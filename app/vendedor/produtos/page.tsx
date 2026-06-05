import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { condicaoLabel, condicaoBadgeColor } from '@/lib/utils/produto'
import ProductStatusToggle from '@/components/produtos/ProductStatusToggle'
import { Plus, Package, Eye, Edit, Search } from 'lucide-react'

export const metadata = { title: 'Meus Produtos' }

const moderacaoConfig = {
  aprovado:    { label: 'Aprovado',   color: 'text-green-600 bg-green-500/10 border-green-500/20' },
  pendente:    { label: 'Pendente',   color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  em_revisao:  { label: 'Em revisão', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20'   },
  reprovado:   { label: 'Reprovado',  color: 'text-red-600 bg-red-500/10 border-red-500/20'      },
}

interface SearchParams { status?: string; condicao?: string }

export default async function VendedorProdutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  let query = supabase
    .from('products')
    .select('id, title, price, unit, condicao, status, moderacao_status, views, created_at, category_id, product_images(url, is_cover), categories(nome)')
    .eq('company_id', company.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status as 'active' | 'paused' | 'sold')
  if (params.condicao) query = query.eq('condicao', params.condicao as import('@/types/supabase').CondicaoProduto)

  const { data: products } = await query

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Meus Produtos</h1>
          <p className="text-sm text-muted-foreground">{products?.length ?? 0} produto(s)</p>
        </div>
        <Link href="/vendedor/produtos/novo">
          <Button className="gradient-brand text-white hover:opacity-90 shadow-md shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Publicar novo
          </Button>
        </Link>
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Todos', href: '/vendedor/produtos' },
          { label: 'Ativos', href: '/vendedor/produtos?status=active' },
          { label: 'Pausados', href: '/vendedor/produtos?status=paused' },
          { label: 'Ótimo', href: '/vendedor/produtos?condicao=otimo' },
          { label: 'Bom', href: '/vendedor/produtos?condicao=bom' },
          { label: 'Regular', href: '/vendedor/produtos?condicao=regular' },
        ].map(({ label, href }) => (
          <Link key={href} href={href}>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              (params.status === href.split('status=')[1] || params.condicao === href.split('condicao=')[1] ||
               (!params.status && !params.condicao && label === 'Todos'))
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}>
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* Lista */}
      {!products?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <Package className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhum produto encontrado</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {params.status || params.condicao
              ? 'Tente remover os filtros.'
              : 'Publique seu primeiro produto e comece a receber propostas.'}
          </p>
          {!params.status && !params.condicao && (
            <Link href="/vendedor/produtos/novo">
              <Button className="gradient-brand text-white hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> Publicar produto
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const images = p.product_images as { url: string; is_cover: boolean }[]
            const cover  = images?.find((i) => i.is_cover)?.url ?? images?.[0]?.url
            const cat    = p.categories as { nome: string } | null
            const mod    = moderacaoConfig[p.moderacao_status as keyof typeof moderacaoConfig] ?? moderacaoConfig.pendente

            return (
              <div key={p.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/10 transition-colors">
                {/* Thumbnail */}
                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {cover
                    ? <img src={cover} alt={p.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground/30" /></div>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="font-semibold text-sm line-clamp-1 flex-1">{p.title}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${mod.color}`}>
                        {mod.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${p.status === 'active' ? 'text-green-600 bg-green-500/10' : 'text-amber-600 bg-amber-500/10'}`}>
                        {p.status === 'active' ? 'Ativo' : p.status === 'paused' ? 'Pausado' : 'Vendido'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    {cat && <span>{cat.nome}</span>}
                    <span className={`px-1.5 py-0.5 rounded border ${condicaoBadgeColor[p.condicao as keyof typeof condicaoBadgeColor] ?? ''}`}>
                      {condicaoLabel[p.condicao as keyof typeof condicaoLabel]}
                    </span>
                    {p.price && <span className="font-medium text-foreground">
                      {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {p.unit}
                    </span>}
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views} views</span>
                    <span>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/produtos/${p.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver público">
                      <Search className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link href={`/vendedor/produtos/${p.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  {p.status !== 'sold' && (
                    <ProductStatusToggle
                      productId={p.id}
                      currentStatus={p.status as 'active' | 'paused'}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
