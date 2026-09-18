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

3. Copy `backend/.env.example` to `backend/.env` and set every value. Keep `<db_password>` as a placeholder until you replace it locally with the URL-encoded MongoDB Atlas database password. Never commit `.env`.
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

The API starts on `http://localhost:5002` only after MongoDB connects. Use `npm start` for production-style startup.

## Frontend Configuration

The frontend clients default to `http://localhost:5002/api` in `frontend/script.js` and `frontend/admin.js`. Change the `API_BASE` constant in both files for a deployed API, or define `window.API_BASE` before the relevant script is loaded. Serve the `frontend/` directory through a local web server such as VS Code Live Server or `npx serve frontend`; do not use a production frontend with a hardcoded development URL.

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

Dish images accept JPG, JPEG, PNG, and WEBP up to 5 MB. Files are stored under `backend/uploads/dishes/`; only their paths are saved in MongoDB. This storage boundary can be replaced with Cloudinary or S3 later.

## Deployment

Deploy the backend on a Node.js host with persistent or object storage for uploads, set the environment variables in the host's secret manager, restrict `CORS_ORIGINS` to the deployed frontend origin, and configure MongoDB Atlas Network Access for the deployment host. Serve the frontend from HTTPS and use an HTTPS API URL. A production deployment should move uploads to Cloudinary/S3 and use a managed process supervisor.

## Security Notes

Passwords are bcrypt-hashed, JWT secrets and MongoDB credentials are never returned by the API, auth routes are rate-limited, request bodies are validated, ObjectId and upload errors are handled centrally, and `helmet`/CORS are enabled. The placeholder credentials in `backend/.env` are intentionally unusable until configured locally.
