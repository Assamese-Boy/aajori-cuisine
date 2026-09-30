-- ============================================================================
-- AAJORI CUISINE - SEED DATA
-- District: Kamrup Metropolitan (Guwahati, Assam)
-- ============================================================================

-- 1. USERS & PROFILES
-- Password hash for 'Aajori@2026' (bcrypt)
-- $2a$10$WqU2PzJ1X3N1xW0qT3Y3Xe4kRzL9Z8v7Q5p6O4n2M1l0K9j8H7g6F (dummy mock hash)
INSERT INTO users (id, phone, email, full_name, role, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', '+919864000001', 'admin@aajori.in', 'Manabendra Sarma (Super Admin)', 'SUPER_ADMIN', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000002', '+919864000002', 'ops@aajori.in', 'Jahnabi Goswami (District Manager)', 'ADMIN', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000010', '+919864000010', 'rider.bipul@aajori.in', 'Bipul Bora', 'DELIVERY_PARTNER', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000011', '+919864000011', 'rider.deepjyoti@aajori.in', 'Deepjyoti Saikia', 'DELIVERY_PARTNER', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000020', '+919864000020', 'ankur.barman@gmail.com', 'Ankur Barman', 'CUSTOMER', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000021', '+919864000021', 'priyom.kalita@gmail.com', 'Priyom Kalita', 'CUSTOMER', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000030', '+919864000030', 'khorikaa.owner@gmail.com', 'Rupam Barua (Owner Khorikaa)', 'RESTAURANT_OWNER', 'ACTIVE'),
  ('a0000000-0000-0000-0000-000000000031', '+919864000031', 'paradise.owner@gmail.com', 'Devajit Neog (Owner Paradise)', 'RESTAURANT_OWNER', 'ACTIVE')
ON CONFLICT (phone) DO NOTHING;

-- 2. DELIVERY PARTNERS
INSERT INTO delivery_partners (id, vehicle_type, vehicle_number, driving_license_number, shift_status, current_location, last_location_time, battery_percentage, rating, total_completed_orders) VALUES
  ('a0000000-0000-0000-0000-000000000010', 'BIKE', 'AS-01-ET-4021', 'AS0120220019283', 'ONLINE_IDLE', ST_SetSRID(ST_MakePoint(91.7760, 26.1520), 4326)::geography, NOW(), 88, 4.92, 142),
  ('a0000000-0000-0000-0000-000000000011', 'BIKE', 'AS-01-FD-8910', 'AS0120230048172', 'ONLINE_IDLE', ST_SetSRID(ST_MakePoint(91.7580, 26.1840), 4326)::geography, NOW(), 74, 4.88, 98)
ON CONFLICT (id) DO NOTHING;

-- 3. CUSTOMER ADDRESSES
INSERT INTO customer_addresses (id, customer_id, label, address_line1, address_line2, landmark, city, district, postal_code, location, is_default) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000020', 'Home', 'Flat 302, Brahmaputra Enclave', 'Bhangagarh Road', 'Opposite GMCH', 'Guwahati', 'Kamrup Metropolitan', '781032', ST_SetSRID(ST_MakePoint(91.7690, 26.1550), 4326)::geography, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000021', 'Home', 'House No 14, Rajgarh Road', 'Bye Lane 3', 'Near Chandmari Flyover', 'Guwahati', 'Kamrup Metropolitan', '781003', ST_SetSRID(ST_MakePoint(91.7610, 26.1810), 4326)::geography, true)
ON CONFLICT (id) DO NOTHING;

