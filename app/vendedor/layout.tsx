import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendedorShell from '@/components/vendedor/VendedorShell'

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: company }] = await Promise.all([
    supabase.from('profiles').select('role').eq('user_id', user.id).single(),
    supabase.from('companies').select('id, razao_social, nome_fantasia').eq('user_id', user.id).single(),
  ])

  if (!profile || !['vendedor', 'admin'].includes(profile.role)) redirect('/comprador')
  if (!company) redirect('/onboarding')

  // Busca badge counts em paralelo
  const [
    { count: activeProducts },
    { count: newPedidos },
    { count: pendingPropostas },
    { count: pendingVisits },
    { data: sellerConvIds },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true })
      .eq('company_id', company.id).eq('status', 'active').is('deleted_at', null),
    supabase.from('pedidos').select('*', { count: 'exact', head: true })
      .eq('vendedor_id', company.id)
      .not('status', 'in', '("concluido","cancelado","reembolsado")'),
    supabase.from('propostas').select('*', { count: 'exact', head: true })
      .eq('vendedor_id', company.id).eq('status', 'pendente').is('deleted_at', null),
    supabase.from('visit_requests').select('*', { count: 'exact', head: true })
      .eq('seller_id', company.id).eq('status', 'pending'),
    supabase.from('conversations').select('id').eq('seller_id', company.id),
  ])

  // Contar mensagens não lidas nas conversas onde sou vendedor
  let unreadMessages = 0
  if (sellerConvIds?.length) {
    const ids = sellerConvIds.map((c) => c.id)
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', ids)
      .eq('read', false)
      .neq('sender_id', company.id)
    unreadMessages = count ?? 0
  }

  const companyName = company.nome_fantasia ?? company.razao_social

  return (
    <VendedorShell
      companyName={companyName}
      userEmail={user.email ?? ''}
      badges={{
        activeProducts: activeProducts ?? 0,
        newPedidos: newPedidos ?? 0,
        pendingPropostas: pendingPropostas ?? 0,
        pendingVisits: pendingVisits ?? 0,
        unreadMessages,
      }}
    >
      {children}
    </VendedorShell>
  )
}
