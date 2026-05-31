'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelarProposta } from '@/app/actions/propostas'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'

export default function CancelarPropostaButton({ propostaId }: { propostaId: string }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const router = useRouter()

  async function handleCancel() {
    if (!confirm('Tem certeza que deseja cancelar esta proposta?')) return
    setLoading(true)
    setError(null)
    const res = await cancelarProposta(propostaId)
    if (res.error) { setError(res.error); setLoading(false); return }
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={loading}
        className="w-full text-red-600 border-red-200 hover:bg-red-50"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelando…</>
          : <><X className="w-4 h-4 mr-2" /> Cancelar proposta</>}
      </Button>
    </div>
  )
}
