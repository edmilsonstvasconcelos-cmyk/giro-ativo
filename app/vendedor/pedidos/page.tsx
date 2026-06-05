import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, Clock, CheckCircle, Package, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Pedidos Recebidos' }

const statusConfig: Record<string, { label: string; color: string }> = {
  aguardando_pagamento: { label: 'Aguard. pagamento', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  pagamento_confirmado: { label: 'Pago',             color: 'text-blue-600 bg-blue-500/10 border-blue-500/20'    },
  em_escrow:            { label: 'Em escrow',         color: 'text-blue-600 bg-blue-500/10 border-blue-500/20'    },
  laudo_solicitado:     { label: 'Laudo solicitado',  color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' },
  laudo_aprovado:       { label: 'Laudo aprovado',   color: 'text-teal-600 bg-teal-500/10 border-teal-500/20'    },
  aguardando_entrega:   { label: 'Aguard. entrega',   color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20' },
  entregue:             { label: 'Entregue',          color: 'text-green-600 bg-green-500/10 border-green-500/20'  },
  concluido:            { label: 'Concluído',         color: 'text-green-700 bg-green-600/10 border-green-600/20'  },
  cancelado:            { label: 'Cancelado',         color: 'text-red-600 bg-red-500/10 border-red-500/20'       },
  reembolsado:          { label: 'Reembolsado',       color: 'text-slate-500 bg-muted border-border'              },
}

interface SearchParams { status?: string }

export default async function PedidosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  let query = supabase
    .from('pedidos')
    .select('id, valor_produto, valor_total, status, created_at, pago_at, concluido_at, metodo_pagamento, produtos:produto_id(id, title, product_images(url, is_cover)), comprador:comprador_id(id, razao_social, nome_fantasia)')
    .eq('vendedor_id', company.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status as import('@/types/supabase').PedidoStatus)

  const { data: pedidos } = await query

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">Pedidos Recebidos</h1>
        <p className="text-sm text-muted-foreground">{pedidos?.length ?? 0} pedido(s)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Todos', href: '/vendedor/pedidos' },
          { label: 'Ativos', href: '/vendedor/pedidos?status=em_escrow' },
          { label: 'Concluídos', href: '/vendedor/pedidos?status=concluido' },
          { label: 'Cancelados', href: '/vendedor/pedidos?status=cancelado' },
        ].map(({ label, href }) => (
          <Link key={href} href={href}>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              params.status === href.split('status=')[1] || (!params.status && label === 'Todos')
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}>{label}</span>
          </Link>
        ))}
      </div>

      {!pedidos?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhum pedido ainda</h3>
          <p className="text-sm text-muted-foreground">Quando propostas forem aceitas e pagamentos confirmados, os pedidos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const produto  = pedido.produtos as any
            const comprador= pedido.comprador as any
            const cover    = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
            const cfg      = statusConfig[pedido.status] ?? statusConfig.aguardando_pagamento
            const buyerName= comprador?.nome_fantasia ?? comprador?.razao_social ?? 'Comprador'

            return (
              <Link key={pedido.id} href={`/vendedor/pedidos/${pedido.id}`}>
                <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
                  <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/30" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 justify-between">
                      <p className="font-semibold text-sm line-clamp-1">{produto?.title}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{buyerName}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-sm">
                      <span className="font-bold">R$ {(pedido.valor_total as number).toLocaleString('pt-BR')}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 self-center" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
