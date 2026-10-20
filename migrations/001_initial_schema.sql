-- Migration 001: Initial Schema for Corrugated Box Manufacturing System

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL DEFAULT 'BoxCraft Industries Pvt. Ltd.',
  ageing_days INT NOT NULL DEFAULT 30,
  shift_hours NUMERIC(4,1) NOT NULL DEFAULT 9.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dept VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  shift VARCHAR(50) NOT NULL DEFAULT 'General',
  doj DATE NOT NULL DEFAULT CURRENT_DATE,
  phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance (unique per employee and date)
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(50) PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT '',
  checkin VARCHAR(20) DEFAULT '',
  checkout VARCHAR(20) DEFAULT '',
  working_hours NUMERIC(4,1) DEFAULT 0,
  overtime NUMERIC(4,1) DEFAULT 0,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_emp_attendance_date UNIQUE(employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_emp ON attendance(employee_id);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  phone VARCHAR(50),
  gstin VARCHAR(50),
  city VARCHAR(100),
  category VARCHAR(50) NOT NULL DEFAULT 'Regular',
  credit_limit NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reel Stock
CREATE TABLE IF NOT EXISTS reel_stock (
  id VARCHAR(50) PRIMARY KEY,
  size NUMERIC(6,2),
  reel_size VARCHAR(100),
  gsm INT NOT NULL DEFAULT 100,
  bf INT NOT NULL DEFAULT 12,
  reels INT NOT NULL DEFAULT 1,
  weight_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  colour VARCHAR(100) NOT NULL DEFAULT 'Kraft',
  date_bought DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'In Stock',
  location VARCHAR(100) DEFAULT 'Rack A1',
  supplier VARCHAR(255) NOT NULL DEFAULT 'Standard Supplier',
  po_ref VARCHAR(100) DEFAULT '',
  qty_received NUMERIC(10,2) NOT NULL DEFAULT 0,
  rate_pkg NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_qty NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reel_stock_status ON reel_stock(status);
CREATE INDEX IF NOT EXISTS idx_reel_stock_supplier ON reel_stock(supplier);

-- Reorder Levels
CREATE TABLE IF NOT EXISTS reorder_levels (
  reel_id VARCHAR(50) PRIMARY KEY REFERENCES reel_stock(id) ON DELETE CASCADE,
  min_reels INT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  cust_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  box_spec VARCHAR(255) NOT NULL,
  ply VARCHAR(50) NOT NULL DEFAULT '3-ply',
  gsm VARCHAR(100) DEFAULT '',
  qty INT NOT NULL DEFAULT 0,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quoted_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  order_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'Received',
  dispatch_qty INT NOT NULL DEFAULT 0,
  dispatch_date DATE,
  stage VARCHAR(100) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_cust ON orders(cust_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery ON orders(delivery_date);

-- Production Plans
CREATE TABLE IF NOT EXISTS production_plans (
  id VARCHAR(50) PRIMARY KEY,
  linked_order VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  machine VARCHAR(100) NOT NULL,
  planned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sequence INT NOT NULL DEFAULT 1,
  reel_used VARCHAR(50) REFERENCES reel_stock(id) ON DELETE SET NULL,
  reel_qty_used NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_stage VARCHAR(100) DEFAULT '',
  qty_planned INT NOT NULL DEFAULT 0,
  qty_produced INT NOT NULL DEFAULT 0,
  wastage INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Not Started',
  expected_completion DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_order ON production_plans(linked_order);
CREATE INDEX IF NOT EXISTS idx_prod_machine ON production_plans(machine);
CREATE INDEX IF NOT EXISTS idx_prod_status ON production_plans(status);

-- Price History
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  cust_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  box_spec VARCHAR(255) NOT NULL,
  gsm VARCHAR(100),
  price NUMERIC(10,2) NOT NULL,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_cust ON price_history(cust_id);
