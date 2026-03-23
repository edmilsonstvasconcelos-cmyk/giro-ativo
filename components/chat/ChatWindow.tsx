'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  read: boolean
}

interface Company {
  id: string
  razao_social: string
  nome_fantasia: string | null
}

interface ChatWindowProps {
  conversationId: string
  myCompanyId: string
  otherCompany: Company
  productTitle: string | null
  initialMessages: Message[]
}

export default function ChatWindow({
  conversationId,
  myCompanyId,
  otherCompany,
  productTitle,
  initialMessages,
}: ChatWindowProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          )
        }
      )
      .subscribe()

    // Mark messages as read
    supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', myCompanyId)
      .then(() => {})

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, myCompanyId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: myCompanyId,
      content,
    })

    if (error) setInput(content) // restore on error
    setSending(false)
  }

  const otherName = otherCompany.nome_fantasia ?? otherCompany.razao_social

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-16">
        <Link href="/chat" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm">
          {otherName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm">{otherName}</p>
          {productTitle && <p className="text-xs text-muted-foreground truncate max-w-xs">{productTitle}</p>}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center">
              Inicie a conversa sobre este produto!
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === myCompanyId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'gradient-brand text-white rounded-br-sm shadow-md shadow-primary/20'
                    : 'bg-muted text-foreground rounded-bl-sm border border-border'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-muted-foreground'} text-right`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: false, locale: ptBR })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-3 border-t border-border bg-card"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
