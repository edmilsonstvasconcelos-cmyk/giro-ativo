'use client'

import { useActionState } from 'react'
import { atualizarPerfil } from '@/app/actions/perfil'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  profile:   { nome: string | null; cpf: string | null; telefone: string | null; avatar_url: string | null } | null
  company:   { razao_social: string; nome_fantasia: string | null; cnpj: string | null } | null
  userEmail: string
  userId:    string
}

const notifLabels = [
  'Proposta respondida pelo vendedor',
  'Visita técnica confirmada',
  'Laudo emitido',
  'Novos produtos compatíveis com meu perfil',
  'Comunicações de marketing',
]

export default function CompradorConfigForm({ profile, company, userEmail }: Props) {
  const [state, formAction, pending] = useActionState(atualizarPerfil, null)

  return (
    <div className="space-y-8">
      {/* Dados pessoais */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-semibold text-base">Dados pessoais</h2>

        <form action={formAction} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={profile?.nome ?? ''} placeholder="Seu nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={userEmail} disabled className="bg-muted/50 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Não editável após cadastro</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" type="tel" defaultValue={profile?.telefone ?? ''} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={profile?.cpf
                  ? `***.***.${profile.cpf.slice(-6, -2)}-${profile.cpf.slice(-2)}`
                  : '—'}
                disabled
                className="bg-muted/50 text-muted-foreground"
              />
            </div>
          </div>

          {company && (
            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label>Razão social</Label>
                <Input value={company.razao_social} disabled className="bg-muted/50 text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input value={company.cnpj ?? '—'} disabled className="bg-muted/50 text-muted-foreground" />
              </div>
            </div>
          )}

          {state?.error && (
            <div className="flex items-center gap-2 text-sm text-red-600 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" /> {state.error}
            </div>
          )}
          {state?.success && (
            <div className="flex items-center gap-2 text-sm text-green-700 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200">
              <CheckCircle className="w-4 h-4 shrink-0" /> Alterações salvas!
            </div>
          )}

          <Button type="submit" disabled={pending} className="gradient-brand text-white hover:opacity-90">
            {pending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando…</> : 'Salvar alterações'}
          </Button>
        </form>
      </section>

      {/* Notificações — placeholder */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-base">Notificações</h2>
          <p className="text-xs text-muted-foreground">Configuração disponível no Sprint 5.</p>
        </div>
        <div className="space-y-3 opacity-50 pointer-events-none">
          {notifLabels.map((label) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <div className="w-10 h-5 rounded-full bg-primary/30" />
            </div>
          ))}
        </div>
      </section>

      {/* Privacidade */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-semibold text-base">Privacidade e LGPD</h2>
        <p className="text-sm text-muted-foreground">
          Você tem direito de acessar, corrigir, exportar ou excluir seus dados pessoais
          conforme a Lei Geral de Proteção de Dados (LGPD).
        </p>
        <a href="mailto:privacidade@giroativo.com.br" className="text-sm text-primary hover:underline block">
          Solicitar dados → privacidade@giroativo.com.br
        </a>
        <button className="text-sm text-red-500 hover:underline text-left">
          Excluir minha conta (solicitar via suporte)
        </button>
      </section>
    </div>
  )
}
