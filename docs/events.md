# Event creation API

`POST /api/admin/events` creates a row in the Event table. The Add event form at `/admin/event` calls this endpoint with same-origin credentials. It loads active categories from `/api/admin/categories`, sends the selected numeric category ID, maps the image URL field to `image`, and converts price/status to the API types. Client and server share validation. Blank prices are rejected; explicitly entering 0 creates a free event.

The form shows field/API errors, category loading/retry/empty states, and disables controls while saving. A ref guard blocks duplicate submissions. Successful creation navigates to `/admin` without an extra success popup. The admin table, mobile cards, and event details now load saved records through the JSON API. No event has been created as part of implementing this connection.

`GET /api/admin/events` returns `data.events`, including active, inactive, past, and upcoming events ordered by date, time, and ID ascending. Each event uses the serialization below and includes its category ID/name. The UI applies combined search, category, city, date, price, and status filters to this loaded list. Category and city choices come from saved records. Loading, retry, and empty states replace sample content.

`GET /api/admin/events/:id` returns `data.event` for the selected saved record. Invalid IDs return 400 and missing events return 404. The admin details page calls this endpoint. Its Edit button opens `/admin/event/:id/edit`, which loads this endpoint and prefills the shared event form and live preview. Both pages are server-protected for admins.

`PATCH /api/admin/events/:id` accepts any nonempty subset of the creation fields, including status-only updates, and returns `data.event`. Unknown fields are rejected and supplied values use creation validation; omitted values are preserved, including status. Invalid bodies return 422; invalid/missing IDs return 400/404. A changed category must exist and be active. An unchanged inactive category can be retained while editing other details. The UI asks for confirmation before saving edits, disables repeated submissions, and returns to the saved event card after success without success banners. Status switches update optimistically after Yes and roll back with an error if saving fails.

All event endpoints require a current active admin and use `Cache-Control: no-store`. Cookie writes require matching Origin. Tables/cards format date/time as IST and prices in Indian currency notation.

The All events table and mobile cards display 10 filtered events per page with shared Previous/Next controls and a result range. Searching, applying filters, or clearing filters resets to page 1. Pages clamp to the available results when a status change reduces the filtered list. Pagination is applied locally to the fetched admin event list.

## Visitor browsing

`/home` keeps its server-side session check and redirects admins to `/admin`. It now shows a personalised hero and event browser. The browser calls public `GET /api/events`; no admin endpoint is exposed to visitors.

`GET /api/events` accepts `search` (up to 200 characters), `city` (up to 100), `categoryId` (positive integer), `page` (default 1), and `pageSize` (default 6, maximum 24). Unknown or invalid query fields return 422. Searches match title/description case-insensitively, cities match case-insensitively, and all filters combine. Database pagination happens after filtering, with stable ordering by date, time, and ID ascending. Out-of-range pages clamp to the last available page. Empty results report page 1 of 1.

Only active events in active categories whose local date/time is later than the current IST date/time are returned. The date and time columns are compared separately using Indian calendar/clock values. Responses use `data.events`, `data.categories` (all active category choices), `data.cities` (cities with eligible events), and `data.pagination` (`page`, `pageSize`, `total`, `totalPages`). There are no user records, tokens, or admin-only lists in this response. All responses use `Cache-Control: no-store`.

`GET /api/events/:id` uses the same visibility and upcoming checks; missing, past, or inactive events return 404. The visitor page `/events/:id` calls it and renders the shared event card with the full description toggle. Guests can open event details; signed-in visitors retain their account menu. No admin edit action appears there.

The home UI debounces text searches by 300 ms, aborts superseded requests, and shows skeleton cards, retryable errors, and empty states. Filters reset to page 1 and use server pagination. Cards show Indian currency and IST dates, with an image fallback and a details link. Favourites, reminders, and card design are not part of this step. No automated tests, browser test flows, or test data writes were run.

Send `Content-Type: application/json`:

```json
{
  "title": "Under the stars: music night",
  "categoryId": 1,
  "city": "Coimbatore",
  "date": "2026-11-07",
  "time": "18:30",
  "price": 499,
  "image": "https://example.com/event.jpg",
  "description": "An evening of live music with local performers.",
  "status": true
}
```

Use an existing active Category ID. The API accepts category IDs, not category names. Title, city, description, and image are trimmed and required, with maximum lengths 200, 100, 5000, and 2048 respectively. Image must be an HTTP(S) URL. Date must be a real `YYYY-MM-DD` date (year 0001–9999); time must be `HH:mm` in 24-hour format. These are local Indian calendar/clock values (IST), stored in separate PostgreSQL DATE and TIME columns without timezone conversion. Past dates are permitted; visitor-facing upcoming filtering will be separate.

Price must be a JSON number from 0 to 9,999,999,999.99 with at most two decimal places. Zero means free. Status is Boolean, defaults to true, and unknown fields are rejected. IDs and timestamps are generated by the server.

Authentication supports a Bearer JWT or browser HttpOnly access cookie. The server verifies the current active database user and admin role. Cookie writes require a matching Origin; provided cross-origin headers are always rejected. Responses use `Cache-Control: no-store` and the existing JSON envelope.

Success: HTTP 201 with `data.event`, including all Event fields and a `category` object containing `id` and `category`. Returned `date` and `time` use the input formats. `price` is a fixed two-decimal string, e.g. `"499.00"`, preserving monetary precision. Timestamps are ISO strings.

Errors: 400 for invalid JSON, 401 for missing/invalid/inactive sessions, 403 for non-admins or invalid origin, 415 for non-JSON requests, and 422 with field errors for invalid input or a missing/inactive category. Unexpected failures return generic 500 errors without exposing database or credential details. No event data was inserted to verify this change; automated tests and API assertions are not run per project instructions.
