# Database

The backend connects to MongoDB with Mongoose. `MONGODB_URI` supplies the connection string and `MONGODB_DB_NAME` explicitly selects the database name. The schemas are defined in `backend/models/`.

| Collection/model | Stored data and notable constraints |
| --- | --- |
| `Admin` | Name, unique normalized email, hidden password hash, and admin role. |
| `User` | Name, unique normalized email, phone, and hidden password hash. |
| `Dish` | Name, description, image URL and Cloudinary public ID, image caption, category string, brand `type`, availability, timestamps. The JSON `imageUrl` virtual aliases `image`. |
| `Category` | Unique normalized name and optional description. Dish category values are stored as strings, not category references. |
| `Quotation` | Customer/event details, guest count, selected dish names and quantities, optional user reference, requirements/message, status, timestamps. Status is one of `pending`, `contacted`, `confirmed`, `completed`, or `cancelled`. |
| `Contact` | Name, normalized email, phone, message, and creation time. |
| `Gallery` | Title, caption, image URL and Cloudinary public ID, brand `type`, timestamps. The JSON `imageUrl` virtual aliases `image`. |
| `Settings` | Unique key/value pairs; currently used for `whatsappOrderNumber`. |

Mongoose validation is supplemented by controller checks. The global error handler maps validation errors to `400`, duplicate-key errors to `409`, and invalid ObjectIds to `400`. The API does not expose database credentials or password hashes in public profile responses.

## Initial Data

Run `npm run seed` from the repository root after configuring `backend/.env`. The seed script upserts the configured admin and inserts starter categories and sample dishes only when those records do not already exist. It does not clear existing collections. Change admin environment values before seeding; rerunning the script updates that admin's name and password hash.

## Image Records

New image records store the Cloudinary secure URL in `image` plus the provider's `imagePublicId` for deletion/replacement. Older `/uploads/...` image paths remain resolvable under `backend/uploads` or the configured `UPLOADS_DIR`. No migration is performed automatically. An image stored on an ephemeral host may no longer exist; replace it using the admin UI.