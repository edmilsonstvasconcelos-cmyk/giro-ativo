-- Migration 009: Anti-fraude e anti-bypass
-- Adiciona campos de bypass em messages e cria bypass_alerts

-- =====================
-- Campos bypass em messages
-- =====================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS bypass_score     NUMERIC(4, 3) DEFAULT 0
    CHECK (bypass_score >= 0 AND bypass_score <= 1),
  ADD COLUMN IF NOT EXISTS bypass_detectado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mascarado        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS conteudo_original TEXT;  -- guarda original antes de mascarar

-- =====================
-- Enums
-- =====================

DO $$ BEGIN
  CREATE TYPE bypass_nivel AS ENUM ('baixo', 'medio', 'alto', 'critico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bypass_acao AS ENUM (
    'alerta_silencioso',  -- registra sem notificar ninguém
    'aviso_usuario',      -- exibe aviso ao remetente
    'bloqueio'            -- mensagem bloqueada + alerta para operações
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- Tabela bypass_alerts
-- Log de todos os eventos de detecção de contato externo no chat
-- =====================

CREATE TABLE IF NOT EXISTS bypass_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id       UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  mensagem_id       UUID REFERENCES messages(id),
  remetente_id      UUID NOT NULL REFERENCES companies(id),

  -- Classificação
  nivel             bypass_nivel NOT NULL,
  acao_tomada       bypass_acao NOT NULL,
  bypass_score      NUMERIC(4, 3),

  -- Detalhes da detecção
  tipo_bypass       TEXT[],        -- ex: ['telefone', 'whatsapp', 'email_corporativo']
  trecho_detectado  TEXT,          -- o trecho que disparou o alerta (PII reduzido)
  modelo_nlp        TEXT,          -- versão do modelo/regex usado

  -- Resolução
  resolvido         BOOLEAN DEFAULT FALSE,
  resolvido_por     UUID REFERENCES auth.users(id),
  resolvido_at      TIMESTAMPTZ,
  nota_resolucao    TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- RLS — bypass_alerts (apenas admins/moderadores)
-- =====================

ALTER TABLE bypass_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bypass_alerts_select_admin"
  ON bypass_alerts FOR SELECT
  USING (is_moderator_or_admin());

CREATE POLICY "bypass_alerts_insert_admin"
  ON bypass_alerts FOR INSERT
  WITH CHECK (is_moderator_or_admin());

-- Moderador pode resolver alertas
CREATE POLICY "bypass_alerts_update_moderator"
  ON bypass_alerts FOR UPDATE
  USING (is_moderator_or_admin());

-- =====================
-- RLS — atualizar policy de messages para respeitar mascaramento
-- =====================

-- Participantes veem mensagens mascaradas (conteudo_original nunca exposto via RLS)
DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id  IN (SELECT id FROM companies WHERE user_id = auth.uid())
         OR seller_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    )
  );

-- Moderador pode ver conteudo_original para investigação
CREATE POLICY "messages_select_moderator"
  ON messages FOR SELECT
  USING (is_moderator_or_admin());

-- =====================
-- Tabela notificacoes (fila de notificações multi-canal)
-- =====================

DO $$ BEGIN
  CREATE TYPE notificacao_tipo AS ENUM (
    'nova_mensagem', 'nova_proposta', 'proposta_aceita', 'proposta_recusada',
    'pedido_criado', 'pagamento_confirmado', 'laudo_concluido',
    'visita_solicitada', 'visita_aceita', 'visita_recusada',
    'avaliacao_recebida', 'moderacao_reprovada', 'bypass_aviso'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notificacao_canal AS ENUM ('push', 'email', 'whatsapp', 'sms', 'inapp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS notificacoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo          notificacao_tipo NOT NULL,
  canal         notificacao_canal NOT NULL DEFAULT 'inapp',

  -- Conteúdo
  titulo        TEXT NOT NULL,
  corpo         TEXT,
  dados_json    JSONB,          -- payload específico por tipo (ex: {produto_id, pedido_id})
  link          TEXT,           -- deep link web ou mobile

  -- Estado
  lida          BOOLEAN DEFAULT FALSE,
  enviada       BOOLEAN DEFAULT FALSE,
  enviada_at    TIMESTAMPTZ,
  lida_at       TIMESTAMPTZ,

  -- Erro de envio
  erro_envio    TEXT,
  tentativas    SMALLINT DEFAULT 0,

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificacoes_select_own"
  ON notificacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notificacoes_update_own"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = user_id);  -- usuário pode marcar como lida

CREATE POLICY "notificacoes_insert_admin"
  ON notificacoes FOR INSERT
  WITH CHECK (is_admin());  -- apenas backend cria notificações
