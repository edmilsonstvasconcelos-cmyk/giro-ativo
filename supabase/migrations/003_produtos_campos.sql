-- Migration 003: Campos faltantes em products e alinhamento com PRD v3.0
--
-- DECISÃO DE SCHEMA:
-- O campo condition (novo/seminovo/usado) é substituído por condicao
-- com o enum do PRD (otimo/bom/regular/inservivel), que alinha com
-- a linguagem do laudo técnico industrial. Os valores existentes são
-- migrados: novo→otimo, seminovo→bom, usado→regular.
-- ATENÇÃO: componentes de UI que referenciam 'condition' precisam ser
-- atualizados (ProductCard, formulário novo produto, filtros).

-- =====================
-- Enums novos
-- =====================

DO $$ BEGIN
  CREATE TYPE condicao_produto AS ENUM ('otimo', 'bom', 'regular', 'inservivel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE moderacao_status AS ENUM ('pendente', 'aprovado', 'reprovado', 'em_revisao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- Adicionar novos campos em products
-- =====================

ALTER TABLE products
  -- Condição com enum PRD (substitui 'condition')
  ADD COLUMN IF NOT EXISTS condicao condicao_produto DEFAULT 'bom',

  -- Preço sugerido pela IA (IA-001)
  ADD COLUMN IF NOT EXISTS preco_sugerido_ia NUMERIC(12, 2),

  -- Especificações técnicas industriais
  ADD COLUMN IF NOT EXISTS norma_tecnica TEXT,    -- ex: NBR 5462, ASTM A53, DIN EN 10216
  ADD COLUMN IF NOT EXISTS ncm VARCHAR(10),       -- Nomenclatura Comum do Mercosul

  -- Flags de serviços disponíveis
  ADD COLUMN IF NOT EXISTS tem_laudo           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS visita_disponivel   BOOLEAN DEFAULT TRUE,

  -- Pipeline de moderação
  ADD COLUMN IF NOT EXISTS moderacao_status moderacao_status DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS moderacao_nota    TEXT,           -- feedback do moderador
  ADD COLUMN IF NOT EXISTS moderado_por      UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderado_at       TIMESTAMPTZ,

  -- Geolocalização (para busca por proximidade e mapa)
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),

  -- Soft delete
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =====================
-- Migrar dados de 'condition' para 'condicao'
-- =====================

UPDATE products SET condicao = 'otimo'    WHERE condition = 'novo';
UPDATE products SET condicao = 'bom'      WHERE condition = 'seminovo';
UPDATE products SET condicao = 'regular'  WHERE condition = 'usado';

-- Tornar condicao NOT NULL após migração
ALTER TABLE products ALTER COLUMN condicao SET NOT NULL;

-- Remover coluna antiga
ALTER TABLE products DROP COLUMN IF EXISTS condition;

-- =====================
-- Atualizar status de moderação: produtos já publicados (status=active)
-- recebem moderacao_status=aprovado retroativamente
-- =====================

UPDATE products
  SET moderacao_status = 'aprovado'
  WHERE status = 'active' AND deleted_at IS NULL;

-- =====================
-- Atualizar policy de leitura: comprador só vê products aprovados
-- =====================

DROP POLICY IF EXISTS "products_select_public" ON products;
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      -- produto aprovado é visível para todos
      (status = 'active' AND moderacao_status = 'aprovado')
      -- dono vê todos os seus próprios
      OR company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    )
  );

-- =====================
-- Atualizar demais policies para respeitar soft delete
-- =====================

DROP POLICY IF EXISTS "products_update_own" ON products;
CREATE POLICY "products_update_own"
  ON products FOR UPDATE
  USING (
    deleted_at IS NULL
    AND company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "products_delete_own" ON products;
CREATE POLICY "products_delete_own"
  ON products FOR DELETE
  USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );
