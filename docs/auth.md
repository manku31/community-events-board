# Token authentication

The sign-up and sign-in forms call `POST /api/signup` and `POST /api/signin`. Both return JWT access tokens and a safe user profile. Signup creates an account and signs the user in; both flows redirect to the server-protected `/home` page. The greeting uses the email address before `@` because the User schema has no separate name field.

## Access tokens

JWT access tokens use HS256 and the existing private `JWT_SECRET` (at least 32 bytes). They expire after 15 minutes. Verification checks the signature, allowed algorithm, issuer, audience, expiry, issued time, user ID, role, session ID, and access-token type. The browser stores the returned access token in session storage under `accessToken`, with an in-memory fallback if storage is blocked. An HttpOnly, SameSite Strict access cookie at `/` lets the server verify `/home`; its lifetime is 15 minutes. Refresh rotates both browser cookies. Use `Authorization: Bearer <accessToken>` with protected JSON APIs. `requireUser` loads the current user from the database; `requireAdmin` checks the current database role equals `admin`.

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

Use `issueAuthTokens(user.id)` only after credential verification or validated account creation. For browser login, return only the access token in JSON and use `setRefreshCookie(response, tokens.refreshToken, tokens.refreshExpiresAt)` to store the refresh token. For native login, return both tokens in JSON. Use `revokeRefreshSession(token)` in a future logout API, followed by clearing both cookies for browsers.

Auth helpers require the Node.js runtime and are server-only. `npm run test:auth` checks JWT/refresh utilities; `npm run test:auth:db` exercises session rotation and replay against the configured database with temporary test users that are cleaned up afterwards.

Sources: [jose JWT library](https://github.com/panva/jose) and [refresh token rotation](https://oauth.net/2/grant-types/refresh-token/).

To check the running HTTP route locally:

```bash
/Users/manku/.local/bin/postman request POST http://localhost:3000/api/auth/refresh --script-post-request @tests/postman/refresh-unauthorized.cjs --response-only
```

This runs four assertions against the expected HTTP 401 error response. This Postman CLI version exits with code 1 for that non-success HTTP status even when all four assertions pass; inspect the assertion results. No workspace upload or credentials are required.

## Signup and signin contract

`POST /api/signup` takes JSON `{ "email": "person@example.com", "password": "a long password", "confirmPassword": "a long password" }`. Confirmation is optional for API clients but required by the signup UI; if supplied, it must match. `POST /api/signin` takes JSON `{ "email": "person@example.com", "password": "a long password" }`.

Email is trimmed, validated, limited to 254 characters, and lowercased. Signup passwords require 8–128 characters; signin requires a nonempty password of at most 128 characters. Password whitespace is preserved. Unknown fields, including client-supplied roles, are rejected. All new accounts get role `user`. Passwords use salted scrypt with N=2^17, r=8, p=1, and are never returned.

Responses are HTTP 201 for signup and 200 for signin, with `data.user` (`id`, `email`, `role`), `data.accessToken`, `data.tokenType`, and `data.expiresIn`. For browsers, the default `client` is `browser`, and refresh tokens are provided only in the HttpOnly cookie. Native clients may add `"client": "native"` to receive `data.refreshToken` instead of cookies.

Both endpoints return the shared error envelope with HTTP 422 / `VALIDATION_ERROR` and field details for invalid input. Signup returns HTTP 409 / `EMAIL_IN_USE` for duplicate email. Signin returns HTTP 401 / `INVALID_CREDENTIALS` with the same message for unknown email and incorrect password. Invalid JSON returns 400; non-JSON bodies return 415. Cross-origin browser requests are rejected with 403. Every response uses `Cache-Control: no-store`.

The UI shows field validation, loading, and API/network errors. `/home` verifies the access cookie and current user on the server, redirecting unauthenticated visitors to `/signin`. An expired access cookie requires signin or a successful refresh before entering `/home` again.

Check validation/password behavior with `npm run test:credentials` and database-backed routes with `npm run test:credentials:db`. The database test creates and cleans up one temporary account.

Password hashing reference: [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

The saved Postman validation assertions are in `tests/postman/credential-validation.cjs`. Use inline JSON with this CLI version: `--body @file` is sent as a multipart upload rather than raw JSON. For example:

```bash
/Users/manku/.local/bin/postman request POST http://localhost:3000/api/signin -H 'Content-Type:application/json' --body '{"email":"not-an-email","password":""}' --script-post-request @tests/postman/credential-validation.cjs
```

The expected response is HTTP 422 with three passing assertions; the CLI exits nonzero for the expected error HTTP status.
