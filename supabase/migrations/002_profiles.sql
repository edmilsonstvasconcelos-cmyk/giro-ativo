-- Migration 002: Sistema de roles e tabela profiles
-- Cria a identidade central do usuário com role e trigger automático

-- =====================
-- Enum: role do usuário
-- =====================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('comprador', 'vendedor', 'avaliador', 'moderador', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- Tabela profiles
-- =====================

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'comprador',
  nome        TEXT,
  cpf         VARCHAR(14),          -- para compradores PF
  telefone    VARCHAR(20),
  avatar_url  TEXT,
  bio         TEXT,
  verified    BOOLEAN DEFAULT FALSE, -- KYC / verificação manual
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_profiles_updated_at();

-- =====================
-- Atualizar companies: adicionar tipo e referência ao profile via user_id
-- =====================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'vendedor'
    CHECK (tipo IN ('comprador', 'vendedor', 'avaliador'));

-- atualiza companies existentes sem updated_at
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE PROCEDURE update_companies_updated_at();

-- =====================
-- Função helper: retorna role do usuário autenticado (SECURITY DEFINER
-- para evitar recursão nas policies RLS da própria tabela profiles)
-- =====================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Atalhos booleanos para policies mais legíveis
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT get_my_role() = 'admin'; $$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT get_my_role() IN ('moderador', 'admin'); $$;

-- =====================
-- Trigger: cria profile automaticamente ao criar usuário
-- =====================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================
-- RLS — profiles
-- =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver perfis (necessário para exibir nome vendedor, avaliador)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Usuário edita apenas o próprio perfil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin pode atualizar qualquer perfil (ex: promover avaliador)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Trigger não usa RLS, mas bloqueamos INSERT direto do client
CREATE POLICY "profiles_insert_deny"
  ON profiles FOR INSERT
  WITH CHECK (false);  -- só o trigger (SECURITY DEFINER) pode inserir

-- =====================
-- RLS — atualizar policies existentes de companies/products para admins
-- =====================

-- Admin pode fazer qualquer coisa em companies
DROP POLICY IF EXISTS "companies_admin_all" ON companies;
CREATE POLICY "companies_admin_all"
  ON companies FOR ALL
  USING (is_admin());

-- Moderador pode ler qualquer empresa
DROP POLICY IF EXISTS "companies_select_moderator" ON companies;
CREATE POLICY "companies_select_moderator"
  ON companies FOR SELECT
  USING (is_moderator_or_admin());

-- Admin pode fazer qualquer coisa em products
DROP POLICY IF EXISTS "products_admin_all" ON products;
CREATE POLICY "products_admin_all"
  ON products FOR ALL
  USING (is_admin());

-- Moderador pode ler e atualizar status de moderação
DROP POLICY IF EXISTS "products_select_moderator" ON products;
CREATE POLICY "products_select_moderator"
  ON products FOR SELECT
  USING (is_moderator_or_admin());

DROP POLICY IF EXISTS "products_update_moderator" ON products;
CREATE POLICY "products_update_moderator"
  ON products FOR UPDATE
  USING (is_moderator_or_admin());
