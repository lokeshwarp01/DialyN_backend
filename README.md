# DailyNews API (backend only)

This project is a Node.js + Express backend using MongoDB and Cloudinary for image storage.

Features

- Admin (single) can create/read/update/delete news items (CRUD).
- Users can register/login (optional) and fetch news by topic or single news.
- Images are uploaded to Cloudinary.

Run locally

1. Copy `.env.example` to `.env` and fill in values (MongoDB URI, Cloudinary keys, JWT secret).
2. Install dependencies:

```powershell
npm install
```

3. Start server:

```powershell
npm run dev
```

API Endpoints (summary)

Auth

- POST /api/auth/admin/register - create admin (use once)
- POST /api/auth/admin/login - admin login -> returns token
- POST /api/auth/user/register - user registration
- POST /api/auth/user/login - user login -> returns token

Admin (protected by admin token)

- GET /api/admin/news - list all news
- POST /api/admin/news - create news (multipart/form-data; field: image)
- PUT /api/admin/news/:id - update news (multipart/form-data optional image)
- DELETE /api/admin/news/:id - delete news

User (public or protected)

- GET /api/news - list all news
- GET /api/news/topic/:topic - list news by topic
- GET /api/news/:id - get single news by id

Testing
Use Postman to call endpoints. For admin protected routes add Authorization header:

Key: Authorization
Value: Bearer <token>
