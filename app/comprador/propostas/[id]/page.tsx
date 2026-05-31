import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, ShoppingCart } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import CancelarPropostaButton from '@/components/comprador/CancelarPropostaButton'

export const metadata = { title: 'Detalhe da Proposta' }

export default async function CompradorPropostaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) redirect('/comprador')

  const { data: proposta } = await supabase
    .from('propostas')
    .select(`
      id, preco_proposta, mensagem, status, created_at, expira_at, respondida_at,
      produto:produto_id ( id, title, price, unit, location, product_images ( url, is_cover ) ),
      vendedor:vendedor_id ( id, razao_social, nome_fantasia, cidade, estado )
    `)
    .eq('id', id)
    .eq('comprador_id', company.id)
    .single()

  if (!proposta) notFound()

  // Buscar pedido se proposta foi aceita
  const { data: pedido } = proposta.status === 'aceita'
    ? await supabase.from('pedidos').select('id').eq('proposta_id', id).single()
    : { data: null }

  const produto    = proposta.produto as any
  const vendedor   = proposta.vendedor as any
  const cover      = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
  const vendorName = vendedor?.nome_fantasia ?? vendedor?.razao_social ?? 'Empresa'
  const priceDiff  = produto?.price ? ((proposta.preco_proposta - produto.price) / produto.price * 100) : null
  const isExpired  = proposta.expira_at && new Date(proposta.expira_at) < new Date()

  const statusColors: Record<string, string> = {
    pendente:        'text-amber-600 bg-amber-500/10 border-amber-500/20',
    aceita:          'text-green-600 bg-green-500/10 border-green-500/20',
    recusada:        'text-red-600 bg-red-500/10 border-red-500/20',
    expirada:        'text-slate-500 bg-muted border-border',
    cancelada:       'text-slate-500 bg-muted border-border',
    contra_proposta: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/comprador/propostas" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Proposta enviada</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(proposta.created_at), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border font-semibold shrink-0 ${statusColors[proposta.status] ?? ''}`}>
          {proposta.status.charAt(0).toUpperCase() + proposta.status.slice(1).replace('_', ' ')}
        </span>
      </div>

      {/* Avisos */}
      {proposta.status === 'pendente' && isExpired && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 flex items-center gap-2 text-sm text-red-600">
          <XCircle className="w-4 h-4 shrink-0" /> Esta proposta expirou.
        </div>
      )}
      {proposta.status === 'pendente' && !isExpired && proposta.expira_at && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 flex items-center gap-2 text-sm text-amber-700">
          <Clock className="w-4 h-4 shrink-0" />
          Expira {formatDistanceToNow(new Date(proposta.expira_at), { addSuffix: true, locale: ptBR })}
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
              Preço anunciado: <strong>R$ {(produto.price as number).toLocaleString('pt-BR')} / {produto.unit}</strong>
            </p>
          )}
        </div>
        <Link href={`/produtos/${produto?.id}`} className="shrink-0">
          <Button variant="outline" size="sm" className="text-xs">Ver produto</Button>
        </Link>
      </div>

      {/* Detalhes da proposta */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Sua proposta</h2>

        <div className="flex items-baseline gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor proposto</p>
            <p className="text-3xl font-bold">R$ {(proposta.preco_proposta as number).toLocaleString('pt-BR')}</p>
          </div>
          {priceDiff !== null && (
            <span className={`text-sm font-semibold ${priceDiff < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(1)}%
            </span>
          )}
        </div>

        {proposta.mensagem && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1 font-semibold">Sua mensagem</p>
            <p className="text-sm italic">"{proposta.mensagem}"</p>
          </div>
        )}
      </div>

      {/* Vendedor */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Vendedor</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold shrink-0">
            {vendorName[0]}
          </div>
          <div>
            <p className="font-semibold text-sm">{vendorName}</p>
            {vendedor?.cidade && <p className="text-xs text-muted-foreground">{vendedor.cidade}, {vendedor.estado}</p>}
          </div>
        </div>
      </div>

      {/* Ações */}
      {proposta.status === 'aceita' && pedido && (
        <div className="p-4 rounded-xl border border-green-300 bg-green-50 dark:bg-green-500/10 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-green-800 dark:text-green-300">Proposta aceita!</p>
              <p className="text-xs text-green-700 dark:text-green-400">O vendedor aceitou sua proposta. Siga para o pagamento.</p>
            </div>
          </div>
          <Link href={`/comprador/pedidos/${pedido.id}`}>
            <Button className="w-full gradient-brand text-white hover:opacity-90">
              <ShoppingCart className="w-4 h-4 mr-2" /> Ver pedido e pagar
            </Button>
          </Link>
        </div>
      )}

      {proposta.status === 'recusada' && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Proposta recusada</p>
            {proposta.respondida_at && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(proposta.respondida_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
          <Link href={`/produtos/${produto?.id}`} className="ml-auto">
            <Button size="sm" variant="outline" className="text-xs">Fazer nova proposta</Button>
          </Link>
        </div>
      )}

      {proposta.status === 'pendente' && !isExpired && (
        <CancelarPropostaButton propostaId={proposta.id} />
      )}
    </div>
  )
}
