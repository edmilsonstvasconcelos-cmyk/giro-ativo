-- Migration 001: Base schema for Giro Ativo

-- Companies (PJ profile)
CREATE TABLE IF NOT EXISTS companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cnpj         VARCHAR(18) UNIQUE NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  telefone     VARCHAR(20),
  cidade       TEXT,
  estado       CHAR(2),
  avatar_url   TEXT,
  verified     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  nome  TEXT NOT NULL,
  slug  TEXT UNIQUE NOT NULL,
  icone TEXT
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  category_id  INTEGER REFERENCES categories(id),
  price        NUMERIC(12, 2),
  unit         TEXT DEFAULT 'unidade',
  quantity     INTEGER DEFAULT 1,
  condition    TEXT CHECK (condition IN ('novo', 'seminovo', 'usado')) DEFAULT 'usado',
  location     TEXT,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active','paused','sold')),
  views        INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  is_cover    BOOLEAN DEFAULT FALSE,
  ordem       SMALLINT DEFAULT 0
);

-- Conversations (chat)
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  buyer_id   UUID NOT NULL REFERENCES companies(id),
  seller_id  UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, buyer_id, seller_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES companies(id),
  content         TEXT NOT NULL,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Visit requests
CREATE TABLE IF NOT EXISTS visit_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id      UUID NOT NULL REFERENCES companies(id),
  seller_id     UUID NOT NULL REFERENCES companies(id),
  proposed_date DATE NOT NULL,
  proposed_time TIME,
  message       TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- =====================
-- Row Level Security
-- =====================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_requests ENABLE ROW LEVEL SECURITY;

-- COMPANIES --
CREATE POLICY "companies_select_public" ON companies FOR SELECT USING (true);
CREATE POLICY "companies_insert_own" ON companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "companies_update_own" ON companies FOR UPDATE USING (auth.uid() = user_id);

-- CATEGORIES --
CREATE POLICY "categories_select_public" ON categories FOR SELECT USING (true);

-- PRODUCTS --
CREATE POLICY "products_select_public" ON products FOR SELECT USING (status = 'active' OR company_id IN (
  SELECT id FROM companies WHERE user_id = auth.uid()
));
CREATE POLICY "products_insert_own" ON products FOR INSERT WITH CHECK (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "products_update_own" ON products FOR UPDATE USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "products_delete_own" ON products FOR DELETE USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);

-- PRODUCT IMAGES --
CREATE POLICY "product_images_select_public" ON product_images FOR SELECT USING (true);
CREATE POLICY "product_images_insert_own" ON product_images FOR INSERT WITH CHECK (
  product_id IN (
    SELECT p.id FROM products p
    JOIN companies c ON c.id = p.company_id
    WHERE c.user_id = auth.uid()
  )
);
CREATE POLICY "product_images_delete_own" ON product_images FOR DELETE USING (
  product_id IN (
    SELECT p.id FROM products p
    JOIN companies c ON c.id = p.company_id
    WHERE c.user_id = auth.uid()
  )
);

-- CONVERSATIONS --
CREATE POLICY "conversations_select_participant" ON conversations FOR SELECT USING (
  buyer_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR
  seller_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "conversations_insert_buyer" ON conversations FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);

-- MESSAGES --
CREATE POLICY "messages_select_participant" ON messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE buyer_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
       OR seller_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  )
);
CREATE POLICY "messages_insert_participant" ON messages FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) AND
  conversation_id IN (
    SELECT id FROM conversations
    WHERE buyer_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
       OR seller_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  )
);
CREATE POLICY "messages_update_own" ON messages FOR UPDATE USING (
  sender_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);

-- VISIT REQUESTS --
CREATE POLICY "visits_select_participant" ON visit_requests FOR SELECT USING (
  buyer_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR
  seller_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "visits_insert_buyer" ON visit_requests FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "visits_update_seller" ON visit_requests FOR UPDATE USING (
  seller_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "visits_delete_buyer" ON visit_requests FOR DELETE USING (
  buyer_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
