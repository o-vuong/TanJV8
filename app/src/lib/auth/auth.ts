import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { anonymous } from 'better-auth/plugins'
import { prisma } from '../../db'
import { env } from '../env'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.NODE_ENV === 'production',
    autoSignIn: true,
  },
  socialProviders: env.ENABLE_OAUTH
    ? {
        google:
          env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
            ? {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
              }
            : undefined,
        github:
          env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
            ? {
                clientId: env.GITHUB_CLIENT_ID,
                clientSecret: env.GITHUB_CLIENT_SECRET,
              }
            : undefined,
      }
    : undefined,
  plugins: [
    anonymous({
      allowAnonymous: true,
      sessionMaxAge: 60 * 60 * 24 * 7,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: env.NODE_ENV === 'production',
    },
    generateId: () => crypto.randomUUID(),
  },
  trustedOrigins: [env.BETTER_AUTH_URL],
  secret: env.BETTER_AUTH_SECRET,
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.User
