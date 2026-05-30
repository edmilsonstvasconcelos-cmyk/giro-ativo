import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { ArrowLeft, Package, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Moderação — Admin Giro Ativo' }

export default async function ModeracaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  if (!profile || !['moderador', 'admin'].includes(profile.role)) redirect('/login')

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, title, condicao, location, created_at, moderacao_status,
      product_images ( url, is_cover ),
      companies ( razao_social, nome_fantasia )
    `)
    .in('moderacao_status', ['pendente', 'em_revisao'])
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(20)

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Moderação de Produtos</h1>
            <p className="text-sm text-muted-foreground">{products?.length ?? 0} produto(s) aguardando revisão</p>
          </div>
        </div>

        {!products?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
            <CheckCircle className="w-16 h-16 text-green-500/30" />
            <h3 className="font-semibold text-lg">Nenhum produto pendente</h3>
            <p className="text-sm text-muted-foreground">Todos os anúncios foram revisados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => {
              const images = p.product_images as { url: string; is_cover: boolean }[]
              const cover = images?.find((i) => i.is_cover)?.url ?? images?.[0]?.url
              const company = p.companies as { razao_social: string; nome_fantasia: string | null } | null
              const companyName = company?.nome_fantasia ?? company?.razao_social ?? 'Empresa'

              return (
                <div key={p.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                  <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {cover
                      ? <img src={cover} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground/30" /></div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{companyName} · {p.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" /> {p.moderacao_status === 'em_revisao' ? 'Em revisão' : 'Pendente'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/produtos/${p.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        Ver
                      </Button>
                    </Link>
                    {/* Ações de moderação — implementar Server Actions no Sprint 9 */}
                    <Button size="sm" className="h-8 bg-green-600 text-white hover:bg-green-700 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs">
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
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
