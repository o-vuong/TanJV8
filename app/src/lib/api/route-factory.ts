import { z } from 'zod'

type PrismaListArgs = Record<string, unknown>

type PrismaModel<T> = {
  findMany: (args?: PrismaListArgs) => Promise<T[]>
  create: (args: Record<string, unknown>) => Promise<T>
  findUnique: (args: Record<string, unknown>) => Promise<T | null>
  update: (args: Record<string, unknown>) => Promise<T>
  delete: (args: Record<string, unknown>) => Promise<T>
}

export interface CollectionHandlersOptions<T, TCreate, TQuery> {
  model: Pick<PrismaModel<T>, 'findMany' | 'create'>
  schema?: {
    query?: z.ZodType<TQuery>
    create?: z.ZodType<TCreate>
  }
  authorize?: (request: Request) => Promise<void> | void
  buildListArgs?: (query: TQuery) => PrismaListArgs
  buildCreateArgs?: (data: TCreate, request: Request) => Record<string, unknown>
}

export function createCollectionHandlers<T, TCreate, TQuery = Record<string, never>>({
  model,
  schema,
  authorize,
  buildListArgs,
  buildCreateArgs,
}: CollectionHandlersOptions<T, TCreate, TQuery>) {
  return {
    GET: async (request: Request) => {
      await authorize?.(request)
      const url = new URL(request.url)
      const rawQuery = Object.fromEntries(url.searchParams.entries())
      const parsedQuery = schema?.query ? schema.query.parse(rawQuery) : (rawQuery as TQuery)
      const args = buildListArgs ? buildListArgs(parsedQuery) : {}
      const data = await model.findMany(args)
      return Response.json(data)
    },
    POST: async (request: Request) => {
      await authorize?.(request)
      const json = await request.json()
      const parsed = schema?.create ? schema.create.parse(json) : (json as TCreate)
      const args = buildCreateArgs ? buildCreateArgs(parsed, request) : { data: parsed }
      const created = await model.create(args)
      return Response.json(created, { status: 201 })
    },
  }
}

export interface EntityHandlersOptions<T, TUpdate> {
  model: Pick<PrismaModel<T>, 'findUnique' | 'update' | 'delete'>
  schema?: {
    update?: z.ZodType<TUpdate>
    params?: z.ZodType<{ id: string }>
  }
  authorize?: (request: Request) => Promise<void> | void
  buildFindArgs?: (params: { id: string }, request: Request) => Record<string, unknown>
  buildUpdateArgs?: (params: { id: string }, data: TUpdate, request: Request) => Record<string, unknown>
  buildDeleteArgs?: (params: { id: string }, request: Request) => Record<string, unknown>
}

async function parseParams(request: Request, schema?: z.ZodType<{ id: string }>) {
  const url = new URL(request.url)
  const parts = url.pathname.split('/')
  const id = parts[parts.length - 1] || parts[parts.length - 2]
  if (!id) {
    throw new Response('Missing resource id', { status: 400 })
  }
  if (!schema) {
    return { id }
  }
  return schema.parse({ id })
}

export function createEntityHandlers<T, TUpdate = Partial<T>>({
  model,
  schema,
  authorize,
  buildFindArgs,
  buildUpdateArgs,
  buildDeleteArgs,
}: EntityHandlersOptions<T, TUpdate>) {
  return {
    GET: async (request: Request) => {
      await authorize?.(request)
      const params = await parseParams(request, schema?.params)
      const args = buildFindArgs ? buildFindArgs(params, request) : { where: { id: params.id } }
      const record = await model.findUnique(args)
      if (!record) {
        return new Response('Not Found', { status: 404 })
      }
      return Response.json(record)
    },
    PATCH: async (request: Request) => {
      await authorize?.(request)
      const params = await parseParams(request, schema?.params)
      const json = await request.json()
      const parsed = schema?.update ? schema.update.parse(json) : (json as TUpdate)
      const args = buildUpdateArgs
        ? buildUpdateArgs(params, parsed, request)
        : { where: { id: params.id }, data: parsed }
      const updated = await model.update(args)
      return Response.json(updated)
    },
    DELETE: async (request: Request) => {
      await authorize?.(request)
      const params = await parseParams(request, schema?.params)
      const args = buildDeleteArgs ? buildDeleteArgs(params, request) : { where: { id: params.id } }
      await model.delete(args)
      return new Response(null, { status: 204 })
    },
  }
}
