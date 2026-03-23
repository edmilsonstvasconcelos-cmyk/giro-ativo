import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle, XCircle, Clock, Package, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import VisitActions from '@/components/visitas/VisitActions'

export const metadata = { title: 'Visitas Técnicas' }

export default async function VisitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!company) redirect('/onboarding')

  const { data: visits } = await supabase
    .from('visit_requests')
    .select(`
      id, proposed_date, proposed_time, message, status, created_at,
      products ( id, title, product_images ( url, is_cover ) ),
      buyer:companies!visit_requests_buyer_id_fkey ( id, razao_social, nome_fantasia ),
      seller:companies!visit_requests_seller_id_fkey ( id, razao_social, nome_fantasia )
    `)
    .or(`buyer_id.eq.${company.id},seller_id.eq.${company.id}`)
    .order('created_at', { ascending: false })

  const statusConfig = {
    pending: { label: 'Aguardando', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Clock },
    accepted: { label: 'Aceita', color: 'text-green-600 bg-green-500/10 border-green-500/20', icon: CheckCircle },
    declined: { label: 'Recusada', color: 'text-red-600 bg-red-500/10 border-red-500/20', icon: XCircle },
    cancelled: { label: 'Cancelada', color: 'text-slate-500 bg-muted border-border', icon: XCircle },
  }

  const sent = visits?.filter((v) => ((v.buyer as unknown) as { id: string }).id === company.id) ?? []
  const received = visits?.filter((v) => ((v.seller as unknown) as { id: string }).id === company.id) ?? []

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Visitas Técnicas</h1>

        {/* Received (as seller) */}
        {received.length > 0 && (
          <section className="mb-8">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Recebidas ({received.length})
            </h2>
            <div className="space-y-3">
              {received.map((v) => {
                const buyer = (v.buyer as unknown) as { id: string; razao_social: string; nome_fantasia: string | null }
                const product = (v.products as unknown) as { id: string; title: string } | null
                const cfg = statusConfig[v.status as keyof typeof statusConfig]
                const StatusIcon = cfg.icon
                const isSeller = true

                return (
                  <div key={v.id} className="p-4 rounded-xl border border-border bg-card flex gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-xl gradient-brand/10 border border-primary/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 justify-between">
                        <div>
                          <p className="font-semibold text-sm">{buyer.nome_fantasia ?? buyer.razao_social}</p>
                          {product && <p className="text-xs text-muted-foreground truncate">{product.title}</p>}
                        </div>
                        <span className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-medium ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(v.proposed_date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {v.proposed_time && ` às ${v.proposed_time.slice(0, 5)}`}
                        </span>
                      </div>
                      {v.message && (
                        <p className="text-xs text-muted-foreground mt-1.5 bg-muted rounded-lg p-2 italic">&ldquo;{v.message}&rdquo;</p>
                      )}
                      {v.status === 'pending' && <VisitActions visitId={v.id} isSeller={isSeller} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Sent (as buyer) */}
        <section>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Enviadas ({sent.length})
          </h2>
          {sent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-dashed border-border text-center">
              <Calendar className="w-16 h-16 text-muted-foreground/30" />
              <h3 className="font-semibold">Nenhuma visita solicitada</h3>
              <p className="text-sm text-muted-foreground">
                Solicite uma visita técnica na página de qualquer produto.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sent.map((v) => {
                const seller = (v.seller as unknown) as { id: string; razao_social: string; nome_fantasia: string | null }
                const product = (v.products as unknown) as { id: string; title: string } | null
                const cfg = statusConfig[v.status as keyof typeof statusConfig]
                const StatusIcon = cfg.icon

                return (
                  <div key={v.id} className="p-4 rounded-xl border border-border bg-card flex gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-xl gradient-brand/10 border border-primary/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 justify-between">
                        <div>
                          <p className="font-semibold text-sm">{seller.nome_fantasia ?? seller.razao_social}</p>
                          {product && <p className="text-xs text-muted-foreground truncate">{product.title}</p>}
                        </div>
                        <span className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-medium ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(v.proposed_date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {v.proposed_time && ` às ${v.proposed_time.slice(0, 5)}`}
                        </span>
                      </div>
                      {v.message && (
                        <p className="text-xs text-muted-foreground mt-1.5 bg-muted rounded-lg p-2 italic">&ldquo;{v.message}&rdquo;</p>
                      )}
                      {v.status === 'pending' && <VisitActions visitId={v.id} isSeller={false} />}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
