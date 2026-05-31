import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, MapPin, Package, MessageSquare, TrendingUp } from 'lucide-react'
import { format, differenceInHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import VisitActions from '@/components/visitas/VisitActions'

export const metadata = { title: 'Detalhe da Visita' }

const statusConfig = {
  pending:   { label: 'Aguardando resposta', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Clock },
  accepted:  { label: 'Confirmada',          color: 'text-green-600 bg-green-500/10 border-green-500/20', icon: CheckCircle },
  declined:  { label: 'Recusada',            color: 'text-red-600 bg-red-500/10 border-red-500/20',       icon: XCircle },
  cancelled: { label: 'Cancelada',           color: 'text-slate-500 bg-muted border-border',               icon: XCircle },
}

export default async function CompradorVisitaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) redirect('/comprador')

  const { data: visit } = await supabase
    .from('visit_requests')
    .select(`
      id, proposed_date, proposed_time, message, status, created_at,
      products ( id, title, product_images ( url, is_cover ), price, unit ),
      seller:companies!visit_requests_seller_id_fkey ( id, razao_social, nome_fantasia, cidade, estado, telefone )
    `)
    .eq('id', id)
    .eq('buyer_id', company.id)
    .single()

  if (!visit) notFound()

  const produto    = visit.products as any
  const vendedor   = visit.seller as any
  const cover      = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
  const cfg        = statusConfig[visit.status as keyof typeof statusConfig] ?? statusConfig.pending
  const StatusIcon = cfg.icon
  const vendorName = vendedor?.nome_fantasia ?? vendedor?.razao_social ?? 'Empresa'

  const visitDate = new Date(visit.proposed_date + 'T00:00:00')
  const hoursUntil = differenceInHours(visitDate, new Date())
  const isPast     = visitDate < new Date()

  // Verificar conversa existente com o vendedor para o produto
  const { data: conversa } = await supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', company.id)
    .eq('seller_id', vendedor?.id ?? '')
    .eq('product_id', produto?.id ?? '')
    .single()

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/comprador/visitas" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Visita Técnica</h1>
          <p className="text-sm text-muted-foreground">
            Solicitada em {format(new Date(visit.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold shrink-0 ${cfg.color}`}>
          <StatusIcon className="w-3 h-3" /> {cfg.label}
        </span>
      </div>

      {/* Produto */}
      <div className="rounded-xl border border-border bg-card p-4 flex gap-4">
        <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
          {cover
            ? <img src={cover} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/30" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{produto?.title ?? 'Produto'}</p>
          {produto?.price && (
            <p className="text-sm text-muted-foreground">
              R$ {(produto.price as number).toLocaleString('pt-BR')} / {produto.unit}
            </p>
          )}
          <Link href={`/produtos/${produto?.id}`} className="text-xs text-primary hover:underline">Ver no marketplace</Link>
        </div>
      </div>

      {/* Data e hora */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Data e hora</h2>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium capitalize">
            {format(visitDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
        {visit.proposed_time && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>{(visit.proposed_time as string).slice(0, 5)}</span>
          </div>
        )}
      </div>

      {/* Vendedor */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Vendedor</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold shrink-0">
            {vendorName[0]}
          </div>
          <div>
            <p className="font-semibold text-sm">{vendorName}</p>
            {vendedor?.cidade && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {vendedor.cidade}, {vendedor.estado}
              </p>
            )}
          </div>
        </div>

        {/* Conversa */}
        {conversa && (
          <Link href={`/chat/${conversa.id}`}>
            <button className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-border text-sm hover:border-primary/30 transition-colors mt-2">
              <MessageSquare className="w-4 h-4" /> Conversar com o vendedor
            </button>
          </Link>
        )}
      </div>

      {/* Mensagem enviada */}
      {visit.message && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-2">Sua mensagem</h2>
          <p className="text-sm text-muted-foreground italic">"{visit.message}"</p>
        </div>
      )}

      {/* Cancelar — apenas se pending e data futura */}
      {visit.status === 'pending' && !isPast && (
        <div>
          <VisitActions visitId={visit.id} isSeller={false} />
        </div>
      )}

      {visit.status === 'accepted' && !isPast && hoursUntil < 12 && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 text-sm text-amber-700">
          ⚠ Esta visita é em menos de 12 horas. Cancelamentos tardios podem gerar penalidade.
          <div className="mt-2">
            <VisitActions visitId={visit.id} isSeller={false} />
          </div>
        </div>
      )}

      {visit.status === 'accepted' && !isPast && hoursUntil >= 12 && (
        <div>
          <VisitActions visitId={visit.id} isSeller={false} />
        </div>
      )}

      {/* Pós-visita: interesse */}
      {visit.status === 'accepted' && isPast && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Resultado da visita</h2>
          <p className="text-sm text-muted-foreground">Ficou interessado no produto?</p>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/produtos/${produto?.id}`}>
              <Button className="gradient-brand text-white hover:opacity-90" size="sm">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Fazer proposta
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="text-muted-foreground">
              Sem interesse
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
