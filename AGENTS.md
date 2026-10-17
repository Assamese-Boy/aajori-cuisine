# Workspace Rules & Architecture Directives

## 1. Deprecated Folders (DO NOT TOUCH)
- **`backend/` is DEPRECATED and NO LONGER USED.**
  - Never make changes, edits, or package installations inside the `backend/` folder.
  - Never run tests or commands inside `backend/`.
  - All API routes and server logic reside exclusively in `admin_panel` (`admin_panel/src/app/api/v1/`).

## 2. Active Application Stack
- **`admin_panel/`**:
  - Full-stack Next.js 14 App Router application.
  - Serves both the Admin Portal UI and the complete REST API (`/api/v1/...`) for all platform clients.
  - Handles database operations via `server-db.ts` (Supabase + local fallback).
  - Handles server-side notifications, media storage, auth, and orders.
- **`customer_web/`**:
  - React + Vite customer web storefront (`cuisine.aajori.in`).
  - Calls `admin_panel`'s API (`/api/v1`).
- **`database/`**:
  - PostgreSQL / Supabase SQL migrations.
