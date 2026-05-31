import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Minhas Visitas' }

const statusConfig = {
  pending:   { label: 'Aguardando',  color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Clock },
  accepted:  { label: 'Confirmada',  color: 'text-green-600 bg-green-500/10 border-green-500/20', icon: CheckCircle },
  declined:  { label: 'Recusada',    color: 'text-red-600 bg-red-500/10 border-red-500/20',       icon: XCircle },
  cancelled: { label: 'Cancelada',   color: 'text-slate-500 bg-muted border-border',               icon: XCircle },
}

export default async function CompradorVisitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) redirect('/comprador')

  const { data: visits } = await supabase
    .from('visit_requests')
    .select(`
      id, proposed_date, proposed_time, message, status, created_at,
      products ( id, title, product_images ( url, is_cover ) ),
      seller:companies!visit_requests_seller_id_fkey ( id, razao_social, nome_fantasia, cidade, estado )
    `)
    .eq('buyer_id', company.id)
    .order('proposed_date', { ascending: true })

  const now       = new Date().toISOString().split('T')[0]
  const upcoming  = visits?.filter((v) => ['pending', 'accepted'].includes(v.status) && v.proposed_date >= now) ?? []
  const completed = visits?.filter((v) => v.status === 'accepted' && v.proposed_date < now) ?? []
  const cancelled = visits?.filter((v) => ['declined', 'cancelled'].includes(v.status)) ?? []

  function VisitCard({ v }: { v: any }) {
    const produto    = v.products as any
    const vendedor   = v.seller as any
    const cfg        = statusConfig[v.status as keyof typeof statusConfig] ?? statusConfig.pending
    const StatusIcon = cfg.icon
    const vendorName = vendedor?.nome_fantasia ?? vendedor?.razao_social ?? 'Empresa'

    return (
      <Link href={`/comprador/visitas/${v.id}`}>
        <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold text-sm">{vendorName}</p>
              {vendedor?.cidade && <p className="text-xs text-muted-foreground">{vendedor.cidade}, {vendedor.estado}</p>}
              {produto && <p className="text-xs text-primary truncate">{produto.title}</p>}
            </div>
            <span className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${cfg.color}`}>
              <StatusIcon className="w-3 h-3" /> {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {format(new Date(v.proposed_date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            {v.proposed_time && ` às ${(v.proposed_time as string).slice(0, 5)}`}
          </div>
          {v.message && (
            <p className="text-xs text-muted-foreground mt-2 italic bg-muted rounded p-2 line-clamp-1">"{v.message}"</p>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Minhas visitas</h1>
          <p className="text-sm text-muted-foreground">{visits?.length ?? 0} solicitação(ões)</p>
        </div>
        <Link href="/comprador/busca?com_visita=1" className="text-sm text-primary hover:underline flex items-center gap-1">
          Agendar nova <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {!visits?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <Calendar className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhuma visita agendada</h3>
          <p className="text-sm text-muted-foreground">Solicite visitas técnicas na página dos produtos.</p>
          <Link href="/comprador/busca?com_visita=1" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver produtos com visita disponível <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Próximas ({upcoming.length})</h2>
              {upcoming.map((v) => <VisitCard key={v.id} v={v} />)}
            </section>
          )}
          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Realizadas ({completed.length})</h2>
              {completed.map((v) => <VisitCard key={v.id} v={v} />)}
            </section>
          )}
          {cancelled.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Canceladas / Recusadas ({cancelled.length})</h2>
              {cancelled.map((v) => <VisitCard key={v.id} v={v} />)}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
