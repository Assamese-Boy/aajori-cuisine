# Aajori Cuisine - Database Design & PostGIS Schema Specification

## 1. Relational Database Overview
The storage layer is built on **PostgreSQL 15+** with the **PostGIS** geospatial extension enabled. It enforces data integrity, strict referential integrity, and fine-grained Row-Level Security (RLS).

---

## 2. PostgreSQL Enums

```sql
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'RESTAURANT_OWNER',
  'RESTAURANT_MANAGER',
  'DELIVERY_PARTNER',
  'CUSTOMER'
);

CREATE TYPE account_status AS ENUM (
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED'
);

CREATE TYPE order_status AS ENUM (
  'CREATED',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'PAYMENT_FAILED',
  'RESTAURANT_ACCEPTED',
  'REJECTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'CANCELLED',
  'REFUND_PENDING',
  'REFUNDED'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
);

CREATE TYPE payment_method AS ENUM (
  'UPI',
  'CARD',
  'NETBANKING',
  'CASH_ON_DELIVERY'
);

CREATE TYPE rider_shift_status AS ENUM (
  'OFFLINE',
  'ONLINE_IDLE',
  'ORDER_ASSIGNED',
  'IN_TRANSIT_TO_RESTAURANT',
  'IN_TRANSIT_TO_CUSTOMER'
);
```

---

## 3. Core Tables Specification

### 3.1. `users` and `user_profiles`
Stores platform identity, synced with Supabase `auth.users`.
- `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
- `phone VARCHAR(15) UNIQUE NOT NULL`
- `email VARCHAR(255) UNIQUE`
- `role user_role NOT NULL DEFAULT 'CUSTOMER'`
- `status account_status NOT NULL DEFAULT 'ACTIVE'`
- `full_name VARCHAR(120) NOT NULL`
- `avatar_url TEXT`
- `fcm_token TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 3.2. `customer_addresses`
Addresses saved by customers with PostGIS coordinates.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `label VARCHAR(50) NOT NULL` -- e.g. 'Home', 'Work', 'Hostel'
- `address_line1 TEXT NOT NULL`
- `address_line2 TEXT`
- `landmark TEXT`
- `city VARCHAR(100) NOT NULL DEFAULT 'Guwahati'`
- `district VARCHAR(100) NOT NULL DEFAULT 'Kamrup Metropolitan'`
- `postal_code VARCHAR(10) NOT NULL`
- `location GEOGRAPHY(POINT, 4326) NOT NULL` -- (longitude, latitude)
- `delivery_instructions TEXT`
- `is_default BOOLEAN NOT NULL DEFAULT FALSE`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 3.3. `restaurants`
Hyperlocal restaurant profiles with operating parameters and geo coordinates.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name VARCHAR(200) NOT NULL`
- `slug VARCHAR(200) UNIQUE NOT NULL`
- `tagline TEXT`
- `description TEXT`
- `phone VARCHAR(20) NOT NULL`
- `email VARCHAR(255)`
- `commission_rate NUMERIC(5,2) NOT NULL DEFAULT 12.00` -- percentage
- `is_active BOOLEAN NOT NULL DEFAULT TRUE` -- Admin status
- `is_accepting_orders BOOLEAN NOT NULL DEFAULT TRUE` -- Store manual toggle
- `address_line TEXT NOT NULL`
- `district VARCHAR(100) NOT NULL DEFAULT 'Kamrup Metropolitan'`
- `postal_code VARCHAR(10) NOT NULL`
- `location GEOGRAPHY(POINT, 4326) NOT NULL`
- `avg_prep_time_minutes INT NOT NULL DEFAULT 25`
- `min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 100.00`
- `packaging_fee NUMERIC(10,2) NOT NULL DEFAULT 15.00`
- `cuisine_types TEXT[] NOT NULL DEFAULT '{}'` -- e.g. ['Assamese Ethnic', 'North Indian', 'Bihari']
- `logo_url TEXT`
- `cover_url TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 3.4. `restaurant_hours`
Weekly operating hours schedule.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE`
- `day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6)` -- 0 = Sunday
- `open_time TIME NOT NULL`
- `close_time TIME NOT NULL`
- `is_closed BOOLEAN NOT NULL DEFAULT FALSE`

### 3.5. `menu_categories` and `menu_items`
Hierarchical catalog with variant and add-on support.
- `menu_categories`: `id, restaurant_id, name, display_order, is_active`
- `menu_items`:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE`
  - `category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT`
  - `name VARCHAR(200) NOT NULL`
  - `description TEXT`
  - `price NUMERIC(10,2) NOT NULL CHECK (price >= 0)`
  - `is_veg BOOLEAN NOT NULL DEFAULT FALSE`
  - `is_available BOOLEAN NOT NULL DEFAULT TRUE`
  - `spiciness_level INT DEFAULT 1 CHECK (spiciness_level BETWEEN 0 AND 3)`
  - `image_url TEXT`
  - `prep_time_minutes INT DEFAULT 20`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `menu_item_variants`: `id, menu_item_id, name (e.g. 'Half', 'Full', '2pc'), price, is_available`
- `menu_item_addons`: `id, menu_item_id, name (e.g. 'Extra Joha Rice', 'Khorisa Dip'), price, is_available`

