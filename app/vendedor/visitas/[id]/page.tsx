import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, MapPin, MessageSquare, Package } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import VisitActions from '@/components/visitas/VisitActions'

export const metadata = { title: 'Detalhe da Visita' }

const statusConfig = {
  pending:   { label: 'Aguardando',  color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Clock },
  accepted:  { label: 'Confirmada',  color: 'text-green-600 bg-green-500/10 border-green-500/20', icon: CheckCircle },
  declined:  { label: 'Recusada',    color: 'text-red-600 bg-red-500/10 border-red-500/20',       icon: XCircle },
  cancelled: { label: 'Cancelada',   color: 'text-slate-500 bg-muted border-border',               icon: XCircle },
}

export default async function VisitaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  const { data: visit } = await supabase
    .from('visit_requests')
    .select(`
      id, proposed_date, proposed_time, message, status, created_at,
      products ( id, title, product_images ( url, is_cover ) ),
      buyer:companies!visit_requests_buyer_id_fkey ( id, razao_social, nome_fantasia, cidade, estado, telefone )
    `)
    .eq('id', id)
    .eq('seller_id', company.id)
    .single()

  if (!visit) notFound()

  const product    = visit.products as any
  const buyer      = visit.buyer as any
  const cover      = product?.product_images?.find((i: any) => i.is_cover)?.url ?? product?.product_images?.[0]?.url
  const cfg        = statusConfig[visit.status as keyof typeof statusConfig] ?? statusConfig.pending
  const StatusIcon = cfg.icon
  const buyerName  = buyer?.nome_fantasia ?? buyer?.razao_social ?? 'Comprador'

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/vendedor/visitas" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Solicitação de Visita</h1>
          <p className="text-sm text-muted-foreground">
            Recebida em {format(new Date(visit.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
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
          <p className="font-semibold">{product?.title ?? 'Produto'}</p>
          <Link href={`/produtos/${product?.id}`} className="text-xs text-primary hover:underline mt-0.5 block">
            Ver no marketplace
          </Link>
        </div>
      </div>

      {/* Data e hora */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Data proposta</h2>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium capitalize">
            {format(new Date(visit.proposed_date + 'T00:00:00'), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
        {visit.proposed_time && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>{(visit.proposed_time as string).slice(0, 5)}</span>
          </div>
        )}
      </div>

      {/* Comprador */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Comprador</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold shrink-0">
            {buyerName[0]}
          </div>
          <div>
            <p className="font-semibold text-sm">{buyerName}</p>
            {buyer?.cidade && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {buyer.cidade}, {buyer.estado}
              </p>
            )}
          </div>
        </div>

        {visit.message && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Mensagem do comprador
            </p>
            <p className="text-sm italic">"{visit.message}"</p>
          </div>
        )}
      </div>

      {/* Ações — visitas pendentes */}
      {visit.status === 'pending' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 p-5">
          <h2 className="font-semibold mb-1">Responder solicitação</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Confirme ou recuse para o comprador ser notificado.
          </p>
          <VisitActions visitId={visit.id} isSeller={true} />
        </div>
      )}

      {/* Visita confirmada */}
      {visit.status === 'accepted' && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/20 p-5 space-y-2">
          <h2 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Visita confirmada
          </h2>
          <p className="text-sm text-muted-foreground">
            O comprador foi notificado. Instruções de acesso, EPI necessário e restrições de portaria
            poderão ser adicionadas aqui (disponível no Sprint 4).
          </p>
        </div>
      )}
    </div>
  )
}
