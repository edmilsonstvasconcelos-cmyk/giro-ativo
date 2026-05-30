import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, CheckCircle, XCircle, Package } from 'lucide-react'
import { format, formatDistanceToNow, differenceInHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import PropostaActions from '@/components/vendedor/PropostaActions'

export const metadata = { title: 'Detalhe da Proposta' }

export default async function PropostaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  const { data: proposta } = await supabase
    .from('propostas')
    .select(`
      id, preco_proposta, mensagem, status, created_at, expira_at, respondida_at,
      produtos:produto_id(id, title, price, unit, location, product_images(url, is_cover)),
      comprador:comprador_id(id, razao_social, nome_fantasia, cidade, estado, telefone)
    `)
    .eq('id', id)
    .eq('vendedor_id', company.id)
    .single()

  if (!proposta) notFound()

  const produto  = proposta.produtos as any
  const comprador= proposta.comprador as any
  const cover    = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
  const priceDiff= produto?.price ? ((proposta.preco_proposta - produto.price) / produto.price * 100) : null
  const hoursWaiting = differenceInHours(new Date(), new Date(proposta.created_at))
  const isExpired = proposta.expira_at && new Date(proposta.expira_at) < new Date()
  const buyerName = comprador?.nome_fantasia ?? comprador?.razao_social ?? 'Comprador'

  const statusColors: Record<string, string> = {
    pendente: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    aceita:   'text-green-600 bg-green-500/10 border-green-500/20',
    recusada: 'text-red-600 bg-red-500/10 border-red-500/20',
    expirada: 'text-slate-500 bg-muted border-border',
    cancelada:'text-slate-500 bg-muted border-border',
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/vendedor/propostas" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Proposta Recebida</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(proposta.created_at), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${statusColors[proposta.status] ?? ''}`}>
          {proposta.status.charAt(0).toUpperCase() + proposta.status.slice(1)}
        </span>
      </div>

      {/* Urgência */}
      {proposta.status === 'pendente' && hoursWaiting >= 24 && (
        <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 flex items-center gap-2 text-sm text-amber-700">
          <Clock className="w-4 h-4 shrink-0" />
          Aguardando resposta há <strong>{hoursWaiting}h</strong>. Responda antes do prazo expirar.
        </div>
      )}

      {isExpired && proposta.status === 'pendente' && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 flex items-center gap-2 text-sm text-red-600">
          <XCircle className="w-4 h-4 shrink-0" />
          Esta proposta expirou em {proposta.expira_at ? format(new Date(proposta.expira_at), 'dd/MM/yyyy', { locale: ptBR }) : ''}.
        </div>
      )}

      {/* Produto */}
      <div className="rounded-xl border border-border bg-card p-4 flex gap-4">
        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
          {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
            <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground/30" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{produto?.title}</p>
          <p className="text-sm text-muted-foreground">{produto?.location}</p>
          {produto?.price && (
            <p className="text-sm mt-1">
              Preço anunciado: <strong className="text-foreground">
                R$ {produto.price.toLocaleString('pt-BR')} / {produto.unit}
              </strong>
            </p>
          )}
        </div>
        <Link href={`/produtos/${produto?.id}`} className="shrink-0">
          <Button variant="outline" size="sm" className="text-xs">Ver produto</Button>
        </Link>
      </div>

      {/* Proposta */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Proposta de compra</h2>

        <div className="flex items-baseline gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor proposto</p>
            <p className="text-3xl font-bold text-foreground">
              R$ {(proposta.preco_proposta as number).toLocaleString('pt-BR')}
            </p>
          </div>
          {priceDiff !== null && (
            <span className={`text-sm font-semibold ${priceDiff < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(1)}% do preço anunciado
            </span>
          )}
        </div>

        {proposta.mensagem && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1 font-semibold">Mensagem do comprador</p>
            <p className="text-sm leading-relaxed italic">"{proposta.mensagem}"</p>
          </div>
        )}

        {proposta.expira_at && proposta.status === 'pendente' && (
          <p className="text-xs text-muted-foreground">
            Expira em: {formatDistanceToNow(new Date(proposta.expira_at), { addSuffix: true, locale: ptBR })}
          </p>
        )}
      </div>

      {/* Comprador */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Comprador</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold shrink-0">
            {buyerName[0]}
          </div>
          <div>
            <p className="font-semibold text-sm">{buyerName}</p>
            {comprador?.cidade && (
              <p className="text-xs text-muted-foreground">{comprador.cidade}, {comprador.estado}</p>
            )}
          </div>
        </div>
      </div>

      {/* Ações (apenas se pendente e não expirada) */}
      {proposta.status === 'pendente' && !isExpired && (
        <PropostaActions propostaId={proposta.id} />
      )}

      {/* Resultado */}
      {proposta.respondida_at && proposta.status !== 'pendente' && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${proposta.status === 'aceita' ? 'border-green-300 bg-green-50 dark:bg-green-500/10' : 'border-red-200 bg-red-50 dark:bg-red-500/10'}`}>
          {proposta.status === 'aceita'
            ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
          <div>
            <p className="font-semibold text-sm">
              Proposta {proposta.status === 'aceita' ? 'aceita' : 'recusada'}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(proposta.respondida_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          {proposta.status === 'aceita' && (
            <Link href="/vendedor/pedidos" className="ml-auto">
              <Button size="sm" className="gradient-brand text-white hover:opacity-90">Ver pedido</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