-- 4. DELIVERY ZONES (Guwahati Urban Belt)
INSERT INTO delivery_zones (id, name, district, center_point, base_fee, base_distance_km, per_km_fee, max_delivery_distance_km, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Guwahati Metro Core', 'Kamrup Metropolitan', ST_SetSRID(ST_MakePoint(91.7700, 26.1600), 4326)::geography, 20.00, 3.00, 7.50, 10.00, true)
ON CONFLICT (id) DO NOTHING;

-- 5. RESTAURANTS
INSERT INTO restaurants (id, name, slug, tagline, description, phone, email, commission_rate, is_active, is_accepting_orders, address_line, city, district, postal_code, location, avg_prep_time_minutes, min_order_amount, packaging_fee, cuisine_types, logo_url, cover_url) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Khorikaa Ethnic Kitchen', 'khorikaa-ethnic-kitchen', 'Authentic Indigenous Charcoal Delicacies', 'Famous for authentic Assamese smoked pork, duck curry with black sesame, and traditional thalis prepared with heritage spices.', '+919864112233', 'contact@khorikaa.com', 12.00, true, true, 'GS Road, Near Bora Service, Ulubari', 'Guwahati', 'Kamrup Metropolitan', '781007', ST_SetSRID(ST_MakePoint(91.7594, 26.1661), 4326)::geography, 25, 120.00, 20.00, ARRAY['Assamese Ethnic', 'Charcoal Grill', 'Indigenous Cuisine'], 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000'),
  ('d0000000-0000-0000-0000-000000000002', 'Paradise Heritage Diner', 'paradise-heritage-diner', 'Guwahati’s Oldest Traditional Assamese Culinary Pioneer', 'Serving traditional Assamese Parampara thalis, Masor Tenga with Kaji Nemu, and Boror Tenga since 1984.', '+919864223344', 'paradise.heritage@gmail.com', 10.00, true, true, 'Maniram Dewan Road, Silpukhuri', 'Guwahati', 'Kamrup Metropolitan', '781003', ST_SetSRID(ST_MakePoint(91.7650, 26.1852), 4326)::geography, 20, 150.00, 15.00, ARRAY['Assamese Thali', 'Heritage Fish', 'Regional Delicacies'], 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1000'),
  ('d0000000-0000-0000-0000-000000000003', 'Brahmaputra Spice Bistro', 'brahmaputra-spice-bistro', 'Contemporary Riverside Flavours & Tea Smoked Specialties', 'Modern regional bistro celebrating North East river fish, aromatic Joha rice bowls, and artisan Assam tea infusions.', '+919864334455', 'bistro@brahmaputra.in', 14.00, true, true, 'MG Road, Uzan Bazar Riverfront', 'Guwahati', 'Kamrup Metropolitan', '781001', ST_SetSRID(ST_MakePoint(91.7520, 26.1910), 4326)::geography, 22, 100.00, 15.00, ARRAY['Regional Fusion', 'Assam Tea Cafe', 'River Catch'], 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000')
ON CONFLICT (id) DO NOTHING;

-- 6. MENU CATEGORIES & ITEMS (Khorikaa)
INSERT INTO menu_categories (id, restaurant_id, name, display_order) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Heritage Charcoal Grills', 1),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Traditional Curries', 2),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Bora & Joha Rice Specials', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, is_veg, is_available, spiciness_level, prep_time_minutes, image_url) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Smoked Pork with Khorisa (Bamboo Shoot)', 'Tender smoked pork slow-simmered with fermented organic bamboo shoots and ghost pepper hint.', 280.00, false, true, 2, 20, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Duck Curry with Til (Black Sesame)', 'Signature Assamese duck delicacy prepared in roasted black sesame gravy and warm spices.', 320.00, false, true, 2, 25, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500'),
  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'Fragrant Joha Rice with Pitika Platter', 'Aromatic heritage Joha rice served with roasted aloo pitika, baingan pitika and fermented mustard dip.', 160.00, true, true, 1, 15, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500')
ON CONFLICT (id) DO NOTHING;

