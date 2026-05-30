-- Migration 005: Tabelas laudos e laudo_fotos

-- =====================
-- Enums
-- =====================

DO $$ BEGIN
  CREATE TYPE laudo_modalidade AS ENUM ('basico', 'presencial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE laudo_status AS ENUM (
    'solicitado',    -- criado, sem avaliador atribuído
    'atribuido',     -- avaliador designado pelo sistema/admin
    'agendado',      -- data/hora de visita confirmada
    'em_execucao',   -- avaliador fez check-in GPS
    'concluido',     -- laudo assinado e PDF emitido
    'cancelado',
    'expirado'       -- validade de 90 dias vencida sem uso
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- Tabela laudos
-- =====================

CREATE TABLE IF NOT EXISTS laudos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id            UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  pedido_id             UUID REFERENCES pedidos(id),  -- nullable: laudo pode ser standalone
  solicitante_id        UUID NOT NULL REFERENCES companies(id), -- quem pediu o laudo
  avaliador_id          UUID REFERENCES profiles(id), -- avaliador designado (role=avaliador)

  modalidade            laudo_modalidade NOT NULL DEFAULT 'presencial',
  status                laudo_status NOT NULL DEFAULT 'solicitado',

  -- Agendamento
  data_agendada         DATE,
  hora_agendada         TIME,

  -- Execução (app do avaliador)
  check_in_lat          NUMERIC(10, 7),
  check_in_lng          NUMERIC(10, 7),
  check_in_at           TIMESTAMPTZ,
  check_out_at          TIMESTAMPTZ,

  -- Resultado
  checklist_json        JSONB,                    -- respostas guiadas por categoria
  classificacao_condicao condicao_produto,        -- avaliação final do avaliador
  valor_mercado_sugerido NUMERIC(12, 2),          -- valor de mercado estimado
  observacoes           TEXT,                     -- texto livre do avaliador
  ia_analise_json       JSONB,                    -- output da visão computacional (IA-004)
  ia_modelo_versao      TEXT,                     -- ex: gpt-4o-2024-05-13

  -- Documentos finais
  pdf_url               TEXT,
  pdf_gerado_at         TIMESTAMPTZ,
  assinatura_digital_url TEXT,                   -- DocuSign URL
  assinatura_id_docusign TEXT,

  -- Validade (90 dias após conclusão)
  validade_ate          TIMESTAMPTZ,

  -- Auditoria
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

-- Trigger: ao concluir, define validade_ate automaticamente
CREATE OR REPLACE FUNCTION set_laudo_validade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluido' AND OLD.status <> 'concluido' THEN
    NEW.validade_ate := NOW() + INTERVAL '90 days';
    NEW.pdf_gerado_at := NOW();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_laudos_status
  BEFORE UPDATE ON laudos
  FOR EACH ROW EXECUTE PROCEDURE set_laudo_validade();

CREATE OR REPLACE FUNCTION trg_laudos_insert_fn()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- Tabela laudo_fotos
-- Fotos tiradas durante a execução do laudo (ângulos obrigatórios por categoria)
-- =====================

CREATE TABLE IF NOT EXISTS laudo_fotos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laudo_id    UUID NOT NULL REFERENCES laudos(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  angulo      TEXT,          -- ex: 'frontal', 'lateral_dir', 'placa_fabricante', 'defeito_1'
  legenda     TEXT,
  ia_analise  JSONB,         -- resultado da análise desta foto específica (IA-004)
  ordem       SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- RLS — laudos
-- =====================

ALTER TABLE laudos ENABLE ROW LEVEL SECURITY;

-- Solicitante vê seus laudos
CREATE POLICY "laudos_select_solicitante"
  ON laudos FOR SELECT
  USING (
    deleted_at IS NULL
    AND solicitante_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

-- Avaliador vê laudos atribuídos a ele
CREATE POLICY "laudos_select_avaliador"
  ON laudos FOR SELECT
  USING (
    deleted_at IS NULL
    AND avaliador_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Vendedor do produto vê laudos relacionados ao seu produto
CREATE POLICY "laudos_select_vendedor"
  ON laudos FOR SELECT
  USING (
    deleted_at IS NULL
    AND produto_id IN (
      SELECT p.id FROM products p
      JOIN companies c ON c.id = p.company_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Admin/moderador vê tudo
CREATE POLICY "laudos_select_admin"
  ON laudos FOR SELECT
  USING (is_moderator_or_admin());

-- Solicitante cria laudo
CREATE POLICY "laudos_insert_solicitante"
  ON laudos FOR INSERT
  WITH CHECK (
    solicitante_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

-- Avaliador atualiza laudo designado; admin pode tudo
CREATE POLICY "laudos_update_avaliador"
  ON laudos FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      avaliador_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR is_admin()
    )
  );

-- =====================
-- RLS — laudo_fotos
-- =====================

ALTER TABLE laudo_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "laudo_fotos_select"
  ON laudo_fotos FOR SELECT
  USING (
    laudo_id IN (
      SELECT id FROM laudos WHERE deleted_at IS NULL AND (
        solicitante_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
        OR avaliador_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR is_moderator_or_admin()
      )
    )
  );

CREATE POLICY "laudo_fotos_insert_avaliador"
  ON laudo_fotos FOR INSERT
  WITH CHECK (
    laudo_id IN (
      SELECT id FROM laudos
      WHERE avaliador_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "laudo_fotos_delete_avaliador"
  ON laudo_fotos FOR DELETE
  USING (
    laudo_id IN (
      SELECT id FROM laudos
      WHERE avaliador_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND status IN ('atribuido', 'agendado', 'em_execucao')
    )
  );
