-- Migration 008: LGPD — consent_records e tos_acceptances
-- Spec Segurança & LGPD v1.0 | Obrigação: ANPD, Marco Civil da Internet

-- =====================
-- Enums
-- =====================

DO $$ BEGIN
  CREATE TYPE consent_purpose AS ENUM (
    'marketing',      -- comunicações promocionais
    'analytics',      -- uso agregado para melhorias de produto
    'ia_training',    -- uso de dados para treino de modelos
    'geo',            -- compartilhamento de geolocalização
    'parceiros'       -- repasse a parceiros (transportadoras, seguradoras)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consent_channel AS ENUM ('web', 'mobile', 'api');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- Tabela consent_records
-- Registra consentimentos granulares por finalidade — imutável (apenas INSERT)
-- Revogação = novo registro com granted = FALSE
-- =====================

CREATE TABLE IF NOT EXISTS consent_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose       consent_purpose NOT NULL,
  granted       BOOLEAN NOT NULL,        -- TRUE = concedeu, FALSE = revogou
  terms_version TEXT NOT NULL,           -- versão dos termos em vigor, ex: 'v1.0'
  ip            INET,
  user_agent    TEXT,
  channel       consent_channel NOT NULL DEFAULT 'web',
  created_at    TIMESTAMPTZ DEFAULT NOW()

  -- SEM updated_at: registros são imutáveis. Revogação = novo INSERT com granted=FALSE.
  -- Isso cria auditoria completa de todos os consentimentos ao longo do tempo.
);

-- =====================
-- Tabela tos_acceptances
-- Registra aceites de Termos de Uso por versão — imutável
-- =====================

CREATE TABLE IF NOT EXISTS tos_acceptances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version     TEXT NOT NULL,   -- versão do ToS aceito, ex: 'v1.0', 'v1.1'
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip          INET,
  user_agent  TEXT,
  channel     consent_channel NOT NULL DEFAULT 'web',

  -- Um usuário aceita cada versão apenas uma vez
  UNIQUE (user_id, version)
);

-- =====================
-- View helper: consentimentos atuais por usuário (último estado por finalidade)
-- =====================

CREATE OR REPLACE VIEW consent_status AS
SELECT DISTINCT ON (user_id, purpose)
  user_id,
  purpose,
  granted,
  terms_version,
  created_at AS updated_at
FROM consent_records
ORDER BY user_id, purpose, created_at DESC;

-- =====================
-- RLS — consent_records (imutável: só INSERT, sem UPDATE/DELETE)
-- =====================

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas seus próprios consentimentos
CREATE POLICY "consent_select_own"
  ON consent_records FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

-- Usuário registra consentimento em próprio nome
CREATE POLICY "consent_insert_own"
  ON consent_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NENHUMA policy de UPDATE ou DELETE → registros imutáveis

-- =====================
-- RLS — tos_acceptances
-- =====================

ALTER TABLE tos_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tos_select_own"
  ON tos_acceptances FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "tos_insert_own"
  ON tos_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);
