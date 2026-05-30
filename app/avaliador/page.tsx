import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { ClipboardList, MapPin, Camera, FileCheck } from 'lucide-react'

export const metadata = { title: 'Painel do Avaliador — Giro Ativo' }

export default async function AvaliadorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('nome, role').eq('user_id', user.id).single()

  if (!profile || !['avaliador', 'admin'].includes(profile.role)) redirect('/login')

  const { count: pendingLaudos } = await supabase
    .from('laudos').select('*', { count: 'exact', head: true })
    .eq('avaliador_id', profile.role === 'avaliador' ? user.id : '00000000-0000-0000-0000-000000000000')
    .in('status', ['atribuido', 'agendado'])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
          <ClipboardList className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Painel do Avaliador</h1>
        <p className="text-muted-foreground mb-8">
          Olá, <strong>{profile.nome ?? 'Avaliador'}</strong>. Você tem{' '}
          <strong>{pendingLaudos ?? 0}</strong> laudo(s) pendente(s).
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-left">
          {[
            { icon: ClipboardList, label: 'Ordens de laudo', desc: 'Visualize e execute laudos atribuídos a você', color: 'text-teal-400' },
            { icon: MapPin,        label: 'Check-in GPS',    desc: 'Registre sua chegada ao local de inspeção',   color: 'text-blue-400' },
            { icon: Camera,        label: 'Fotos do laudo',  desc: 'Capture os ângulos obrigatórios por categoria', color: 'text-purple-400' },
            { icon: FileCheck,     label: 'Emitir laudo',    desc: 'Assine digitalmente e emita o PDF final',     color: 'text-green-400' },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="p-5 rounded-xl border border-border bg-card">
              <Icon className={`w-6 h-6 ${color} mb-3`} />
              <p className="font-semibold text-sm mb-1">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          O app mobile do avaliador está em desenvolvimento (Sprint 4).
          Esta tela será substituída pela interface completa de execução de laudos.
        </p>
      </main>
    </div>
  )
}
