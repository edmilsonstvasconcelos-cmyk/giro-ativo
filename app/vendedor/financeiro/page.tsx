import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Wallet, TrendingUp, Clock, ArrowDownToLine, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Financeiro' }

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  const now          = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: gmvData }, { count: pedidosAtivos }] = await Promise.all([
    supabase.from('pedidos')
      .select('valor_produto, valor_taxa_plataforma')
      .eq('vendedor_id', company.id)
      .eq('status', 'concluido')
      .gte('concluido_at', startOfMonth),
    supabase.from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('vendedor_id', company.id)
      .in('status', ['em_escrow', 'aguardando_entrega', 'entregue']),
  ])

  const gmvMes      = (gmvData ?? []).reduce((s: number, p: any) => s + ((p.valor_produto ?? 0) - (p.valor_taxa_plataforma ?? 0)), 0)
  const emEscrow    = pedidosAtivos ?? 0

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Repasses e saldo da conta</p>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <Wallet className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-xl font-bold text-muted-foreground">—</p>
          <p className="text-xs text-muted-foreground">Saldo disponível</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Integração Pagar.me — Sprint 4</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <Clock className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-xl font-bold">{emEscrow}</p>
          <p className="text-xs text-muted-foreground">Pedidos em escrow</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <TrendingUp className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-xl font-bold">
            {gmvMes > 0
              ? gmvMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
              : 'R$ 0'}
          </p>
          <p className="text-xs text-muted-foreground">Repasses este mês</p>
        </div>
      </div>

      {/* Banner placeholder */}
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl gradient-brand/10 border border-primary/20 flex items-center justify-center">
          <ArrowDownToLine className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">Módulo financeiro em desenvolvimento</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Extrato completo de repasses, comissões detalhadas e solicitação de saque estarão
            disponíveis no Sprint 4 com integração Pagar.me.
          </p>
        </div>
        <Link href="/vendedor/pedidos" className="text-sm text-primary hover:underline flex items-center gap-1">
          Ver pedidos recebidos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
