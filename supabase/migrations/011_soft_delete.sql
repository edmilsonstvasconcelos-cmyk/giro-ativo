-- Migration 011: Soft delete em todas as tabelas principais que ainda não têm
-- Garante conformidade com LGPD (retenção obrigatória de dados por prazos legais)

-- =====================
-- Adicionar deleted_at nas tabelas que ainda não têm
-- =====================

ALTER TABLE companies       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE categories      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE conversations   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE visit_requests  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE laudo_fotos     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE avaliacoes      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE assinaturas     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notificacoes    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- products, propostas, pedidos e laudos já receberam deleted_at nas migrations anteriores

-- =====================
-- Atualizar RLS das tabelas que já existiam para filtrar soft-deleted
-- =====================

-- companies
DROP POLICY IF EXISTS "companies_select_public" ON companies;
CREATE POLICY "companies_select_public"
  ON companies FOR SELECT
  USING (deleted_at IS NULL);

-- categories
DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (deleted_at IS NULL);

-- conversations
DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      buyer_id  IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR seller_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR is_moderator_or_admin()
    )
  );

-- messages (buyer vê mensagens não deletadas de sua conversa)
DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (
    deleted_at IS NULL
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE deleted_at IS NULL
        AND (buyer_id  IN (SELECT id FROM companies WHERE user_id = auth.uid())
          OR seller_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
    )
  );

-- visit_requests
DROP POLICY IF EXISTS "visits_select_participant" ON visit_requests;
CREATE POLICY "visits_select_participant"
  ON visit_requests FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      buyer_id  IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR seller_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR is_moderator_or_admin()
    )
  );

-- =====================
-- Função helper: soft delete (marcar deleted_at em vez de DELETE)
-- Pode ser usada em Server Actions para garantir consistência
-- =====================

CREATE OR REPLACE FUNCTION soft_delete(table_name TEXT, record_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    table_name
  ) USING record_id;
END;
$$;