### 3.6. `delivery_zones` and `pricing_rules`
PostGIS polygon boundaries and distance fee formulas.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name VARCHAR(100) NOT NULL`
- `district VARCHAR(100) NOT NULL DEFAULT 'Kamrup Metropolitan'`
- `boundary GEOMETRY(POLYGON, 4326)` -- PostGIS polygon of service boundary
- `center_point GEOGRAPHY(POINT, 4326)`
- `base_fee NUMERIC(10,2) NOT NULL DEFAULT 20.00`
- `base_distance_km NUMERIC(5,2) NOT NULL DEFAULT 3.00`
- `per_km_fee NUMERIC(10,2) NOT NULL DEFAULT 7.50`
- `max_delivery_distance_km NUMERIC(5,2) NOT NULL DEFAULT 10.00`
- `is_active BOOLEAN NOT NULL DEFAULT TRUE`

### 3.7. `delivery_partners` and `delivery_locations`
Rider profiles and spatial tracking.
- `id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE`
- `vehicle_type VARCHAR(50) NOT NULL DEFAULT 'BIKE'`
- `vehicle_number VARCHAR(30) NOT NULL`
- `driving_license_number VARCHAR(50) NOT NULL`
- `shift_status rider_shift_status NOT NULL DEFAULT 'OFFLINE'`
- `current_location GEOGRAPHY(POINT, 4326)`
- `last_location_time TIMESTAMPTZ`
- `battery_percentage INT`
- `rating NUMERIC(3,2) DEFAULT 5.00`
- `total_completed_orders INT DEFAULT 0`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 3.8. `orders`, `order_items`, and `order_status_history`
Core transactional tables with immutable financial snapshots.
- `orders`:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `order_number VARCHAR(30) UNIQUE NOT NULL` -- e.g. 'AJR-202610-0012'
  - `customer_id UUID NOT NULL REFERENCES users(id)`
  - `restaurant_id UUID NOT NULL REFERENCES restaurants(id)`
  - `delivery_partner_id UUID REFERENCES delivery_partners(id)`
  - `delivery_address JSONB NOT NULL` -- Snapshot of full customer address & geo point
  - `delivery_distance_km NUMERIC(5,2) NOT NULL`
  - `status order_status NOT NULL DEFAULT 'CREATED'`
  - `payment_status payment_status NOT NULL DEFAULT 'PENDING'`
  - `payment_method payment_method NOT NULL DEFAULT 'UPI'`
  - `subtotal NUMERIC(10,2) NOT NULL`
  - `packaging_fee NUMERIC(10,2) NOT NULL`
  - `delivery_fee NUMERIC(10,2) NOT NULL`
  - `platform_fee NUMERIC(10,2) NOT NULL`
  - `tax_amount NUMERIC(10,2) NOT NULL`
  - `discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00`
  - `total_price NUMERIC(10,2) NOT NULL`
  - `restaurant_commission_amount NUMERIC(10,2) NOT NULL`
  - `rider_payout_amount NUMERIC(10,2) NOT NULL`
  - `pricing_breakdown JSONB NOT NULL`
  - `customer_instructions TEXT`
  - `estimated_prep_time_minutes INT`
  - `estimated_delivery_time TIMESTAMPTZ`
  - `idempotency_key VARCHAR(100) UNIQUE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

- `order_items`:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE`
  - `menu_item_id UUID NOT NULL`
  - `name VARCHAR(200) NOT NULL`
  - `unit_price NUMERIC(10,2) NOT NULL`
  - `quantity INT NOT NULL CHECK (quantity > 0)`
  - `variant_snapshot JSONB`
  - `addons_snapshot JSONB`
  - `subtotal NUMERIC(10,2) NOT NULL`

- `order_status_history`:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE`
  - `from_status order_status`
  - `to_status order_status NOT NULL`
  - `actor_id UUID REFERENCES users(id)`
  - `actor_role VARCHAR(50) NOT NULL`
  - `reason TEXT`
  - `metadata JSONB`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 3.9. `audit_logs`
Immutable administrative audit trails.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `actor_id UUID REFERENCES users(id)`
- `actor_email VARCHAR(255)`
- `action VARCHAR(100) NOT NULL` -- e.g. 'UPDATE_DELIVERY_FEE', 'SUSPEND_RESTAURANT'
- `entity_type VARCHAR(50) NOT NULL` -- e.g. 'RESTAURANT', 'ORDER', 'COUPON'
- `entity_id VARCHAR(100) NOT NULL`
- `old_values JSONB`
- `new_values JSONB`
- `ip_address VARCHAR(50)`
- `user_agent TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

---

## 4. PostGIS Distance & Serviceability Functions

```sql
-- Calculate Haversine/Spheroidal distance between restaurant and customer
CREATE OR REPLACE FUNCTION calculate_delivery_distance_km(
  restaurant_id UUID,
  customer_lon DOUBLE PRECISION,
  customer_lat DOUBLE PRECISION
) RETURNS NUMERIC(5,2) AS $$
DECLARE
  dist_km NUMERIC(5,2);
BEGIN
  SELECT ROUND(
    (ST_Distance(
      r.location,
      ST_SetSRID(ST_MakePoint(customer_lon, customer_lat), 4326)::geography
    ) / 1000.0)::numeric, 2
  ) INTO dist_km
  FROM restaurants r
  WHERE r.id = restaurant_id;

  RETURN dist_km;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 5. Row-Level Security (RLS) Rules
- `customers`: Can select, insert, and update their own addresses, carts, and view only their own orders.
- `restaurants`: Staff can view orders for their restaurant ID, edit their own menu, and toggle accepting orders.
- `delivery_partners`: Can view broadcasts in their zone, view their assigned orders, and update their own location.
- `super_admin / admin`: Full SELECT, INSERT, UPDATE across all tables with audit logging.
