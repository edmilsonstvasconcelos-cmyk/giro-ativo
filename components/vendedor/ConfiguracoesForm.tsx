'use client'

import { useActionState } from 'react'
import { atualizarEmpresa } from '@/app/actions/empresa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface CompanyData {
  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null
  telefone: string | null
  cidade: string | null
  estado: string | null
}

interface ProfileData {
  nome: string | null
  cpf: string | null
  telefone: string | null
}

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

export default function ConfiguracoesForm({
  company,
  profile,
}: {
  company: CompanyData
  profile: ProfileData | null
}) {
  const [state, formAction, pending] = useActionState(atualizarEmpresa, null)

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Dados da empresa */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-semibold text-base">Dados da empresa</h2>

        <form action={formAction} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="razao_social">Razão social</Label>
              <Input
                id="razao_social"
                value={company.razao_social}
                disabled
                className="bg-muted/50 text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground">Não editável após cadastro</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={company.cnpj ?? ''}
                disabled
                className="bg-muted/50 text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nome_fantasia">Nome fantasia</Label>
            <Input
              id="nome_fantasia"
              name="nome_fantasia"
              defaultValue={company.nome_fantasia ?? ''}
              placeholder="Como sua empresa é conhecida no mercado"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone comercial</Label>
            <Input
              id="telefone"
              name="telefone"
              type="tel"
              defaultValue={company.telefone ?? ''}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                name="cidade"
                defaultValue={company.cidade ?? ''}
                placeholder="São Paulo"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estado">Estado</Label>
              <select
                id="estado"
                name="estado"
                defaultValue={company.estado ?? ''}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Selecione…</option>
                {ESTADOS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 text-sm text-red-600 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" /> {state.error}
            </div>
          )}
          {state?.success && (
            <div className="flex items-center gap-2 text-sm text-green-700 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200">
              <CheckCircle className="w-4 h-4 shrink-0" /> Alterações salvas com sucesso!
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="gradient-brand text-white hover:opacity-90"
          >
            {pending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando…</> : 'Salvar alterações'}
          </Button>
        </form>
      </section>

      {/* Dados do responsável — somente leitura */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-base">Responsável pela conta</h2>
          <p className="text-xs text-muted-foreground">Para alterar seus dados pessoais, entre em contato com o suporte.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={profile?.nome ?? '—'} disabled className="bg-muted/50 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <Label>CPF</Label>
            <Input
              value={profile?.cpf ? `***.***.${profile.cpf.slice(-6, -2)}-${profile.cpf.slice(-2)}` : '—'}
              disabled
              className="bg-muted/50 text-muted-foreground"
            />
          </div>
        </div>
      </section>

      {/* Notificações — placeholder */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-base">Notificações</h2>
          <p className="text-xs text-muted-foreground">Configuração de alertas por e-mail e push — disponível no Sprint 4.</p>
        </div>
        <div className="space-y-3 opacity-50 pointer-events-none select-none">
          {[
            'Nova proposta recebida',
            'Visita técnica solicitada',
            'Pedido confirmado',
            'Mensagem de comprador',
            'Laudo emitido',
          ].map((label) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <div className="w-10 h-5 rounded-full bg-primary/30" />
            </div>
          ))}
        </div>
      </section>

      {/* LGPD */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-base mb-2">Privacidade e LGPD</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Acesse o portal do titular para ver, exportar ou excluir seus dados pessoais conforme
          a Lei Geral de Proteção de Dados.
        </p>
        <a
          href="mailto:privacidade@giroativo.com.br"
          className="text-sm text-primary hover:underline"
        >
          Solicitar dados → privacidade@giroativo.com.br
        </a>
      </section>
    </div>
  )
}
