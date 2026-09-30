# Aajori Cuisine

> **AI-Native Hyperlocal Food Delivery & Commerce Platform for Assam, India**

Aajori Cuisine is an enterprise-grade local food-commerce infrastructure platform built for district-scale operations (initially configured for Kamrup Metropolitan / Guwahati, Assam). It unites multiple ordering and operational interfaces through a single source-of-truth backend:

1. **Native Flutter Customer Application** (Android / iOS)
2. **Native Flutter Delivery Partner Application** (Android / iOS)
3. **Super Admin Operations Control Center** (React + Vite + Leaflet GIS)
4. **Restaurant Management Portal**
5. **WhatsApp Conversational Ordering Engine** (Meta Cloud API)
6. **AI Food Assistant** (Multi-turn preference resolver)
7. **MCP (Model Context Protocol) Server** (Standardized tools for Claude, ChatGPT, Gemini)

---

## 🏛️ System Architecture

```text
Customer Flutter App     Delivery Flutter App     Admin Web Control Center
WhatsApp Bot             AI Meal Assistant        MCP Clients (Claude/GPT)
        │                       │                        │
        └───────────────────────┴────────────────────────┘
                                │
                                ▼
                       PLATFORM REST API
                   (/api/v1 - Node.js/TypeScript)
                                │
                                ▼
                       CORE BUSINESS LOGIC
   ├── Authoritative Pricing Engine (PostGIS Distance Tiers, Tax, Packaging)
   ├── Strict Order State Machine & Transition Matrix
   ├── RBAC Security Guard (Customer, Rider, Restaurant, Admin)
   ├── Payment Abstraction Layer (UPI, Card, COD, Mock Gateway)
   └── Centralized Multi-Channel Notifications
                                │
                                ▼
                     PostgreSQL + PostGIS (Supabase)
                   + Realtime WebSocket Subscriptions
                   + Object Storage (S3 / Supabase)
```

---

## 📁 Repository Structure

```text
aajori-cuisine/
├── backend/                  # Node.js/TypeScript Modular Monolith
│   ├── src/
│   │   ├── config/           # Typed environment & constants
│   │   ├── modules/          # Auth, Pricing, Orders, Delivery, Payments, AI, MCP, Admin
│   │   ├── routes/           # Unified REST API router
│   │   └── server.ts         # Express server & Vercel entrypoint
│   └── tests/                # Unit test suites (Pricing, State Machine, AI)
│
├── admin_panel/              # Super Admin Control Center & Restaurant Portal
│   ├── src/
│   │   ├── components/       # UI kit, Header with role-switcher, Sidebar
│   │   └── pages/            # Dashboard, Orders Inspector, Live GIS Map, AI Sandbox
│   └── vite.config.ts        # Fast Vite bundler with API proxy
│
├── customer_app/             # Native Flutter Customer Mobile Application
│   └── lib/
│       ├── core/             # API client & local session storage
│       └── main.dart         # Explore, Restaurant Menu, Backend Cart & Order Tracking
│
├── delivery_app/             # Native Flutter Delivery Partner Application
│   └── lib/
│       ├── core/             # API client & battery-conscious tracking
│       └── main.dart         # Shift toggle, Broadcast acceptance, Turn-by-turn workflow
│
├── database/                 # Supabase PostgreSQL + PostGIS Migrations & Seeds
│   ├── migrations/           # 001_initial_schema.sql
│   └── seeds/                # 001_district_seed.sql (3 authentic Assam restaurants)
│
└── docs/                     # Architectural & operational documentation
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API.md
    ├── DEPLOYMENT.md
    ├── SECURITY.md
    ├── MCP.md
    ├── WHATSAPP.md
    └── ADMIN.md
```

---

## 🚀 Quick Start Guide

### 1. Start Backend Server
```bash
cd backend
npm install
npm test            # Run Vitest test suite (10/10 tests)
npm run build       # Build TypeScript
npm run dev         # Launches on http://localhost:4000
```

### 2. Start Super Admin Operations Control Center
```bash
cd admin_panel
npm install
npm run build       # Builds production bundle cleanly
npm run dev         # Launches web control center on http://localhost:5173
```

### 3. Run Native Flutter Customer Mobile App
```bash
cd customer_app
flutter pub get
flutter run
```

### 4. Run Native Flutter Delivery Partner App
```bash
cd delivery_app
flutter pub get
flutter run
```

---

## 🍲 Sample District Seed Data (Kamrup Metro)

The platform is pre-loaded with authentic indigenous Assamese culinary institutions:
1. **Khorikaa Ethnic Kitchen** (GS Road, Ulubari): Smoked pork with khorisa (bamboo shoot), duck curry with roasted black sesame (til), Joha rice with pitika platter.
2. **Paradise Heritage Diner** (Silpukhuri): Parampara grand non-veg thalis, Masor Tenga with Kaji Nemu.
3. **Brahmaputra Spice Bistro** (Uzan Bazar Riverfront): Hot luchi & til aloo dum, Assam smoked orthodox iced tea.

---

## 🧪 Testing Summary

```bash
cd backend
npm test
```

- **Pricing Engine**: Verifies item subtotal calculations, packaging fees, tiered PostGIS delivery fee rules, coupon application, and minimum spend enforcement.
- **Order State Machine**: Verifies valid status transitions (`CREATED` -> `CONFIRMED` -> `PREPARING` -> `READY` -> `TRANSIT` -> `DELIVERED`), rejects invalid jumps, and verifies RBAC permissions.
- **AI Meal Assistant**: Verifies intent parsing for budget, headcount, and spiciness, and ensures all recommended combos are strictly grounded in real database menu items (zero hallucination).

---

## 🔐 Credentials & Environment Setup

Refer to `backend/.env.example` for all configurable variables:
- `JWT_SECRET`: Secret key for token signing.
- `DATABASE_URL`: PostgreSQL + PostGIS connection string.
- `PAYMENT_GATEWAY_PROVIDER`: `MOCK` (for local development) or `RAZORPAY`.
- `WHATSAPP_VERIFY_TOKEN`: Meta WhatsApp Cloud API verification token.
