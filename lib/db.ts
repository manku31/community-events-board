import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Set it in your environment.");
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }

  const adapter = new PrismaPg(
    {
      connectionString,
      max: 5,
      connectionTimeoutMillis: 20_000,
      // Reuse established connections across short pauses between requests.
      idleTimeoutMillis: 120_000,
      statement_timeout: 15_000,
    },
    { schema: databaseUrl.searchParams.get("schema") ?? "public" },
  );

  return new PrismaClient({ adapter });
}

// Reuse the pool across Next.js development reloads.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const cachedClient = globalForPrisma.prisma;
// A client retained by hot reload may predate a newly generated model.
const hasCurrentModels = cachedClient && Object.values(Prisma.ModelName).every(model => {
  const delegate = model.charAt(0).toLowerCase() + model.slice(1);
  return Reflect.get(cachedClient, delegate) !== undefined;
});

export const prisma = cachedClient && hasCurrentModels ? cachedClient : createPrismaClient();

if (cachedClient && cachedClient !== prisma) {
  // Release the obsolete client's pool rather than keeping it alive after reload.
  void cachedClient.$disconnect().catch(() => {});
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
