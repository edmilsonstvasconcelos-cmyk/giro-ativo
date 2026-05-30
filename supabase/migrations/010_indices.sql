-- Migration 010: Índices de performance

-- =====================
-- products — campos mais consultados em listagens, filtros e moderação
-- =====================

CREATE INDEX IF NOT EXISTS idx_products_company_id        ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_status            ON products(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_moderacao_status  ON products(moderacao_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_condicao          ON products(condicao) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id       ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at        ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price             ON products(price) WHERE price IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at        ON products(deleted_at) WHERE deleted_at IS NOT NULL;

-- Índice geo para busca por proximidade (PostGIS não disponível no Supabase Free tier;
-- usamos lat/lng numérico para bounding box simples)
CREATE INDEX IF NOT EXISTS idx_products_geo ON products(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND deleted_at IS NULL;

-- Full-text search em título e descrição (pt_BR)
CREATE INDEX IF NOT EXISTS idx_products_fts ON products
  USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));

-- =====================
-- messages — leitura de histórico e campos de bypass
-- =====================

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id       ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_bypass          ON messages(bypass_detectado) WHERE bypass_detectado = TRUE;

-- =====================
-- conversations — consultas de participação
-- =====================

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id  ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);

-- =====================
-- visit_requests — painel de visitas
-- =====================

CREATE INDEX IF NOT EXISTS idx_visit_requests_buyer_id  ON visit_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_seller_id ON visit_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_status    ON visit_requests(status);
CREATE INDEX IF NOT EXISTS idx_visit_requests_date      ON visit_requests(proposed_date);

-- =====================
-- propostas — acompanhamento comprador/vendedor
-- =====================

CREATE INDEX IF NOT EXISTS idx_propostas_comprador_id ON propostas(comprador_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_propostas_vendedor_id  ON propostas(vendedor_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_propostas_produto_id   ON propostas(produto_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_propostas_status       ON propostas(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_propostas_expira_at    ON propostas(expira_at) WHERE status = 'pendente';

-- =====================
-- pedidos — dashboard financeiro e escrow
-- =====================

CREATE INDEX IF NOT EXISTS idx_pedidos_comprador_id ON pedidos(comprador_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor_id  ON pedidos(vendedor_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_status       ON pedidos(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_produto_id   ON pedidos(produto_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at   ON pedidos(created_at DESC);

-- =====================
-- laudos — painel do avaliador
-- =====================

CREATE INDEX IF NOT EXISTS idx_laudos_avaliador_id ON laudos(avaliador_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_laudos_produto_id   ON laudos(produto_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_laudos_status       ON laudos(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_laudos_validade     ON laudos(validade_ate) WHERE status = 'concluido';

-- =====================
-- bypass_alerts — fila de moderação
-- =====================

CREATE INDEX IF NOT EXISTS idx_bypass_nivel       ON bypass_alerts(nivel) WHERE resolvido = FALSE;
CREATE INDEX IF NOT EXISTS idx_bypass_conversa_id ON bypass_alerts(conversa_id);
CREATE INDEX IF NOT EXISTS idx_bypass_created_at  ON bypass_alerts(created_at DESC);

-- =====================
-- profiles — busca por role (ex: listar avaliadores disponíveis)
-- =====================

CREATE INDEX IF NOT EXISTS idx_profiles_role    ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- =====================
-- consent_records — portal do titular
-- =====================

CREATE INDEX IF NOT EXISTS idx_consent_user_purpose ON consent_records(user_id, purpose, created_at DESC);

-- =====================
-- notificacoes — fila de entrega e inbox
-- =====================

CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida ON notificacoes(user_id, lida) WHERE lida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notificacoes_enviada   ON notificacoes(enviada, tentativas) WHERE enviada = FALSE;
