import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/produtos/ProductCard'
import {
  Search, Calendar, Clock, ShoppingCart,
  Package, AlertCircle, ArrowRight, TrendingUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Área do Comprador — Giro Ativo' }

export default async function CompradorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('nome, role').eq('user_id', user.id).single()
  if (!profile || !['comprador', 'admin'].includes(profile.role)) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id, razao_social, nome_fantasia').eq('user_id', user.id).maybeSingle()

  const companyId = company?.id ?? null
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 86400000)

  const [
    { data: urgentProposals },
    { data: todayVisits },
    { data: pendingDelivery },
    { data: recentProducts },
  ] = await Promise.all([
    // Propostas aguardando resposta do vendedor
    companyId
      ? supabase.from('propostas')
          .select('id, preco_proposta, created_at, produtos:produto_id(title)')
          .eq('comprador_id', companyId).eq('status', 'pendente').is('deleted_at', null)
          .order('created_at', { ascending: true }).limit(3)
      : Promise.resolve({ data: [] }),
    // Visitas de hoje e amanhã
    companyId
      ? supabase.from('visit_requests')
          .select('id, proposed_date, proposed_time, produtos:product_id(title)')
          .eq('buyer_id', companyId).eq('status', 'accepted')
          .gte('proposed_date', now.toISOString().split('T')[0])
          .lte('proposed_date', tomorrow.toISOString().split('T')[0])
          .limit(3)
      : Promise.resolve({ data: [] }),
    // Pedidos aguardando confirmação de recebimento
    companyId
      ? supabase.from('pedidos')
          .select('id, valor_total, produtos:produto_id(title)')
          .eq('comprador_id', companyId).eq('status', 'entregue')
          .limit(3)
      : Promise.resolve({ data: [] }),
    // Produtos recentes aprovados
    supabase.from('products')
      .select(`
        id, title, price, unit, condicao, location, views, created_at, tem_laudo,
        categories ( nome ),
        product_images ( url, is_cover ),
        companies ( razao_social, nome_fantasia )
      `)
      .eq('status', 'active').eq('moderacao_status', 'aprovado').is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(8),
  ])

  const displayName = profile.nome ?? company?.nome_fantasia ?? company?.razao_social ?? 'Comprador'
  const hasUrgent   = (urgentProposals?.length ?? 0) + (todayVisits?.length ?? 0) + (pendingDelivery?.length ?? 0)

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Olá, <span className="text-gradient">{displayName}</span> 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Encontre materiais industriais com segurança e agilidade</p>
      </div>

      {/* Barra de busca */}
      <form action="/comprador/busca" method="GET">
        <div className="flex gap-2 p-4 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              name="q"
              type="text"
              placeholder="Buscar materiais, equipamentos, válvulas..."
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            name="categoria"
            className="h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none"
          >
            <option value="">Todas as categorias</option>
            <option value="1">Tubulações e Conexões</option>
            <option value="2">Elétrica e Automação</option>
            <option value="3">Mecânica e Estruturas</option>
            <option value="4">Instrumentação</option>
            <option value="5">Válvulas e Atuadores</option>
            <option value="6">Motores e Bombas</option>
            <option value="7">EPIs e Segurança</option>
          </select>
          <button
            type="submit"
            className="h-11 px-5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Ação necessária */}
      {hasUrgent > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Ação necessária
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentProposals?.map((p) => {
              const produto = p.produtos as any
              return (
                <Link key={p.id} href={`/comprador/propostas/${p.id}`}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 hover:border-amber-300 transition-colors">
                  <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{produto?.title ?? 'Produto'}</p>
                    <p className="text-xs text-amber-600">
                      Proposta R$ {(p.preco_proposta as number).toLocaleString('pt-BR')} aguardando vendedor
                    </p>
                  </div>
                </Link>
              )
            })}
            {todayVisits?.map((v) => {
              const produto = v.produtos as any
              return (
                <Link key={v.id} href={`/comprador/visitas/${v.id}`}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 hover:border-blue-300 transition-colors">
                  <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{produto?.title ?? 'Produto'}</p>
                    <p className="text-xs text-blue-600">
                      Visita em {format(new Date(v.proposed_date + 'T00:00:00'), "dd/MM", { locale: ptBR })}
                      {v.proposed_time ? ` às ${(v.proposed_time as string).slice(0, 5)}` : ''}
                    </p>
                  </div>
                </Link>
              )
            })}
            {pendingDelivery?.map((pedido) => {
              const produto = pedido.produtos as any
              return (
                <Link key={pedido.id} href={`/comprador/pedidos/${pedido.id}`}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/20 hover:border-green-300 transition-colors">
                  <ShoppingCart className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{produto?.title ?? 'Produto'}</p>
                    <p className="text-xs text-green-700">Confirmar recebimento</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Novidades no marketplace */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Novidades no marketplace</h2>
          <Link href="/comprador/busca" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!recentProducts?.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border text-center">
            <Package className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum produto disponível no momento</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentProducts.map((p) => {
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
                  condicao={p.condicao ?? 'bom'}
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
      </section>

      {/* Visitas desta semana */}
      {companyId && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" /> Visitas desta semana
            </h2>
            <Link href="/comprador/visitas" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <WeeklyVisits companyId={companyId} supabase={supabase} />
        </section>
      )}
    </div>
  )
}

async function WeeklyVisits({ companyId, supabase }: { companyId: string; supabase: any }) {
  const in7Days = new Date(Date.now() + 7 * 86400000)
  const { data: visits } = await supabase
    .from('visit_requests')
    .select('id, proposed_date, proposed_time, status, produtos:product_id(title)')
    .eq('buyer_id', companyId)
    .in('status', ['pending', 'accepted'])
    .gte('proposed_date', new Date().toISOString().split('T')[0])
    .lte('proposed_date', in7Days.toISOString().split('T')[0])
    .order('proposed_date', { ascending: true })
    .limit(4)

  if (!visits?.length) {
    return (
      <div className="p-6 rounded-xl border border-dashed border-border text-center">
        <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma visita agendada para esta semana</p>
        <Link href="/comprador/busca" className="text-xs text-primary hover:underline mt-1 inline-block">
          Explore produtos para agendar uma visita →
        </Link>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {visits.map((v: any) => {
        const produto = v.produtos as { title: string } | null
        const isToday = v.proposed_date === new Date().toISOString().split('T')[0]
        return (
          <Link key={v.id} href={`/comprador/visitas/${v.id}`}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${v.status === 'accepted' ? 'gradient-brand' : 'bg-muted border border-border'}`}>
              <span className={`text-[10px] font-bold uppercase ${v.status === 'accepted' ? 'text-white' : 'text-muted-foreground'}`}>
                {format(new Date(v.proposed_date + 'T00:00:00'), 'MMM', { locale: ptBR })}
              </span>
              <span className={`text-sm font-bold leading-none ${v.status === 'accepted' ? 'text-white' : 'text-foreground'}`}>
                {format(new Date(v.proposed_date + 'T00:00:00'), 'dd')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{produto?.title ?? 'Produto'}</p>
              <p className="text-xs text-muted-foreground">
                {isToday ? 'Hoje' : format(new Date(v.proposed_date + 'T00:00:00'), 'EEEE', { locale: ptBR })}
                {v.proposed_time ? ` às ${(v.proposed_time as string).slice(0, 5)}` : ''}
                {' · '}
                <span className={v.status === 'accepted' ? 'text-green-600' : 'text-amber-600'}>
                  {v.status === 'accepted' ? 'Confirmada' : 'Aguardando'}
                </span>
              </p>
            </div>
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}
