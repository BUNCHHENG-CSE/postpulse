import { PrismaClient } from '@prisma/client';

/**
 * Optimized Prisma Client with Dual-Database Architecture:
 * 1. Production: PostgreSQL using Neon Serverless WebSocket Driver Adapter (@prisma/adapter-neon)
 * 2. Local Development: SQLite (file:./dev.db) with zero setup
 * 3. Singleton pattern across Next.js HMR/Serverless lifecycles
 * 4. Prisma Client Extensions: Query performance timing & slow query monitoring
 * 5. Computed field extensions on Event model
 * 6. Graceful connection diagnostics
 */

function createOptimizedPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

  let baseClient: PrismaClient;

  if (isPostgres) {
    try {
      // Dynamic import / require of Neon adapter for PostgreSQL production runtime
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaNeon } = require('@prisma/adapter-neon');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool, neonConfig } = require('@neondatabase/serverless');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ws = require('ws');

      if (!neonConfig.webSocketConstructor) {
        neonConfig.webSocketConstructor = ws;
      }

      const pool = new Pool({ connectionString: dbUrl });
      const adapter = new PrismaNeon(pool);

      baseClient = new PrismaClient({
        adapter,
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ],
      });
    } catch (err) {
      console.warn('[Prisma] Neon adapter setup fallback to direct connection:', err);
      baseClient = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ],
      });
    }
  } else {
    // Local SQLite Client
    baseClient = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

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
    console.warn('Database connection check failed:', error);
    return false;
  }
}
