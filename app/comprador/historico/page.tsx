import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, Package, ArrowRight, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Histórico de Compras' }

const periodos = [
  { value: '1',  label: 'Este mês' },
  { value: '3',  label: 'Últimos 3 meses' },
  { value: '12', label: 'Último ano' },
  { value: '0',  label: 'Tudo' },
]

interface SearchParams { periodo?: string }

export default async function HistoricoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params   = await searchParams
  const periodo  = Number(params.periodo ?? '3')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) redirect('/comprador')

  let query = supabase
    .from('pedidos')
    .select(`
      id, valor_total, created_at, concluido_at, metodo_pagamento,
      produto:produto_id ( id, title, status, product_images ( url, is_cover ) ),
      vendedor:vendedor_id ( razao_social, nome_fantasia )
    `)
    .eq('comprador_id', company.id)
    .eq('status', 'concluido')
    .is('deleted_at', null)
    .order('concluido_at', { ascending: false })

  if (periodo > 0) {
    const desde = new Date(Date.now() - periodo * 30 * 86400000).toISOString()
    query = query.gte('concluido_at', desde)
  }

  const { data: pedidos } = await query

  const total = (pedidos ?? []).reduce((s, p) => s + (p.valor_total as number), 0)

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Histórico de compras</h1>
          <p className="text-sm text-muted-foreground">{pedidos?.length ?? 0} pedido(s) concluído(s)</p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total no período</p>
            <p className="text-xl font-bold text-primary">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        )}
      </div>

      {/* Filtro de período */}
      <div className="flex gap-2 flex-wrap">
        {periodos.map((p) => (
          <Link key={p.value} href={`/comprador/historico?periodo=${p.value}`}>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              String(periodo) === p.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}>{p.label}</span>
          </Link>
        ))}
      </div>

      {!pedidos?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhuma compra no período</h3>
          <Link href="/comprador/busca" className="text-sm text-primary hover:underline flex items-center gap-1">
            Explorar produtos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const produto   = pedido.produto as any
            const vendedor  = pedido.vendedor as any
            const cover     = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
            const vendorName= vendedor?.nome_fantasia ?? vendedor?.razao_social ?? 'Empresa'

            return (
              <div key={pedido.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/30" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">{produto?.title ?? 'Produto'}</p>
                  <p className="text-xs text-muted-foreground">{vendorName}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="font-bold text-sm">
                      {(pedido.valor_total as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {pedido.concluido_at
                        ? format(new Date(pedido.concluido_at), 'dd/MM/yyyy', { locale: ptBR })
                        : format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-700 font-medium">Concluído</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 justify-center">
                  {produto?.status === 'active' && (
                    <Link href={`/produtos/${produto.id}`}>
                      <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <RefreshCw className="w-3 h-3" /> Comprar novamente
                      </button>
                    </Link>
                  )}
                  <Link href={`/comprador/pedidos/${pedido.id}`}>
                    <button className="text-xs text-muted-foreground hover:text-foreground">Ver detalhes</button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
