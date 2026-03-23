'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

export default function ContactSellerButton({ productId, sellerId }: { productId: string; sellerId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleContact() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get buyer's company
    const { data: buyer } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!buyer) {
      router.push('/onboarding')
      return
    }

    if (buyer.id === sellerId) {
      alert('Você não pode iniciar uma conversa com você mesmo.')
      setLoading(false)
      return
    }

    // Get or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('product_id', productId)
      .eq('buyer_id', buyer.id)
      .eq('seller_id', sellerId)
      .single()

    if (existing) {
      router.push(`/chat/${existing.id}`)
      return
    }

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ product_id: productId, buyer_id: buyer.id, seller_id: sellerId })
      .select('id')
      .single()

    if (!error && newConv) {
      router.push(`/chat/${newConv.id}`)
    }
    setLoading(false)
  }

  return (
    <Button
      onClick={handleContact}
      disabled={loading}
      className="w-full gradient-brand text-white shadow-md shadow-primary/20 hover:opacity-90"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          <MessageSquare className="w-4 h-4 mr-2" />
          Falar com vendedor
        </>
      )}
    </Button>
  )
}
