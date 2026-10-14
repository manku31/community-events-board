# Backend foundation

Prisma ORM 7 connects to Neon PostgreSQL using the PostgreSQL driver adapter. The shared client in `lib/db.ts` is restricted to server code and reuses its connection pool during development. It reads `DATABASE_URL` from the environment; Next.js loads `.env` automatically, and the standalone scripts load it with dotenv.

The schema contains a `User` model with an auto-incrementing integer `id`, unique `email`, `password` string for the password hash, and a required string `role`. `createdAt` defaults to the creation time, and Prisma maintains `updatedAt` on updates. The initial migration creates this table; signup and login APIs will be implemented separately.

## Local setup

1. Install dependencies with `npm install`. This also generates Prisma Client.
2. Put your Neon connection string in `.env` as `DATABASE_URL` (see `.env.example`).
3. Run `npm run db:validate` to validate the schema and `npm run db:check` to verify the live connection with a read-only `SELECT 1` query.
4. Start the app with `npm run dev`.

The connection check does not create or modify any rows or tables, and does not print connection credentials. `lib/db.ts` is for the Node.js server runtime, not Edge or browser code. Use the pooled Neon connection for the application. Before adding migrations, set the optional `DATABASE_URL_UNPOOLED` to the direct Neon connection; Prisma CLI prefers it when present and otherwise uses `DATABASE_URL`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run db:generate` | Regenerate Prisma Client after changing the schema |
| `npm run db:validate` | Validate the schema |
| `npm run db:check` | Verify the connection without writing data |
| `npm run db:migrate -- --name <name>` | Create and apply a development migration after adding models |
| `npm run db:deploy` | Apply existing migrations in production |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test:api` | Check the reusable JSON response contract |
| `npm run build` | Generate Prisma Client and build the app |

Prisma Client is generated into `generated/prisma` and is ignored by Git. Generation also runs after installation and before builds. Generation can run without database credentials; actual database queries require `DATABASE_URL`.

## JSON response contract

Future APIs use `lib/api` to return native JSON `Response` objects. The refresh API uses these helpers. See [token authentication](auth.md) for its contract and integration instructions.

Success responses contain `success`, `message`, and `data`. Optional `meta` holds pagination or similar information. The default HTTP status is 200; use 201 for creation.

```json
{
  "success": true,
  "message": "Events loaded",
  "data": [],
  "meta": { "page": 1, "total": 0 }
}
```

Errors contain `success: false` and an `error` object with `code` and `message`. Optional `details` maps field names to arrays of validation messages. The HTTP status is always a 4xx or 5xx code.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check your input.",
    "details": { "email": ["Enter a valid email."] }
  }
}
```

Use `ApiError` only for messages safe to show to callers. Unexpected exceptions passed to `handleApiError` return HTTP 500 with `INTERNAL_SERVER_ERROR` and a generic message, keeping database or internal details out of the response.

```ts
import { prisma } from "@/lib/db";
import { ApiError, successResponse, handleApiError } from "@/lib/api";

// Example pattern for a future route handler (not an installed endpoint).
export async function GET() {
  try {
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1::int AS ok`;
    if (result[0]?.ok !== 1) {
      throw new ApiError(503, "DATABASE_UNAVAILABLE", "Please try again later.");
    }
    return successResponse({ connected: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

Clients should check the HTTP status and narrow `ApiResponse<T>` using `success` before reading `data` or `error`. A 204/205 response cannot carry this JSON envelope; the success helper rejects those statuses.

Reference: [Prisma PostgreSQL setup](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql) and [Neon connection guidance](https://neon.com/docs/guides/prisma).

## Authentication

JWT access tokens and rotating refresh sessions are configured. See [token authentication](auth.md) for the API contract, server helpers, and verification commands.
