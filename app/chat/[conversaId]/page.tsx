import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ChatWindow from '@/components/chat/ChatWindow'

export default async function ChatRoomPage({ params }: { params: Promise<{ conversaId: string }> }) {
  const { conversaId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myCompany } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!myCompany) redirect('/onboarding')

  // Fetch conversation base data
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id, products ( title )')
    .eq('id', conversaId)
    .single()

  if (!conv) notFound()

  const buyerId = conv.buyer_id as string
  const sellerId = conv.seller_id as string

  // Auth check: only participants can access
  if (buyerId !== myCompany.id && sellerId !== myCompany.id) notFound()

  const otherId = buyerId === myCompany.id ? sellerId : buyerId

  // Fetch the other company's info
  const { data: otherCompany } = await supabase
    .from('companies')
    .select('id, razao_social, nome_fantasia')
    .eq('id', otherId)
    .single()

  if (!otherCompany) notFound()

  const product = (conv.products as unknown) as { title: string } | null


  // Fetch initial messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, sender_id, created_at, read')
    .eq('conversation_id', conversaId)
    .order('created_at', { ascending: true })

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 overflow-hidden">
        <div className="max-w-2xl mx-auto h-full">
          <ChatWindow
            conversationId={conversaId}
            myCompanyId={myCompany.id}
            otherCompany={otherCompany}
            productTitle={product?.title ?? null}
            initialMessages={messages ?? []}
          />
        </div>
      </main>
    </div>
  )
}
