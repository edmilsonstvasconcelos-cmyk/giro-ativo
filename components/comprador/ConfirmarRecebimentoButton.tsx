'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmarRecebimento } from '@/app/actions/pedidos'
import { CheckCircle, Loader2, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ConfirmarRecebimentoButton({ pedidoId }: { pedidoId: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const router = useRouter()

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    const res = await confirmarRecebimento(pedidoId)
    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }
    setModalOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className="w-full gradient-brand text-white hover:opacity-90 shadow-md shadow-primary/20"
      >
        <CheckCircle className="w-4 h-4 mr-2" /> Confirmar recebimento
      </Button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && setModalOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Confirmar recebimento</h2>
              <button onClick={() => !loading && setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 flex items-start gap-2 text-sm text-amber-700">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Ao confirmar, o valor em escrow será <strong>liberado para o vendedor</strong>.
                Esta ação não pode ser desfeita. Confirme apenas se o produto foi recebido em boas condições.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 gradient-brand text-white hover:opacity-90"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirmando…</>
                  : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
