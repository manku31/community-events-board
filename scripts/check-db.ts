import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  try {
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1::int AS ok`;
    if (result[0]?.ok !== 1) throw new Error("Unexpected database response.");
    console.log("Prisma successfully connected to PostgreSQL. Read-only query passed.");
  } catch {
    // Keep the connection URL and driver error details out of terminal output.
    console.error("Database connection failed. Check DATABASE_URL and database/network availability.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error("Database check could not finish.");
  process.exitCode = 1;
});
