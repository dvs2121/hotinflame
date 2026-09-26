# Architecture

## Runtime Shape

The application has two independently deployed parts:

1. `frontend/` contains three static HTML pages, one stylesheet, and browser scripts. It has no frontend package dependencies or compilation framework.
2. `backend/` is a CommonJS Express API. Controllers validate request data and use Mongoose models to persist records in MongoDB. Cloudinary handles new image uploads.

The browser reads `window.API_BASE` from `config.js`. `scripts/build-frontend.js` copies `frontend/` to the ignored `public/` directory and writes the selected API base there. During a Vercel build it writes the API base into `frontend/config.js`, which is the configured Vercel output directory.

## Request Flow

```text
Browser page -> API_BASE -> Express middleware -> route/controller -> Mongoose -> MongoDB
                                                       |
                                                       +-> Cloudinary for image uploads
```

`backend/server.js` configures Helmet, CORS, JSON/form body limits, static legacy uploads, route-level rate limits, direct admin upload/settings routes, and centralized error responses. The route files mount public and protected controller operations. `auth` and `adminAuth` verify bearer JWTs and reload the corresponding database record; admin access is not granted by frontend state.

## Source Ownership

- `frontend/` is the authored frontend source. `public/` is generated output and ignored by Git; do not edit it as the source of record.
- `backend/routes/` defines grouped REST endpoints. Several admin write routes and WhatsApp settings endpoints are registered directly in `backend/server.js` because they use shared upload middleware or are small settings handlers.
- `backend/controllers/` contains request validation and business behavior; `backend/models/` defines MongoDB documents.
- `backend/config/cloudinary.js` validates credentials and owns image upload/deletion. `backend/config/uploads.js` resolves legacy local image paths safely.
- `backend/seed.js` provisions the admin and initial menu data. It is a separate command and is not run automatically when the API starts.

The API endpoint inventory is maintained in [api.md](api.md); persistence details are in [database.md](database.md).