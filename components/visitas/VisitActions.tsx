'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function VisitActions({ visitId, isSeller }: { visitId: string; isSeller: boolean }) {
  const [loading, setLoading] = useState<'accept' | 'decline' | 'cancel' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function update(status: 'accepted' | 'declined' | 'cancelled') {
    const action = status === 'accepted' ? 'accept' : status === 'declined' ? 'decline' : 'cancel'
    setLoading(action)
    const { error } = await supabase
      .from('visit_requests')
      .update({ status })
      .eq('id', visitId)
    if (!error) router.refresh()
    setLoading(null)
  }

  if (isSeller) {
    return (
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={() => update('accepted')}
          disabled={loading !== null}
          className="gradient-brand text-white hover:opacity-90 h-7 text-xs"
        >
          {loading === 'accept' ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" />Aceitar</>}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => update('declined')}
          disabled={loading !== null}
          className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
        >
          {loading === 'decline' ? <span className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" /> : <><XCircle className="w-3 h-3 mr-1" />Recusar</>}
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => update('cancelled')}
      disabled={loading !== null}
      className="h-7 text-xs text-muted-foreground mt-3"
    >
      {loading === 'cancel' ? <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" /> : <><X className="w-3 h-3 mr-1" />Cancelar solicitação</>}
    </Button>
  )
}
