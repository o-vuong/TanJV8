// Database client module with fallback when Prisma is not initialized

declare global {
  var __prisma: unknown | undefined;
  var __prismaAvailable: boolean | undefined;
}

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

// Initialize Prisma client at module load time
let prismaInstance: unknown;

// Check if we already have a cached instance
if (globalThis.__prisma) {
  prismaInstance = globalThis.__prisma;
} else {
  try {
    // Try to load Prisma using dynamic import
    const { PrismaClient } = await import("@prisma/client");

    // Try to create the client - this will throw if not generated
    const client = new PrismaClient();

    // Try to extend with accelerate
    try {
      const { withAccelerate } = await import("@prisma/extension-accelerate");
      prismaInstance = client.$extends(withAccelerate());
    } catch {
      // Accelerate extension not available, use basic client
      prismaInstance = client;
    }

    globalThis.__prismaAvailable = true;
    globalThis.__prisma = prismaInstance;

    console.log("✓ Prisma client loaded successfully");
  } catch (error) {
    console.warn("Prisma client not available, using mock client:", (error as Error).message);
    globalThis.__prismaAvailable = false;
    prismaInstance = createMockPrismaClient();
  }
}

// Export the initialized client
export const db = prismaInstance;

// Also export as prisma for backwards compatibility
export const prisma = db;
