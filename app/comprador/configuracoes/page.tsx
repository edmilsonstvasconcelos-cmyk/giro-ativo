import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CompradorConfigForm from '@/components/comprador/CompradorConfigForm'

export const metadata = { title: 'Configurações' }

export default async function CompradorConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: company }] = await Promise.all([
    supabase.from('profiles')
      .select('nome, cpf, telefone, avatar_url')
      .eq('user_id', user.id)
      .single(),
    supabase.from('companies')
      .select('razao_social, nome_fantasia, cnpj')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados pessoais, notificações e privacidade</p>
      </div>

      <CompradorConfigForm
        profile={profile}
        company={company}
        userEmail={user.email ?? ''}
        userId={user.id}
      />
    </div>
  )
}
