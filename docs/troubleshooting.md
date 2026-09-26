# Troubleshooting

## API Does Not Start

Check that `backend/.env` exists and contains all three Cloudinary values, `MONGODB_URI`, and `MONGODB_DB_NAME`. In production, also set `JWT_SECRET` (at least 32 characters) and `CORS_ORIGINS`. Startup waits for MongoDB; inspect the backend log for connection errors.

## MongoDB Connection Errors

Check the URI, database user permissions, URL-encoding of reserved password characters, Atlas network access, and DNS/network access from the API host. `MONGODB_DB_NAME` is passed separately to Mongoose and must also be set.

## Browser CORS or Network Errors

Inspect `window.API_BASE` in the served `config.js` and ensure it points to the correct API origin plus `/api`. Then compare the page's exact origin with `CORS_ORIGINS`. Production does not automatically allow arbitrary localhost or preview origins. The backend must be reachable over HTTPS when the page is served over HTTPS.

## Authentication Fails

For users, register via `/api/auth/register` or check the email/password pair. For admins, seed the database after setting `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`; the seed command intentionally rejects `change_this_password`. Check that the UI request sends the admin bearer token and that the database record still has the admin role.

## Upload or Image Display Fails

Uploads are limited to 5 MB and JPG/JPEG, PNG, or WEBP with matching MIME type and extension. Confirm Cloudinary credentials and account availability. Existing `/uploads/...` records need their files under `backend/uploads` or `UPLOADS_DIR`; ephemeral disks may have lost old files, in which case re-upload from the admin portal. New image URLs are returned by the API as `image` and `imageUrl`.

## Build Uses the Wrong API

Set `NEXT_PUBLIC_API_URL` (preferred) or `API_BASE_URL` at build time to the API origin. The build appends `/api`. Vercel uses `frontend/` as output and updates its `config.js`; a non-Vercel build writes the generated configuration to `public/`.

## No Automated Test Suite

The repository currently has no test script or test files. Basic checks include `npm run build`, `npm ls --prefix backend --depth=0`, and `node --check` on changed JavaScript. Exercise database-backed and upload workflows against a non-production environment before release.