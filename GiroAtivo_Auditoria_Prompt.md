# GiroAtivo — Prompt de Auditoria Completa

> **Como usar:** Cole este documento inteiro em uma conversa nova no Antigravity com o repositório aberto. O assistente vai executar cada bloco em sequência e entregar um relatório consolidado ao final.

---

## Contexto do projeto

Você é um assistente sênior de produto e engenharia analisando o projeto **GiroAtivo** — marketplace B2B especializado na comercialização de materiais industriais excedentes, equipamentos de obra e estoques obsoletos de almoxarifados.

**Documentação de referência (já arquivada no projeto):**
- `GiroAtivo_PRD_v3_0.docx` — Product Requirements Document completo
- `GiroAtivo_Spec_Seguranca_LGPD_v1_0.docx` — Especificação técnica de segurança e LGPD

**Stack definido no PRD v3.0:**
- Frontend Web: Next.js 14 + TypeScript
- Backend/BaaS: Supabase (PostgreSQL + Auth + Storage + Realtime + RLS)
- Mobile: React Native (Expo) — iOS e Android
- Pagamentos: Pagar.me com escrow nativo (PCI-DSS)
- IA: OpenAI API + Claude API (Anthropic) + AWS SageMaker
- Busca: Elasticsearch 8.x + embeddings OpenAI
- Notificações: Firebase FCM + Twilio/Zenvia (WhatsApp)
- Assinatura digital: DocuSign API
- Infraestrutura: Cloudflare (DDoS/WAF) + GitHub Actions (CI/CD)

**Roadmap de referência:**
- Fase 1 — MVP (meses 1–6): Autenticação → Catálogo → Transação → Visita Técnica v1 → Laudo Básico → Anti-bypass → Go-live
- Fase 2 — Crescimento (meses 7–12): IA avançada, App Mobile, Laudo Presencial, Planos, Assistente IA
- Fase 3 — Escala (meses 13–24): Leilão, ERP, IA de negociação, White-label, LatAm

O repositório está conectado ao GitHub e o desenvolvimento está sendo retomado. Analise tudo com acesso ao código e ao Supabase.

---

## Bloco 1 — Estrutura do repositório

Analise a estrutura atual do repositório e responda:

**1.1 Estrutura de pastas**
- Qual é a estrutura de diretórios raiz?
- Existe separação clara entre frontend, backend e mobile?
- Há monorepo configurado (Turborepo, Nx, pnpm workspaces) ou repositórios separados?

**1.2 Configuração base**
- `package.json`: quais dependências estão instaladas? Versões batem com o stack do PRD?
- TypeScript configurado (`tsconfig.json`)?
- ESLint + Prettier configurados e funcionando?
- Husky/lint-staged para pre-commit hooks?
- `.env.example` documentado? `.env` está no `.gitignore`?
- README com instruções de setup local?

**1.3 Supabase**
- Projeto Supabase criado e conectado?
- Pasta `/supabase/migrations` existe com migrations versionadas?
- Supabase CLI configurado (`supabase/config.toml`)?
- Seed de dados para desenvolvimento local?

**1.4 CI/CD**
- GitHub Actions configurado (`.github/workflows`)?
- Pipeline de lint, testes e deploy automatizado?
- Ambientes separados (dev, staging, production)?

Para cada item: `✅ feito` | `⚠️ parcial` | `❌ faltando` — com observação objetiva.

---

## Bloco 2 — Banco de dados e Supabase

Audite o estado do banco de dados contra os módulos do PRD v3.0.

**2.1 Tabelas esperadas para o MVP — verifique quais existem:**

| Tabela | Propósito |
|---|---|
| `profiles` | Perfis de usuário (comprador / vendedor / avaliador / moderador / admin) |
| `produtos` | Anúncios com status: rascunho / em_revisao / publicado / reservado / vendido |
| `categorias` | Hierarquia de categorias industriais |
| `pedidos` | Transações com status de escrow e histórico |
| `propostas` | Propostas comerciais entre comprador e vendedor |
| `conversas` | Threads de chat interno |
| `mensagens` | Mensagens individuais com flag de monitoramento anti-bypass |
| `laudos` | Ordens de laudo com status, arquivos PDF e assinatura digital |
| `visitas` | Agendamentos com confirmação bilateral e check-in GPS |
| `avaliacoes` | Ratings pós-transação (comprador e vendedor avaliam) |
| `planos` | Definição dos planos Básico / Pro / Enterprise |
| `assinaturas` | Assinatura ativa por vendedor com histórico de cobranças |
| `consent_records` | LGPD — consentimentos granulares por finalidade |
| `tos_acceptances` | Aceites de Termos de Uso versionados |
| `bypass_alerts` | Log de alertas do score anti-bypass |
| `notificacoes` | Fila de notificações push / e-mail / WhatsApp |

