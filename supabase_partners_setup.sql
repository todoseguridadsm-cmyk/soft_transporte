-- 1. Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR NOT NULL,
  fantasy_name VARCHAR,
  cuit VARCHAR,
  address VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert a default company record if none exists
INSERT INTO company_settings (company_name, fantasy_name)
SELECT 'Mi Empresa S.A.', 'Transportes'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

-- 2. Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR NOT NULL,
  dni_cuit VARCHAR,
  share_percentage DECIMAL(5,2),
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create partner_transactions table
CREATE TABLE IF NOT EXISTS partner_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('withdrawal', 'investment')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies allowing authenticated users to access these tables
-- Since this is an internal ERP, we grant access to authenticated users. Application logic handles specific role restrictions.
CREATE POLICY "Allow authenticated access" ON company_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON partners FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON partner_transactions FOR ALL USING (auth.role() = 'authenticated');
