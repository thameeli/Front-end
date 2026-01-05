-- ============================================
-- Thamili Mobile App - Concurrency Functions
-- Atomic operations for stock management and order creation
-- ============================================

-- ============================================
-- 1. ATOMIC STOCK RESERVATION FUNCTION
-- ============================================
-- Reserves stock atomically to prevent overselling
-- Returns TRUE if stock was successfully reserved, FALSE otherwise
CREATE OR REPLACE FUNCTION reserve_stock(
  p_product_id UUID,
  p_country TEXT,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
  updated_rows INTEGER;
BEGIN
  -- Validate country
  IF p_country NOT IN ('germany', 'denmark') THEN
    RAISE EXCEPTION 'Invalid country: %', p_country;
  END IF;

  -- Lock the product row for update to prevent concurrent modifications
  IF p_country = 'germany' THEN
    SELECT stock_germany INTO current_stock 
    FROM products 
    WHERE id = p_product_id 
    FOR UPDATE; -- Row-level lock
    
    IF current_stock IS NULL THEN
      RETURN FALSE; -- Product not found
    END IF;
    
    IF current_stock >= p_quantity THEN
      UPDATE products 
      SET stock_germany = stock_germany - p_quantity 
      WHERE id = p_product_id;
      GET DIAGNOSTICS updated_rows = ROW_COUNT;
      RETURN updated_rows > 0;
    ELSE
      RETURN FALSE; -- Insufficient stock
    END IF;
  ELSE -- denmark
    SELECT stock_denmark INTO current_stock 
    FROM products 
    WHERE id = p_product_id 
    FOR UPDATE; -- Row-level lock
    
    IF current_stock IS NULL THEN
      RETURN FALSE; -- Product not found
    END IF;
    
    IF current_stock >= p_quantity THEN
      UPDATE products 
      SET stock_denmark = stock_denmark - p_quantity 
      WHERE id = p_product_id;
      GET DIAGNOSTICS updated_rows = ROW_COUNT;
      RETURN updated_rows > 0;
    ELSE
      RETURN FALSE; -- Insufficient stock
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. ATOMIC ORDER CREATION FUNCTION
-- ============================================
-- Creates order and order items atomically within a transaction
-- Also reserves stock atomically
-- Returns the created order ID
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_user_id UUID,
  p_country TEXT,
  p_payment_method TEXT,
  p_total_amount DECIMAL,
  p_items JSONB,
  p_pickup_point_id UUID DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL,
  p_delivery_fee DECIMAL DEFAULT 0,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_existing_order_id UUID;
  item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_price DECIMAL;
  v_stock_reserved BOOLEAN;
BEGIN
  -- Check for duplicate order using idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_order_id
    FROM orders
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;
    
    IF v_existing_order_id IS NOT NULL THEN
      RETURN v_existing_order_id; -- Return existing order
    END IF;
  END IF;

  -- Validate country
  IF p_country NOT IN ('germany', 'denmark') THEN
    RAISE EXCEPTION 'Invalid country: %', p_country;
  END IF;

  -- Validate payment method
  IF p_payment_method NOT IN ('online', 'cod') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
  END IF;

  -- Reserve stock for all items first (fail fast if any item is out of stock)
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::UUID;
    v_quantity := (item->>'quantity')::INTEGER;
    
    -- Reserve stock atomically
    SELECT reserve_stock(v_product_id, p_country, v_quantity) INTO v_stock_reserved;
    
    IF NOT v_stock_reserved THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;
  END LOOP;

  -- Create order
  INSERT INTO orders (
    user_id,
    country,
    payment_method,
    payment_status,
    total_amount,
    status,
    pickup_point_id,
    delivery_address,
    idempotency_key
  )
  VALUES (
    p_user_id,
    p_country,
    p_payment_method,
    CASE WHEN p_payment_method = 'cod' THEN 'pending' ELSE 'pending' END,
    p_total_amount,
    'pending',
    p_pickup_point_id,
    p_delivery_address,
    p_idempotency_key
  )
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price,
      subtotal
    )
    VALUES (
      v_order_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::INTEGER,
      (item->>'price')::DECIMAL,
      (item->>'price')::DECIMAL * (item->>'quantity')::INTEGER
    );
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. ADD IDEMPOTENCY KEY COLUMN TO ORDERS
-- ============================================
-- Add idempotency_key column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE orders ADD COLUMN idempotency_key TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 4. STOCK RESTORATION FUNCTION (for order cancellation)
-- ============================================
-- Restores stock when an order is cancelled
CREATE OR REPLACE FUNCTION restore_stock(
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  order_record RECORD;
  item_record RECORD;
BEGIN
  -- Get order details
  SELECT country INTO order_record
  FROM orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Restore stock for each order item
  FOR item_record IN 
    SELECT product_id, quantity
    FROM order_items
    WHERE order_id = p_order_id
  LOOP
    IF order_record.country = 'germany' THEN
      UPDATE products
      SET stock_germany = stock_germany + item_record.quantity
      WHERE id = item_record.product_id;
    ELSE
      UPDATE products
      SET stock_denmark = stock_denmark + item_record.quantity
      WHERE id = item_record.product_id;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF CONCURRENCY FUNCTIONS
-- ============================================

