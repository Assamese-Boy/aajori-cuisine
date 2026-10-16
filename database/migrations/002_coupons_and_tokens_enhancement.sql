-- ============================================================================
-- AAJORI CUISINE - HYPERLOCAL FOOD-COMMERCE PLATFORM
-- Migration 002: Coupons, Order Tracking Tokens, Restaurant Busy Mode & Indexes
-- ============================================================================

-- 1. Add tracking_token to orders table for scoped, secure WhatsApp-accessible web tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS is_whatsapp_order BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_notification_status VARCHAR(50) DEFAULT 'NOT_SENT';

-- 2. Add is_busy flag to restaurants for kitchen operational throttling
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS is_busy BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS operational_notes TEXT;

-- 3. Enhance menu_items with portion sizing and add-on flags
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_customizations BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Add index on tracking_token for fast token-based tracking lookup
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders (tracking_token);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active_busy ON restaurants (is_active, is_accepting_orders, is_busy);

-- 5. Seed additional local coupons if not present
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, max_uses, current_uses, is_active)
VALUES 
  (gen_random_uuid(), 'AAJORI50', 'Flat ₹50 OFF on authentic Assamese meals above ₹250', 'FLAT', 50.00, 250.00, NULL, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', 1000, 42, TRUE),
  (gen_random_uuid(), 'BIHU20', '20% OFF up to ₹100 on traditional thalis & feasts', 'PERCENTAGE', 20.00, 300.00, 100.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', 500, 89, TRUE),
  (gen_random_uuid(), 'FIRSTMEAL', 'Flat ₹75 OFF on your first district order', 'FLAT', 75.00, 200.00, NULL, NOW() - INTERVAL '1 day', NOW() + INTERVAL '180 days', 2000, 15, TRUE)
ON CONFLICT (code) DO NOTHING;
