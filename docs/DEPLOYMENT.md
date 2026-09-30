# Aajori Cuisine - Deployment Guide

This guide covers deployment instructions for the **Vercel + Supabase** production stack as well as local development.

---

## 1. Local Development Setup

### 1.1 Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- Flutter >= 3.x (with Dart 3.x)

### 1.2 Starting the Backend
```bash
cd backend
npm install
npm test            # Runs unit & integration test suites
npm run dev         # Launches server at http://localhost:4000
```

### 1.3 Starting the Super Admin Operations Control Center
```bash
cd admin_panel
npm install
npm run dev         # Launches web panel at http://localhost:5173
```

### 1.4 Running Customer Flutter Mobile App
```bash
cd customer_app
flutter pub get
flutter run         # Runs on connected Android/iOS device or Chrome
```

### 1.5 Running Delivery Partner Flutter App
```bash
cd delivery_app
flutter pub get
flutter run         # Runs on connected rider device
```

---

## 2. Supabase PostgreSQL + PostGIS Deployment

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Run the migrations in sequence:
   - `database/migrations/001_initial_schema.sql` (Enables PostGIS, creates tables, enums, triggers)
4. (Optional for development) Run seed data:
   - `database/seeds/001_district_seed.sql` (Seeds 3 authentic Assamese restaurants, menus, riders, zones)
5. Copy your project connection settings into `backend/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`

---

## 3. Vercel Backend Deployment

The backend is engineered as a serverless-compatible Express application.

1. Install Vercel CLI: `npm i -g vercel`
2. In the `backend` directory, create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ]
}
```
3. Configure environment variables in the Vercel project dashboard:
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DEFAULT_DISTRICT=Kamrup Metropolitan`
   - `DEFAULT_CITY=Guwahati`
4. Deploy with `vercel --prod`.

---

## 4. Admin Panel Deployment

The Admin Control Center is a modern Vite/React single-page application.
Deploy to Vercel, Netlify, or Cloudflare Pages:
```bash
cd admin_panel
npm run build
# Upload dist/ folder
```
Set the `VITE_API_BASE_URL` to your production Vercel backend URL.
