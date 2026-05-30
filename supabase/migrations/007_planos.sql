-- Migration 007: Tabelas planos e assinaturas

-- =====================
-- Enums
-- =====================

DO $$ BEGIN
  CREATE TYPE assinatura_status AS ENUM ('ativa', 'pausada', 'cancelada', 'expirada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE assinatura_periodo AS ENUM ('mensal', 'anual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- Tabela planos (referência — editada via admin/migrações, não via app)
-- =====================

CREATE TABLE IF NOT EXISTS planos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                TEXT UNIQUE NOT NULL,   -- basico | pro | enterprise
  descricao           TEXT,

  -- Preços
  preco_mensal        NUMERIC(8, 2) NOT NULL DEFAULT 0,
  preco_anual         NUMERIC(8, 2) NOT NULL DEFAULT 0,  -- preço total do ano

  -- Limites e features
  limite_produtos     INTEGER DEFAULT 5,        -- NULL = ilimitado
  limite_fotos        INTEGER DEFAULT 3,        -- fotos por produto
  limite_laudos_mes   INTEGER DEFAULT 0,        -- laudos gratuitos incluídos
  tem_destaque        BOOLEAN DEFAULT FALSE,    -- produto em destaque no marketplace
  tem_busca_semantica BOOLEAN DEFAULT FALSE,    -- acesso à busca vetorial
  tem_relatorios      BOOLEAN DEFAULT FALSE,    -- relatórios de análise
  suporte_prioritario BOOLEAN DEFAULT FALSE,

  ativo               BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_planos_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_planos_updated_at
  BEFORE UPDATE ON planos
  FOR EACH ROW EXECUTE PROCEDURE update_planos_updated_at();

-- =====================
-- Seed dos 3 planos base
-- =====================

INSERT INTO planos (nome, descricao, preco_mensal, preco_anual, limite_produtos, limite_fotos, limite_laudos_mes, tem_destaque, tem_relatorios, suporte_prioritario) VALUES
  ('basico',
   'Para empresas iniciando no marketplace. Ideal para testar a plataforma.',
   0, 0, 5, 3, 0, FALSE, FALSE, FALSE),
  ('pro',
   'Para vendedores ativos. Produtos ilimitados, destaque e relatórios.',
   199, 1990, NULL, 10, 2, TRUE, TRUE, FALSE),
  ('enterprise',
   'Para grandes operações. Laudos ilimitados, suporte prioritário e API.',
   799, 7990, NULL, 20, NULL, TRUE, TRUE, TRUE)
ON CONFLICT (nome) DO NOTHING;

-- =====================
-- Tabela assinaturas
-- =====================

CREATE TABLE IF NOT EXISTS assinaturas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  plano_id            UUID NOT NULL REFERENCES planos(id),

  status              assinatura_status NOT NULL DEFAULT 'ativa',
  periodo             assinatura_periodo NOT NULL DEFAULT 'mensal',

  -- Datas
  iniciada_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em           TIMESTAMPTZ,
  renovada_em         TIMESTAMPTZ,
  cancelada_em        TIMESTAMPTZ,
  motivo_cancelamento TEXT,

  -- Pagamento (Pagar.me)
  pagarme_subscription_id TEXT,
  pagarme_plan_id         TEXT,

  -- Auditoria
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  -- Apenas uma assinatura ativa por empresa
  CONSTRAINT assinaturas_uma_ativa UNIQUE (empresa_id, status)
    DEFERRABLE INITIALLY DEFERRED  -- permite troca de plano na mesma transação
);

CREATE OR REPLACE FUNCTION update_assinaturas_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assinaturas_updated_at
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE PROCEDURE update_assinaturas_updated_at();

-- =====================
-- RLS — planos (leitura pública, escrita só admin)
-- =====================

ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planos_select_public"  ON planos FOR SELECT USING (ativo = TRUE);
CREATE POLICY "planos_all_admin"      ON planos FOR ALL    USING (is_admin());

-- =====================
-- RLS — assinaturas
-- =====================

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assinaturas_select_own"
  ON assinaturas FOR SELECT
  USING (
    empresa_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    OR is_moderator_or_admin()
  );

-- Assinaturas criadas/gerenciadas pelo backend (webhook Pagar.me)
CREATE POLICY "assinaturas_insert_admin"
  ON assinaturas FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "assinaturas_update_admin"
  ON assinaturas FOR UPDATE
  USING (is_admin());
