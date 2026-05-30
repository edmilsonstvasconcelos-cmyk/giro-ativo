import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { condicaoLabel, condicaoBadgeColor } from '@/lib/utils/produto'
import {
  Package, MessageSquare, Calendar, Eye, Plus,
  TrendingUp, AlertCircle, Clock, ArrowRight,
} from 'lucide-react'

export const metadata = { title: 'Dashboard — Giro Ativo Vendedor' }

const ROLE_HOME: Record<string, string> = {
  vendedor: '/vendedor', comprador: '/comprador',
  avaliador: '/avaliador', moderador: '/admin/moderacao', admin: '/admin',
}

export default async function VendedorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role && ROLE_HOME[profile.role] && profile.role !== 'vendedor' && profile.role !== 'admin') {
    redirect(ROLE_HOME[profile.role])
  }

  const { data: company } = await supabase
    .from('companies').select('id, razao_social, nome_fantasia').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString()

  const [
    { count: activeProducts },
    { count: pendingPropostas },
    { count: visitsThisWeek },
    { data: gmvData },
    { data: urgentPropostas },
    { data: todayVisits },
    { data: recentProducts },
    { data: recentConvs },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true })
      .eq('company_id', company.id).eq('status', 'active').eq('moderacao_status', 'aprovado').is('deleted_at', null),
    supabase.from('propostas').select('*', { count: 'exact', head: true })
      .eq('vendedor_id', company.id).eq('status', 'pendente').is('deleted_at', null),
    supabase.from('visit_requests').select('*', { count: 'exact', head: true })
      .eq('seller_id', company.id).eq('status', 'accepted')
      .gte('proposed_date', now.toISOString().split('T')[0])
      .lte('proposed_date', in7Days.split('T')[0]),
    supabase.from('pedidos').select('valor_total')
      .eq('vendedor_id', company.id).eq('status', 'concluido')
      .gte('concluido_at', startOfMonth),
    supabase.from('propostas').select('id, preco_proposta, produto_id, created_at, products(title)')
      .eq('vendedor_id', company.id).eq('status', 'pendente').is('deleted_at', null)
      .lte('created_at', new Date(now.getTime() - 86400000).toISOString())
      .order('created_at', { ascending: true }).limit(3),
    supabase.from('visit_requests').select('id, proposed_date, proposed_time, products(title), companies!visit_requests_buyer_id_fkey(razao_social, nome_fantasia)')
      .eq('seller_id', company.id).eq('status', 'accepted')
      .eq('proposed_date', now.toISOString().split('T')[0])
      .limit(3),
    supabase.from('products')
      .select('id, title, views, status, condicao, created_at, product_images(url, is_cover)')
      .eq('company_id', company.id).is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('conversations')
      .select('id, products(title), companies!conversations_buyer_id_fkey(razao_social, nome_fantasia), messages(content, created_at, read, sender_id)')
      .eq('seller_id', company.id).order('created_at', { ascending: false }).limit(3),
  ])

  const gmv = (gmvData as { valor_total: number }[] | null)
    ?.reduce((acc, p) => acc + (p.valor_total ?? 0), 0) ?? 0

  const displayName = company.nome_fantasia ?? company.razao_social

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Olá, <span className="text-gradient">{displayName}</span> 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Seu painel de vendas</p>
        </div>
        <Link href="/vendedor/produtos/novo">
          <Button className="gradient-brand text-white hover:opacity-90 shadow-md shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Publicar produto
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Produtos ativos',    value: activeProducts ?? 0,  icon: Package,      href: '/vendedor/produtos',  color: 'text-teal-500' },
          { label: 'Propostas pend.',    value: pendingPropostas ?? 0, icon: TrendingUp,   href: '/vendedor/propostas', color: 'text-amber-500' },
          { label: 'Visitas esta semana',value: visitsThisWeek ?? 0,  icon: Calendar,     href: '/vendedor/visitas',   color: 'text-purple-500' },
          { label: 'GMV do mês',
            value: gmv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
            icon: Eye, href: '/vendedor/financeiro', color: 'text-green-500' },
        ].map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xl font-bold truncate">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
                <Icon className={`w-5 h-5 ${color} shrink-0 group-hover:scale-110 transition-transform`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ação necessária */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Ação necessária
          </h2>

          {(!urgentPropostas?.length && !todayVisits?.length) ? (
            <div className="p-4 rounded-xl border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">Nenhum item urgente 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {urgentPropostas?.map((p) => {
                const product = p.products as unknown as { title: string } | null
                return (
                  <Link key={p.id} href={`/vendedor/propostas/${p.id}`}
                    className="flex items-start gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/5 dark:border-amber-500/20 hover:border-amber-300 transition-colors">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{product?.title ?? 'Produto'}</p>
                      <p className="text-xs text-amber-600">
                        R$ {(p.preco_proposta as number).toLocaleString('pt-BR')} · aguarda +24h
                      </p>
                    </div>
                  </Link>
                )
              })}
              {todayVisits?.map((v) => {
                const product = v.products as unknown as { title: string } | null
                const buyer = v.companies as unknown as { razao_social: string; nome_fantasia: string | null } | null
                return (
                  <Link key={v.id} href={`/vendedor/visitas/${v.id}`}
                    className="flex items-start gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-500/5 dark:border-blue-500/20 hover:border-blue-300 transition-colors">
                    <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{product?.title ?? 'Produto'}</p>
                      <p className="text-xs text-blue-600">
                        Hoje {v.proposed_time ? `às ${(v.proposed_time as string).slice(0, 5)}` : ''} · {buyer?.nome_fantasia ?? buyer?.razao_social}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Produtos recentes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Produtos recentes</h2>
            <Link href="/vendedor/produtos" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!recentProducts?.length ? (
            <div className="p-8 rounded-xl border border-dashed border-border text-center">
              <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Nenhum produto publicado</p>
              <Link href="/vendedor/produtos/novo">
                <Button size="sm" className="gradient-brand text-white hover:opacity-90">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Publicar agora
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentProducts.map((p) => {
                const images = p.product_images as { url: string; is_cover: boolean }[]
                const cover = images?.find((i) => i.is_cover)?.url ?? images?.[0]?.url
                return (
                  <Link key={p.id} href={`/vendedor/produtos/${p.id}`}
                    className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0">
                      {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground/30" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${condicaoBadgeColor[p.condicao as keyof typeof condicaoBadgeColor] ?? ''}`}>
                          {condicaoLabel[p.condicao as keyof typeof condicaoLabel]}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.status === 'active' ? 'text-green-600 bg-green-500/10' : 'text-amber-600 bg-amber-500/10'}`}>
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
      </div>

      {/* Últimas conversas */}
      {!!recentConvs?.length && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Últimas mensagens</h2>
            <Link href="/vendedor/mensagens" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {recentConvs.map((conv) => {
              const product = conv.products as unknown as { title: string } | null
              const buyer = conv.companies as unknown as { razao_social: string; nome_fantasia: string | null } | null
              const msgs = conv.messages as unknown as { content: string; created_at: string; read: boolean; sender_id: string }[]
              const last = msgs?.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
              const unread = msgs?.filter((m) => !m.read && m.sender_id !== company.id).length ?? 0
              const buyerName = buyer?.nome_fantasia ?? buyer?.razao_social ?? 'Comprador'
              return (
                <Link key={conv.id} href={`/vendedor/mensagens`}
                  className="p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {buyerName[0]}
                    </div>
                    <span className="text-sm font-medium truncate flex-1">{buyerName}</span>
                    {unread > 0 && <span className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0">{unread}</span>}
                  </div>
                  {product && <p className="text-xs text-primary truncate">{product.title}</p>}
                  {last && <p className="text-xs text-muted-foreground truncate mt-0.5">{last.content}</p>}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
