import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CompradorNavbar from '@/components/comprador/Navbar'

export default async function CompradorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: company }] = await Promise.all([
    supabase.from('profiles').select('role, nome').eq('user_id', user.id).single(),
    supabase.from('companies').select('id, razao_social, nome_fantasia').eq('user_id', user.id).maybeSingle(),
  ])

  if (!profile || !['comprador', 'admin'].includes(profile.role)) redirect('/login')

  const companyId = company?.id ?? null

  // Badge counts — primeiro busca IDs de conversas do comprador
  let unreadMessages = 0
  let pendingProposals = 0
  let upcomingVisits = 0

  if (companyId) {
    const [
      { data: buyerConvIds },
      { count: propCount },
      { count: visitCount },
    ] = await Promise.all([
      supabase.from('conversations').select('id').eq('buyer_id', companyId),
      supabase.from('propostas').select('*', { count: 'exact', head: true })
        .eq('comprador_id', companyId).eq('status', 'pendente').is('deleted_at', null),
      supabase.from('visit_requests').select('*', { count: 'exact', head: true })
        .eq('buyer_id', companyId).eq('status', 'accepted')
        .gte('proposed_date', new Date().toISOString().split('T')[0])
        .lte('proposed_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]),
    ])

    pendingProposals = propCount ?? 0
    upcomingVisits   = visitCount ?? 0

    if (buyerConvIds?.length) {
      const convIds = buyerConvIds.map((c) => c.id)
      const { count } = await supabase
        .from('messages').select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .eq('read', false)
        .neq('sender_id', companyId)
      unreadMessages = count ?? 0
    }
  }

  const displayName = profile.nome ?? company?.nome_fantasia ?? company?.razao_social ?? 'Comprador'

  return (
    <div className="min-h-screen flex flex-col">
      <CompradorNavbar
        displayName={displayName}
        userEmail={user.email ?? ''}
        badges={{
          unreadMessages: unreadMessages ?? 0,
          pendingProposals: pendingProposals ?? 0,
          upcomingVisits: upcomingVisits ?? 0,
        }}
      />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
