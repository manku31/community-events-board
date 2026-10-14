# Token authentication

This step adds token issuance/verification helpers and `POST /api/auth/refresh`. Signup and login remain UI-only; their future APIs will issue sessions after verifying credentials. No endpoint issues tokens merely from a user ID.

## Access tokens

JWT access tokens use HS256 and the existing private `JWT_SECRET` (at least 32 bytes). They expire after 15 minutes. Verification checks the signature, allowed algorithm, issuer, audience, expiry, issued time, user ID, role, session ID, and access-token type. Use `Authorization: Bearer <accessToken>` with future APIs. `requireUser` loads the current user from the database; `requireAdmin` checks the current database role equals `admin`.

## Refresh sessions

Refresh tokens are random 32-byte opaque strings, not JWTs. Only SHA-256 hashes are saved in PostgreSQL. A session lasts at most 30 days from issuance. A transaction-scoped PostgreSQL advisory lock serializes operations within each session. Each successful refresh consumes the old token atomically and creates a new one with the same session ID and original expiry. Reusing a consumed token revokes the entire session, including its latest refresh token. Concurrent requests must be avoided by clients; duplicate refreshes are treated as reuse. A revocation helper is available for the future logout API.

Already issued access tokens remain valid until their 15-minute expiry after refresh-session revocation. Never log tokens or return the User password field.

## Refresh API contract

`POST /api/auth/refresh` supports two transports:

- Browser: the HttpOnly `refreshToken` cookie, scoped to `/api/auth`, with SameSite Strict and Secure in production. Send no request body and a same-origin `Origin` header. The new refresh token is delivered only through Set-Cookie.
- Native/mobile: `Content-Type: application/json` and `{ "refreshToken": "<token>" }`. The replacement refresh token is returned in JSON. Native clients do not need an Origin header; any supplied Origin must match the API origin.

Successful responses use HTTP 200 and the existing success envelope:

```json
{
  "success": true,
  "message": "Session refreshed",
  "data": {
    "accessToken": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

JSON transport also includes `data.refreshToken`. All responses carry `Cache-Control: no-store`. Cookie failures with HTTP 401 clear the refresh cookie. Errors use the existing error envelope and never include tokens, password hashes, or driver errors:

| HTTP status | Code | Meaning |
| --- | --- | --- |
| 400 | INVALID_REQUEST | Malformed JSON or missing/invalid JSON refreshToken field |
| 401 | INVALID_REFRESH_TOKEN | Missing, expired, invalid, revoked, or already used refresh token |
| 403 | INVALID_ORIGIN | Browser origin check failed |
| 415 | UNSUPPORTED_MEDIA_TYPE | Request body is not JSON |
| 500 | INTERNAL_SERVER_ERROR | Configuration or unexpected server failure |

## Server integration

Use `issueAuthTokens(user.id)` only after credential verification. For browser login, return only the access token in JSON and use `setRefreshCookie(response, tokens.refreshToken, tokens.refreshExpiresAt)` to store the refresh token. For native login, return both tokens in JSON. Use `revokeRefreshSession(token)` in the future logout API, followed by `clearRefreshCookie(response)` for browsers.

Auth helpers require the Node.js runtime and are server-only. `npm run test:auth` checks JWT/refresh utilities; `npm run test:auth:db` exercises session rotation and replay against the configured database with temporary test users that are cleaned up afterwards.

Sources: [jose JWT library](https://github.com/panva/jose) and [refresh token rotation](https://oauth.net/2/grant-types/refresh-token/).

To check the running HTTP route locally:

```bash
/Users/manku/.local/bin/postman request POST http://localhost:3000/api/auth/refresh --script-post-request @tests/postman/refresh-unauthorized.cjs --response-only
```

This runs four assertions against the expected HTTP 401 error response. This Postman CLI version exits with code 1 for that non-success HTTP status even when all four assertions pass; inspect the assertion results. No workspace upload or credentials are required.
