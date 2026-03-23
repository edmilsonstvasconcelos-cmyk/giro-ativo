-- Seed: Categories
INSERT INTO categories (nome, slug, icone) VALUES
  ('Tubulações e Conexões', 'tubulacoes-conexoes', '🔩'),
  ('Elétrica e Automação', 'eletrica-automacao', '⚡'),
  ('Mecânica e Estruturas', 'mecanica-estruturas', '⚙️'),
  ('Instrumentação', 'instrumentacao', '📊'),
  ('Válvulas e Atuadores', 'valvulas-atuadores', '🔧'),
  ('Motores e Bombas', 'motores-bombas', '🏭'),
  ('EPIs e Segurança', 'epis-seguranca', '🦺'),
  ('Outros', 'outros', '📦')
ON CONFLICT (slug) DO NOTHING;
