import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Plus, Package, Eye, Edit, PauseCircle, PlayCircle } from 'lucide-react'
import ProductStatusToggle from '@/components/produtos/ProductStatusToggle'

export const metadata = { title: 'Meus Produtos' }

export default async function MeusProdutosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/onboarding')

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, title, price, unit, condition, status, views, created_at,
      product_images ( url, is_cover )
    `)
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const statusLabel: Record<string, string> = { active: 'Ativo', paused: 'Pausado', sold: 'Vendido' }
  const statusColor: Record<string, string> = {
    active: 'text-green-600 bg-green-500/10 border-green-500/20',
    paused: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    sold: 'text-slate-500 bg-muted border-border',
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Meus Produtos</h1>
            <p className="text-sm text-muted-foreground">{products?.length ?? 0} produto(s) cadastrado(s)</p>
          </div>
          <Link href="/meus-produtos/novo">
            <Button className="gradient-brand text-white shadow-md shadow-primary/20 hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Publicar novo
            </Button>
          </Link>
        </div>

        {!products?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 rounded-2xl border border-dashed border-border">
            <Package className="w-16 h-16 text-muted-foreground/30" />
            <h3 className="font-semibold">Nenhum produto publicado</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Publique materiais excedentes e comece a receber propostas hoje!
            </p>
            <Link href="/meus-produtos/novo">
              <Button className="gradient-brand text-white">Publicar primeiro produto</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => {
              const cover = (p.product_images as { url: string; is_cover: boolean }[])
                ?.find((img) => img.is_cover)?.url ??
                (p.product_images as { url: string }[])?.[0]?.url ?? null

              return (
                <div
                  key={p.id}
                  className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {cover ? (
                      <img src={cover} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{p.title}</h3>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-md border font-medium ${statusColor[p.status]}`}>
                        {statusLabel[p.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {p.price != null
                        ? p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + ' / ' + p.unit
                        : 'Preço a consultar'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.views} visitas</span>
                      <span>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={`/produtos/${p.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/meus-produtos/${p.id}/editar`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <ProductStatusToggle
                      productId={p.id}
                      currentStatus={p.status as 'active' | 'paused'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
