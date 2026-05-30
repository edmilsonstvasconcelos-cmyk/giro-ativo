import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ClipboardCheck, ArrowRight, AlertTriangle } from 'lucide-react'
import { format, isPast, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Laudos Técnicos' }

const statusConfig: Record<string, { label: string; color: string }> = {
  solicitado:   { label: 'Solicitado',    color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  atribuido:    { label: 'Atribuído',     color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20' },
  agendado:     { label: 'Agendado',      color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' },
  em_execucao:  { label: 'Em execução',   color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  concluido:    { label: 'Emitido',       color: 'text-green-600 bg-green-500/10 border-green-500/20' },
  cancelado:    { label: 'Cancelado',     color: 'text-red-600 bg-red-500/10 border-red-500/20' },
  expirado:     { label: 'Expirado',      color: 'text-slate-500 bg-muted border-border' },
}

export default async function VendedorLaudosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  // Laudos de produtos do vendedor
  const { data: myProductIds } = await supabase
    .from('products').select('id').eq('company_id', company.id).is('deleted_at', null)

  const ids = (myProductIds ?? []).map((p) => p.id)

  const { data: laudos } = ids.length
    ? await supabase
        .from('laudos')
        .select('id, status, modalidade, validade_ate, pdf_url, created_at, produtos:produto_id(id, title)')
        .in('produto_id', ids)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">Laudos Técnicos</h1>
        <p className="text-sm text-muted-foreground">Laudos solicitados para seus produtos</p>
      </div>

      {!laudos?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <ClipboardCheck className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhum laudo ainda</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Laudos são solicitados pelos compradores durante a negociação. Um produto com laudo tem maior conversão.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {laudos.map((laudo) => {
            const produto = laudo.produtos as { id: string; title: string } | null
            const cfg = statusConfig[laudo.status] ?? statusConfig.solicitado
            const expired = laudo.validade_ate ? isPast(new Date(laudo.validade_ate)) : false
            const expiringIn = laudo.validade_ate && !expired
              ? differenceInDays(new Date(laudo.validade_ate), new Date())
              : null

            return (
              <Link key={laudo.id} href={`/vendedor/laudos/${laudo.id}`}>
                <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
                  <div className="w-10 h-10 shrink-0 rounded-xl gradient-brand/10 border border-primary/20 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 justify-between">
                      <p className="font-semibold text-sm line-clamp-1">{produto?.title ?? 'Produto'}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded border font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{laudo.modalidade}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>Solicitado em {format(new Date(laudo.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      {laudo.validade_ate && (
                        <span className={`flex items-center gap-1 ${expired ? 'text-red-500' : expiringIn !== null && expiringIn <= 7 ? 'text-amber-600' : 'text-green-600'}`}>
                          {expired ? <AlertTriangle className="w-3 h-3" /> : null}
                          {expired ? 'Vencido' : expiringIn !== null && expiringIn <= 7 ? `Vence em ${expiringIn}d` : `Válido até ${format(new Date(laudo.validade_ate), 'dd/MM/yyyy')}`}
                        </span>
                      )}
                    </div>
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
