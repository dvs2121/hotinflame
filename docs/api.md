# API Reference

Base path: `/api`. Unless noted, successful responses use `{ "success": true, "message": "...", "data": ... }`. Error responses use `{ "success": false, "message": "...", "error": "..." }`. The API listens on the backend's configured `PORT`.

Authentication uses `Authorization: Bearer <JWT>`. User and admin tokens are distinct; admin routes require an admin token and an admin record with the admin role. Authentication and admin requests are limited to 30 requests per 15 minutes per IP. Public quotation and contact writes are limited to 10 per 15 minutes per IP.

## Service

| Method and endpoint | Authentication | Input | Success | Purpose and possible errors |
| --- | --- | --- | --- | --- |
| `GET /` | None | None | `200`, API-running message | Basic process response. |
| `GET /api/health` | None | None | `200`, API message and `database: connected\|disconnected` | Reports current Mongoose connection state. |

## User Authentication

| Method and endpoint | Authentication | Input | Success | Purpose and possible errors |
| --- | --- | --- | --- | --- |
| `POST /api/auth/register` | None | JSON: `name`, `email`, `phone`, `password` (at least 8 characters) | `201`, user and seven-day token | Creates a user with a bcrypt password hash. `400` invalid/missing fields; `409` email already registered; `429` rate limit. |
| `POST /api/auth/login` | None | JSON: `email`, `password` | `200`, user and seven-day token | Authenticates a user. `401` invalid credentials; `429` rate limit. |
| `GET /api/auth/me` | User bearer token | None | `200`, public user profile | Returns the authenticated user. `401` missing, invalid, expired, or unknown user token. |

## Public Catalog and Enquiries

| Method and endpoint | Authentication | Input | Success | Purpose and possible errors |
| --- | --- | --- | --- | --- |
| `GET /api/dishes` | None | Optional query: `type`, `available` (`true`/`false`) | `200`, dish array with populated `category` and `imageUrl` virtual | Lists matching dishes, newest first. |
| `GET /api/dishes/:id` | None | Path: MongoDB dish ID | `200`, dish | Returns one dish. `400` invalid ID; `404` missing dish. |
| `GET /api/categories` | None | None | `200`, category array sorted by name | Lists dish categories. |
| `GET /api/gallery` | None | Optional query: `type` | `200`, gallery item array, newest first | Lists public gallery entries. |
| `GET /api/gallery/:id` | None | Path: MongoDB gallery ID | `200`, gallery item | Returns one public gallery entry. `400` invalid ID; `404` missing item. |
| `GET /api/settings/whatsapp` | None | None | `200`, `{ data: { number } }` | Returns the configured public order number, or an empty string when unset. |
| `POST /api/quotations` | None | JSON: `customerName`, `email`, `phone`, `eventType`, `eventDate`, `guestCount`; optional `selectedDishes` array (`name`, `quantity`), `customRequirements`, `message` | `201`, created quotation with initial `pending` status | Guest event enquiry; no account is required. `400` invalid details/model values; `429` rate limit. |
| `POST /api/contact` | None | JSON: `name`, `email`, `phone`, `message` | `201`, created contact ID | Stores a contact message. `400` missing fields or invalid email; `429` rate limit. |

## Admin Authentication and Quotations

| Method and endpoint | Authentication | Input | Success | Purpose and possible errors |
| --- | --- | --- | --- | --- |
| `POST /api/admin/login` | None | JSON: `email`, `password` (the identifier `admin` also resolves to configured `ADMIN_EMAIL`) | `200`, admin profile and eight-hour token | Admin sign-in. `401` invalid credentials; `429` rate limit. |
| `GET /api/admin/me` | Admin bearer token | None | `200`, public admin profile | Checks the current admin identity. `401` invalid/missing token; `403` insufficient role or no admin record. |
| `GET /api/admin/quotations` | Admin bearer token | None | `200`, quotations with populated user summary, newest first | Lists customer quotations. `401`/`403` authorization errors. |
| `GET /api/admin/quotations/:id` | Admin bearer token | Path: MongoDB quotation ID | `200`, quotation with populated user summary | Reads one quotation. `400` invalid ID; `404` missing quotation; `401`/`403` authorization errors. |
| `PUT /api/admin/quotations/:id/status` | Admin bearer token | Path: quotation ID; JSON: `status` in `pending`, `contacted`, `confirmed`, `completed`, `cancelled` | `200`, updated quotation | Changes quotation status. `400` invalid status/ID; `404` missing quotation; `401`/`403` authorization errors. |

