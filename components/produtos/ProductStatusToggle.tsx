'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PauseCircle, PlayCircle } from 'lucide-react'

export default function ProductStatusToggle({
  productId,
  currentStatus,
}: {
  productId: string
  currentStatus: 'active' | 'paused'
}) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    const newStatus = status === 'active' ? 'paused' : 'active'
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', productId)

    if (!error) {
      setStatus(newStatus)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${status === 'active' ? 'text-amber-500 hover:text-amber-600' : 'text-green-500 hover:text-green-600'}`}
      onClick={toggle}
      disabled={loading}
      title={status === 'active' ? 'Pausar produto' : 'Ativar produto'}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : status === 'active' ? (
        <PauseCircle className="w-4 h-4" />
      ) : (
        <PlayCircle className="w-4 h-4" />
      )}
    </Button>
  )
}
