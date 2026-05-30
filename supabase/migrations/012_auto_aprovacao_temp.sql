-- Migration 012: Aprovação automática temporária de produtos
--
-- TEMP: Aprovação automática para desenvolvimento.
-- Durante o desenvolvimento, produtos inseridos com moderacao_status='pendente'
-- são imediatamente promovidos para 'aprovado' por este trigger.
--
-- REMOVER ANTES DO GO-LIVE (Sprint 9 implementa a moderação real com painel
-- de moderador, pipeline verde/amarelo/vermelho e integração com IA-009).
-- Para desativar: DROP TRIGGER trg_auto_aprovar_produto ON products;

CREATE OR REPLACE FUNCTION auto_aprovar_produto_temp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Só auto-aprova na inserção inicial (não afeta updates manuais de moderação)
  IF TG_OP = 'INSERT' AND NEW.moderacao_status = 'pendente' THEN
    NEW.moderacao_status := 'aprovado';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_aprovar_produto ON products;

CREATE TRIGGER trg_auto_aprovar_produto
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE PROCEDURE auto_aprovar_produto_temp();
