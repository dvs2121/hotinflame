# Deployment

The frontend and API are separate services. The current Vercel configuration runs `npm run build` and publishes `frontend/`. The build script also creates `public/` for local/static hosting; Git ignores this generated directory. The API is a separate Node service, currently documented for Render, and connects to MongoDB and Cloudinary.

## Frontend

1. Connect the repository to Vercel.
2. Set `NEXT_PUBLIC_API_URL` to the backend origin, for example `https://your-api.example`, without `/api` (the build adds it).
3. Build and deploy. Vercel sets `VERCEL`; the build script writes the configured API base into `frontend/config.js`, which is the configured output directory.
4. Add the deployed frontend origin to the backend's `CORS_ORIGINS` value.

The current build script writes a generated `public/` copy as well. Do not treat that ignored copy as source. Verify the effective `window.API_BASE` in the deployed `config.js` if changing hosting configuration.

## Backend

Deploy `backend/` as a Node.js service with `npm start` as its start command. Set `NODE_ENV=production`, `PORT` as provided by the host, and the required MongoDB, JWT, CORS, admin-seed (only when seeding), and Cloudinary values. `npm run seed` must be run deliberately with the intended database and admin credentials; it is not part of server startup.

Allow the backend host to connect to MongoDB Atlas. Set `CORS_ORIGINS` to the exact frontend origin(s), such as `https://your-site.vercel.app`. Serve both services over HTTPS. Cloudinary secrets belong only in the backend environment, never in Vercel frontend variables.

## Storage and Health

New dish and gallery images go to Cloudinary, so a persistent disk is not required for new uploads. A disk mounted at `UPLOADS_DIR` is only relevant if the deployment must retain old local `/uploads/...` assets. The API health endpoint is `GET /api/health`; it reports whether Mongoose is connected but does not replace host-level process monitoring.

## Deployment Checklist

- [ ] Set a unique JWT secret of at least 32 characters.
- [ ] Set database and Cloudinary credentials in the backend service only.
- [ ] Restrict production CORS to approved frontend origins.
- [ ] Confirm MongoDB network access allows the backend service.
- [ ] Configure the frontend API origin and inspect the built API base.
- [ ] Seed the admin using a strong, non-default password.
- [ ] Check `GET /api/health`, an admin login, and image upload after deployment.