import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { Shield, Users, Package, AlertTriangle, BarChart2, Settings } from 'lucide-react'

export const metadata = { title: 'Admin — Giro Ativo' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('nome, role').eq('user_id', user.id).single()

  if (!profile || !['moderador', 'admin'].includes(profile.role)) redirect('/login')

  const [
    { count: totalUsers },
    { count: totalProducts },
    { count: pendingAlerts },
    { count: pendingModeration },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('bypass_alerts').select('*', { count: 'exact', head: true }).eq('resolvido', false),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('moderacao_status', 'pendente').is('deleted_at', null),
  ])

  const sections = [
    { href: '/admin/moderacao', icon: Package, label: 'Moderação de produtos', value: pendingModeration ?? 0, desc: 'pendentes de revisão', color: 'text-amber-400' },
    { href: '/admin/usuarios',  icon: Users,   label: 'Usuários',              value: totalUsers ?? 0,       desc: 'cadastrados',       color: 'text-blue-400' },
    { href: '/admin/produtos',  icon: Package, label: 'Todos os produtos',     value: totalProducts ?? 0,    desc: 'no marketplace',    color: 'text-teal-400' },
    { href: '/admin/alertas',   icon: AlertTriangle, label: 'Alertas anti-bypass', value: pendingAlerts ?? 0, desc: 'não resolvidos', color: 'text-red-400' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">
              Logado como <strong>{profile.nome}</strong> · {profile.role}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {sections.map(({ href, icon: Icon, label, value, desc, color }) => (
            <Link key={href} href={href}>
              <div className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`w-6 h-6 ${color}`} />
                  <span className="text-2xl font-bold">{value}</span>
                </div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/admin/moderacao" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
            <BarChart2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Moderação</p>
              <p className="text-xs text-muted-foreground">Aprovar / reprovar anúncios</p>
            </div>
          </Link>
          <Link href="/admin/configuracoes" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
            <Settings className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Configurações</p>
              <p className="text-xs text-muted-foreground">Planos, taxas e parâmetros</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
