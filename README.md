# Deeksha Caterers

Deeksha Caterers is a static catering website for the Deeksha Caterers and TheFlameIn Hot brands. It presents menus and event photography, lets visitors build a dish enquiry and request a quotation, and provides an authenticated admin area for managing menus, quotations, gallery images, categories, and the WhatsApp order number.

## Features

- Responsive public home page with brand switching, dish filters, a cart, gallery, contact form, and event quotation form.
- Public user registration, login, and profile API endpoints. The current public website submits quotations as a guest; it does not require an account.
- Admin login and protected management of dishes, categories, quotations, gallery images, and the WhatsApp number.
- Cloudinary-backed image uploads for dishes and gallery items, with support for serving legacy local `/uploads/...` images.
- MongoDB persistence, request rate limits, Helmet security headers, and an explicit CORS allow-list in production.

## Technology

The frontend is plain HTML, CSS, and browser JavaScript. The backend uses Node.js, Express 4, Mongoose, and MongoDB. Images are uploaded to Cloudinary; authentication uses bcryptjs password hashes and signed JWTs. Vercel serves the static frontend and the API is deployed separately (currently documented for Render).

## Project Layout

```text
frontend/                 Authored static pages, styles, and browser scripts
public/                   Generated copy created by `npm run build` (git-ignored)
backend/config/            Database, Cloudinary, and legacy upload configuration
backend/controllers/       Request handlers and persistence logic
backend/middleware/        User and admin JWT authentication
backend/models/            Mongoose schemas
backend/routes/             Express routers
backend/seed.js             Initial admin, categories, and sample dishes
scripts/build-frontend.js   Static output and API-base configuration
docs/                       Architecture, API, data, environment, and operations guides
```

The Vercel configuration publishes `frontend/`; the build script also creates `public/` for local/static hosting. `public/` is generated and ignored by Git. See [Architecture](docs/architecture.md) for request flow and ownership details.

## Requirements

- Node.js 18 or newer and npm.
- A MongoDB database and a Cloudinary account. The API currently validates Cloudinary configuration at startup, including when running locally.
- A static file server for local frontend testing.

## Backend Setup

From the repository root:

```sh
npm run install:backend
cp backend/.env.example backend/.env
```

Edit `backend/.env` with a MongoDB connection URI, database name, a long random JWT secret, admin seed credentials, and Cloudinary credentials. The sample contains placeholders only. See [Environment](docs/environment.md) before deploying or sharing configuration.

Create the initial admin account and starter catalog:

```sh
npm run seed
```

Start the API for local development:

```sh
npm run dev
```

The sample sets `PORT=5002`; the API waits for MongoDB before listening at `http://localhost:5002`. `npm start` starts the same server without Nodemon.

## Frontend Setup

In a second terminal, build a local static copy configured to use the local API, then serve it on an origin allowed by the sample CORS setup:

```sh
NEXT_PUBLIC_API_URL=http://localhost:5002 npm run build
npx --yes http-server public -p 5500
```

Open `http://localhost:5500`. The build script appends `/api` to the configured API origin. `API_BASE_URL` is also accepted for older build environments. With no API URL configured, local builds use same-origin `/api`; on Vercel the default is the deployed API URL.

## Database and Images

The application stores admins, users, dishes, categories, quotations, contacts, gallery entries, and settings in MongoDB. The configured `MONGODB_DB_NAME` selects the database. The seed command is idempotent for its admin, starter categories, and sample dishes. Details and field constraints are in [Database](docs/database.md).

Dish and gallery uploads accept JPG, JPEG, PNG, or WEBP files up to 5 MB. Multer holds the upload in memory and Cloudinary stores the image; MongoDB stores its secure URL and Cloudinary public ID. Old image paths under `/uploads/` are still served from `backend/uploads` (or `UPLOADS_DIR` when configured), but new uploads do not use local disk. See [Environment](docs/environment.md) for the storage settings.

## Authentication and Roles

User registration and login return seven-day user JWTs. Admin login returns an eight-hour admin JWT. Protected API calls require `Authorization: Bearer <token>`; the admin middleware checks the signed role and reloads the admin record from MongoDB. The browser stores the admin token in `sessionStorage`, so it is scoped to the current tab session. Public quotation submission does not require a user account. Rate limits apply to authentication and public write routes.

## Admin and Visitor Workflows

Visitors can browse both brands' menus and galleries, add dishes to the cart, submit an event quotation, and send a contact message. The cart also supports a WhatsApp enquiry when the admin has configured a number. The admin portal manages dishes and availability, quotation statuses, gallery images, dish categories, and that WhatsApp number. User account endpoints are available in the API but are not currently linked to a public account UI.

The complete endpoint list, authentication requirements, request fields, success responses, and common errors are in [API](docs/api.md).

## Build and Deployment

```sh
npm run build                  # Generate public/ and its API configuration
npm run install:backend        # Install backend dependencies
npm run dev                    # Start the backend with Nodemon
npm start                      # Start the backend without Nodemon
npm run seed                   # Seed the initial admin and catalog
```

Deploy the frontend to Vercel and the backend as a separate Node service. Configure the API URL on Vercel and set backend environment variables on the API host. MongoDB Atlas must allow connections from the backend host; the backend CORS list must include the deployed frontend origin. The current Vercel project publishes `frontend/`, while `npm run build` also writes the ignored `public/` directory. See [Deployment](docs/deployment.md) for the build behavior and deployment checklist.

## Troubleshooting

- **API exits at startup:** verify all three Cloudinary variables, MongoDB URI, and database name. Production also requires `JWT_SECRET` (at least 32 characters) and `CORS_ORIGINS`.
- **MongoDB connection fails:** check the URI, database user/password URL encoding, Atlas network access, and host connectivity.
- **Browser reports a CORS error:** use an origin listed in `CORS_ORIGINS`; in development, localhost origins are allowed, while production requires an explicit match.
- **Frontend calls the wrong API:** rebuild with `NEXT_PUBLIC_API_URL` (or `API_BASE_URL`) set to the API origin without `/api`, or inspect the generated `config.js`.
- **Image upload fails:** verify Cloudinary credentials, allowed format, and the 5 MB limit. Legacy local files may be missing on ephemeral hosts; upload them again through the admin portal.
- **Admin login fails:** confirm the account was seeded and use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values configured before seeding.

## Security Notes

Never commit `.env` files or place Cloudinary credentials, database credentials, admin passwords, or JWT secrets in frontend configuration. Use a unique JWT secret of at least 32 characters in production and non-default admin credentials. CORS is not authentication: protected operations enforce admin JWT authorization on the server. Admin JWTs are held in browser `sessionStorage`, which is accessible to same-origin scripts; keep the frontend free of untrusted script injection and serve it over HTTPS. The example environment file uses placeholders and must be replaced before use.

## Future Improvements

- Add focused automated tests for authentication, quotation validation, admin authorization, and image lifecycle behavior.
- Add pagination for growing dish, gallery, and quotation collections.
- Consider an HttpOnly cookie session for the admin UI and stronger image-content inspection before upload.
- Add a health/readiness check that distinguishes process availability from database readiness for deployment monitoring.