**2.2 Para cada tabela existente, verifique:**
- RLS habilitado? Políticas criadas e testadas?
- Índices nos campos de busca frequente (status, user_id, created_at)?
- Foreign keys com `ON DELETE` correto?
- Campos de auditoria (`created_at`, `updated_at`, `deleted_at` para soft delete)?

**2.3 Campos críticos por tabela**

`produtos`: id, vendedor_id, titulo, categoria_id, condicao (otimo/bom/regular/inservivel), preco, preco_sugerido_ia, status, localizacao (lat/lng), fotos[], norma_tecnica, ncm, tem_laudo, visita_disponivel, moderacao_status, created_at

`laudos`: id, produto_id, solicitante_id, avaliador_id, modalidade, status, fotos[], checklist_json, classificacao_condicao, valor_mercado_sugerido, pdf_url, assinatura_digital_url, check_in_coords, validade_ate (90 dias), ia_modelo_versao

`mensagens`: id, conversa_id, remetente_id, conteudo, bypass_score, bypass_detectado (bool), mascarado (bool), created_at

`consent_records`: id, user_id, purpose (enum: marketing/analytics/ia_training/geo/parceiros), granted (bool), timestamp, terms_version, ip, channel

Resultado esperado: tabela de status para cada item auditado + lista priorizada de tabelas críticas para o MVP.

---

## Bloco 3 — Autenticação e segurança

Audite a implementação de autenticação e segurança contra a Spec Segurança & LGPD v1.0.

**3.1 Autenticação**
- [ ] Login e-mail/senha com validação de força (mín. 8 chars, 1 maiúscula, 1 número, 1 especial)
- [ ] Google OAuth configurado no Supabase Auth
- [ ] Sign in with Apple configurado — **obrigatório para iOS App Store se houver outro OAuth**
- [ ] Magic link (passwordless) implementado
- [ ] OTP de 6 dígitos para verificação de e-mail e telefone (validade 10 min)
- [ ] MFA disponível: TOTP (Google Authenticator) ou SMS OTP
- [ ] MFA obrigatório para admins, avaliadores e contas com GMV > R$ 20k/mês
- [ ] Bloqueio após 5 tentativas incorretas + desbloqueio por e-mail
- [ ] Detecção de login em novo dispositivo ou localização incomum

**3.2 Tokens e sessões**
- [ ] JWT com expiração curta (15 min configurado no Supabase)
- [ ] Refresh token rotativo habilitado (invalidado a cada uso)
- [ ] Logout automático por inatividade: 30 dias web / 7 dias mobile
- [ ] No mobile: tokens armazenados no Keychain (iOS) / EncryptedSharedPreferences (Android) — nunca em AsyncStorage não criptografado

**3.3 Segurança da API**
- [ ] Rate limiting configurado (via Cloudflare ou middleware):
  - Auth/login: máx. 10 req/min por IP
  - OTP: máx. 5 tentativas por token
  - API geral autenticada: máx. 300 req/min por usuário
  - API pública (catálogo): máx. 100 req/min por IP
  - Upload: máx. 20 req/hora por usuário
- [ ] Headers de segurança: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`
- [ ] CORS restrito a `giroativo.com.br` e `localhost` — sem wildcard em produção
- [ ] Nenhuma chave de API hardcoded no código ou exposta no client-side
- [ ] Validação HMAC-SHA256 em todos os webhooks (Pagar.me, DocuSign)
- [ ] Cálculo de valores de pedido exclusivamente no backend — client nunca envia valor

**3.4 RLS — Supabase**

Verifique se as políticas RLS existem e estão corretas para cada perfil:

| Tabela | Comprador | Vendedor | Avaliador | Admin |
|---|---|---|---|---|
| produtos | lê publicados | CRUD próprios | lê designados | tudo |
| pedidos | lê próprios | lê recebidos | — | tudo |
| mensagens | lê conversas próprias | lê conversas próprias | — | tudo |
| laudos | lê solicitados | lê vinculados | CRUD designados | tudo |
| bypass_alerts | — | — | — | tudo |
| dados_financeiros | próprios | próprios | — | + auditoria |

Para cada item: `✅ feito` | `⚠️ parcial` | `❌ faltando` — com observação.
Destaque os bloqueadores críticos para aprovação nas lojas e para conformidade LGPD.

---

## Bloco 4 — Telas e componentes de UI

Audite o estado das telas contra o design system do PRD v3.0 e os requisitos funcionais (seção 7).

**4.1 Design system**
- [ ] Tokens de cor implementados (CSS variables ou Tailwind config):
  - `--brand-green: #0F766E` (verde principal — CTAs, destaques)
  - `--brand-dark: #2D3748` (grafite — textos)
  - `--brand-green-light: #2DD4BF` (hover, accents)
  - `--brand-green-bg: #F0FDFA` (fundos sutis)
  - `--text-primary: #1E293B` | `--text-secondary: #475569` | `--text-muted: #94A3B8`
