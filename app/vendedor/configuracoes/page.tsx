import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConfiguracoesForm from '@/components/vendedor/ConfiguracoesForm'

export const metadata = { title: 'Configurações' }

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: company }, { data: profile }] = await Promise.all([
    supabase.from('companies')
      .select('razao_social, nome_fantasia, cnpj, telefone, cidade, estado')
      .eq('user_id', user.id)
      .single(),
    supabase.from('profiles')
      .select('nome, cpf, telefone')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!company) redirect('/onboarding')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da empresa, responsável e preferências</p>
      </div>

      <ConfiguracoesForm company={company} profile={profile} />
    </div>
  )
}
