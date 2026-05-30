-- Migration 006: Tabela avaliacoes pós-transação

CREATE TABLE IF NOT EXISTS avaliacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,

  -- Quem avalia e quem é avaliado
  avaliador_id    UUID NOT NULL REFERENCES companies(id),  -- empresa que avalia
  avaliado_id     UUID NOT NULL REFERENCES companies(id),  -- empresa avaliada
  papel_avaliado  TEXT NOT NULL CHECK (papel_avaliado IN ('comprador', 'vendedor')),

  -- Nota de 1 a 5 (sem decimais)
  nota            SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),

  -- Dimensões opcionais (para relatórios mais ricos)
  nota_comunicacao    SMALLINT CHECK (nota_comunicacao BETWEEN 1 AND 5),
  nota_produto        SMALLINT CHECK (nota_produto BETWEEN 1 AND 5),      -- vendedor avalia: qualidade info
  nota_pontualidade   SMALLINT CHECK (nota_pontualidade BETWEEN 1 AND 5),

  comentario      TEXT,
  publico         BOOLEAN DEFAULT TRUE,  -- avaliações podem ser ocultadas por moderadores

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Cada parte avalia a outra exatamente uma vez por pedido
  UNIQUE (pedido_id, avaliador_id),
  CONSTRAINT avaliacoes_partes_diferentes CHECK (avaliador_id <> avaliado_id)
);

CREATE OR REPLACE FUNCTION update_avaliacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_avaliacoes_updated_at
  BEFORE UPDATE ON avaliacoes
  FOR EACH ROW EXECUTE PROCEDURE update_avaliacoes_updated_at();

-- =====================
-- RLS — avaliacoes
-- =====================

ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Avaliações públicas são visíveis para todos; privadas só para partes e admin
CREATE POLICY "avaliacoes_select_public"
  ON avaliacoes FOR SELECT
  USING (
    publico = TRUE
    OR avaliador_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    OR avaliado_id  IN (SELECT id FROM companies WHERE user_id = auth.uid())
    OR is_moderator_or_admin()
  );

-- Participante do pedido pode avaliar (após pedido concluído — validado no server action)
CREATE POLICY "avaliacoes_insert_participant"
  ON avaliacoes FOR INSERT
  WITH CHECK (
    avaliador_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    AND pedido_id IN (
      SELECT id FROM pedidos
      WHERE (comprador_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
             OR vendedor_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
        AND status = 'concluido'
    )
  );

-- Moderador pode ocultar avaliações abusivas
CREATE POLICY "avaliacoes_update_moderator"
  ON avaliacoes FOR UPDATE
  USING (is_moderator_or_admin());
