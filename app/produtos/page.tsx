import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/produtos/ProductCard'
import ProductFilters from '@/components/produtos/ProductFilters'
import { Package } from 'lucide-react'

interface SearchParams {
  q?: string
  categoria?: string
  estado?: string
  condicao?: string
  preco_min?: string
  preco_max?: string
  page?: string
}

export const metadata = {
  title: 'Marketplace de Materiais Industriais',
  description: 'Encontre tubulações, válvulas, motores e muito mais. Marketplace B2B de materiais industriais excedentes.',
}

async function ProductsGrid({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(`
      id, title, price, unit, condition, location, views, status, created_at,
      categories ( nome ),
      product_images ( url, is_cover ),
      companies ( razao_social, nome_fantasia )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(24)

  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }

  if (searchParams.estado) {
    query = query.eq('location', `${searchParams.estado}`)
  }

  if (searchParams.condicao) {
    query = query.eq('condicao', searchParams.condicao)
  }

  if (searchParams.preco_min) {
    query = query.gte('price', Number(searchParams.preco_min))
  }

  if (searchParams.preco_max) {
    query = query.lte('price', Number(searchParams.preco_max))
  }

  const { data: products, error } = await query

  if (error || !products?.length) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center gap-4">
        <Package className="w-16 h-16 text-muted-foreground/30" />
        <h3 className="text-lg font-semibold">Nenhum produto encontrado</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Tente outros filtros ou seja o primeiro a publicar nessa categoria!
        </p>
      </div>
    )
  }

  return (
    <>
      {products.map((p) => {
        const cover = (p.product_images as unknown as { url: string; is_cover: boolean }[])
          ?.find((img) => img.is_cover)?.url ??
          (p.product_images as unknown as { url: string }[])?.[0]?.url ?? null

        const company = (p.companies as unknown) as { razao_social: string; nome_fantasia: string | null } | null
        const companyName = company?.nome_fantasia ?? company?.razao_social ?? 'Empresa'
        const cat = (p.categories as unknown) as { nome: string } | null

        return (
          <ProductCard
            key={p.id}
            id={p.id}
            title={p.title}
            price={p.price}
            unit={p.unit ?? 'unidade'}
            condicao={p.condicao ?? 'bom'}
            location={p.location}
            category={cat?.nome ?? null}
            views={p.views ?? 0}
            cover={cover}
            companyName={companyName}
          />
        )
      })}
    </>
  )
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Marketplace Industrial</h1>
          <p className="text-muted-foreground text-sm">
            Materiais industriais excedentes disponíveis para compra imediata
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <aside className="lg:w-64 shrink-0">
            <ProductFilters />
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            <Suspense fallback={
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/30 aspect-[4/5] animate-pulse" />
                ))}
              </div>
            }>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <ProductsGrid searchParams={params} />
              </div>
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