-- 7. MENU ITEMS (Paradise Heritage Diner)
INSERT INTO menu_categories (id, restaurant_id, name, display_order) VALUES
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000002', 'Parampara Thalis', 1),
  ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002', 'Fish Specialties', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, is_veg, is_available, spiciness_level, prep_time_minutes, image_url) VALUES
  ('f0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000010', 'Grand Assamese Non-Veg Thali', 'Includes Joha rice, Mati Mahor Daal, Rohu fish curry, Kaji Nemu, Khorisa, Khar, and Payash.', 350.00, false, true, 1, 20, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500'),
  ('f0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000011', 'Masor Tenga (Tangy Fish Curry)', 'Fresh local river fish prepared with sun-dried Thekera and fragrant Kaji Nemu (Assam Lemon).', 240.00, false, true, 1, 18, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500')
ON CONFLICT (id) DO NOTHING;

-- 8. MENU ITEMS (Brahmaputra Spice Bistro)
INSERT INTO menu_categories (id, restaurant_id, name, display_order) VALUES
  ('e0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000003', 'Riverside Quick Bites', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, is_veg, is_available, spiciness_level, prep_time_minutes, image_url) VALUES
  ('f0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000020', 'Hot Luchi & Til Aloo Dum Platter', 'Fluffy golden fried luchis served with baby potatoes simmered in roasted sesame seed sauce.', 140.00, true, true, 2, 15, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500'),
  ('f0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000020', 'Assam Orthodox Smoked Iced Tea', 'Single estate first flush black tea with fresh mint sprigs and Assam lemon honey infusion.', 90.00, true, true, 0, 5, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500')
ON CONFLICT (id) DO NOTHING;

-- 9. PROMOTIONS & COUPONS
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, valid_from, valid_until, max_uses, current_uses, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 'AAJORI50', 'Flat ₹50 discount on your local district order', 'FLAT', 50.00, 250.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 500, 24, true),
  ('10000000-0000-0000-0000-000000000002', 'BIHU20', '20% off up to ₹100 on traditional platters', 'PERCENTAGE', 20.00, 300.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 1000, 89, true)
ON CONFLICT (id) DO NOTHING;

-- 10. SAMPLE ORDERS & ORDER HISTORY
INSERT INTO orders (
  id, order_number, customer_id, restaurant_id, delivery_partner_id,
  delivery_address, delivery_distance_km, status, payment_status, payment_method,
  subtotal, packaging_fee, delivery_fee, platform_fee, tax_amount, discount_amount,
  total_price, restaurant_commission_amount, rider_payout_amount, pricing_breakdown,
  customer_instructions, created_at
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'AJR-202610-0001',
    'a0000000-0000-0000-0000-000000000020',
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000010',
    '{"label": "Home", "address_line1": "Flat 302, Brahmaputra Enclave", "city": "Guwahati", "latitude": 26.1550, "longitude": 91.7690}'::jsonb,
    2.10,
    'OUT_FOR_DELIVERY',
    'SUCCESS',
    'UPI',
    600.00, 20.00, 20.00, 5.00, 30.00, 50.00,
    625.00, 72.00, 35.00,
    '{"item_subtotal": 600, "packaging": 20, "delivery": 20, "platform": 5, "tax": 30, "discount": 50, "final": 625}'::jsonb,
    'Please send extra bamboo shoot dip',
    NOW() - INTERVAL '35 minutes'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'AJR-202610-0002',
    'a0000000-0000-0000-0000-000000000021',
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000011',
    '{"label": "Home", "address_line1": "House No 14, Rajgarh Road", "city": "Guwahati", "latitude": 26.1810, "longitude": 91.7610}'::jsonb,
    1.40,
    'DELIVERED',
    'SUCCESS',
    'UPI',
    350.00, 15.00, 20.00, 5.00, 17.50, 0.00,
    407.50, 35.00, 30.00,
    '{"item_subtotal": 350, "packaging": 15, "delivery": 20, "platform": 5, "tax": 17.5, "discount": 0, "final": 407.5}'::jsonb,
    'Leave at doorstep with guard',
    NOW() - INTERVAL '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- Order Items
INSERT INTO order_items (id, order_id, menu_item_id, name, unit_price, quantity, subtotal) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Smoked Pork with Khorisa (Bamboo Shoot)', 280.00, 1, 280.00),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'Duck Curry with Til (Black Sesame)', 320.00, 1, 320.00),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000010', 'Grand Assamese Non-Veg Thali', 350.00, 1, 350.00)
ON CONFLICT (id) DO NOTHING;

-- Order Status History
INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, actor_role, reason, created_at) VALUES
  ('20000000-0000-0000-0000-000000000001', NULL, 'CREATED', 'a0000000-0000-0000-0000-000000000020', 'CUSTOMER', 'Customer placed order', NOW() - INTERVAL '35 minutes'),
  ('20000000-0000-0000-0000-000000000001', 'CREATED', 'PAYMENT_CONFIRMED', NULL, 'SYSTEM', 'UPI payment verified', NOW() - INTERVAL '34 minutes'),
  ('20000000-0000-0000-0000-000000000001', 'PAYMENT_CONFIRMED', 'RESTAURANT_ACCEPTED', 'a0000000-0000-0000-0000-000000000030', 'RESTAURANT', 'Kitchen accepted order', NOW() - INTERVAL '32 minutes'),
  ('20000000-0000-0000-0000-000000000001', 'RESTAURANT_ACCEPTED', 'PREPARING', 'a0000000-0000-0000-0000-000000000030', 'RESTAURANT', 'Cooking started', NOW() - INTERVAL '30 minutes'),
  ('20000000-0000-0000-0000-000000000001', 'PREPARING', 'READY_FOR_PICKUP', 'a0000000-0000-0000-0000-000000000030', 'RESTAURANT', 'Food packed in bag', NOW() - INTERVAL '15 minutes'),
  ('20000000-0000-0000-0000-000000000001', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'a0000000-0000-0000-0000-000000000010', 'DELIVERY_PARTNER', 'Rider Bipul accepted request', NOW() - INTERVAL '14 minutes'),
  ('20000000-0000-0000-0000-000000000001', 'RIDER_ASSIGNED', 'PICKED_UP', 'a0000000-0000-0000-0000-000000000010', 'DELIVERY_PARTNER', 'Collected from Khorikaa', NOW() - INTERVAL '8 minutes'),
  ('20000000-0000-0000-0000-000000000001', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'a0000000-0000-0000-0000-000000000010', 'DELIVERY_PARTNER', 'Heading to Brahmaputra Enclave', NOW() - INTERVAL '7 minutes')
ON CONFLICT (id) DO NOTHING;
