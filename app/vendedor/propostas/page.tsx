import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FileText, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { formatDistanceToNow, differenceInHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Propostas Recebidas' }

const statusConfig = {
  pendente:  { label: 'Pendente',  color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', icon: Clock },
  aceita:    { label: 'Aceita',    color: 'text-green-600 bg-green-500/10 border-green-500/20', icon: CheckCircle },
  recusada:  { label: 'Recusada', color: 'text-red-600 bg-red-500/10 border-red-500/20',       icon: XCircle },
  expirada:  { label: 'Expirada', color: 'text-slate-500 bg-muted border-border',               icon: Clock },
  cancelada: { label: 'Cancelada',color: 'text-slate-500 bg-muted border-border',               icon: XCircle },
}

interface SearchParams { status?: string }

export default async function PropostasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  let query = supabase
    .from('propostas')
    .select('id, preco_proposta, mensagem, status, created_at, expira_at, respondida_at, produtos:produto_id(id, title, price, product_images(url, is_cover)), comprador:comprador_id(id, razao_social, nome_fantasia)')
    .eq('vendedor_id', company.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status as import('@/types/supabase').PropostaStatus)

  const { data: propostas } = await query

  const pending = propostas?.filter((p) => p.status === 'pendente') ?? []
  const others  = propostas?.filter((p) => p.status !== 'pendente') ?? []

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">Propostas Recebidas</h1>
        <p className="text-sm text-muted-foreground">{propostas?.length ?? 0} proposta(s)</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Todas', href: '/vendedor/propostas' },
          { label: 'Pendentes', href: '/vendedor/propostas?status=pendente' },
          { label: 'Aceitas', href: '/vendedor/propostas?status=aceita' },
          { label: 'Recusadas', href: '/vendedor/propostas?status=recusada' },
        ].map(({ label, href }) => (
          <Link key={href} href={href}>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              params.status === href.split('status=')[1] || (!params.status && label === 'Todas')
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}>{label}</span>
          </Link>
        ))}
      </div>

      {!propostas?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <FileText className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhuma proposta ainda</h3>
          <p className="text-sm text-muted-foreground">Quando compradores fizerem propostas nos seus produtos, elas aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pendentes em destaque */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4" /> Aguardando resposta ({pending.length})
              </h2>
              {pending.map((p) => <PropostaCard key={p.id} proposta={p} companyId={company.id} />)}
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-3">
              {pending.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Histórico</h2>}
              {others.map((p) => <PropostaCard key={p.id} proposta={p} companyId={company.id} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PropostaCard({ proposta, companyId }: { proposta: any; companyId: string }) {
  const produto  = proposta.produtos as { id: string; title: string; price: number | null; product_images: { url: string; is_cover: boolean }[] } | null
  const comprador= proposta.comprador as { id: string; razao_social: string; nome_fantasia: string | null } | null
  const cfg      = statusConfig[proposta.status as keyof typeof statusConfig] ?? statusConfig.pendente
  const StatusIcon = cfg.icon
  const cover    = produto?.product_images?.find((i) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
  const priceDiff= produto?.price ? ((proposta.preco_proposta - produto.price) / produto.price * 100) : null
  const isUrgent = proposta.status === 'pendente' && differenceInHours(new Date(), new Date(proposta.created_at)) >= 24
  const buyerName = comprador?.nome_fantasia ?? comprador?.razao_social ?? 'Comprador'

  return (
    <Link href={`/vendedor/propostas/${proposta.id}`}>
      <div className={`flex gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 transition-all ${isUrgent ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-500/5' : 'border-border'}`}>
        {/* Produto foto */}
        {cover && <img src={cover} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <p className="font-semibold text-sm line-clamp-1">{produto?.title}</p>
            <span className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${cfg.color}`}>
              <StatusIcon className="w-3 h-3" /> {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{buyerName}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
            <span className="font-bold text-foreground">
              R$ {(proposta.preco_proposta as number).toLocaleString('pt-BR')}
            </span>
            {priceDiff !== null && (
              <span className={`text-xs font-medium ${priceDiff < 0 ? 'text-red-500' : 'text-green-600'}`}>
                ({priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(1)}% do anunciado)
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(proposta.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          {proposta.mensagem && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">"{proposta.mensagem}"</p>}
        </div>

        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 self-center" />
      </div>
    </Link>
  )
}
