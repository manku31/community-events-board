# Authentication API

These four Next.js App Router endpoints consume and return JSON. A future mobile app can use the same API. The source of truth is [openapi.yaml](openapi.yaml).

## Signup and signin

Send `Content-Type: application/json` to `POST /api/auth/signup` or `POST /api/auth/signin`:

```json
{
  "email": "visitor@example.com",
  "password": "a-long-example-passphrase"
}
```

Emails are trimmed, lowercased, validated and limited to 254 characters. Passwords must be 12–128 characters and are preserved exactly, including whitespace. Unknown fields are rejected. Signup always creates a `USER`; callers cannot set an admin role. Password hashes use salted scrypt with N=32768, r=8, p=3, following an [OWASP scrypt profile](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

Signup returns `201`; signin returns `200`. Both return:

```json
{
  "data": {
    "user": {
      "id": "<uuid>",
      "email": "visitor@example.com",
      "role": "USER",
      "createdAt": "<ISO timestamp>"
    },
    "accessToken": "<signed JWT>",
    "expiresIn": 900,
    "refreshToken": "<opaque refresh secret>",
    "tokenType": "Bearer",
    "refreshExpiresAt": "<ISO timestamp>"
  }
}
```

Each signin starts an independent session. The JWT contains `sub` (user ID), `sid` (session ID), `jti`, `iss`, `aud`, `iat` and `exp`. Verification fixes the algorithm to HS256 and requires the `at+jwt` type, expected issuer/audience and expiry. Role checks read the current database value.

Signup and signin each allow ten attempts per normalized email per 15-minute window, stored atomically in PostgreSQL. This account-based limit works across instances; configure deployment-wide traffic limits at the hosting edge when deploying publicly. Wrong passwords and unknown accounts receive the same error and both perform password hashing work.

## Refresh

Send `POST /api/auth/refresh` with:

```json
{ "refreshToken": "<current refresh token>" }
```

The response has the same shape as signin. Save the new access and refresh tokens together. Refresh tokens contain 48 cryptographically random bytes and are stored only as SHA-256 digests. They are opaque; only access tokens are JWTs.

Rotation uses a PostgreSQL transaction and row locks. Each refresh token can be used once. Reusing a consumed token revokes the entire session, including replacement refresh tokens and all access JWTs for that session. Clients must serialize refresh calls, including across browser tabs. Do not blindly retry the same token after an ambiguous network failure; sign in again if the rotated token response was lost.

Sessions expire absolutely after seven days; refresh does not extend that lifetime. The returned `expiresIn` may be less than 900 seconds near session expiry.

## Logout

Send `POST /api/auth/logout` with:

```http
Authorization: Bearer <access token>
```

No request body is needed. Success returns `200`:

```json
{ "data": { "message": "Signed out successfully." } }
```

Logout revokes the current session in PostgreSQL. Its access and refresh tokens immediately fail subsequent authorization. Other sessions remain valid. An already-revoked token returns `401`. If the access token has expired, refresh before logout; remove local tokens when logout succeeds or returns `401`.

## Server middleware

`lib/server/auth/middleware.ts` exports `requireAuth`, `requireRole` and `withAuth`. The wrapper verifies the JWT and reads the live session and current user role from PostgreSQL before invoking a protected handler:

```ts
import { withAuth } from "@/lib/server/auth/middleware";

export const POST = withAuth(async (_request, auth) => {
  return Response.json({ data: { userId: auth.user.id } });
});

// For an admin-only route, pass "ADMIN" as the second argument to withAuth.
```

Protection runs inside handlers at the data boundary. The installed Next.js guide treats Proxy as an optional optimistic check, not a replacement for session authorization. Server modules use `server-only` to prevent accidental client imports. The database supports `USER` and `ADMIN`; this phase does not bootstrap admins or create admin pages.

## Shared errors

Error definitions and validation messages live in `lib/server/errors.ts`. Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields.",
    "requestId": "<uuid>",
    "fields": { "email": ["Enter a valid email address of at most 254 characters."] }
  }
}
```

`fields` is included for validation failures; `_root` describes invalid objects or unknown fields. Unexpected errors never return internal exception messages, SQL, database URLs, passwords or tokens. A request ID is included in errors and the `X-Request-Id` response header.

| Status | Codes |
| --- | --- |
| 400 | `INVALID_JSON` |
| 401 | `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_REUSED` |
| 403 | `FORBIDDEN` |
| 409 | `EMAIL_IN_USE` |
| 413 | `PAYLOAD_TOO_LARGE` (4 KB, including streamed bodies) |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | `VALIDATION_ERROR` |
| 429 | `TOO_MANY_REQUESTS`, with `Retry-After` in seconds |
| 500 | `INTERNAL_ERROR` |
| 503 | `SERVICE_UNAVAILABLE` |

All handler responses use `Cache-Control: no-store`. Other HTTP methods receive Next.js's default `405` response.

## Client token transport

This phase uses explicit bearer authentication and JSON refresh tokens. It does not read or set cookies; cross-site requests cannot authenticate using browser cookies. No cross-origin CORS policy is enabled. Use HTTPS outside local development, keep tokens out of URLs and logs, and use the operating system's secure storage for refresh tokens in native apps.

For the later browser UI, keep access tokens in memory and add an HttpOnly refresh-cookie or server-side token-storage layer for persistent sessions instead of placing refresh tokens in localStorage. Cookie authentication will also require CSRF protection. Browser integration is outside this backend-only phase.

## Database lifecycle

`db/migrations/001_auth.sql` creates `app_auth.users`, `sessions`, `refresh_tokens` and `rate_limits`. Users have unique normalized emails. Foreign keys, expiry checks, lookup indexes and a partial unique index enforce one unused refresh token per session. `schema_migrations` records applied migration checksums.

Used refresh-token hashes must remain for the entire session lifetime to detect replay. A deployment maintenance job may clean up expired sessions and rate-limit rows; deleting a session cascades to its token rows. Logout revokes rather than deletes sessions.
