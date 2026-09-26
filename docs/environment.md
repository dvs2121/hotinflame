# Environment Configuration

Copy `backend/.env.example` to `backend/.env` for local backend development. The example values are placeholders and are not usable credentials. Keep `.env` out of version control and configure production values in the hosting provider's secret/environment settings.

| Variable | Required | Use |
| --- | --- | --- |
| `PORT` | No | HTTP port; defaults to `5000`. The example uses `5002`. |
| `MONGODB_URI` | Yes | MongoDB connection string. Encode reserved characters in the database password. |
| `MONGODB_DB_NAME` | Yes | Database selected by Mongoose. |
| `JWT_SECRET` | Yes | Signs user and admin JWTs. Production startup requires at least 32 characters. Use a unique random value. |
| `CORS_ORIGINS` | Production | Comma-separated allowed origins, with scheme and optional port, no trailing path. Required in production. Local development also allows localhost/127.0.0.1 origins. |
| `ADMIN_NAME` | Seed command | Initial admin display name. |
| `ADMIN_EMAIL` | Seed command | Initial admin email; the login identifier `admin` resolves to this address. |
| `ADMIN_PASSWORD` | Seed command | Initial admin password. The seed command rejects the sample default. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account name. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret. Backend only; never expose it to the browser. |
| `UPLOADS_DIR` | No | Root directory for serving/deleting legacy local `/uploads/...` images. Defaults to `backend/uploads`. New images use Cloudinary. |
| `NODE_ENV` | Hosting platform | Set to `production` in production. This enables strict CORS origin matching and production config checks. |

The API validates all three Cloudinary values at startup. MongoDB URI and database name are checked when connecting. In production, `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET`, and `CORS_ORIGINS` must be set, and `JWT_SECRET` must contain at least 32 characters.

## Frontend Build Variables

These variables are read by `scripts/build-frontend.js`, not by the API:

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Preferred API origin. The build appends `/api` unless it is already present. Despite the conventional prefix, this is public browser configuration, not a secret. |
| `API_BASE_URL` | Legacy fallback for `NEXT_PUBLIC_API_URL`. |
| `VERCEL` | Set by Vercel. Selects the deployed API fallback and writes the generated API base into `frontend/config.js`, the Vercel output directory. |

For local frontend builds, set `NEXT_PUBLIC_API_URL=http://localhost:5002`; the generated `public/config.js` will then target `http://localhost:5002/api`. Without either API URL, non-Vercel builds use same-origin `/api`.