## Admin Dishes and Categories

| Method and endpoint | Authentication | Input | Success | Purpose and possible errors |
| --- | --- | --- | --- | --- |
| `POST /api/admin/dishes` | Admin bearer token | `multipart/form-data`: required `name`, `description`, `category`; optional `type`, `imageCaption`, `available`, `image` | `201`, created dish | Creates a dish. Image formats and limits are below. `400` invalid fields/upload; `401`/`403` authorization; `502` Cloudinary upload failure; `409` duplicate value where applicable. |
| `PUT /api/admin/dishes/:id` | Admin bearer token | Path: dish ID; same multipart fields as create. Image is optional; omitted image preserves the current image. | `200`, updated dish | Updates a dish. `400` invalid ID/fields/upload; `404` missing dish; `401`/`403`; `502` upload failure. |
| `DELETE /api/admin/dishes/:id` | Admin bearer token | Path: dish ID | `200`, empty data object | Deletes the dish and attempts to delete its stored image. `400` invalid ID; `404` missing dish; `401`/`403`. |
| `POST /api/admin/categories` | Admin bearer token | JSON: `name`, optional `description` | `201`, created category | Creates a category. `400` validation error; `409` duplicate category; `401`/`403`. |
| `PUT /api/admin/categories/:id` | Admin bearer token | Path: category ID; JSON: `name`, `description` | `200`, updated category | Updates a category. `400` validation/ID error; `404` missing category; `401`/`403`; `409` duplicate category. |
| `DELETE /api/admin/categories/:id` | Admin bearer token | Path: category ID | `200`, empty data object | Deletes a category. `400` invalid ID; `404` missing category; `401`/`403`. |

## Admin Gallery and Settings

| Method and endpoint | Authentication | Input | Success | Purpose and possible errors |
| --- | --- | --- | --- | --- |
| `GET /api/admin/gallery` | Admin bearer token | Optional query: `type` | `200`, gallery item array | Lists gallery entries for management. `401`/`403`. |
| `GET /api/admin/gallery/:id` | Admin bearer token | Path: gallery ID | `200`, gallery item | Reads a gallery entry. `400` invalid ID; `404` missing item; `401`/`403`. |
| `POST /api/admin/gallery` | Admin bearer token | `multipart/form-data`: required `image`; optional `title`, `caption` (or `imageCaption`), `type` | `201`, created gallery item | Adds an image. `400` missing/invalid image; `401`/`403`; `502` Cloudinary upload failure. |
| `PUT /api/admin/gallery/:id` | Admin bearer token | Path: gallery ID; multipart fields `title`, `caption` (or `imageCaption`), `type`, optional `image` | `200`, updated item | Updates metadata and optionally replaces the image. `400` invalid ID/upload; `404` missing item; `401`/`403`; `502` upload failure. |
| `DELETE /api/admin/gallery/:id` | Admin bearer token | Path: gallery ID | `200`, empty data object | Deletes the item and attempts to delete its stored image. `400` invalid ID; `404` missing item; `401`/`403`. |
| `GET /api/admin/settings/whatsapp` | Admin bearer token | None | `200`, `{ data: { number } }` | Returns the current WhatsApp order number. `401`/`403`. |
| `PUT /api/admin/settings/whatsapp` | Admin bearer token | JSON: `number` (digits after normalization; 8 to 15 digits) | `200`, saved number | Sets the order number. `400` invalid number; `401`/`403`. |

## Upload and Error Behavior

Dish and gallery images must use JPG/JPEG, PNG, or WEBP MIME types and matching filename extensions; files are limited to 5 MB. Uploads are sent to Cloudinary in the `deeksha-caterers/dishes` or `deeksha-caterers/gallery` folder. The browser receives secure image URLs; `imageUrl` is a JSON virtual alias of the stored `image` value.

Common API errors are `400` validation, upload, or invalid-ID errors; `401` missing/invalid authentication; `403` insufficient admin access; `404` missing route or record; `409` duplicate values; `429` rate limiting; `502` image-provider failure; and `500` unexpected server errors. Not every endpoint can produce every status. The server returns a generic message for unexpected failures.