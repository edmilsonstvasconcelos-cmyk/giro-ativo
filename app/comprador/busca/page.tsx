import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/produtos/ProductCard'
import { Package, SlidersHorizontal } from 'lucide-react'

export const metadata = { title: 'Buscar Produtos — Giro Ativo' }

interface SearchParams {
  q?:           string
  categoria?:   string
  condicao?:    string
  preco_min?:   string
  preco_max?:   string
  estado?:      string
  com_laudo?:   string
  com_visita?:  string
  ordenacao?:   string
  page?:        string
}

const PER_PAGE = 20

const categorias = [
  { id: '1', nome: 'Tubulações e Conexões' },
  { id: '2', nome: 'Elétrica e Automação' },
  { id: '3', nome: 'Mecânica e Estruturas' },
  { id: '4', nome: 'Instrumentação' },
  { id: '5', nome: 'Válvulas e Atuadores' },
  { id: '6', nome: 'Motores e Bombas' },
  { id: '7', nome: 'EPIs e Segurança' },
  { id: '8', nome: 'Outros' },
]

const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

async function BuscaGrid({ sp }: { sp: SearchParams }) {
  const supabase = await createClient()
  const page     = Math.max(1, Number(sp.page ?? 1))
  const from     = (page - 1) * PER_PAGE
  const to       = from + PER_PAGE - 1

  let query = supabase
    .from('products')
    .select(`
      id, title, price, unit, condicao, location, views, created_at, tem_laudo,
      categories ( nome ),
      product_images ( url, is_cover ),
      companies ( razao_social, nome_fantasia )
    `, { count: 'exact' })
    .eq('status', 'active')
    .eq('moderacao_status', 'aprovado')
    .is('deleted_at', null)
    .range(from, to)

  if (sp.q)          query = query.or(`title.ilike.%${sp.q}%,description.ilike.%${sp.q}%,norma_tecnica.ilike.%${sp.q}%`)
  if (sp.categoria)  query = query.eq('category_id', Number(sp.categoria))
  if (sp.condicao)   query = query.eq('condicao', sp.condicao)
  if (sp.preco_min)  query = query.gte('price', Number(sp.preco_min))
  if (sp.preco_max)  query = query.lte('price', Number(sp.preco_max))
  if (sp.estado)     query = query.ilike('location', `%, ${sp.estado}%`)
  if (sp.com_laudo === '1')  query = query.eq('tem_laudo', true)
  if (sp.com_visita === '1') query = query.eq('visita_disponivel', true)

  switch (sp.ordenacao) {
    case 'preco_asc':  query = query.order('price', { ascending: true, nullsFirst: false }); break
    case 'preco_desc': query = query.order('price', { ascending: false, nullsFirst: false }); break
    default:           query = query.order('created_at', { ascending: false })
  }

  const { data: products, count } = await query

  if (!products?.length) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Package className="w-16 h-16 text-muted-foreground/30" />
        <h3 className="text-lg font-semibold">Nenhum produto encontrado</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Tente outros termos ou remova alguns filtros.
        </p>
      </div>
    )
  }

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  return (
    <>
      <p className="col-span-full text-sm text-muted-foreground mb-2">
        {count ?? 0} produto{(count ?? 0) !== 1 ? 's' : ''} encontrado{(count ?? 0) !== 1 ? 's' : ''}
        {sp.q ? ` para "${sp.q}"` : ''}
      </p>
      {products.map((p) => {
        const cover      = (p.product_images as any[])?.find((i) => i.is_cover)?.url ?? (p.product_images as any[])?.[0]?.url ?? null
        const company    = p.companies as any
        const cat        = p.categories as any
        const companyName= company?.nome_fantasia ?? company?.razao_social ?? 'Empresa'
        return (
          <ProductCard
            key={p.id}
            id={p.id}
            title={p.title}
            price={p.price}
            unit={p.unit ?? 'unidade'}
            condicao={(p.condicao ?? 'bom') as any}
            location={p.location}
            category={cat?.nome ?? null}
            views={p.views ?? 0}
            cover={cover}
            companyName={companyName}
            temLaudo={p.tem_laudo ?? false}
          />
        )
      })}
      {totalPages > 1 && (
        <div className="col-span-full flex justify-center gap-2 mt-4">
          {page > 1 && (
            <PaginationLink sp={sp} page={page - 1} label="← Anterior" />
          )}
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <PaginationLink sp={sp} page={page + 1} label="Próxima →" />
          )}
        </div>
      )}
    </>
  )
}

function PaginationLink({ sp, page, label }: { sp: SearchParams; page: number; label: string }) {
  const params = new URLSearchParams()
  Object.entries({ ...sp, page: String(page) }).forEach(([k, v]) => { if (v) params.set(k, v) })
  return (
    <Link href={`/comprador/busca?${params}`}
      className="px-4 py-2 text-sm border border-border rounded-lg hover:border-primary/30 transition-colors">
      {label}
    </Link>
  )
}

function FilterInput({ name, label, defaultValue, placeholder }: {
  name: string; label: string; defaultValue?: string; placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  )
}

export default async function BuscaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filtros */}
      <aside className="lg:w-56 shrink-0">
        <form method="GET" className="space-y-5 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Filtros</span>
          </div>

          {/* Busca por texto */}
          <FilterInput name="q" label="Busca" defaultValue={sp.q} placeholder="Título, NCM, norma…" />

          {/* Categoria */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Categoria</label>
            <select name="categoria" defaultValue={sp.categoria ?? ''}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm focus:outline-none">
              <option value="">Todas</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {/* Condição */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Condição</label>
            <select name="condicao" defaultValue={sp.condicao ?? ''}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm focus:outline-none">
              <option value="">Todas</option>
              <option value="otimo">Ótimo</option>
              <option value="bom">Bom</option>
              <option value="regular">Regular</option>
              <option value="inservivel">Inservível</option>
            </select>
          </div>

          {/* Faixa de preço */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Faixa de preço (R$)</label>
            <div className="flex gap-1">
              <input name="preco_min" type="number" placeholder="Mín" defaultValue={sp.preco_min}
                className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs focus:outline-none" />
              <input name="preco_max" type="number" placeholder="Máx" defaultValue={sp.preco_max}
                className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs focus:outline-none" />
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <select name="estado" defaultValue={sp.estado ?? ''}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm focus:outline-none">
              <option value="">Todos</option>
              {estados.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="com_laudo" value="1"
                defaultChecked={sp.com_laudo === '1'}
                className="h-4 w-4 rounded border-border" />
              Com laudo técnico
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="com_visita" value="1"
                defaultChecked={sp.com_visita === '1'}
                className="h-4 w-4 rounded border-border" />
              Com visita disponível
            </label>
          </div>

          {/* Ordenação */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
            <select name="ordenacao" defaultValue={sp.ordenacao ?? ''}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm focus:outline-none">
              <option value="">Mais recentes</option>
              <option value="preco_asc">Menor preço</option>
              <option value="preco_desc">Maior preço</option>
            </select>
          </div>

          <button type="submit"
            className="w-full h-9 rounded-lg gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Aplicar filtros
          </button>

          {Object.values(sp).some(Boolean) && (
            <Link href="/comprador/busca" className="block text-center text-xs text-muted-foreground hover:underline">
              Limpar filtros
            </Link>
          )}
        </form>
      </aside>

      {/* Grid de resultados */}
      <div className="flex-1 min-w-0">
        <Suspense fallback={
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 aspect-[4/5] animate-pulse" />
            ))}
          </div>
        }>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <BuscaGrid sp={sp} />
          </div>
        </Suspense>
      </div>
    </div>
  )
}