- [ ] Fontes carregadas: **Plus Jakarta Sans** (display/hero, 700/800) + **DM Sans** (corpo/UI, 400/500)
- [ ] Logo GiroAtivo integrada: SVG com "Giro" bold verde + "Ativo" light grafite + linha separadora verde
- [ ] Componentes base criados: Button, Input, Select, Card, Badge, Avatar, Modal, Toast
- [ ] Modo responsivo: mobile-first, breakpoints corretos

**4.2 Telas do fluxo MVP**

| Tela | Existe? | Funcional? | Design system? | Responsivo? |
|---|---|---|---|---|
| Landing page pública | | | | |
| Cadastro comprador (PF/PJ) | | | | |
| Cadastro vendedor (PJ + CNPJ) | | | | |
| Login (e-mail / Google / Apple) | | | | |
| Home autenticada — comprador | | | | |
| Busca e listagem de produtos | | | | |
| Página de produto (detalhes, fotos, laudo) | | | | |
| Dashboard do vendedor | | | | |
| Publicação de produto (formulário) | | | | |
| Chat interno comprador ↔ vendedor | | | | |
| Fluxo de compra e checkout (escrow) | | | | |
| Agendamento de visita técnica | | | | |
| Solicitação de laudo | | | | |
| Configurações e perfil | | | | |
| Portal do titular LGPD (/privacidade/meus-dados) | | | | |

**4.3 Telas específicas do App do Avaliador (mobile)**
- [ ] Login do avaliador com MFA
- [ ] Lista de ordens de laudo atribuídas
- [ ] Execução do laudo: checklist guiado por categoria
- [ ] Captura de fotos com ângulos obrigatórios
- [ ] Check-in GPS georreferenciado
- [ ] Assinatura digital e emissão do PDF

Identifique gaps críticos para o MVP e sugira ordem de implementação por impacto.

---

## Bloco 5 — Módulos de IA

Audite o estado de implementação dos 10 módulos de IA (PRD v3.0, seção 5).

Para cada módulo, informe: `não iniciado` | `em desenvolvimento` | `funcional (dev)` | `em produção`.

**IA-001 — Precificação automática sugerida**
- Modelo ML (XGBoost/Gradient Boosting) ou stub funcional?
- Features implementadas: categoria, condição, localização, volume?
- Integrado ao formulário de publicação?
- Retorna faixa de preço em < 2s? (critério de aceite do MVP)

**IA-002 — Busca semântica**
- Elasticsearch configurado e conectado ao Supabase/backend?
- Geração de embeddings (OpenAI text-embedding-3-small) implementada?
- Busca vetorial kNN funcionando?
- Sinônimos técnicos industriais mapeados? (ex: "tubo de aço" = "pipe schedule 40" = "ASTM A53")
- Busca por NCM, norma técnica (NBR, ASTM, DIN)?

**IA-003 — Cadastro inteligente (OCR)**
- Integração com Google Cloud Vision ou Azure Computer Vision?
- Pipeline: upload de foto → OCR → extração de campos → preenchimento do formulário?
- Campos extraídos: fabricante, modelo, nº série, capacidade, norma, NCM?

**IA-004 — Laudo assistido por visão computacional**
- App do Avaliador: roteiro de fotos guiado por categoria?
- Análise de foto em tempo real: corrosão, oxidação, deformações, desgaste?
- Preenchimento automático do checklist?
- Geração do texto do laudo via LLM (Claude ou GPT-4o)?

