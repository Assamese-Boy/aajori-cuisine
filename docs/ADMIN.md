# Aajori Cuisine - Super Admin Operations Control Center

The Super Admin panel is an **operational control center**, not a basic CRUD dashboard. It gives district operations managers total observability and intervention capabilities across the district.

---

## 1. Operational Views & Modules

### 1.1 Dashboard Overview
- **District Telemetry**: Active orders, today's gross & net sales, weekly sales, online delivery partners, and open kitchens.
- **Order Stream**: Real-time ticker of incoming tickets with visual status badges.
- **Operations Alerts**: Delayed order detection, payment issues, and weather/shift warnings.

### 1.2 Live GIS Operations Map
- Built using **Leaflet + OpenStreetMap** without expensive proprietary Google Maps API lock-in.
- Displays:
  - Orange nodes: Active district restaurants with real-time in-flight order counters.
  - Blue pins: Online delivery fleet with battery percentages and current shift status.
  - Green markers: Customer drop-off points.
  - Dotted radial circles: PostGIS delivery zone service boundaries.

### 1.3 Order Control Center
- Multi-filter pipeline (`ALL`, `ACTIVE`, `COMPLETED`, `CANCELLED`).
- **Full Visual Lifecycle Inspector**:
  `Created -> Payment -> Restaurant Accepted -> Preparing -> Ready -> Rider Assigned -> Picked Up -> In Transit -> Delivered`
- Immutable historical pricing breakdown snapshot viewer.
- Manual intervention action buttons (`Accept Order`, `Start Cooking`, `Mark Ready`, `Assign Rider`, `Confirm Delivered`, `Emergency Cancel`).

### 1.4 Restaurant Partner Management
- Instant store order pausing / resumption.
- Commission rate display (e.g. 10%, 12%, 14%).
- Authoritative dish catalog inspector with veg/non-veg indicators.

### 1.5 Delivery Fleet Telemetry
- Roster of delivery partners with vehicle registrations and driving licenses.
- Online/offline shift monitor.
- Battery level alerts and lifetime delivery counts.

### 1.6 AI & WhatsApp Interactive Hub
- Live simulator for customer queries ("Find something spicy for 2 people under ₹500").
- JSON intent inspector verifying that no hallucinated dishes or invented prices ever leave the platform.
- WhatsApp conversation tester with automatic stateful replies.

### 1.7 Enterprise Audit Logs
- Immutable record of every administrative action (who, what, when, old values, new values, target entity).
