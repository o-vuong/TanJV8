// Database client module with fallback when Prisma is not initialized

declare global {
  var __prisma: unknown | undefined;
  var __prismaAvailable: boolean | undefined;
}

let prismaInstance: unknown | null = null;
let prismaAvailable = globalThis.__prismaAvailable ?? null;

// Create a mock model that returns empty results for common operations
function createMockModel() {
  const notAvailableError = () => {
    throw new Error("Database not available. Please run 'prisma generate' and ensure DATABASE_URL is set.");
  };

  return new Proxy({}, {
    get: (_target, prop) => {
      // Return async functions that behave reasonably for read operations
      if (prop === 'findMany' || prop === 'findFirst' || prop === 'findUnique') {
        return async () => (prop === 'findMany' ? [] : null);
      }
      if (prop === 'count') {
        return async () => 0;
      }
      // Write operations should throw
      if (prop === 'create' || prop === 'update' || prop === 'delete' || prop === 'upsert') {
        return notAvailableError;
      }
      // For any other operation, return a function that throws
      return notAvailableError;
    }
  });
}

// Create a mock Prisma client
function createMockPrismaClient() {
  const mockModel = createMockModel();

  return new Proxy({}, {
    get: (_target, prop) => {
      // Handle special Prisma methods
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => {};
      }
      if (prop === '$queryRaw' || prop === '$executeRaw') {
        return async () => {
          throw new Error("Database not available. Please run 'prisma generate' first.");
        };
      }
      if (prop === '$transaction') {
        return async () => {
          throw new Error("Database not available. Please run 'prisma generate' first.");
        };
      }
      // Return mock model for any model access (user, session, etc.)
      return mockModel;
    }
  });
}

function createPrismaClient(): unknown {
  // Return cached instance if available
  if (prismaInstance) {
    return prismaInstance;
  }

  // Return mock if we already know Prisma isn't available
  if (prismaAvailable === false) {
    prismaInstance = createMockPrismaClient();
    return prismaInstance;
  }

  try {
    // Try to load Prisma
    const prismaModule = require("@prisma/client");
    const PrismaClientClass = prismaModule.PrismaClient;

    // Try to create the client - this will throw if not generated
    const client = new PrismaClientClass();

    // Try to extend with accelerate
    try {
      const { withAccelerate } = require("@prisma/extension-accelerate");
      prismaInstance = client.$extends(withAccelerate());
    } catch {
      // Accelerate extension not available, use basic client
      prismaInstance = client;
    }

    prismaAvailable = true;
    globalThis.__prismaAvailable = true;
    globalThis.__prisma = prismaInstance;

    return prismaInstance;
  } catch (error) {
    console.warn("Prisma client not available, using mock client:", (error as Error).message);
    prismaAvailable = false;
    globalThis.__prismaAvailable = false;
    prismaInstance = createMockPrismaClient();
    return prismaInstance;
  }
}

// Export a proxy that lazily initializes the client
export const db = new Proxy({} as unknown, {
  get(_target, prop) {
    const client = createPrismaClient();
    return (client as Record<string | symbol, unknown>)[prop];
  },
});

// Also export as prisma for backwards compatibility
export const prisma = db;
