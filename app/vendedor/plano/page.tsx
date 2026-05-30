import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CheckCircle, Zap, Star, Building2 } from 'lucide-react'

export const metadata = { title: 'Meu Plano' }

const planoIcons: Record<string, React.ElementType> = {
  basico: Zap, pro: Star, enterprise: Building2,
}

const planoFeatures: Record<string, string[]> = {
  basico:     ['Até 5 produtos ativos', '3 fotos por produto', 'Comissão 3%', 'Chat e visitas'],
  pro:        ['Produtos ilimitados', '10 fotos por produto', 'Comissão 2%', 'Analytics', '2 laudos/mês'],
  enterprise: ['Tudo do Pro', 'Laudos ilimitados', 'API de integração', 'Conta gerenciada', 'Suporte prioritário'],
}

export default async function VendedorPlanoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, periodo, expira_em, planos(nome, preco_mensal, preco_anual)')
    .eq('empresa_id', company.id)
    .eq('status', 'ativa')
    .single()

  const { data: todosPlanos } = await supabase
    .from('planos').select('*').eq('ativo', true).order('preco_mensal', { ascending: true })

  const planoAtual = (assinatura?.planos as any)?.nome ?? 'basico'
  const Icon = planoIcons[planoAtual] ?? Zap

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Meu Plano</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua assinatura GiroAtivo</p>
      </div>

      {/* Plano atual */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg capitalize">Plano {planoAtual}</p>
            <p className="text-sm text-muted-foreground">
              {assinatura?.status === 'ativa' ? 'Ativo' : 'Trial'}
              {assinatura?.expira_em && ` · expira em ${new Date(assinatura.expira_em).toLocaleDateString('pt-BR')}`}
            </p>
          </div>
        </div>
        <ul className="space-y-1.5">
          {(planoFeatures[planoAtual] ?? []).map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Outros planos */}
      <div>
        <h2 className="font-semibold mb-4">Fazer upgrade</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {todosPlanos?.filter((p) => p.nome !== planoAtual).map((p) => {
            const PIcon = planoIcons[p.nome] ?? Zap
            return (
              <div key={p.id} className={`p-5 rounded-xl border bg-card relative ${p.nome === 'pro' ? 'border-primary/40 shadow-lg shadow-primary/10' : 'border-border'}`}>
                {p.nome === 'pro' && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-0.5 rounded-full">
                    Recomendado
                  </div>
                )}
                <PIcon className="w-5 h-5 text-primary mb-2" />
                <p className="font-bold capitalize">{p.nome}</p>
                <p className="text-xl font-bold mt-1">
                  R$ {p.preco_mensal.toLocaleString('pt-BR')}<span className="text-xs text-muted-foreground font-normal">/mês</span>
                </p>
                <ul className="mt-3 space-y-1">
                  {(planoFeatures[p.nome] ?? []).slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-4 gradient-brand text-white hover:opacity-90 text-sm" size="sm">
                  Fazer upgrade
                </Button>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Pagamentos com Pagar.me disponíveis em breve (Sprint 4).
        </p>
      </div>
    </div>
  )
}
