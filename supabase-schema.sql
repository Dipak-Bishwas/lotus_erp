-- Lotus ERP PostgreSQL Schema for Supabase

-- 1. Areas
CREATE TABLE IF NOT EXISTS delivery_areas (
  area_id TEXT PRIMARY KEY,
  area_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  assigned_delivery_boy_id TEXT,
  customer_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (Staff / Admins)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL, -- 'ADMIN' | 'DELIVERY_BOY'
  status TEXT DEFAULT 'ACTIVE',
  assigned_area_ids TEXT[],
  avatar_url TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
  customer_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  area_id TEXT REFERENCES delivery_areas(area_id),
  assigned_delivery_boy_id TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'ACTIVE',
  current_rate NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  flower_type TEXT NOT NULL,
  instructions TEXT,
  opening_balance NUMERIC(10, 2) DEFAULT 0.00,
  current_outstanding NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Customer Rate History
CREATE TABLE IF NOT EXISTS customer_rates (
  rate_id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(customer_id) ON DELETE CASCADE,
  flower_type TEXT NOT NULL,
  daily_price NUMERIC(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Daily Deliveries
CREATE TABLE IF NOT EXISTS daily_deliveries (
  delivery_id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(customer_id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL,
  delivery_boy_id TEXT,
  status TEXT NOT NULL, -- 'DELIVERED', 'CUSTOMER_ABSENT', 'VACATION', 'NOT_DELIVERED', 'PENDING'
  billable_amount NUMERIC(10, 2) DEFAULT 0.00,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  absent_reason TEXT,
  UNIQUE(customer_id, delivery_date)
);

-- 6. Absences & Vacations
CREATE TABLE IF NOT EXISTS absences (
  absence_id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(customer_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'APPROVED',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Monthly Invoices
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(customer_id) ON DELETE CASCADE,
  billing_month TEXT NOT NULL, -- 'YYYY-MM'
  total_calendar_days INT NOT NULL,
  billable_days INT NOT NULL,
  absence_days INT DEFAULT 0,
  not_delivered_days INT DEFAULT 0,
  current_month_charges NUMERIC(10, 2) NOT NULL,
  previous_balance NUMERIC(10, 2) DEFAULT 0.00,
  adjustments NUMERIC(10, 2) DEFAULT 0.00,
  total_payable NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0.00,
  closing_balance NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE NOT NULL,
  UNIQUE(customer_id, billing_month)
);

-- 8. Payments
CREATE TABLE IF NOT EXISTS payments (
  payment_id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(customer_id) ON DELETE CASCADE,
  invoice_id TEXT REFERENCES invoices(invoice_id),
  amount NUMERIC(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode TEXT NOT NULL, -- 'CASH', 'UPI', 'BANK_TRANSFER'
  collected_by TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Ledger Entries
CREATE TABLE IF NOT EXISTS ledger_entries (
  entry_id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(customer_id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  entry_type TEXT NOT NULL, -- 'INVOICE', 'PAYMENT', 'ADJUSTMENT'
  debit NUMERIC(10, 2) DEFAULT 0.00,
  credit NUMERIC(10, 2) DEFAULT 0.00,
  running_balance NUMERIC(10, 2) NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB
);

-- Enable Row Level Security (RLS)
ALTER TABLE delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access with the anon key for portfolio demo
CREATE POLICY "Public full access delivery_areas" ON delivery_areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access customer_rates" ON customer_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access daily_deliveries" ON daily_deliveries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access absences" ON absences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access ledger_entries" ON ledger_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