**IA-005 — Motor de recomendação**
- Filtragem colaborativa implementada?
- Contexto de CNAE da empresa compradora usado?
- Notificações proativas de produtos relevantes?

**IA-006 — Matching vendedor-comprador**
- Score de adequação calculado ao publicar produto?
- Top compradores notificados automaticamente?
- Dashboard mostra quantos foram notificados?

**IA-007 — Score de risco de bypass e antifraude**
- Regex/NLP no chat para detectar compartilhamento de contato (telefone, e-mail, WhatsApp)?
- Mascaramento automático de dados de contato antes da transação formal?
- Score de risco por conversa calculado?
- Resposta por nível: alerta silencioso / aviso ao usuário / bloqueio + operações?

**IA-008 — Previsão de demanda**
- Série temporal (Prophet ou ARIMA) por categoria?
- Alertas de "melhor momento para vender"?
- Mapa de calor de demanda geográfica?

**IA-009 — Moderação automática de anúncios**
- Pipeline de aprovação: verde (imediato) / amarelo (4h) / vermelho (24h)?
- Detecção de imagens genéricas (hash comparison)?
- Detecção de preços fora da curva (> 5 desvios-padrão)?

**IA-010 — Assistente virtual (LLM)**
- Claude API ou OpenAI integrada no chat?
- RAG configurado sobre catálogo de produtos, FAQ e políticas?
- Escalonamento automático para humano com contexto?

Priorize pelos critérios de aceite do MVP (seção 17 do PRD) e pelo roadmap da Fase 1.

---

## Bloco 6 — LGPD e conformidade com lojas de app

Audite a conformidade contra a Spec Segurança & LGPD v1.0 e os requisitos das lojas.

**6.1 Documentos legais obrigatórios**
- [ ] Política de Privacidade publicada em URL permanente e pública (`/privacidade`)
  - **Rejeição automática** na App Store e Google Play sem este item
- [ ] Termos de Uso com cláusula de não-circumvenção anti-bypass destacada (`/termos`)
- [ ] Política de Cookies com banner granular na versão web
- [ ] Contrato de Prestação de Serviços — Laudos (`/contrato-laudos`)
- [ ] Política de Cancelamento e Reembolso
- [ ] Política de Moderação e Banimento

**6.2 Implementação técnica LGPD**
- [ ] Tabela `consent_records` criada e populada (campos: user_id, purpose, granted, timestamp, terms_version, ip, channel)
- [ ] Tabela `tos_acceptances` criada (campos: user_id, version, accepted_at, ip)
- [ ] Todos os checkboxes de consentimento desmarcados por padrão (opt-in, nunca opt-out)
- [ ] Portal do titular funcional:
  - Exportar todos os dados em JSON e PDF
  - Excluir conta (remove dados não-obrigatórios em até 15 dias)
  - Revogar consentimentos individualmente
  - Visualizar com quem os dados são compartilhados
- [ ] E-mail do DPO publicado: `privacidade@giroativo.com.br`
- [ ] Link de exclusão de conta em Configurações > Privacidade (obrigatório Apple + Google)
- [ ] Logs de acesso retidos por mínimo 6 meses (Marco Civil da Internet, art. 15)
- [ ] Histórico de transações retido por 10 anos (Código Civil)
- [ ] Laudos técnicos retidos por 5 anos (valor probatório)

**6.3 Apple App Store — itens críticos**
- [ ] Privacy Nutrition Label preenchida no App Store Connect
- [ ] Privacy Manifest (`PrivacyInfo.xcprivacy`) incluído no projeto Xcode
- [ ] Sign in with Apple implementado (obrigatório pois há Google OAuth — Guideline 4.8)
- [ ] Permissões solicitadas de forma contextual, nunca no launch do app
- [ ] `NSUsageDescription` declarada para cada permissão usada no `Info.plist`
- [ ] Classificação etária 17+ (conteúdo financeiro/comercial)
- [ ] Conta de teste criada para o processo de revisão da Apple

**6.4 Google Play Store — itens críticos**
- [ ] Data Safety Section preenchida no Google Play Console
- [ ] `targetSdkVersion >= 34` (Android 14) no `build.gradle`
- [ ] Prominent Disclosure implementado antes de solicitar permissões sensíveis (câmera, localização, microfone)
- [ ] ProGuard/R8 habilitado em builds de produção
- [ ] App Bundle (`.aab`) em vez de APK
- [ ] App Signing by Google Play configurado
- [ ] `READ_CONTACTS` e `ACCESS_BACKGROUND_LOCATION` **não declarados** (violação de política)

