# GiroAtivo — Marketplace B2B de Materiais Industriais

Plataforma para compra e venda de materiais industriais excedentes, equipamentos de obra e estoques obsoletos de almoxarifados.

## Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui
- **Backend/BaaS**: Supabase (PostgreSQL + Auth + Storage + Realtime + RLS)
- **Pagamentos**: Pagar.me (escrow, PIX, cartão)
- **IA**: OpenAI API + Claude API (Anthropic)

## Pré-requisitos

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- Conta no [Supabase](https://app.supabase.com) (ou Docker para ambiente local)

## Setup local

### 1. Clone e instale dependências

```bash
git clone https://github.com/seu-org/giro-ativo.git
cd giro-ativo
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
# Preencha as variáveis obrigatórias (mínimo: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### 3. Banco de dados

**Opção A — Projeto Supabase remoto (recomendado para iniciar)**

1. Crie um projeto em [app.supabase.com](https://app.supabase.com)
2. Copie a URL e a anon key para `.env.local`
3. Execute as migrations no SQL Editor do Supabase:
   ```bash
   # Abra cada arquivo em ordem e execute no SQL Editor
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_profiles.sql
   # ... até 011_soft_delete.sql
   ```
4. Execute o seed:
   ```sql
   -- Cole o conteúdo de supabase/seed.sql no SQL Editor
   ```

**Opção B — Supabase local com Docker**

```bash
supabase start                          # Inicia o stack local (PostgreSQL + Studio)
supabase db push                        # Aplica todas as migrations
supabase db seed                        # Executa o seed.sql
supabase gen types typescript --local > types/supabase.ts  # Regenera tipos
```

### 4. Storage (buckets)

Crie o bucket `product-images` no Supabase Storage com as policies:
- Leitura pública para todos os objetos
- Upload restrito ao usuário autenticado (verificado via RLS)

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
# Acesse http://localhost:3000
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Next.js) |
| `npm run build` | Build de produção |
| `npm run lint` | Lint com ESLint |
| `supabase start` | Inicia stack Supabase local |
| `supabase db push` | Aplica migrations pendentes |
| `supabase gen types typescript --local > types/supabase.ts` | Regenera tipos TypeScript |

## Estrutura de pastas

```
giro-ativo/
├── app/                    # App Router (Next.js)
│   ├── auth/callback/      # Callback OAuth (Google, Apple)
│   ├── cadastro/           # Cadastro de conta
│   ├── chat/               # Chat interno (lista + janela)
│   ├── dashboard/          # Dashboard do usuário
│   ├── login/              # Login
│   ├── meus-produtos/      # Gestão de produtos do vendedor
│   ├── onboarding/         # Cadastro da empresa (CNPJ)
│   ├── produtos/           # Marketplace (listagem + detalhe)
│   └── visitas/            # Visitas técnicas
├── components/
│   ├── layout/             # Header, Footer
│   ├── produtos/           # ProductCard, Filters, etc.
│   ├── ui/                 # Componentes base (shadcn/ui)
│   └── visitas/            # VisitActions, VisitRequestButton
├── lib/supabase/           # Clientes Supabase (server + client)
├── supabase/
│   ├── migrations/         # Migrations SQL versionadas (001–011)
│   ├── config.toml         # Configuração Supabase CLI
│   └── seed.sql            # Dados de desenvolvimento
└── types/
    └── supabase.ts         # Tipos TypeScript gerados do schema
```

## Roles de usuário

| Role | Permissões |
|---|---|
| `comprador` | Busca produtos, faz propostas, solicita visitas e laudos |
| `vendedor` | CRUD de produtos, aceita propostas e visitas |
| `avaliador` | Executa laudos no app mobile, faz check-in GPS |
| `moderador` | Modera anúncios e resolve alertas de bypass |
| `admin` | Acesso total + gestão de planos e usuários |

## Variáveis de ambiente obrigatórias

Para o MVP web funcionar localmente, você precisa no mínimo:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Consulte `.env.example` para a lista completa com todas as integrações.

## Conformidade

- **LGPD**: consentimentos granulares em `consent_records`, portal do titular em `/privacidade/meus-dados`
- **Pagamentos**: escrow via Pagar.me (PCI-DSS) — valor nunca calculado no client
- **Segurança**: RLS em todas as tabelas, headers HTTP de segurança, CORS restrito
