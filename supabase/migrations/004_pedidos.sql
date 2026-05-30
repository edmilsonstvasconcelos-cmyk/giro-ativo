-- Migration 004: Tabelas propostas e pedidos (fluxo de transação com escrow)

-- =====================
-- Enums
-- =====================

DO $$ BEGIN
  CREATE TYPE proposta_status AS ENUM (
    'pendente', 'aceita', 'recusada', 'expirada', 'cancelada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pedido_status AS ENUM (
    'aguardando_pagamento',  -- proposta aceita, aguardando pagamento comprador
    'pagamento_confirmado',  -- Pagar.me confirmou o pagamento
    'em_escrow',             -- valor retido no escrow
    'laudo_solicitado',      -- comprador solicitou laudo antes da liberação
    'laudo_aprovado',        -- laudo emitido e aprovado
    'aguardando_entrega',    -- aguardando retirada/entrega física
    'entregue',              -- vendedor confirmou entrega
    'concluido',             -- comprador confirmou recebimento → escrow liberado
    'cancelado',             -- cancelado por qualquer parte
    'reembolsado'            -- escrow devolvido ao comprador
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('pix', 'cartao_credito', 'boleto', 'transferencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- Tabela propostas
-- Comprador faz uma proposta de preço ao vendedor para um produto
-- =====================

CREATE TABLE IF NOT EXISTS propostas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  comprador_id    UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  vendedor_id     UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  conversa_id     UUID REFERENCES conversations(id), -- conversa associada
  preco_proposta  NUMERIC(12, 2) NOT NULL,
  mensagem        TEXT,
  status          proposta_status NOT NULL DEFAULT 'pendente',
  respondida_at   TIMESTAMPTZ,
  expira_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours'),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT propostas_partes_diferentes CHECK (comprador_id <> vendedor_id)
);

CREATE OR REPLACE FUNCTION update_propostas_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_propostas_updated_at
  BEFORE UPDATE ON propostas
  FOR EACH ROW EXECUTE PROCEDURE update_propostas_updated_at();

-- =====================
-- Tabela pedidos
-- Criado automaticamente ao aceitar uma proposta
-- =====================

CREATE TABLE IF NOT EXISTS pedidos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id         UUID REFERENCES propostas(id),
  produto_id          UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  comprador_id        UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  vendedor_id         UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,

  -- Valores (calculados e travados no momento do pedido — nunca recalculados via client)
  valor_produto       NUMERIC(12, 2) NOT NULL,
  valor_taxa_plataforma NUMERIC(12, 2) NOT NULL DEFAULT 0, -- taxa GiroAtivo
  valor_frete         NUMERIC(12, 2) DEFAULT 0,
  valor_total         NUMERIC(12, 2) NOT NULL,

  -- Pagamento (Pagar.me)
  status              pedido_status NOT NULL DEFAULT 'aguardando_pagamento',
  metodo_pagamento    payment_method,
  pagarme_order_id    TEXT,         -- ID do pedido no Pagar.me
  pagarme_charge_id   TEXT,         -- ID da cobrança
  pagarme_escrow_id   TEXT,         -- ID do escrow (split futuro)

  -- Datas de status
  pago_at             TIMESTAMPTZ,
  escrow_liberado_at  TIMESTAMPTZ,
  entregue_at         TIMESTAMPTZ,
  concluido_at        TIMESTAMPTZ,
  cancelado_at        TIMESTAMPTZ,
  cancelado_por       UUID REFERENCES auth.users(id),
  motivo_cancelamento TEXT,

  -- Auditoria
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT pedidos_valor_total_positivo CHECK (valor_total > 0),
  CONSTRAINT pedidos_partes_diferentes CHECK (comprador_id <> vendedor_id)
);

CREATE OR REPLACE FUNCTION update_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE PROCEDURE update_pedidos_updated_at();

-- =====================
-- RLS — propostas
-- =====================

ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "propostas_select_participant"
  ON propostas FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      comprador_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR vendedor_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR is_moderator_or_admin()
    )
  );

CREATE POLICY "propostas_insert_comprador"
  ON propostas FOR INSERT
  WITH CHECK (
    comprador_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

-- Vendedor aceita/recusa; comprador pode cancelar
CREATE POLICY "propostas_update_participant"
  ON propostas FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      vendedor_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR comprador_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR is_admin()
    )
  );

-- =====================
-- RLS — pedidos
-- =====================

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_select_participant"
  ON pedidos FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      comprador_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR vendedor_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR is_moderator_or_admin()
    )
  );

-- Pedidos são criados apenas pelo backend (server action / webhook Pagar.me)
-- Client não cria pedido diretamente — valor sempre validado no servidor
CREATE POLICY "pedidos_insert_deny_client"
  ON pedidos FOR INSERT
  WITH CHECK (is_admin());  -- somente service_role / funções SECURITY DEFINER

CREATE POLICY "pedidos_update_participant"
  ON pedidos FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      comprador_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR vendedor_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR is_admin()
    )
  );
