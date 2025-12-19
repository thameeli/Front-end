-- ============================================
-- Thamili Mobile App - Seed Data
-- Supabase PostgreSQL Database
-- ============================================
-- NOTE: Run this AFTER creating the schema and RLS policies
-- NOTE: Make sure you have created at least one admin user via Supabase Auth first

-- ============================================
-- 1. PRODUCTS - Fresh Fish
-- ============================================
INSERT INTO products (name, description, category, price_germany, price_norway, stock, active) VALUES
('Salmon Fillet', 'Fresh Atlantic salmon fillet, 500g', 'fresh', 12.99, 149.00, 50, true),
('Tuna Steak', 'Premium tuna steak, 400g', 'fresh', 15.99, 179.00, 30, true),
('Cod Fillet', 'Fresh cod fillet, 500g', 'fresh', 9.99, 119.00, 60, true),
('Sea Bass', 'Whole sea bass, 600g', 'fresh', 11.99, 139.00, 40, true),
('Prawns', 'Fresh jumbo prawns, 1kg', 'fresh', 18.99, 219.00, 25, true),
('Mackerel', 'Fresh mackerel, 400g', 'fresh', 7.99, 99.00, 45, true),
('Sardines', 'Fresh sardines, 500g', 'fresh', 6.99, 79.00, 50, true),
('Trout', 'Fresh rainbow trout, 500g', 'fresh', 8.99, 109.00, 35, true);

-- ============================================
-- 2. PRODUCTS - Frozen Fish
-- ============================================
INSERT INTO products (name, description, category, price_germany, price_norway, stock, active) VALUES
('Frozen Salmon Portions', 'Frozen salmon portions, 1kg', 'frozen', 10.99, 129.00, 100, true),
('Frozen Cod Fillets', 'Frozen cod fillets, 1kg', 'frozen', 8.99, 109.00, 120, true),
('Frozen Prawns', 'Frozen prawns, 1kg', 'frozen', 15.99, 189.00, 80, true),
('Frozen Fish Fingers', 'Frozen fish fingers, 500g', 'frozen', 4.99, 59.00, 150, true),
('Frozen Tuna Steaks', 'Frozen tuna steaks, 1kg', 'frozen', 13.99, 169.00, 90, true);

-- ============================================
-- 3. PRODUCTS - Fresh Vegetables
-- ============================================
INSERT INTO products (name, description, category, price_germany, price_norway, stock, active) VALUES
('Tomatoes', 'Fresh red tomatoes, 1kg', 'fresh', 2.99, 35.00, 200, true),
('Cucumber', 'Fresh cucumber, 1kg', 'fresh', 1.99, 25.00, 180, true),
('Carrots', 'Fresh carrots, 1kg', 'fresh', 1.49, 19.00, 250, true),
('Potatoes', 'Fresh potatoes, 2kg', 'fresh', 2.49, 29.00, 300, true),
('Onions', 'Fresh onions, 1kg', 'fresh', 1.99, 24.00, 220, true),
('Bell Peppers', 'Fresh bell peppers, 1kg', 'fresh', 3.99, 45.00, 150, true),
('Lettuce', 'Fresh lettuce, 1 head', 'fresh', 1.99, 24.00, 100, true),
('Spinach', 'Fresh spinach, 500g', 'fresh', 2.49, 29.00, 120, true),
('Broccoli', 'Fresh broccoli, 1kg', 'fresh', 2.99, 35.00, 140, true),
('Cauliflower', 'Fresh cauliflower, 1kg', 'fresh', 2.49, 29.00, 130, true);

-- ============================================
-- 4. PRODUCTS - Frozen Vegetables
-- ============================================
INSERT INTO products (name, description, category, price_germany, price_norway, stock, active) VALUES
('Frozen Peas', 'Frozen peas, 500g', 'frozen', 1.99, 24.00, 200, true),
('Frozen Corn', 'Frozen corn, 500g', 'frozen', 1.99, 24.00, 180, true),
('Frozen Mixed Vegetables', 'Frozen mixed vegetables, 1kg', 'frozen', 2.99, 35.00, 160, true),
('Frozen Green Beans', 'Frozen green beans, 500g', 'frozen', 2.49, 29.00, 170, true),
('Frozen Broccoli', 'Frozen broccoli, 500g', 'frozen', 2.49, 29.00, 150, true);

-- ============================================
-- 5. PICKUP POINTS - Germany
-- ============================================
INSERT INTO pickup_points (name, address, latitude, longitude, country, delivery_fee, active) VALUES
('Berlin Central', 'Alexanderplatz 1, 10178 Berlin, Germany', 52.5200, 13.4050, 'germany', 2.50, true),
('Munich Main Station', 'Bayerstraße 10, 80335 München, Germany', 48.1351, 11.5820, 'germany', 3.00, true),
('Hamburg Harbor', 'Speicherstadt 1, 20457 Hamburg, Germany', 53.5511, 9.9937, 'germany', 2.75, true),
('Frankfurt Airport', 'Frankfurt Airport, 60547 Frankfurt, Germany', 50.0379, 8.5622, 'germany', 4.00, true),
('Cologne Cathedral', 'Domkloster 4, 50667 Köln, Germany', 50.9413, 6.9583, 'germany', 2.50, true);

-- ============================================
-- 6. PICKUP POINTS - Norway
-- ============================================
INSERT INTO pickup_points (name, address, latitude, longitude, country, delivery_fee, active) VALUES
('Oslo Central Station', 'Jernbanetorget 1, 0154 Oslo, Norway', 59.9115, 10.7522, 'norway', 30.00, true),
('Bergen Fish Market', 'Torget, 5014 Bergen, Norway', 60.3913, 5.3221, 'norway', 35.00, true),
('Trondheim Harbor', 'Havnegata 1, 7010 Trondheim, Norway', 63.4305, 10.3951, 'norway', 40.00, true),
('Stavanger City Center', 'Olav V gate 3, 4005 Stavanger, Norway', 58.9699, 5.7331, 'norway', 35.00, true),
('Tromsø Arctic', 'Storgata 1, 9008 Tromsø, Norway', 69.6492, 18.9553, 'norway', 50.00, true);

-- ============================================
-- NOTES:
-- ============================================
-- 1. Admin & Delivery Partners: See seed_admin_users.sql
--    - Create users in Supabase Auth first
--    - Then run seed_admin_users.sql to assign roles
--    - Default: 1 admin, 2 delivery partners
--
-- 2. Prices: 
--    - Germany prices are in EUR
--    - Norway prices are in NOK (Norwegian Krone)
--    - Adjust prices according to your market
--
-- 3. Stock: Update stock levels as needed
--
-- 4. Images: Add image_url values later when you have product images
--
-- ============================================
-- END OF SEED DATA
-- ============================================

