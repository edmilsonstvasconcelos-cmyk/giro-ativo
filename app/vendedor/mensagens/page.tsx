import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Package } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Mensagens' }

export default async function VendedorMensagensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
  if (!company) redirect('/onboarding')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, created_at,
      products ( id, title, product_images ( url, is_cover ) ),
      buyer:companies!conversations_buyer_id_fkey ( id, razao_social, nome_fantasia ),
      messages ( content, created_at, read, sender_id )
    `)
    .eq('seller_id', company.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Mensagens</h1>
        <p className="text-sm text-muted-foreground">{conversations?.length ?? 0} conversa(s)</p>
      </div>

      {!conversations?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhuma conversa ainda</h3>
          <p className="text-sm text-muted-foreground">Compradores interessados nos seus produtos iniciarão conversas aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const buyer   = conv.buyer as any
            const product = conv.products as any
            const msgs    = conv.messages as any[]
            const lastMsg = msgs?.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
            const unread  = msgs?.filter((m) => !m.read && m.sender_id !== company.id).length ?? 0
            const cover   = product?.product_images?.find((i: any) => i.is_cover)?.url ?? product?.product_images?.[0]?.url
            const buyerName = buyer?.nome_fantasia ?? buyer?.razao_social ?? 'Comprador'

            return (
              <Link key={conv.id} href={`/chat/${conv.id}`}
                className="flex gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 hover:bg-primary/5 transition-all">
                <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/40" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-semibold text-sm truncate">{buyerName}</span>
                    {lastMsg && <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true, locale: ptBR })}
                    </span>}
                  </div>
                  {product && <p className="text-xs text-primary truncate">{product.title}</p>}
                  {lastMsg && <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg.content}</p>}
                </div>
                {unread > 0 && (
                  <div className="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                    {unread}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
