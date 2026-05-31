import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Package } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Mensagens' }

export default async function CompradorMensagensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).maybeSingle()

  if (!company) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-xl font-bold">Mensagens</h1>
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Chat disponível para empresas</h3>
          <p className="text-sm text-muted-foreground">Como comprador PF, use os botões de contato na página de cada produto.</p>
        </div>
      </div>
    )
  }

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, created_at,
      products ( id, title, product_images ( url, is_cover ) ),
      seller:companies!conversations_seller_id_fkey ( id, razao_social, nome_fantasia ),
      messages ( content, created_at, read, sender_id )
    `)
    .eq('buyer_id', company.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">Mensagens</h1>
        <p className="text-sm text-muted-foreground">{conversations?.length ?? 0} conversa(s)</p>
      </div>

      {!conversations?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground/30" />
          <h3 className="font-semibold">Nenhuma conversa ainda</h3>
          <p className="text-sm text-muted-foreground">
            Inicie uma conversa clicando em "Entrar em contato" na página de um produto.
          </p>
          <Link href="/comprador/busca" className="text-sm text-primary hover:underline">
            Explorar produtos →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const seller  = conv.seller as any
            const product = conv.products as any
            const msgs    = conv.messages as any[]
            const lastMsg = msgs?.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))[0]
            const unread  = msgs?.filter((m: any) => !m.read && m.sender_id !== company.id).length ?? 0
            const cover   = product?.product_images?.find((i: any) => i.is_cover)?.url ?? product?.product_images?.[0]?.url
            const sellerName = seller?.nome_fantasia ?? seller?.razao_social ?? 'Empresa'

            return (
              <Link key={conv.id} href={`/chat/${conv.id}`}
                className="flex gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 hover:bg-primary/5 transition-all">
                <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/40" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-semibold text-sm truncate">{sellerName}</span>
                    {lastMsg && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    )}
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
