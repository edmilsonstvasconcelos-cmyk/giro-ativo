import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
  Search, MessageSquare, Calendar, Package,
  ArrowRight, ShieldCheck, Zap,
} from 'lucide-react'

export const metadata = { title: 'Área do Comprador — Giro Ativo' }

export default async function CompradorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'comprador') redirect('/login')

  // Comprador pode ter ou não uma empresa (PF não tem)
  const { data: company } = await supabase
    .from('companies')
    .select('id, razao_social, nome_fantasia')
    .eq('user_id', user.id)
    .single()

  const [
    { count: activeConversations },
    { count: pendingVisits },
    { data: recentConversations },
  ] = await Promise.all([
    supabase.from('conversations').select('*', { count: 'exact', head: true })
      .eq('buyer_id', company?.id ?? '00000000-0000-0000-0000-000000000000'),
    supabase.from('visit_requests').select('*', { count: 'exact', head: true })
      .eq('buyer_id', company?.id ?? '00000000-0000-0000-0000-000000000000')
      .eq('status', 'pending'),
    company
      ? supabase.from('conversations')
          .select(`
            id, created_at,
            products ( id, title ),
            seller:companies!conversations_seller_id_fkey ( razao_social, nome_fantasia ),
            messages ( content, created_at, read, sender_id )
          `)
          .eq('buyer_id', company.id)
          .order('created_at', { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
  ])

  const displayName = profile.nome ?? (company?.nome_fantasia ?? company?.razao_social) ?? 'Comprador'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Olá, <span className="text-gradient">{displayName}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Encontre materiais industriais excedentes com segurança e agilidade
          </p>
        </div>

        {/* Search CTA */}
        <Link href="/produtos">
          <div className="mb-8 p-5 rounded-2xl gradient-hero border border-white/10 flex items-center gap-4 hover:border-primary/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">Buscar no marketplace</p>
              <p className="text-sm text-slate-400">
                Tubulações, válvulas, motores, instrumentação e muito mais
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-teal-400 shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversas recentes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Conversas recentes</h2>
              {company && (
                <Link href="/chat" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {!company ? (
              <div className="p-6 rounded-xl border border-dashed border-border text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1 font-medium">
                  Chat disponível para empresas
                </p>
                <p className="text-xs text-muted-foreground">
                  Como comprador PF, entre em contato diretamente pelos produtos.
                </p>
              </div>
            ) : !recentConversations?.length ? (
              <div className="p-6 rounded-xl border border-dashed border-border text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma conversa iniciada</p>
                <Link href="/produtos" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Encontre um produto e inicie uma negociação →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentConversations.map((conv) => {
                  const seller = (conv.seller as unknown) as { razao_social: string; nome_fantasia: string | null } | null
                  const product = (conv.products as unknown) as { id: string; title: string } | null
                  const messages = (conv.messages as unknown) as { content: string; created_at: string; read: boolean; sender_id: string }[]
                  const lastMsg = messages?.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
                  const unread = messages?.filter((m) => !m.read && m.sender_id !== company.id).length ?? 0
                  const sellerName = seller?.nome_fantasia ?? seller?.razao_social ?? 'Empresa'

                  return (
                    <Link key={conv.id} href={`/chat/${conv.id}`}
                      className="flex gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 hover:bg-primary/5 transition-all">
                      <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {sellerName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="font-semibold text-sm truncate">{sellerName}</span>
                          {lastMsg && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(lastMsg.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        {product && <p className="text-xs text-primary truncate">{product.title}</p>}
                        {lastMsg && <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg.content}</p>}
                      </div>
                      {unread > 0 && (
                        <div className="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                          {unread}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Ações e stats */}
          <div className="space-y-4">
            <h2 className="font-semibold">Minhas atividades</h2>

            {company && (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/chat">
                  <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all text-center">
                    <MessageSquare className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <p className="text-xl font-bold">{activeConversations ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Conversas</p>
                  </div>
                </Link>
                <Link href="/visitas">
                  <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all text-center">
                    <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                    <p className="text-xl font-bold">{pendingVisits ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Visitas pend.</p>
                  </div>
                </Link>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Link href="/produtos">
                <Button className="w-full justify-start gradient-brand text-white hover:opacity-90 shadow-md shadow-primary/20">
                  <Search className="w-4 h-4 mr-2" /> Buscar produtos
                </Button>
              </Link>
              {company && (
                <>
                  <Link href="/chat">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" /> Minhas conversas
                    </Button>
                  </Link>
                  <Link href="/visitas">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" /> Visitas técnicas
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Compra segura</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Pagamento com escrow</div>
                <div className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Laudo técnico disponível</div>
                <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-teal-500 shrink-0" /> Visita técnica presencial</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
