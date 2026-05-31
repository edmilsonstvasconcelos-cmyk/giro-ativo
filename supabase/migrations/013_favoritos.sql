-- Migration 013: tabela de favoritos (produtos salvos pelo comprador)

create table if not exists favoritos (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  produto_id  uuid        not null references products(id)   on delete cascade,
  created_at  timestamptz not null default now(),
  constraint  favoritos_unique unique(user_id, produto_id)
);

alter table favoritos enable row level security;

-- Usuário gerencia apenas os próprios favoritos
create policy "favoritos_self"
  on favoritos for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Índice de busca por usuário (listagem de favoritos)
create index if not exists idx_favoritos_user_id on favoritos(user_id);
-- Índice de busca por produto (verificar se já está salvo)
create index if not exists idx_favoritos_produto_id on favoritos(produto_id);
