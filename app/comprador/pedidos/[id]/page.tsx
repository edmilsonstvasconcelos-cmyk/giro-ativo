import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Package, CheckCircle, Truck, Clock, ShieldCheck, XCircle, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ConfirmarRecebimentoButton from '@/components/comprador/ConfirmarRecebimentoButton'

export const metadata = { title: 'Detalhe do Pedido' }

const statusSteps = [
  { key: 'aguardando_pagamento', label: 'Aguardando pagamento',      icon: Clock },
  { key: 'em_escrow',            label: 'Pagamento protegido (escrow)', icon: ShieldCheck },
  { key: 'aguardando_entrega',   label: 'Vendedor confirmou envio',  icon: Truck },
  { key: 'entregue',             label: 'Produto entregue',          icon: Package },
  { key: 'concluido',            label: 'Recebimento confirmado',    icon: CheckCircle },
]

export default async function CompradorPedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) redirect('/comprador')

  const { data: pedido } = await supabase
    .from('pedidos')
    .select(`
      id, valor_produto, valor_taxa_plataforma, valor_frete, valor_total,
      status, metodo_pagamento, created_at, pago_at, entregue_at, concluido_at,
      cancelado_at, motivo_cancelamento,
      produto:produto_id ( id, title, product_images ( url, is_cover ), location ),
      vendedor:vendedor_id ( id, razao_social, nome_fantasia, cidade, estado ),
      proposta:proposta_id ( id, conversa_id )
    `)
    .eq('id', id)
    .eq('comprador_id', company.id)
    .single()

  if (!pedido) notFound()

  const produto    = pedido.produto as any
  const vendedor   = pedido.vendedor as any
  const cover      = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
  const vendorName = vendedor?.nome_fantasia ?? vendedor?.razao_social ?? 'Empresa'
  const proposta   = pedido.proposta as any

  const currentStepIdx = statusSteps.findIndex((s) => s.key === pedido.status)
  const isCancelled    = ['cancelado', 'reembolsado'].includes(pedido.status)

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/comprador/pedidos" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Pedido #{pedido.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(pedido.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Produto */}
      <div className="rounded-xl border border-border bg-card p-4 flex gap-4">
        <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
          {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
            <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/30" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{produto?.title}</p>
          <p className="text-xs text-muted-foreground">{produto?.location}</p>
          <Link href={`/produtos/${produto?.id}`} className="text-xs text-primary hover:underline">Ver produto</Link>
        </div>
      </div>

      {/* Timeline */}
      {!isCancelled && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Status do pedido</h2>
          <div className="space-y-0">
            {statusSteps.map((step, i) => {
              const done    = i <= currentStepIdx
              const current = i === currentStepIdx
              const isLast  = i === statusSteps.length - 1
              const Icon    = step.icon
              return (
                <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? 'gradient-brand' : 'bg-muted border border-border'}`}>
                      <Icon className={`w-3.5 h-3.5 ${done ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    {!isLast && <div className={`w-px flex-1 mt-1 min-h-[20px] ${done && i < currentStepIdx ? 'bg-primary' : 'bg-border'}`} />}
                  </div>
                  <div className="flex-1 pb-1">
                    <p className={`text-sm font-medium leading-7 ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                  </div>
                  {current && <span className="text-xs text-primary font-semibold shrink-0 mt-1.5">Atual</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-red-700">Pedido cancelado</p>
            {pedido.motivo_cancelamento && <p className="text-xs text-red-600 mt-1">{pedido.motivo_cancelamento as string}</p>}
          </div>
        </div>
      )}

      {/* Escrow info */}
      {['em_escrow', 'laudo_solicitado', 'laudo_aprovado', 'aguardando_entrega', 'entregue'].includes(pedido.status) && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-blue-800 dark:text-blue-300">Pagamento protegido</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              O valor de <strong>
                {(pedido.valor_total as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong> está retido em escrow e só será liberado ao vendedor após você confirmar o recebimento.
            </p>
          </div>
        </div>
      )}

      {/* Confirmar recebimento */}
      {pedido.status === 'entregue' && (
        <ConfirmarRecebimentoButton pedidoId={pedido.id} />
      )}

      {/* Financeiro */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Resumo financeiro</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor do produto</span>
            <span>R$ {(pedido.valor_produto as number).toLocaleString('pt-BR')}</span>
          </div>
          {(pedido.valor_frete as number) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>R$ {(pedido.valor_frete as number).toLocaleString('pt-BR')}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-border font-bold">
            <span>Total pago</span>
            <span>R$ {(pedido.valor_total as number).toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Vendedor */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Vendedor</h2>
        <p className="font-medium text-sm">{vendorName}</p>
        {vendedor?.cidade && <p className="text-xs text-muted-foreground">{vendedor.cidade}, {vendedor.estado}</p>}
        {proposta?.conversa_id && (
          <Link href={`/chat/${proposta.conversa_id}`} className="mt-3 block">
            <button className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-border text-sm hover:border-primary/30 transition-colors">
              <MessageSquare className="w-4 h-4" /> Ver conversa com o vendedor
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
