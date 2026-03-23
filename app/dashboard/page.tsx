import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { Package, MessageSquare, Calendar, Eye, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, razao_social, nome_fantasia')
    .eq('user_id', user.id)
    .single()
  if (!company) redirect('/onboarding')

  // Fetch stats in parallel
  const [
    { count: activeProducts },
    { data: viewsData },
    { count: activeConversations },
    { count: pendingVisits },
    { data: recentProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('status', 'active'),
    supabase.from('products').select('views').eq('company_id', company.id),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).or(`buyer_id.eq.${company.id},seller_id.eq.${company.id}`),
    supabase.from('visit_requests').select('*', { count: 'exact', head: true }).or(`buyer_id.eq.${company.id},seller_id.eq.${company.id}`).eq('status', 'pending'),
    supabase.from('products').select('id, title, views, status, created_at, product_images(url, is_cover)').eq('company_id', company.id).order('created_at', { ascending: false }).limit(3),
  ])

  const displayName = company.nome_fantasia ?? company.razao_social
  const viewsSum = (viewsData as { views: number }[] | null)?.reduce((acc, p) => acc + (p.views ?? 0), 0) ?? 0

  const stats = [
    { label: 'Produtos ativos', value: activeProducts ?? 0, icon: Package, href: '/meus-produtos', color: 'text-primary' },
    { label: 'Visualizações', value: viewsSum, icon: Eye, href: '/meus-produtos', color: 'text-blue-500' },
    { label: 'Conversas', value: activeConversations ?? 0, icon: MessageSquare, href: '/chat', color: 'text-green-500' },
    { label: 'Visitas pendentes', value: pendingVisits ?? 0, icon: Calendar, href: '/visitas', color: 'text-purple-500' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Olá, <span className="text-gradient">{displayName}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Aqui está um resumo da sua atividade na plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, href, color }) => (
            <Link key={label} href={href}>
              <div className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </div>
                  <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent products */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Produtos recentes</h2>
              <Link href="/meus-produtos" className="text-sm text-primary hover:underline">Ver todos →</Link>
            </div>

            {!recentProducts?.length ? (
              <div className="p-6 rounded-xl border border-dashed border-border text-center">
                <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum produto ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProducts.map((p) => {
                  const cover = (p.product_images as { url: string; is_cover: boolean }[])
                    ?.find((i) => i.is_cover)?.url ??
                    (p.product_images as { url: string }[])?.[0]?.url
                  return (
                    <Link key={p.id} href={`/produtos/${p.id}`} className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/30" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" /> {p.views} visitas
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${p.status === 'active' ? 'text-green-600 bg-green-500/10' : 'text-amber-600 bg-amber-500/10'}`}>
                            {p.status === 'active' ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="font-semibold mb-4">Ações rápidas</h2>
            <div className="space-y-2">
              <Link href="/meus-produtos/novo">
                <Button className="w-full justify-start gradient-brand text-white hover:opacity-90 shadow-md shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" /> Publicar produto
                </Button>
              </Link>
              <Link href="/produtos">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" /> Ver marketplace
                </Button>
              </Link>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
