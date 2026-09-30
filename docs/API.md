# Aajori Cuisine - Unified Platform API Specification

All platform interfaces (Flutter Customer App, Flutter Delivery App, Restaurant Web Portal, Super Admin Control Center, WhatsApp Bot, AI Agent, MCP Server) consume these centralized REST APIs.

Base URL: `/api/v1`

---

## 1. Response Standard & Error Conventions

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "OUT_OF_SERVICE_RADIUS",
    "message": "Delivery location exceeds the maximum serviceable distance (8.4 km > 6.0 km).",
    "details": {
      "distance_km": 8.4,
      "max_distance_km": 6.0
    }
  }
}
```

---

## 2. API Endpoints Catalog

### 2.1. Authentication & Profile (`/api/v1/auth`)
- `POST /auth/send-otp`: `{ phone: "+919864012345" }`
- `POST /auth/verify-otp`: `{ phone: "+919864012345", otp: "123456" }` -> Returns `{ token, user }`
- `GET /auth/me`: Get current authenticated user profile and permissions
- `PUT /auth/profile`: Update name, email, avatar, fcm_token

### 2.2. Addresses & Geocoding (`/api/v1/addresses`)
- `GET /addresses`: List saved addresses for authenticated customer
- `POST /addresses`: Create new address with coordinates `{ label, address_line1, landmark, latitude, longitude, postal_code }`
- `DELETE /addresses/:id`: Delete saved address

### 2.3. Restaurants Discovery & Catalog (`/api/v1/restaurants`)
- `GET /restaurants?lat=26.1445&lng=91.7362&cuisine=Assamese&veg_only=false`: List serviceable restaurants ranked by distance & rating
- `GET /restaurants/:id`: Restaurant details, operating hours, delivery estimate
- `GET /restaurants/:id/menu`: Full menu catalog with categories, items, variants, and add-ons

### 2.4. Search (`/api/v1/search`)
- `GET /search?q=biryani&lat=26.1445&lng=91.7362`: Semantic & fuzzy full-text search across dishes and restaurants

### 2.5. Pricing & Cart Engine (`/api/v1/pricing` & `/api/v1/cart`)
- `POST /pricing/calculate`: Compute authoritative price breakdown before checkout:
  ```json
  {
    "restaurant_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "customer_location": { "latitude": 26.1445, "longitude": 91.7362 },
    "items": [
      {
        "menu_item_id": "c1a2b3c4-...",
        "quantity": 2,
        "variant_id": null,
        "addon_ids": ["e1f2..."]
      }
    ],
    "coupon_code": "AAJORI50"
  }
  ```
  Returns:
  ```json
  {
    "subtotal": 520.00,
    "packaging_fee": 20.00,
    "delivery_distance_km": 3.4,
    "delivery_fee": 35.00,
    "platform_fee": 5.00,
    "tax_amount": 26.00,
    "discount_amount": 50.00,
    "total_customer_price": 556.00,
    "is_serviceable": true
  }
  ```

### 2.6. Order Lifecycle (`/api/v1/orders`)
- `POST /orders`: Place order (Header `Idempotency-Key` required):
  ```json
  {
    "restaurant_id": "...",
    "items": [...],
    "delivery_address_id": "...",
    "payment_method": "UPI",
    "customer_instructions": "Less spicy, please provide bamboo shoot chutney",
    "coupon_code": "AAJORI50"
  }
  ```
- `GET /orders`: List order history for current customer / restaurant / rider / admin
- `GET /orders/:id`: Full order detail with status history timeline and pricing snapshot
- `PATCH /orders/:id/status`: Transition order status:
  ```json
  {
    "to_status": "PREPARING",
    "reason": "Kitchen ticket printed and cooking started",
    "prep_time_minutes": 25
  }
  ```
- `POST /orders/:id/cancel`: Customer or Admin cancellation with reason

### 2.7. Delivery Operations (`/api/v1/delivery`)
- `POST /delivery/shift`: Toggle status `{ is_online: true }`
- `POST /delivery/location`: Battery-efficient periodic location push `{ latitude, longitude, battery_level }`
- `GET /delivery/active-orders`: Orders assigned to or broadcast to current rider
- `POST /delivery/orders/:id/accept`: Rider accepts broadcast delivery request
- `POST /delivery/orders/:id/pickup`: Rider confirms food collection from restaurant
- `POST /delivery/orders/:id/deliver`: Rider confirms handover to customer (with optional OTP/geo-check)
- `GET /delivery/earnings`: Rider daily & weekly earnings summary

### 2.8. Restaurant Management (`/api/v1/restaurant-admin`)
- `GET /restaurant-admin/overview`: Today's orders, revenue, avg prep time, order queue
- `PATCH /restaurant-admin/accepting-orders`: Toggle accepting orders
- `POST /restaurant-admin/menu/items`: Create menu item
- `PATCH /restaurant-admin/menu/items/:id/availability`: Toggle item availability 86ing
- `GET /restaurant-admin/orders`: Live incoming KDS (Kitchen Display System) orders

### 2.9. Super Admin Control Center (`/api/v1/admin`)
- `GET /admin/dashboard`: Platform metrics, revenue, active riders, active orders, health alerts
- `GET /admin/live-map`: Coordinates of all restaurants, online riders, active deliveries, zones
- `GET /admin/orders`: Global order inspector with filters (status, restaurant, date range)
- `POST /admin/restaurants`: Onboard new restaurant with commission rate & PostGIS coords
- `PATCH /admin/restaurants/:id/status`: Approve / suspend restaurant
- `GET /admin/zones`: Delivery polygon boundaries and pricing matrices
- `POST /admin/zones`: Update or create delivery zones
- `GET /admin/audit-logs`: Immutable log of platform actions

### 2.10. AI Food Assistant (`/api/v1/ai`)
- `POST /ai/parse-intent`: Takes raw customer message (e.g. "I want something spicy for 2 people under ₹500 in Beltola") and converts to structured query filters
- `POST /ai/recommend`: Resolves structured query against real menu database and returns recommended combos

### 2.11. WhatsApp Business Webhook (`/api/v1/whatsapp`)
- `GET /whatsapp/webhook`: Meta Cloud API challenge verification
- `POST /whatsapp/webhook`: Inbound WhatsApp customer messages -> runs state machine -> sends interactive messages

### 2.12. MCP (Model Context Protocol) Server (`/api/v1/mcp`)
- JSON-RPC 2.0 endpoint exposing tools: `search_restaurants`, `get_menu`, `calculate_order`, `create_order`, `get_order_status`
