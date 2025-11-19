-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE deposit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    depositor_name TEXT NOT NULL,
    total_weight_kg DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    input_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_id UUID
);

CREATE TABLE deposit_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES deposit_transactions(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('Botol/Gelas Plastik Minuman', 'Kardus', 'Buku', 'Logam/Besi', 'Emberan/Campuran', 'Elektronik')),
    weight_kg DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_items ENABLE ROW LEVEL SECURITY;

-- Simple policies - allow all authenticated users to perform operations
CREATE POLICY "Allow all for authenticated users" ON deposit_transactions
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON deposit_items
FOR ALL USING (auth.role() = 'authenticated');

-- Public read access
CREATE POLICY "Public read access" ON deposit_transactions
FOR SELECT USING (true);

CREATE POLICY "Public read access" ON deposit_items
FOR SELECT USING (true);

-- Sample data
INSERT INTO deposit_transactions (depositor_name, total_weight_kg, total_value, input_date, admin_id) VALUES
('Ahmad Santoso', 5.50, 11000, '2025-11-19', NULL),
('Budi Raharjo', 3.25, 4875, '2025-11-19', NULL),
('Citra Dewi', 2.75, 13750, '2025-11-19', NULL);

INSERT INTO deposit_items (transaction_id, item_type, weight_kg, price_per_kg, total_value) VALUES
((SELECT id FROM deposit_transactions WHERE depositor_name = 'Ahmad Santoso' LIMIT 1), 'Elektronik', 5.50, 2000, 11000),
((SELECT id FROM deposit_transactions WHERE depositor_name = 'Budi Raharjo' LIMIT 1), 'Kardus', 3.25, 1500, 4875),
((SELECT id FROM deposit_transactions WHERE depositor_name = 'Citra Dewi' LIMIT 1), 'Logam/Besi', 2.75, 5000, 13750);

-- Create indexes
CREATE INDEX idx_transactions_depositor_name ON deposit_transactions(depositor_name);
CREATE INDEX idx_transactions_created_at ON deposit_transactions(created_at);
CREATE INDEX idx_items_transaction_id ON deposit_items(transaction_id);