**6.5 DPO e governança**
- [ ] DPO designado (interno ou empresa terceirizada especializada)?
- [ ] RIPD (Relatório de Impacto à Proteção de Dados) elaborado?
- [ ] Plano de resposta a incidentes documentado e testado?
- [ ] Treinamento LGPD para toda a equipe com acesso a dados pessoais?

Para cada item: `✅ feito` | `⚠️ parcial` | `❌ faltando`.
Classifique os pendentes em: **bloqueador de loja** | **risco de multa LGPD** | **melhoria**.

---

## Bloco 7 — Integrações externas

Verifique quais integrações externas estão configuradas e funcionando.

| Integração | Finalidade | Status | Observação |
|---|---|---|---|
| Supabase | BaaS principal — banco, auth, storage, realtime | | |
| Pagar.me | Gateway de pagamento, escrow, split, PIX | | |
| OpenAI API | Embeddings, GPT-4o Vision, assistente | | |
| Claude API (Anthropic) | Assistente virtual, geração texto do laudo | | |
| Google Cloud Vision | OCR industrial (IA-003) | | |
| Firebase FCM | Push notifications iOS e Android | | |
| Twilio / Zenvia | SMS e WhatsApp (OTP e notificações) | | |
| DocuSign | Assinatura digital dos laudos | | |
| Google Maps API | Geolocalização, rota para visita, check-in GPS | | |
| Receita Federal | Validação de CNPJ em tempo real | | |
| ViaCEP | Autopreenchimento de endereços por CEP | | |
| Correios / Frenet | Cálculo de frete por CEP | | |
| Cloudflare | DDoS, WAF, rate limiting, SSL | | |
| Elasticsearch | Busca semântica vetorial (IA-002) | | |
| AWS SageMaker | Modelos de ML proprietários | | |
| Sentry | Monitoramento de erros em tempo real | | |
| Datadog | APM, logs, alertas de infraestrutura | | |

Para cada integração: `configurada` | `parcial (credenciais sem implementação)` | `não iniciada`.
Identifique as dependências bloqueantes para o MVP.

---

## Bloco 8 — Relatório executivo e plano de ação

Com base em tudo auditado nos blocos anteriores, gere um relatório executivo completo:

**8.1 Situação atual**
- Percentual estimado de conclusão do MVP (Fase 1)
- O que está funcionando bem e pode ser aproveitado
- Principais pontos fortes do que foi desenvolvido
- Principais riscos e bloqueadores identificados

**8.2 Gaps críticos por categoria**

Organize os gaps em três níveis:
1. **Bloqueadores de go-live** — impede o lançamento se não resolvido
2. **Bloqueadores de loja** — causa rejeição automática na App Store ou Google Play
3. **Risco regulatório** — pode gerar multa LGPD ou ação da ANPD

**8.3 Plano de ação — próximas 4 semanas**

```
Semana 1 — Fundação (o que desbloqueia todo o resto):
- ...

Semana 2 — Core de produto (fluxo principal funcional):
- ...

Semana 3 — Conformidade e segurança (preparar para submissão):
- ...

Semana 4 — Qualidade e go-live (estabilizar para lançamento):
- ...
```

**8.4 Backlog priorizado**

Liste todas as tarefas identificadas na auditoria no formato:

```
[PRIORIDADE] Descrição da tarefa
Módulo PRD: seção X.X
Esforço: P (< 4h) | M (1–3 dias) | G (1–2 semanas)
Depende de: [tarefa anterior se houver]
```

Prioridades: `CRÍTICO` | `ALTO` | `MÉDIO` | `BAIXO`

**8.5 Marcos sugeridos**

Com base no estado atual e no plano de 4 semanas, estime:
- **Alpha interno** (time testa o fluxo completo de ponta a ponta): quando?
- **Beta fechado** (10–20 usuários reais convidados): quando?
- **Submissão para lojas** (App Store + Google Play): quando?
- **Go-live MVP** (lançamento público): quando?

**8.6 Recomendações técnicas**

Além dos gaps identificados, liste até 5 recomendações técnicas de melhoria de arquitetura, performance ou manutenibilidade que valem a pena adotar agora, antes de escalar.

---

*GiroAtivo — Prompt de Auditoria v1.0 | Baseado no PRD v3.0 e Spec Segurança & LGPD v1.0 | CONFIDENCIAL — Uso Interno*
