import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Star, MessageSquare, ThumbsUp, TrendingUp } from 'lucide-react'

export const metadata = { title: 'Reputação' }

export default async function ReputacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('nota, nota_comunicacao, nota_produto, nota_pontualidade, comentario, created_at')
    .eq('avaliado_id', company.id)
    .eq('papel_avaliado', 'vendedor')
    .eq('publico', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const total = avaliacoes?.length ?? 0
  const avg   = (field: string) =>
    total ? (avaliacoes!.reduce((s, a) => s + ((a as any)[field] ?? 0), 0) / total).toFixed(1) : '—'

  const notaGeral = total
    ? (avaliacoes!.reduce((s, a) => s + (a.nota as number), 0) / total).toFixed(1)
    : null

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Reputação</h1>
        <p className="text-sm text-muted-foreground">Avaliações recebidas dos compradores</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Nota geral',    value: notaGeral ?? '—', icon: Star,        color: 'text-amber-500' },
          { label: 'Avaliações',    value: String(total),    icon: MessageSquare, color: 'text-blue-500' },
          { label: 'Comunicação',   value: avg('nota_comunicacao'), icon: ThumbsUp, color: 'text-teal-500' },
          { label: 'Pontualidade',  value: avg('nota_pontualidade'), icon: TrendingUp, color: 'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-xl border border-border bg-card text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Distribuição por estrelas */}
      {total > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Distribuição</h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count  = avaliacoes!.filter((a) => a.nota === star).length
              const pct    = total ? Math.round((count / total) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-4 text-right text-muted-foreground">{star}</span>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-xs text-muted-foreground text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!total ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <Star className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhuma avaliação ainda</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Quando transações forem concluídas, compradores poderão avaliar sua empresa aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-semibold">Avaliações recentes</h2>
          {avaliacoes!.map((av, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s < (av.nota as number) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(av.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {av.comentario && (
                <p className="text-sm text-muted-foreground italic">"{av.comentario}"</p>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {av.nota_comunicacao && <span>Comunicação: {av.nota_comunicacao}/5</span>}
                {av.nota_produto && <span>Produto: {av.nota_produto}/5</span>}
                {av.nota_pontualidade && <span>Pontualidade: {av.nota_pontualidade}/5</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
