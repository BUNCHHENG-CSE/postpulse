import { PrismaClient } from '@prisma/client';

/**
 * Optimized Prisma Client with:
 * 1. Singleton pattern across Next.js HMR/Serverless lifecycles
 * 2. Prisma Client Extensions: Query performance timing & slow query monitoring
 * 3. Computed field extensions on Event model
 * 4. Graceful connection diagnostics
 */

function createOptimizedPrismaClient() {
  const baseClient = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
  });

  // Client extension for performance tracing and computed helpers
  const extendedClient = baseClient.$extends({
    name: 'PostPulsePerformanceExtension',
    result: {
      event: {
        isWorthPosting: {
          needs: { worthinessScore: true },
          compute(event) {
            return event.worthinessScore >= 50;
          },
        },
      },
    },
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const duration = Math.round(performance.now() - start);

          // Warn if a query exceeds 50ms threshold (N+1 or missing index indicator)
          if (duration > 50 && process.env.NODE_ENV === 'development') {
            console.warn(`[PRISMA SLOW QUERY] ${model}.${operation} took ${duration}ms`);
          }

          return result;
        },
      },
    },
  });

  return extendedClient;
}

type ExtendedPrismaClient = ReturnType<typeof createOptimizedPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createOptimizedPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('PostgreSQL connection check failed:', error);
    return false;
  }
}
