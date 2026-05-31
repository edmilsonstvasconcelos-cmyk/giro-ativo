import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardCheck, Calendar, CheckCircle, FileDown, AlertTriangle, Package } from 'lucide-react'
import { format, isPast, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Detalhe do Laudo' }

const statusSteps = [
  { key: 'solicitado',  label: 'Solicitado' },
  { key: 'atribuido',   label: 'Atribuído ao avaliador' },
  { key: 'agendado',    label: 'Vistoria agendada' },
  { key: 'em_execucao', label: 'Em execução' },
  { key: 'concluido',   label: 'Laudo emitido' },
]

const statusColors: Record<string, string> = {
  solicitado:  'text-blue-600 bg-blue-500/10 border-blue-500/20',
  atribuido:   'text-indigo-600 bg-indigo-500/10 border-indigo-500/20',
  agendado:    'text-purple-600 bg-purple-500/10 border-purple-500/20',
  em_execucao: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  concluido:   'text-green-600 bg-green-500/10 border-green-500/20',
  cancelado:   'text-red-600 bg-red-500/10 border-red-500/20',
  expirado:    'text-slate-500 bg-muted border-border',
}

const statusLabels: Record<string, string> = {
  solicitado:  'Solicitado', atribuido: 'Atribuído', agendado: 'Agendado',
  em_execucao: 'Em execução', concluido: 'Emitido', cancelado: 'Cancelado', expirado: 'Expirado',
}

export default async function CompradorLaudoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).maybeSingle()
  if (!company) redirect('/comprador')

  const { data: laudo } = await supabase
    .from('laudos')
    .select(`
      id, status, modalidade, validade_ate, pdf_url, created_at,
      data_agendada, hora_agendada, classificacao_condicao,
      valor_mercado_sugerido, observacoes,
      produto:produto_id ( id, title, product_images ( url, is_cover ) ),
      avaliador:avaliador_id ( id, razao_social, nome_fantasia )
    `)
    .eq('id', id)
    .eq('solicitante_id', company.id)
    .single()

  if (!laudo) notFound()

  const produto    = laudo.produto as any
  const avaliador  = laudo.avaliador as any
  const cover      = produto?.product_images?.find((i: any) => i.is_cover)?.url ?? produto?.product_images?.[0]?.url
  const expired    = laudo.validade_ate ? isPast(new Date(laudo.validade_ate)) : false
  const expiresIn  = laudo.validade_ate && !expired
    ? differenceInDays(new Date(laudo.validade_ate), new Date()) : null
  const currentIdx = statusSteps.findIndex((s) => s.key === laudo.status)

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/comprador/laudos" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Laudo Técnico</h1>
          <p className="text-sm text-muted-foreground">
            Solicitado em {format(new Date(laudo.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border font-semibold shrink-0 ${statusColors[laudo.status] ?? ''}`}>
          {statusLabels[laudo.status] ?? laudo.status}
        </span>
      </div>

      {/* Produto */}
      <div className="rounded-xl border border-border bg-card p-4 flex gap-4">
        <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
          {cover
            ? <img src={cover} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/30" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{produto?.title ?? 'Produto'}</p>
          <p className="text-xs text-muted-foreground capitalize">{laudo.modalidade}</p>
          <Link href={`/produtos/${produto?.id}`} className="text-xs text-primary hover:underline">Ver no marketplace</Link>
        </div>
      </div>

      {/* Timeline */}
      {!['cancelado', 'expirado'].includes(laudo.status) && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Progresso</h2>
          <div className="space-y-0">
            {statusSteps.map((step, i) => {
              const done    = i <= currentIdx
              const current = i === currentIdx
              const isLast  = i === statusSteps.length - 1
              return (
                <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? 'gradient-brand' : 'bg-muted border border-border'}`}>
                      <CheckCircle className={`w-3.5 h-3.5 ${done ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    {!isLast && <div className={`w-px flex-1 mt-1 min-h-[20px] ${done && i < currentIdx ? 'bg-primary' : 'bg-border'}`} />}
                  </div>
                  <div className="flex-1 pb-1">
                    <p className={`text-sm font-medium leading-7 ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                    {current && laudo.data_agendada && step.key === 'agendado' && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(laudo.data_agendada + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        {laudo.hora_agendada ? ` às ${(laudo.hora_agendada as string).slice(0, 5)}` : ''}
                      </p>
                    )}
                  </div>
                  {current && <span className="text-xs text-primary font-semibold shrink-0 mt-1.5">Atual</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {avaliador && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-2">Avaliador responsável</h2>
          <p className="font-medium text-sm">{avaliador.nome_fantasia ?? avaliador.razao_social}</p>
        </div>
      )}

      {laudo.status === 'concluido' && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/20 p-5 space-y-4">
          <h2 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" /> Laudo emitido
          </h2>
          {laudo.classificacao_condicao && (
            <div>
              <p className="text-xs text-muted-foreground">Condição classificada</p>
              <p className="font-semibold capitalize">{laudo.classificacao_condicao as string}</p>
            </div>
          )}
          {laudo.valor_mercado_sugerido && (
            <div>
              <p className="text-xs text-muted-foreground">Valor de mercado sugerido</p>
              <p className="font-semibold">R$ {(laudo.valor_mercado_sugerido as number).toLocaleString('pt-BR')}</p>
            </div>
          )}
          {laudo.validade_ate && (
            <p className={`text-sm font-medium flex items-center gap-2 ${expired ? 'text-red-600' : expiresIn !== null && expiresIn <= 7 ? 'text-amber-600' : 'text-green-700 dark:text-green-300'}`}>
              {(expired || (expiresIn !== null && expiresIn <= 7)) && <AlertTriangle className="w-4 h-4 shrink-0" />}
              {expired ? `Laudo vencido em ${format(new Date(laudo.validade_ate), 'dd/MM/yyyy')}` :
                expiresIn !== null && expiresIn <= 7 ? `Vence em ${expiresIn} dias` :
                `Válido até ${format(new Date(laudo.validade_ate), 'dd/MM/yyyy')}`}
            </p>
          )}
          {laudo.pdf_url ? (
            <a href={laudo.pdf_url as string} target="_blank" rel="noopener noreferrer">
              <Button className="gradient-brand text-white hover:opacity-90 w-full">
                <FileDown className="w-4 h-4 mr-2" /> Baixar PDF do Laudo
              </Button>
            </a>
          ) : <p className="text-xs text-muted-foreground">PDF sendo gerado…</p>}
        </div>
      )}

      {laudo.observacoes && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-2">Observações do avaliador</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{laudo.observacoes as string}</p>
        </div>
      )}
    </div>
  )
}
