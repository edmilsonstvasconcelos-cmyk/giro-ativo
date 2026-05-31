import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/produtos/ProductCard'
import { Heart, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Favoritos' }

export default async function CompradorFavoritosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: favoritos } = await supabase
    .from('favoritos')
    .select(`
      id, created_at,
      produto:produto_id (
        id, title, price, unit, condicao, location, views, tem_laudo,
        categories ( nome ),
        product_images ( url, is_cover ),
        companies ( razao_social, nome_fantasia )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const ativos = (favoritos ?? []).filter((f) => {
    const p = f.produto as any
    return p && !p.deleted_at
  })

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold">Favoritos</h1>
        <p className="text-sm text-muted-foreground">{ativos.length} produto{ativos.length !== 1 ? 's' : ''} salvo{ativos.length !== 1 ? 's' : ''}</p>
      </div>

      {!ativos.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <Heart className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhum produto favorito</h3>
          <p className="text-sm text-muted-foreground">
            Salve produtos clicando no coração na página de cada produto.
          </p>
          <Link href="/comprador/busca" className="text-sm text-primary hover:underline flex items-center gap-1">
            Explorar produtos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ativos.map((fav) => {
            const p          = fav.produto as any
            const cover      = p.product_images?.find((i: any) => i.is_cover)?.url ?? p.product_images?.[0]?.url ?? null
            const company    = p.companies as any
            const cat        = p.categories as any
            const companyName= company?.nome_fantasia ?? company?.razao_social ?? 'Empresa'
            return (
              <ProductCard
                key={fav.id}
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
        </div>
      )}
    </div>
  )
}
