# Deeksha Caterers

Deeksha Caterers is a static frontend connected to an Express/MongoDB Atlas backend. The existing visual design is preserved; menu, admin, quotations, and contact workflows use REST APIs.

## Setup

1. Install Node.js 18 or newer.
2. From the project root, install backend dependencies:

```bash
cd backend
npm install
```

Alternatively, from the project root run `npm run install:backend`.

3. Copy `backend/.env.example` to `backend/.env` and set every value, including `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Keep `<db_password>` as a placeholder until you replace it locally with the URL-encoded MongoDB Atlas database password. Never commit `.env`.
4. Create a MongoDB Atlas cluster, create a database user, allow the development machine's IP address in Network Access, and use `MONGODB_DB_NAME=deeksha_caterers`.
5. Set a long random `JWT_SECRET` and a strong non-default `ADMIN_PASSWORD`.
6. Seed the admin and initial categories from either the project root or `backend/`:

```bash
npm run seed
```

7. Start the API from either the project root or `backend/`:

```bash
npm run dev
```

The API starts on `http://localhost:5002` only after MongoDB connects when `PORT=5002` is set locally. Use `npm start` for production-style startup.

## Frontend Configuration

The frontend build uses `NEXT_PUBLIC_API_URL` (or the legacy `API_BASE_URL`) and appends `/api` when needed. For Vercel, set `NEXT_PUBLIC_API_URL=https://hotinflame.onrender.com` for Preview and Production. If it is omitted on Vercel, the build defaults to the deployed API; local builds use same-origin `/api`.

Quotation submission is a guest workflow: customers provide their contact and event details and do not create or enter a password. Admin JWTs are stored only for the current browser session and are required for all admin mutations.

## API Endpoints

Public:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` with a user bearer token
- `GET /api/dishes`
- `GET /api/dishes/:id`
- `GET /api/categories`
- `POST /api/quotations` as a public guest endpoint
- `POST /api/contact`

Admin:

- `POST /api/admin/login`
- `GET /api/admin/me`
- `POST /api/admin/dishes` multipart form with optional `image`
- `PUT /api/admin/dishes/:id` multipart form with optional `image`
- `DELETE /api/admin/dishes/:id`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `GET /api/admin/quotations`
- `GET /api/admin/quotations/:id`
- `PUT /api/admin/quotations/:id/status`

Dish and gallery images accept JPG, JPEG, PNG, and WEBP up to 5 MB. New uploads are held in memory during the request, sent to Cloudinary, and saved in MongoDB as an HTTPS `image`/`imageUrl` plus an `imagePublicId`. Assets use the `deeksha-caterers/dishes` and `deeksha-caterers/gallery` folders. Existing `/uploads/...` records remain supported and are served from `backend/uploads/` when those old files still exist; records and files are not bulk-migrated or deleted. If a legacy file has already disappeared from ephemeral storage, re-upload its image through the admin panel.

## Deployment

The Vercel project serves only the static frontend. Deploy `backend/` separately on Render and set `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the Render service environment. Set `CORS_ORIGINS` to the deployed frontend origin `https://hotinflamee.vercel.app` (and any other approved origins), and configure MongoDB Atlas Network Access for Render. A Render persistent disk and `UPLOADS_DIR` are not required for new uploads.

Set the Vercel environment variable `NEXT_PUBLIC_API_URL` to `https://hotinflame.onrender.com` for Preview and Production, then redeploy. Cloudinary credentials are backend-only and must not be added to Vercel; the frontend receives image URLs through the API.

Serve both applications over HTTPS and use a managed process supervisor for the backend. The backend validates all three Cloudinary variables at startup and exits with a clear missing-variable message if any are unset.

## Security Notes

Passwords are bcrypt-hashed, JWT secrets, MongoDB credentials, and the Cloudinary API secret are never returned by the API, auth routes are rate-limited, request bodies are validated, ObjectId and upload errors are handled centrally, and `helmet`/CORS are enabled. The placeholder credentials in `backend/.env.example` are intentionally unusable until configured locally.
