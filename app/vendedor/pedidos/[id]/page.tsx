import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Detalhe do Pedido' }

const statusSteps = [
  { key: 'aguardando_pagamento', label: 'Aguardando pagamento', icon: Clock },
  { key: 'em_escrow',            label: 'Pagamento em escrow',  icon: CheckCircle },
  { key: 'aguardando_entrega',   label: 'Aguardando entrega',  icon: Truck },
  { key: 'concluido',            label: 'Concluído',            icon: CheckCircle },
]

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  const { data: pedido } = await supabase
    .from('pedidos')
    .select(`
      id, valor_produto, valor_taxa_plataforma, valor_frete, valor_total,
      status, metodo_pagamento, pagarme_order_id,
      pago_at, entregue_at, concluido_at, cancelado_at, motivo_cancelamento,
      created_at,
      produto:produto_id(id, title, product_images(url, is_cover), location),
      comprador:comprador_id(id, razao_social, nome_fantasia, cidade, estado, telefone),
      proposta:proposta_id(id, conversa_id)
    `)
    .eq('id', id)
    .eq('vendedor_id', company.id)
    .single()

  if (!pedido) notFound()

  const produto  = pedido.produto as any
  const comprador= pedido.comprador as any
  const cover    = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
  const buyerName= comprador?.nome_fantasia ?? comprador?.razao_social ?? 'Comprador'
  const proposta = pedido.proposta as any

  const currentStepIdx = statusSteps.findIndex((s) => s.key === pedido.status)

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/vendedor/pedidos" className="p-2 rounded-lg hover:bg-muted transition-colors">
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
        </div>
        <Link href={`/produtos/${produto?.id}`}>
          <Button variant="outline" size="sm" className="text-xs shrink-0">Ver</Button>
        </Link>
      </div>

      {/* Timeline */}
      {!['cancelado', 'reembolsado'].includes(pedido.status) && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Status do pedido</h2>
          <div className="space-y-3">
            {statusSteps.map((step, i) => {
              const done = i <= currentStepIdx
              const Icon = step.icon
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? 'gradient-brand' : 'bg-muted border border-border'}`}>
                    <Icon className={`w-3.5 h-3.5 ${done ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                  </div>
                  {i === currentStepIdx && <span className="text-xs text-primary font-semibold">Atual</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pedido cancelado */}
      {['cancelado', 'reembolsado'].includes(pedido.status) && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-red-700">Pedido cancelado</p>
            {pedido.motivo_cancelamento && <p className="text-xs text-red-600 mt-1">{pedido.motivo_cancelamento}</p>}
          </div>
        </div>
      )}

      {/* Valores */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Financeiro</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Valor do produto</span><span>R$ {(pedido.valor_produto as number).toLocaleString('pt-BR')}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Taxa da plataforma</span><span className="text-muted-foreground">- R$ {(pedido.valor_taxa_plataforma as number).toLocaleString('pt-BR')}</span></div>
          {(pedido.valor_frete as number) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>R$ {(pedido.valor_frete as number).toLocaleString('pt-BR')}</span></div>}
          <div className="flex justify-between pt-2 border-t border-border font-bold">
            <span>Você recebe</span>
            <span className="text-green-600">R$ {((pedido.valor_produto as number) - (pedido.valor_taxa_plataforma as number)).toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Comprador */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Comprador</h2>
        <p className="font-medium text-sm">{buyerName}</p>
        {comprador?.cidade && <p className="text-xs text-muted-foreground">{comprador.cidade}, {comprador.estado}</p>}
        {proposta?.conversa_id && (
          <Link href={`/chat/${proposta.conversa_id}`} className="mt-3 block">
            <Button variant="outline" size="sm" className="text-xs w-full">Ver conversa com o comprador</Button>
          </Link>
        )}
      </div>

      {/* Ações por status — placeholder para Sprint 4 com Pagar.me */}
      {pedido.status === 'em_escrow' && (
        <div className="p-4 rounded-xl border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            Integração com Pagar.me em desenvolvimento (Sprint 4).
            Quando liberada, você poderá confirmar a entrega aqui para receber o valor do escrow.
          </p>
        </div>
      )}
    </div>
  )
}
