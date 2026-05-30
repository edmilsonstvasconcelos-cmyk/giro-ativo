'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { aceitarProposta, recusarProposta } from '@/app/actions/propostas'
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'

export default function PropostaActions({ propostaId }: { propostaId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modal, setModal]   = useState<'recusar' | 'aceitar' | null>(null)
  const [motivo, setMotivo] = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleAceitar() {
    setModal(null); setError(null)
    startTransition(async () => {
      const res = await aceitarProposta(propostaId)
      if (res.error) { setError(res.error); return }
      setSuccess(res.message ?? 'Proposta aceita! Pedido criado.')
      setTimeout(() => router.push('/vendedor/pedidos'), 1500)
    })
  }

  function handleRecusar() {
    setError(null)
    startTransition(async () => {
      const res = await recusarProposta(propostaId, motivo || undefined)
      if (res.error) { setError(res.error); return }
      setModal(null)
      router.refresh()
    })
  }

  if (success) {
    return (
      <div className="p-4 rounded-xl border border-green-300 bg-green-50 dark:bg-green-500/10 flex items-center gap-3 text-green-700">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{success}</span>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">{error}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => setModal('aceitar')} disabled={isPending}
          className="flex-1 gradient-brand text-white hover:opacity-90 shadow-md shadow-primary/20 h-11">
          <CheckCircle className="w-4 h-4 mr-2" /> Aceitar proposta
        </Button>
        <Button onClick={() => setModal('recusar')} disabled={isPending}
          variant="outline" className="flex-1 h-11 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-500/10">
          <XCircle className="w-4 h-4 mr-2" /> Recusar
        </Button>
        <Button disabled variant="outline" className="flex-1 h-11 text-muted-foreground" title="Em desenvolvimento">
          Contra-propor
        </Button>
      </div>

      {/* Modal aceitar */}
      {modal === 'aceitar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Aceitar proposta</p>
                <p className="text-xs text-muted-foreground">Um pedido será criado automaticamente</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 mb-5">
              <p className="text-xs text-amber-700 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Ao aceitar, o comprador será notificado e terá 48h para efetuar o pagamento via escrow.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setModal(null)} disabled={isPending} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleAceitar} disabled={isPending}
                className="flex-1 gradient-brand text-white hover:opacity-90">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal recusar */}
      {modal === 'recusar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold">Recusar proposta</p>
                <p className="text-xs text-muted-foreground">O comprador será notificado</p>
              </div>
            </div>
            <div className="space-y-1.5 mb-5">
              <Label className="text-sm">Motivo (opcional)</Label>
              <textarea
                rows={3}
                placeholder="Ex: Preço abaixo do mínimo aceito..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setModal(null)} disabled={isPending} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleRecusar} disabled={isPending}
                variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Recusar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
