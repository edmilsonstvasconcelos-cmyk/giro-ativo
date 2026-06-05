import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Package, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Minhas Propostas' }

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente:         { label: 'Aguardando vendedor', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Clock },
  aceita:           { label: 'Aceita',              color: 'text-green-600 bg-green-500/10 border-green-500/20', icon: CheckCircle },
  recusada:         { label: 'Recusada',            color: 'text-red-600 bg-red-500/10 border-red-500/20',      icon: XCircle },
  contra_proposta:  { label: 'Contra-proposta',     color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',   icon: AlertCircle },
  expirada:         { label: 'Expirada',            color: 'text-slate-500 bg-muted border-border',             icon: XCircle },
  cancelada:        { label: 'Cancelada',           color: 'text-slate-500 bg-muted border-border',             icon: XCircle },
}

interface SearchParams { filtro?: string }

export default async function CompradorPropostasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params   = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) redirect('/comprador')

  let query = supabase
    .from('propostas')
    .select(`
      id, preco_proposta, status, created_at, expira_at, respondida_at, mensagem,
      produto:produto_id ( id, title, price, unit, product_images ( url, is_cover ) ),
      vendedor:vendedor_id ( razao_social, nome_fantasia )
    `)
    .eq('comprador_id', company.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.filtro && params.filtro !== 'todas') {
    query = query.eq('status', params.filtro as import('@/types/supabase').PropostaStatus)
  }

  const { data: propostas } = await query

  const pendentes = propostas?.filter((p) => p.status === 'pendente') ?? []

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">Minhas propostas</h1>
        <p className="text-sm text-muted-foreground">{propostas?.length ?? 0} proposta(s)</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'todas',    label: 'Todas' },
          { value: 'pendente', label: `Aguardando${pendentes.length ? ` (${pendentes.length})` : ''}` },
          { value: 'aceita',   label: 'Aceitas' },
          { value: 'recusada', label: 'Recusadas' },
        ].map(({ value, label }) => (
          <Link key={value} href={`/comprador/propostas?filtro=${value}`}>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              (params.filtro ?? 'todas') === value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}>{label}</span>
          </Link>
        ))}
      </div>

      {!propostas?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhuma proposta enviada</h3>
          <p className="text-sm text-muted-foreground">Faça propostas nos produtos que tiver interesse.</p>
          <Link href="/comprador/busca" className="text-sm text-primary hover:underline flex items-center gap-1">
            Explorar produtos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {propostas.map((proposta) => {
            const produto    = proposta.produto as any
            const vendedor   = proposta.vendedor as any
            const cover      = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
            const cfg        = statusConfig[proposta.status] ?? statusConfig.pendente
            const Icon       = cfg.icon
            const vendorName = vendedor?.nome_fantasia ?? vendedor?.razao_social ?? 'Empresa'
            const priceDiff  = produto?.price ? ((proposta.preco_proposta - produto.price) / produto.price * 100) : null

            return (
              <Link key={proposta.id} href={`/comprador/propostas/${proposta.id}`}>
                <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
                  <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/30" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">{produto?.title}</p>
                        <p className="text-xs text-muted-foreground">{vendorName}</p>
                      </div>
                      <span className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-bold text-sm">
                        R$ {(proposta.preco_proposta as number).toLocaleString('pt-BR')}
                      </span>
                      {produto?.price && (
                        <span className="text-xs text-muted-foreground">
                          de R$ {(produto.price as number).toLocaleString('pt-BR')}
                        </span>
                      )}
                      {priceDiff !== null && (
                        <span className={`text-xs font-medium ${priceDiff < 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(proposta.created_at), { addSuffix: true, locale: ptBR })}
                      {proposta.expira_at && proposta.status === 'pendente' && (
                        <> · expira {formatDistanceToNow(new Date(proposta.expira_at), { addSuffix: true, locale: ptBR })}</>
                      )}
                    </p>
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
