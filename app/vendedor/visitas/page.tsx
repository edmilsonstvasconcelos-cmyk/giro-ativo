import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import VisitActions from '@/components/visitas/VisitActions'
import Link from 'next/link'

export const metadata = { title: 'Visitas Técnicas' }

const statusConfig = {
  pending:   { label: 'Aguardando', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Clock },
  accepted:  { label: 'Aceita',     color: 'text-green-600 bg-green-500/10 border-green-500/20', icon: CheckCircle },
  declined:  { label: 'Recusada',  color: 'text-red-600 bg-red-500/10 border-red-500/20',       icon: XCircle },
  cancelled: { label: 'Cancelada', color: 'text-slate-500 bg-muted border-border',               icon: XCircle },
}

export default async function VendedorVisitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  const { data: visits } = await supabase
    .from('visit_requests')
    .select(`
      id, proposed_date, proposed_time, message, status, created_at,
      products ( id, title, product_images ( url, is_cover ) ),
      buyer:companies!visit_requests_buyer_id_fkey ( id, razao_social, nome_fantasia, cidade, estado )
    `)
    .eq('seller_id', company.id)
    .order('proposed_date', { ascending: true })

  const pending   = visits?.filter((v) => v.status === 'pending')   ?? []
  const accepted  = visits?.filter((v) => v.status === 'accepted')  ?? []
  const historical= visits?.filter((v) => ['declined', 'cancelled'].includes(v.status)) ?? []

  function VisitCard({ v, isSeller }: { v: any; isSeller: boolean }) {
    const buyer   = v.buyer as any
    const product = v.products as any
    const cfg     = statusConfig[v.status as keyof typeof statusConfig]
    const StatusIcon = cfg.icon
    const buyerName  = buyer?.nome_fantasia ?? buyer?.razao_social ?? 'Comprador'

    return (
      <Link href={`/vendedor/visitas/${v.id}`}>
        <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl gradient-brand/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{buyerName}</p>
                  {buyer?.cidade && <p className="text-xs text-muted-foreground">{buyer.cidade}, {buyer.estado}</p>}
                  {product && <p className="text-xs text-primary truncate mt-0.5">{product.title}</p>}
                </div>
                <span className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${cfg.color}`}>
                  <StatusIcon className="w-3 h-3" /> {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {format(new Date(v.proposed_date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                {v.proposed_time && ` às ${(v.proposed_time as string).slice(0, 5)}`}
              </div>
              {v.message && <p className="text-xs text-muted-foreground mt-1.5 bg-muted rounded p-2 italic line-clamp-2">"{v.message}"</p>}
            </div>
          </div>
          {v.status === 'pending' && (
            <div onClick={(e) => e.preventDefault()}>
              <VisitActions visitId={v.id} isSeller={isSeller} />
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Visitas Técnicas</h1>
        <p className="text-sm text-muted-foreground">{visits?.length ?? 0} visita(s) solicitadas</p>
      </div>

      {!visits?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <Calendar className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhuma visita solicitada</h3>
          <p className="text-sm text-muted-foreground">Compradores podem solicitar visitas na página dos seus produtos.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Aguardando resposta ({pending.length})</h2>
              {pending.map((v) => <VisitCard key={v.id} v={v} isSeller={true} />)}
            </section>
          )}
          {accepted.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide">Confirmadas ({accepted.length})</h2>
              {accepted.map((v) => <VisitCard key={v.id} v={v} isSeller={true} />)}
            </section>
          )}
          {historical.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Histórico ({historical.length})</h2>
              {historical.map((v) => <VisitCard key={v.id} v={v} isSeller={true} />)}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
