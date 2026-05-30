-- =============================================================================
-- Seed: dados de desenvolvimento para o GiroAtivo
-- Funciona apenas com Supabase CLI local (supabase start + supabase db seed)
-- NÃO execute em ambiente de produção.
-- =============================================================================

-- =====================
-- Categorias
-- =====================

INSERT INTO categories (nome, slug, icone) VALUES
  ('Tubulações e Conexões',  'tubulacoes-conexoes',  '🔩'),
  ('Elétrica e Automação',   'eletrica-automacao',   '⚡'),
  ('Mecânica e Estruturas',  'mecanica-estruturas',  '⚙️'),
  ('Instrumentação',         'instrumentacao',        '📊'),
  ('Válvulas e Atuadores',   'valvulas-atuadores',   '🔧'),
  ('Motores e Bombas',       'motores-bombas',        '🏭'),
  ('EPIs e Segurança',       'epis-seguranca',        '🦺'),
  ('Outros',                 'outros',                '📦')
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- Usuários de teste (auth.users)
-- UUIDs fixos para facilitar FKs no seed
-- Senha de todos: Teste@123
-- =====================

-- Comprador PF
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token
) VALUES (
  'a0000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'carlos.buyer@example.com',
  crypt('Teste@123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Carlos Mendes"}',
  '', ''
) ON CONFLICT (id) DO NOTHING;

-- Comprador PJ
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token
) VALUES (
  'a0000002-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'compras@construtora-omega.com',
  crypt('Teste@123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Construtora Omega"}',
  '', ''
) ON CONFLICT (id) DO NOTHING;

-- Vendedor 1 — Indústria de tubulação
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token
) VALUES (
  'a0000003-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'vendas@acosinox.com.br',
  crypt('Teste@123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Aços Inox Nordeste"}',
  '', ''
) ON CONFLICT (id) DO NOTHING;

-- Vendedor 2 — Equipamentos elétricos
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token
) VALUES (
  'a0000004-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'estoque@eletroparts.com.br',
  crypt('Teste@123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"EletroParts Distribuidora"}',
  '', ''
) ON CONFLICT (id) DO NOTHING;

-- Vendedor 3 — Válvulas e instrumentação
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token
) VALUES (
  'a0000005-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'almox@petroquimica-sul.com.br',
  crypt('Teste@123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Petroquímica Sul"}',
  '', ''
) ON CONFLICT (id) DO NOTHING;

-- =====================
-- Profiles (trigger on_auth_user_created já criou os registros base;
-- aqui atualizamos role e dados adicionais)
-- =====================

-- Aguarda propagação do trigger (em seeds síncronos não é necessário, mas por segurança):
UPDATE profiles SET
  role = 'comprador',
  nome = 'Carlos Mendes',
  cpf = '123.456.789-00',
  telefone = '(11) 98765-4321'
WHERE user_id = 'a0000001-0000-0000-0000-000000000001';

UPDATE profiles SET
  role = 'comprador',
  nome = 'Construtora Omega — Dep. Compras',
  telefone = '(21) 3456-7890'
WHERE user_id = 'a0000002-0000-0000-0000-000000000002';

UPDATE profiles SET
  role = 'vendedor',
  nome = 'Marcos Ferreira',
  telefone = '(85) 98888-1234'
WHERE user_id = 'a0000003-0000-0000-0000-000000000003';

UPDATE profiles SET
  role = 'vendedor',
  nome = 'Ana Lucia Santos',
  telefone = '(51) 97777-5678'
WHERE user_id = 'a0000004-0000-0000-0000-000000000004';

UPDATE profiles SET
  role = 'vendedor',
  nome = 'Roberto Andrade',
  telefone = '(41) 96666-9012'
WHERE user_id = 'a0000005-0000-0000-0000-000000000005';

-- =====================
-- Companies
-- =====================

-- Comprador PF não tem empresa — apenas profile

-- Comprador PJ — Construtora Omega
INSERT INTO companies (id, user_id, cnpj, razao_social, nome_fantasia, telefone, cidade, estado, tipo, verified) VALUES
  ('c0000001-0000-0000-0000-000000000001',
   'a0000002-0000-0000-0000-000000000002',
   '12.345.678/0001-90', 'CONSTRUTORA OMEGA LTDA', 'Construtora Omega',
   '(21) 3456-7890', 'Rio de Janeiro', 'RJ', 'comprador', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Vendedor 1 — Aços Inox Nordeste (Fortaleza)
INSERT INTO companies (id, user_id, cnpj, razao_social, nome_fantasia, telefone, cidade, estado, tipo, verified) VALUES
  ('c0000002-0000-0000-0000-000000000002',
   'a0000003-0000-0000-0000-000000000003',
   '23.456.789/0001-01', 'ACOS INOX NORDESTE COMERCIO E INDUSTRIA LTDA', 'Aços Inox Nordeste',
   '(85) 3333-4444', 'Fortaleza', 'CE', 'vendedor', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Vendedor 2 — EletroParts (Porto Alegre)
INSERT INTO companies (id, user_id, cnpj, razao_social, nome_fantasia, telefone, cidade, estado, tipo, verified) VALUES
  ('c0000003-0000-0000-0000-000000000003',
   'a0000004-0000-0000-0000-000000000004',
   '34.567.890/0001-12', 'ELETROPARTS DISTRIBUIDORA DE MATERIAIS ELETRICOS LTDA', 'EletroParts',
   '(51) 3322-1100', 'Porto Alegre', 'RS', 'vendedor', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Vendedor 3 — Petroquímica Sul (Curitiba)
INSERT INTO companies (id, user_id, cnpj, razao_social, nome_fantasia, telefone, cidade, estado, tipo, verified) VALUES
  ('c0000004-0000-0000-0000-000000000004',
   'a0000005-0000-0000-0000-000000000005',
   '45.678.901/0001-23', 'PETROQUIMICA SUL INDUSTRIA E COMERCIO S.A.', 'Petroquímica Sul',
   '(41) 3300-5500', 'Curitiba', 'PR', 'vendedor', TRUE)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- Produtos (15 produtos variados)
-- =====================

-- Aços Inox Nordeste (c0000002) — 5 produtos
INSERT INTO products (id, company_id, title, description, category_id, price, unit, quantity, condicao, location, latitude, longitude, norma_tecnica, ncm, visita_disponivel, status, moderacao_status) VALUES

  ('b0000001-0000-0000-0000-000000000001',
   'c0000002-0000-0000-0000-000000000002',
   'Tubo de Aço Inox AISI 316L — 3" SCH 40 — 200 metros',
   'Estoque excedente de projeto de refinaria. Nunca instalados. Certificado de material disponível. Norma ASTM A312. Ótimo estado, sem corrosão.',
   1, 185.00, 'metro', 200,
   'otimo', 'Fortaleza, CE', -3.7172, -38.5433,
   'ASTM A312 / NBR 5580', '7304.41.10',
   TRUE, 'active', 'aprovado'),

  ('b0000002-0000-0000-0000-000000000002',
   'c0000002-0000-0000-0000-000000000002',
   'Flanges ANSI B16.5 — 150# — 4" — Aço Carbono — Lote com 48 unidades',
   'Flanges do tipo WN (Weld Neck) e SO (Slip On) em aço carbono ASTM A105. Lote misturado com 30 WN e 18 SO. Sem uso.',
   1, 9800.00, 'lote', 1,
   'otimo', 'Fortaleza, CE', -3.7172, -38.5433,
   'ANSI B16.5 / ASTM A105', '7307.91.00',
   TRUE, 'active', 'aprovado'),

  ('b0000003-0000-0000-0000-000000000003',
   'c0000002-0000-0000-0000-000000000002',
   'Curvas 90° Aço Inox 304 — 2" SCH 80 — 35 peças',
   'Curvas de raio longo (LR) em ASTM A403 Gr.WP304. Excedente de montagem industrial. Boas condições, alguns apresentam marcas de armazenamento.',
   1, 320.00, 'unidade', 35,
   'bom', 'Fortaleza, CE', -3.7172, -38.5433,
   'ASTM A403 WP304', '7307.23.00',
   FALSE, 'active', 'aprovado'),

  ('b0000004-0000-0000-0000-000000000004',
   'c0000002-0000-0000-0000-000000000002',
   'Cotovelos Soldáveis 45° — 1.1/2" Inox 316 — 60 unidades',
   'Cotovelos de raio curto em aço inoxidável 316. Produto importado com certificado MILL. Excedente de projeto de expansão de planta petroquímica.',
   1, 145.00, 'unidade', 60,
   'otimo', 'Fortaleza, CE', -3.7172, -38.5433,
   'ASTM A403 WP316', '7307.23.00',
   FALSE, 'paused', 'aprovado'),

  ('b0000005-0000-0000-0000-000000000005',
   'c0000002-0000-0000-0000-000000000002',
   'Manômetros Bourdon 0-40 bar — Inox — 6 unidades',
   'Manômetros industriais com glicerina, escala 0-40 bar, diâmetro 100mm, conexão 1/2" NPT. Marca Wika. Calibração em dia. Saindo do almoxarifado por atualização de estoque.',
   4, 380.00, 'unidade', 6,
   'bom', 'Fortaleza, CE', -3.7172, -38.5433,
   'NBR ISO 2955', '9026.20.10',
   TRUE, 'active', 'aprovado');

-- EletroParts (c0000003) — 5 produtos
INSERT INTO products (id, company_id, title, description, category_id, price, unit, quantity, condicao, location, latitude, longitude, ncm, visita_disponivel, status, moderacao_status) VALUES

  ('b0000006-0000-0000-0000-000000000006',
   'c0000003-0000-0000-0000-000000000003',
   'Motor Elétrico WEG W22 — 30 CV — 4 polos — 380V — 1750 rpm',
   'Motor de indução trifásico. Usado por 800 horas em bombeamento de água industrial. Desmontado para revisão preventiva, ainda não instalado novamente. Carcaça 200L, IP55.',
   6, 7500.00, 'unidade', 1,
   'bom', 'Porto Alegre, RS', -30.0346, -51.2177,
   '8501.52.20',
   TRUE, 'active', 'aprovado'),

  ('b0000007-0000-0000-0000-000000000007',
   'c0000003-0000-0000-0000-000000000003',
   'Disjuntores Siemens 3RV — 25A — Lote com 12 unidades — Novos',
   'Disjuntores para motor (SDMO) série 3RV1021. Capacidade de interrupção 100kA. Novos, na embalagem original. Excedente de projeto de modernização de painéis.',
   2, 290.00, 'unidade', 12,
   'otimo', 'Porto Alegre, RS', -30.0346, -51.2177,
   '8535.21.00',
   FALSE, 'active', 'aprovado'),

  ('b0000008-0000-0000-0000-000000000008',
   'c0000003-0000-0000-0000-000000000003',
   'CLP Siemens S7-300 — CPU 315-2 DP — com módulos I/O',
   'Controlador Lógico Programável Siemens S7-300 completo: CPU 315-2 DP, 2x SM321 (DI 32x24VDC), 1x SM322 (DO 32x24VDC/0.5A). Rack e fonte de alimentação PS307 incluídos. Funcionando, retirado por migração para S7-1500.',
   2, 18500.00, 'lote', 1,
   'regular', 'Porto Alegre, RS', -30.0346, -51.2177,
   '8537.10.20',
   TRUE, 'active', 'aprovado'),

  ('b0000009-0000-0000-0000-000000000009',
   'c0000003-0000-0000-0000-000000000003',
   'Cabos Elétricos 95mm² — Cobre flexível 0,6/1kV — 180 metros',
   'Cabo multipolar 3x95mm² + 50mm² (terra) — XLPE isolação, PVC cobertura. Sobraram de obra de subestação. Bobina parcial. Norma NBR 7286.',
   2, 280.00, 'metro', 180,
   'otimo', 'Porto Alegre, RS', -30.0346, -51.2177,
   '8544.49.00',
   FALSE, 'active', 'aprovado'),

  ('b0000010-0000-0000-0000-000000000010',
   'c0000003-0000-0000-0000-000000000003',
   'Inversor de Frequência ABB ACS550 — 22 kW — 380V — Sem uso',
   'Drive de frequência variável ACS550-01-045A-4 para controle de motores de até 22kW. Nunca instalado. Caixa original. Manual em português. Excelente para projetos de eficiência energética.',
   2, 4200.00, 'unidade', 1,
   'otimo', 'Porto Alegre, RS', -30.0346, -51.2177,
   '8504.40.40',
   FALSE, 'active', 'aprovado');

-- Petroquímica Sul (c0000004) — 5 produtos
INSERT INTO products (id, company_id, title, description, category_id, price, unit, quantity, condicao, location, latitude, longitude, norma_tecnica, ncm, tem_laudo, visita_disponivel, status, moderacao_status) VALUES

  ('b0000011-0000-0000-0000-000000000011',
   'c0000004-0000-0000-0000-000000000004',
   'Válvula Globo Inox 316 — 2" — Classe 150 — API 602 — 8 unidades',
   'Válvulas globo com corpo em ASTM A182 F316 e trim em AISI 316. Pressão de serviço 20 bar a 200°C. Usadas por 3 anos em linha de processo. Em bom estado operacional, sem vazamentos registrados.',
   5, 1850.00, 'unidade', 8,
   'bom', 'Curitiba, PR', -25.4284, -49.2733,
   'API 602 / ASME B16.34', '8481.20.00',
   TRUE, TRUE, 'active', 'aprovado'),

  ('b0000012-0000-0000-0000-000000000012',
   'c0000004-0000-0000-0000-000000000004',
   'Válvula de Controle Fisher — 3" — Pneumática — Cv 120',
   'Válvula de controle tipo globo Fisher série GX com atuador pneumático rotativo. Cv=120, corpo ANSI 300#, trim igual percentagem. Posicionador digital FIELDVUE DVC6200. Retirada de linha por upgrade de processo.',
   5, 22000.00, 'unidade', 1,
   'regular', 'Curitiba, PR', -25.4284, -49.2733,
   'IEC 60534 / ANSI/ISA S75.01', '8481.20.00',
   TRUE, TRUE, 'active', 'aprovado'),

  ('b0000013-0000-0000-0000-000000000013',
   'c0000004-0000-0000-0000-000000000004',
   'Transmissor de Pressão Rosemount 3051 — 0-40 bar — Hart — Novo',
   'Transmissores de pressão diferencial Rosemount 3051CD3A22A1AB4 (0-40 bar, protocolo HART 4-20mA). Lote com 4 unidades, na embalagem original. Excedente de projeto de expansão de planta.',
   4, 3800.00, 'unidade', 4,
   'otimo', 'Curitiba, PR', -25.4284, -49.2733,
   'IEC 61508 SIL 2', '9026.10.21',
   FALSE, TRUE, 'active', 'aprovado'),

  ('b0000014-0000-0000-0000-000000000014',
   'c0000004-0000-0000-0000-000000000004',
   'Bomba Centrífuga KSB Megachem — 45 kW — AISI 316L — revisada',
   'Bomba centrífuga para fluidos corrosivos. Corpo e rotor em AISI 316L. Curva Q=80m³/h H=80m. Revisão completa realizada em 2024 com troca de selos e rolamentos. Certificado de revisão disponível.',
   6, 35000.00, 'unidade', 1,
   'bom', 'Curitiba, PR', -25.4284, -49.2733,
   'ISO 5199 / API 685', '8413.70.90',
   TRUE, TRUE, 'active', 'aprovado'),

  ('b0000015-0000-0000-0000-000000000015',
   'c0000004-0000-0000-0000-000000000004',
   'EPIs para trabalho em altura — Lote 50 kits completos',
   'Kits de EPI para trabalho em altura: talabarte dupla ação CA 39519, cinto paraquedista CA 35503, capacete aba total CA 31469. Kits inspecionados, dentro do prazo de validade. Venda somente em lote.',
   7, 280.00, 'unidade', 50,
   'bom', 'Curitiba, PR', -25.4284, -49.2733,
   'NR-35 / NBR 14626', '6211.43.00',
   FALSE, FALSE, 'active', 'aprovado');

-- =====================
-- Conversas e mensagens de exemplo
-- =====================

-- Conversa: Construtora Omega (comprador) perguntando sobre tubos Aços Inox
INSERT INTO conversations (id, product_id, buyer_id, seller_id) VALUES
  ('d0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001',
   'c0000001-0000-0000-0000-000000000001',
   'c0000002-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO messages (conversation_id, sender_id, content, read, created_at) VALUES
  ('d0000001-0000-0000-0000-000000000001',
   'c0000001-0000-0000-0000-000000000001',
   'Bom dia! Temos interesse nos 200 metros de tubo 3" SCH40. Vocês têm o certificado de material (MTR) disponível para análise antes de fecharmos negócio?',
   TRUE, NOW() - INTERVAL '2 days'),

  ('d0000001-0000-0000-0000-000000000001',
   'c0000002-0000-0000-0000-000000000002',
   'Bom dia! Sim, temos o MTR completo do fabricante com rastreabilidade de corrida. Posso enviar por aqui mesmo. Também temos laudo dimensional disponível. Qual é o volume mínimo que vocês precisam?',
   TRUE, NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),

  ('d0000001-0000-0000-0000-000000000001',
   'c0000001-0000-0000-0000-000000000001',
   'Perfeito! Precisamos de no mínimo 80 metros para a primeira fase da obra. Podemos negociar o lote completo em 2 entregas? A primeira em 30 dias e o restante em 60 dias.',
   TRUE, NOW() - INTERVAL '1 day'),

  ('d0000001-0000-0000-0000-000000000001',
   'c0000002-0000-0000-0000-000000000002',
   'Sim, é possível trabalhar com entregas parciais. Vou verificar nossa logística e retorno amanhã com uma proposta formal. Podemos agendar uma visita técnica ao nosso almoxarifado se quiserem inspecionar o material pessoalmente?',
   FALSE, NOW() - INTERVAL '20 hours');

-- Conversa: Construtora Omega perguntando sobre a bomba KSB
INSERT INTO conversations (id, product_id, buyer_id, seller_id) VALUES
  ('d0000002-0000-0000-0000-000000000002',
   'b0000014-0000-0000-0000-000000000014',
   'c0000001-0000-0000-0000-000000000001',
   'c0000004-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

INSERT INTO messages (conversation_id, sender_id, content, read, created_at) VALUES
  ('d0000002-0000-0000-0000-000000000002',
   'c0000001-0000-0000-0000-000000000001',
   'Olá! Vimos o anúncio da bomba KSB Megachem. Vocês têm o relatório de revisão? É para aplicação com ácido clorídrico a 15%.',
   TRUE, NOW() - INTERVAL '5 hours'),

  ('d0000002-0000-0000-0000-000000000002',
   'c0000004-0000-0000-0000-000000000004',
   'Olá! Sim, temos o relatório completo da revisão feita pela KSB em março/2024. Para aplicação com HCl a 15%, o material 316L é adequado até temperaturas de 60°C. Qual é a temperatura de operação? Posso indicar se a bomba atende.',
   FALSE, NOW() - INTERVAL '3 hours');

-- =====================
-- Visita técnica agendada
-- =====================

INSERT INTO visit_requests (id, product_id, buyer_id, seller_id, proposed_date, proposed_time, message, status) VALUES
  ('f0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001',
   'c0000001-0000-0000-0000-000000000001',
   'c0000002-0000-0000-0000-000000000002',
   CURRENT_DATE + INTERVAL '7 days',
   '09:00:00',
   'Gostaríamos de inspecionar o material pessoalmente e conferir o MTR. Nosso engenheiro de piping estará presente.',
   'accepted')
ON CONFLICT DO NOTHING;

-- =====================
-- Consentimentos LGPD dos usuários de teste
-- =====================

-- Comprador PF — consentimentos na versão v1.0 dos termos
INSERT INTO consent_records (user_id, purpose, granted, terms_version, channel) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'marketing',   TRUE,  'v1.0', 'web'),
  ('a0000001-0000-0000-0000-000000000001', 'analytics',   TRUE,  'v1.0', 'web'),
  ('a0000001-0000-0000-0000-000000000001', 'ia_training', FALSE, 'v1.0', 'web'),
  ('a0000001-0000-0000-0000-000000000001', 'geo',         TRUE,  'v1.0', 'web'),
  ('a0000001-0000-0000-0000-000000000001', 'parceiros',   FALSE, 'v1.0', 'web');

-- Comprador PJ
INSERT INTO consent_records (user_id, purpose, granted, terms_version, channel) VALUES
  ('a0000002-0000-0000-0000-000000000002', 'marketing',   TRUE,  'v1.0', 'web'),
  ('a0000002-0000-0000-0000-000000000002', 'analytics',   TRUE,  'v1.0', 'web'),
  ('a0000002-0000-0000-0000-000000000002', 'ia_training', TRUE,  'v1.0', 'web'),
  ('a0000002-0000-0000-0000-000000000002', 'geo',         TRUE,  'v1.0', 'web'),
  ('a0000002-0000-0000-0000-000000000002', 'parceiros',   FALSE, 'v1.0', 'web');

-- Vendedor 1
INSERT INTO consent_records (user_id, purpose, granted, terms_version, channel) VALUES
  ('a0000003-0000-0000-0000-000000000003', 'marketing',   TRUE,  'v1.0', 'web'),
  ('a0000003-0000-0000-0000-000000000003', 'analytics',   TRUE,  'v1.0', 'web'),
  ('a0000003-0000-0000-0000-000000000003', 'ia_training', TRUE,  'v1.0', 'web'),
  ('a0000003-0000-0000-0000-000000000003', 'geo',         TRUE,  'v1.0', 'web'),
  ('a0000003-0000-0000-0000-000000000003', 'parceiros',   TRUE,  'v1.0', 'web');

-- =====================
-- ToS acceptances
-- =====================

INSERT INTO tos_acceptances (user_id, version, channel) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'v1.0', 'web'),
  ('a0000002-0000-0000-0000-000000000002', 'v1.0', 'web'),
  ('a0000003-0000-0000-0000-000000000003', 'v1.0', 'web'),
  ('a0000004-0000-0000-0000-000000000004', 'v1.0', 'web'),
  ('a0000005-0000-0000-0000-000000000005', 'v1.0', 'web')
ON CONFLICT (user_id, version) DO NOTHING;
