import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ContactSellerButton from '@/components/produtos/ContactSellerButton'
import VisitRequestButton from '@/components/visitas/VisitRequestButton'
import { MapPin, Package, Eye, Building2, Calendar, Tag } from 'lucide-react'

const conditionLabel: Record<string, string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  usado: 'Usado',
}

const conditionColor: Record<string, string> = {
  novo: 'bg-green-500/10 text-green-600 border-green-500/20',
  seminovo: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  usado: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('title, description').eq('id', id).single()
  return {
    title: data?.title ?? 'Produto',
    description: data?.description ?? 'Produto disponível no Giro Ativo',
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      categories ( nome, slug ),
      product_images ( url, is_cover, ordem ),
      companies ( id, razao_social, nome_fantasia, cidade, estado, telefone )
    `)
    .eq('id', id)
    .single()

  if (!product) notFound()

  // Increment views
  await supabase.from('products').update({ views: (product.views ?? 0) + 1 }).eq('id', id)

  const images = (product.product_images as { url: string; is_cover: boolean; ordem: number }[])
    ?.sort((a, b) => (a.is_cover ? -1 : b.is_cover ? 1 : a.ordem - b.ordem)) ?? []
  const company = product.companies as {
    id: string; razao_social: string; nome_fantasia: string | null;
    cidade: string | null; estado: string | null; telefone: string | null;
  } | null
  const category = product.categories as { nome: string } | null

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border">
              {images[0] ? (
                <img src={images[0].url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1, 5).map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted border border-border">
                    <img src={img.url} alt={`${product.title} ${i + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {category && (
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                  <Tag className="w-3 h-3 inline mr-1" />{category.nome}
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${conditionColor[product.condition] ?? conditionColor.usado}`}>
                {conditionLabel[product.condition] ?? product.condition}
              </span>
            </div>

            <h1 className="text-2xl font-bold leading-snug">{product.title}</h1>

            {/* Price */}
            <div>
              {product.price != null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {product.unit}</span>
                </div>
              ) : (
                <span className="text-xl text-muted-foreground italic">Preço a consultar</span>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Quantidade disponível: <strong>{product.quantity} {product.unit}</strong>
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <h3 className="font-semibold text-sm mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {product.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {product.location}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4 text-primary" />
                {product.views + 1} visualizações
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                {new Date(product.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Seller card */}
            {company && (
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{company.nome_fantasia ?? company.razao_social}</p>
                    {company.cidade && (
                      <p className="text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {company.cidade}, {company.estado}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <ContactSellerButton productId={product.id} sellerId={company.id} />
                  <VisitRequestButton productId={product.id} sellerId={company.id} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
