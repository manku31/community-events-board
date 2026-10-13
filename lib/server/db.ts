import "server-only";
import { Pool, type PoolClient } from "pg";
import { databaseUrl } from "./config";

const globalDb = globalThis as typeof globalThis & { authPool?: Pool };

export function db(): Pool {
  if (!globalDb.authPool) {
    globalDb.authPool = new Pool({
      connectionString: databaseUrl(),
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 20_000,
      statement_timeout: 10_000,
      application_name: "community-events-board",
      enableChannelBinding: true,
    });
    // Never log connection errors verbatim: they may contain credentials.
    globalDb.authPool.on("error", () => {
      console.error("Idle database connection failed.");
    });
  }
  return globalDb.authPool;
}

export async function closeDb(): Promise<void> {
  if (globalDb.authPool) {
    await globalDb.authPool.end();
    delete globalDb.authPool;
  }
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
