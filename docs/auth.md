# Token authentication

The sign-up and sign-in forms call `POST /api/signup` and `POST /api/signin`. Both return JWT access tokens and a safe user profile. Signup creates an account and signs the user in. Successful authentication redirects users with role `admin` to `/admin` and other users to `/home`. The greeting uses the saved user name. Existing accounts are backfilled with the email address before `@`.

## Access tokens

JWT access tokens use HS256 and the existing private `JWT_SECRET` (at least 32 bytes). They expire after 15 minutes. Verification checks the signature, allowed algorithm, issuer, audience, expiry, issued time, user ID, role, session ID, and access-token type. The browser stores the returned access token in session storage under `accessToken`, with an in-memory fallback if storage is blocked. An HttpOnly, SameSite Strict access cookie at `/` lets the server verify `/home`; its lifetime is 15 minutes. Refresh rotates both browser cookies. Use `Authorization: Bearer <accessToken>` with protected JSON APIs. `requireUser` loads the current user from the database; `requireAdmin` checks the current database role equals `admin`.

## Refresh sessions

Refresh tokens are random 32-byte opaque strings, not JWTs. Only SHA-256 hashes are saved in PostgreSQL. A session lasts at most 30 days from issuance. A transaction-scoped PostgreSQL advisory lock serializes operations within each session. Each successful refresh consumes the old token atomically and creates a new one with the same session ID and original expiry. Reusing a consumed token revokes the entire session, including its latest refresh token. Concurrent requests must be avoided by clients; duplicate refreshes are treated as reuse. The logout API uses the revocation helper to end the current refresh session.

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

Use `issueAuthTokens(user)` with the active database user already loaded during credential verification or validated account creation. Never pass client-supplied identity or role data. For browser login, return only the access token in JSON and use `setRefreshCookie(response, tokens.refreshToken, tokens.refreshExpiresAt)` to store the refresh token. For native login, return both tokens in JSON. `POST /api/auth/logout` revokes the refresh session and clears both browser cookies.

Auth helpers require the Node.js runtime and are server-only.

Sources: [jose JWT library](https://github.com/panva/jose) and [refresh token rotation](https://oauth.net/2/grant-types/refresh-token/).


## Signup and signin contract

`POST /api/signup` takes JSON `{ "name": "Person", "email": "person@example.com", "password": "a long password", "confirmPassword": "a long password" }`. Confirmation is optional for API clients but required by the signup UI; if supplied, it must match. `POST /api/signin` takes JSON `{ "email": "person@example.com", "password": "a long password" }`.

Name is required, trimmed, and limited to 1–100 characters. Email is trimmed, validated, limited to 254 characters, and lowercased. Signup passwords require 8–128 characters; signin requires a nonempty password of at most 128 characters. Password whitespace is preserved. Unknown fields, including client-supplied roles, are rejected. All new accounts get role `user`. Passwords use salted scrypt with N=2^17, r=8, p=1, and are never returned.

Responses are HTTP 201 for signup and 200 for signin, with `data.user` (`id`, `name`, `email`, `role`), `data.accessToken`, `data.tokenType`, and `data.expiresIn`. For browsers, the default `client` is `browser`, and refresh tokens are provided only in the HttpOnly cookie. Native clients may add `"client": "native"` to receive `data.refreshToken` instead of cookies.

Both endpoints return the shared error envelope with HTTP 422 / `VALIDATION_ERROR` and field details for invalid input. Signup returns HTTP 409 / `EMAIL_IN_USE` for duplicate email. Signin returns HTTP 401 / `INVALID_CREDENTIALS` with the same message for unknown email and incorrect password. Invalid JSON returns 400; non-JSON bodies return 415. Cross-origin browser requests are rejected with 403. Every response uses `Cache-Control: no-store`.

The UI shows field validation, loading, and API/network errors. `/home` verifies the access cookie and current user on the server, redirecting unauthenticated visitors to `/signin`. An expired access cookie requires signin or a successful refresh before entering `/home` again.


Password hashing reference: [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).


## Status flags

`User.status` and `RefreshToken.status` are Boolean fields defaulting to `true`. Inactive users cannot sign in, receive tokens, refresh sessions, or pass protected page/API guards. Consuming or revoking a refresh token sets its status to `false`; its replacement starts active. Existing consumed, revoked, and expired token records are marked inactive by the migration. Status is checked alongside expiry and revocation timestamps.

## Guest pages

The landing page (`/`), signin page (`/signin`), and signup page (`/signup`) use a shared server-side guard. A valid access cookie for an active user redirects admins to `/admin` and other users to `/home` before guest content is displayed. Missing, expired, invalid, or inactive sessions can access these pages to sign in. The check uses the signed cookie and current database user, rather than trusting client storage.

## Admin landing page

`/admin` is a simple welcome page with the shared profile/logout menu. The server verifies the access cookie, active account, and current database role before rendering admin content. Guests are redirected to `/signin`; users whose role is not `admin` are redirected to `/home`. Admins visiting `/home` are redirected to `/admin`. Header and profile home links follow the same role-based destination. Signup continues to create only `user` accounts; this change does not create or promote an admin account.

## Authentication request efficiency

Token issuance reuses the user loaded by signin or created by signup, removing a duplicate user query from both flows. Signin selects only the fields it needs. Successful authentication uses one fresh navigation to `/home` to apply the new cookies without a separate router refresh. Password hashing settings are retained. The connection pool keeps idle connections for two minutes to reduce repeated connection setup during short pauses. Restart the dev server to apply pool-setting changes.

## Logout

The signed-in header has a user-icon dropdown containing My profile and Log out. The logout menu item that calls `POST /api/auth/logout` with the refresh cookie and same-origin Origin header. Successful logout revokes the session, marks its refresh tokens inactive, clears both HttpOnly cookies, removes the client access token from session storage and memory, and returns the browser to `/`. Missing cookies also return success. Failures keep the current session and show a retry message. The JSON response uses the shared envelope with HTTP 200, `data: null`, and message `Logged out`; it is not cached. As documented above, copies of previously issued bearer access tokens expire after 15 minutes.

## Profile

The user menu opens `/profile`, which verifies the access cookie and active user on the server. It shows the signed-in user’s name, email, account ID, role, status, creation date, and last-updated date. Passwords and tokens are not loaded into the profile. The page is read-only and includes a link back to `/home`.
