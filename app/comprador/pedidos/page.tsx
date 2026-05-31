import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, Package, ArrowRight, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Minhas Compras' }

const statusConfig: Record<string, { label: string; color: string }> = {
  aguardando_pagamento: { label: 'Aguard. pagamento', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  pagamento_confirmado: { label: 'Pago',              color: 'text-blue-600 bg-blue-500/10 border-blue-500/20'   },
  em_escrow:            { label: 'Em escrow',          color: 'text-blue-600 bg-blue-500/10 border-blue-500/20'   },
  laudo_solicitado:     { label: 'Laudo solicitado',   color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' },
  laudo_aprovado:       { label: 'Laudo aprovado',    color: 'text-teal-600 bg-teal-500/10 border-teal-500/20'   },
  aguardando_entrega:   { label: 'Em envio',           color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20' },
  entregue:             { label: 'Entregue',           color: 'text-orange-600 bg-orange-500/10 border-orange-500/20' },
  concluido:            { label: 'Concluído',          color: 'text-green-700 bg-green-600/10 border-green-600/20' },
  cancelado:            { label: 'Cancelado',          color: 'text-red-600 bg-red-500/10 border-red-500/20'     },
  reembolsado:          { label: 'Reembolsado',        color: 'text-slate-500 bg-muted border-border'             },
}

interface SearchParams { filtro?: string }

export default async function CompradorPedidosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params   = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) redirect('/comprador')

  // Pedidos aguardando confirmação de recebimento
  const { data: pendingDelivery } = await supabase
    .from('pedidos').select('id')
    .eq('comprador_id', company.id).eq('status', 'entregue').is('deleted_at', null)

  let query = supabase
    .from('pedidos')
    .select(`
      id, valor_total, status, created_at, pago_at,
      produto:produto_id ( id, title, product_images ( url, is_cover ) ),
      vendedor:vendedor_id ( razao_social, nome_fantasia )
    `)
    .eq('comprador_id', company.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.filtro === 'ativo') {
    query = query.not('status', 'in', '("concluido","cancelado","reembolsado")')
  } else if (params.filtro === 'concluido') {
    query = query.eq('status', 'concluido')
  } else if (params.filtro === 'cancelado') {
    query = query.in('status', ['cancelado', 'reembolsado'])
  }

  const { data: pedidos } = await query

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">Minhas compras</h1>
        <p className="text-sm text-muted-foreground">{pedidos?.length ?? 0} pedido(s)</p>
      </div>

      {/* Alerta de ação pendente */}
      {(pendingDelivery?.length ?? 0) > 0 && (
        <div className="p-3 rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-500/10 flex items-center gap-2 text-sm text-orange-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {pendingDelivery!.length} pedido(s) aguardando sua confirmação de recebimento.
          <Link href="/comprador/pedidos?filtro=ativo" className="ml-auto font-semibold hover:underline shrink-0">Ver →</Link>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: undefined, label: 'Todos' },
          { value: 'ativo',    label: 'Em andamento' },
          { value: 'concluido', label: 'Concluídos' },
          { value: 'cancelado', label: 'Cancelados' },
        ].map(({ value, label }) => (
          <Link key={label} href={value ? `/comprador/pedidos?filtro=${value}` : '/comprador/pedidos'}>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              params.filtro === value || (!params.filtro && !value)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}>{label}</span>
          </Link>
        ))}
      </div>

      {!pedidos?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhum pedido encontrado</h3>
          <Link href="/comprador/busca" className="text-sm text-primary hover:underline flex items-center gap-1">
            Explorar produtos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const produto    = pedido.produto as any
            const vendedor   = pedido.vendedor as any
            const cover      = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
            const cfg        = statusConfig[pedido.status] ?? statusConfig.aguardando_pagamento
            const vendorName = vendedor?.nome_fantasia ?? vendedor?.razao_social ?? 'Empresa'
            const needsAction= pedido.status === 'entregue'

            return (
              <Link key={pedido.id} href={`/comprador/pedidos/${pedido.id}`}>
                <div className={`flex gap-4 p-4 rounded-xl border bg-card hover:border-primary/20 transition-colors ${
                  needsAction ? 'border-orange-300 dark:border-orange-500/40' : 'border-border'
                }`}>
                  <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/30" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 justify-between">
                      <p className="font-semibold text-sm line-clamp-1">{produto?.title}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{vendorName}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-sm">
                      <span className="font-bold">
                        {(pedido.valor_total as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    {needsAction && <p className="text-xs text-orange-600 font-medium mt-1">⚠ Confirmar recebimento</p>}
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
