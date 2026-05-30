'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator'
import { registerCompradorPF, registerCompradorPJ } from '@/app/actions/auth'
import { ArrowLeft, ArrowRight, Search, CheckCircle, Loader2 } from 'lucide-react'

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

function formatCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatCNPJ(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatTel(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

export default function CadastroCompradorPage() {
  const [tipo, setTipo] = useState<'pf' | 'pj'>('pj')
  const [senha, setSenha] = useState('')
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjFound, setCnpjFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [pfForm, setPFForm] = useState({ nome: '', cpf: '', email: '', senha: '', telefone: '' })
  const [pjForm, setPJForm] = useState({
    cnpj: '', razao_social: '', nome_fantasia: '', nome_responsavel: '',
    email: '', senha: '', telefone: '', cidade: '', estado: '',
  })
  const [aceites, setAceites] = useState({ termos: false, marketing: false, analytics: false })

  async function lookupCNPJ() {
    const digits = pjForm.cnpj.replace(/\D/g, '')
    if (digits.length !== 14) { setError('CNPJ incompleto'); return }
    setCnpjLoading(true); setError(null)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPJForm((p) => ({
        ...p,
        razao_social: data.razao_social ?? '',
        nome_fantasia: data.nome_fantasia ?? '',
        cidade: data.municipio ?? '',
        estado: data.uf ?? '',
      }))
      setCnpjFound(true)
    } catch {
      setError('CNPJ não encontrado na Receita Federal.')
    } finally {
      setCnpjLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!aceites.termos) { setError('Aceite os Termos de Uso para continuar.'); return }

    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = tipo === 'pf'
        ? await registerCompradorPF(fd)
        : await registerCompradorPJ(fd)
      if (result?.error) setError(result.error)
    })
  }

  const senhaAtual = tipo === 'pf' ? pfForm.senha : pjForm.senha

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'oklch(0.65 0.22 45)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/cadastro" className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <img src="/logo/giroativo-logo-dark.svg" alt="Giro Ativo" className="h-7 w-auto" />
          </div>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-1">Criar conta de comprador</h1>
          <p className="text-slate-400 text-sm mb-6">Acesso gratuito ao marketplace industrial</p>

          {/* Toggle PF / PJ */}
          <div className="flex rounded-xl border border-white/10 p-1 mb-6">
            {(['pj', 'pf'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTipo(t); setError(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tipo === t
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo tipo oculto */}
            <input type="hidden" name="tipo" value={tipo} />

            {tipo === 'pf' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-slate-300 text-sm">Nome completo *</Label>
                  <Input id="nome" name="nome" placeholder="João da Silva"
                    value={pfForm.nome} onChange={(e) => setPFForm((p) => ({ ...p, nome: e.target.value }))}
                    required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cpf" className="text-slate-300 text-sm">CPF *</Label>
                  <Input id="cpf" name="cpf" placeholder="000.000.000-00"
                    value={pfForm.cpf}
                    onChange={(e) => setPFForm((p) => ({ ...p, cpf: formatCPF(e.target.value) }))}
                    required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="cnpj" className="text-slate-300 text-sm">CNPJ *</Label>
                  <div className="flex gap-2">
                    <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00"
                      value={pjForm.cnpj}
                      onChange={(e) => { setPJForm((p) => ({ ...p, cnpj: formatCNPJ(e.target.value) })); setCnpjFound(false) }}
                      required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                    <Button type="button" onClick={lookupCNPJ} disabled={cnpjLoading}
                      variant="outline" className="shrink-0 border-white/10 bg-white/5 text-white hover:bg-white/10">
                      {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" />
                        : cnpjFound ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {cnpjFound && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Empresa encontrada</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="razao_social" className="text-slate-300 text-sm">Razão Social *</Label>
                    <Input id="razao_social" name="razao_social" placeholder="EMPRESA LTDA"
                      value={pjForm.razao_social} onChange={(e) => setPJForm((p) => ({ ...p, razao_social: e.target.value }))}
                      required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cidade" className="text-slate-300 text-sm">Cidade</Label>
                    <Input id="cidade" name="cidade" placeholder="São Paulo"
                      value={pjForm.cidade} onChange={(e) => setPJForm((p) => ({ ...p, cidade: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="estado" className="text-slate-300 text-sm">Estado</Label>
                    <select id="estado" name="estado" value={pjForm.estado}
                      onChange={(e) => setPJForm((p) => ({ ...p, estado: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50">
                      <option value="" className="bg-slate-900">UF</option>
                      {ESTADOS.map((uf) => <option key={uf} value={uf} className="bg-slate-900">{uf}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nome_responsavel" className="text-slate-300 text-sm">Nome do responsável *</Label>
                  <Input id="nome_responsavel" name="nome_responsavel" placeholder="João da Silva"
                    value={pjForm.nome_responsavel} onChange={(e) => setPJForm((p) => ({ ...p, nome_responsavel: e.target.value }))}
                    required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
              </>
            )}

            {/* Campos comuns */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm">E-mail corporativo *</Label>
              <Input id="email" name="email" type="email" placeholder="seu@empresa.com.br"
                required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="text-slate-300 text-sm">
                Telefone <span className="text-slate-500 font-normal">(opcional)</span>
              </Label>
              <Input id="telefone" name="telefone" type="tel" placeholder="(11) 99999-9999"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha" className="text-slate-300 text-sm">Senha *</Label>
              <Input id="senha" name="senha" type="password" placeholder="••••••••"
                value={senhaAtual}
                onChange={(e) => {
                  const v = e.target.value
                  setSenha(v)
                  tipo === 'pf'
                    ? setPFForm((p) => ({ ...p, senha: v }))
                    : setPJForm((p) => ({ ...p, senha: v }))
                }}
                required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
              <PasswordStrengthIndicator senha={senhaAtual} />
            </div>

            {/* Consentimentos */}
            <div className="pt-2 space-y-2 border-t border-white/10">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" name="aceite_termos" checked={aceites.termos}
                  onChange={(e) => setAceites((a) => ({ ...a, termos: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                <span className="text-xs text-slate-400 leading-relaxed">
                  Li e aceito os{' '}
                  <Link href="/termos" target="_blank" className="text-teal-400 hover:underline">Termos de Uso</Link>
                  {' '}e a{' '}
                  <Link href="/privacidade" target="_blank" className="text-teal-400 hover:underline">Política de Privacidade</Link>
                  {' '}*
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" name="marketing" checked={aceites.marketing}
                  onChange={(e) => setAceites((a) => ({ ...a, marketing: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                <span className="text-xs text-slate-400">Aceito receber comunicações e ofertas do Giro Ativo</span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" name="analytics" checked={aceites.analytics}
                  onChange={(e) => setAceites((a) => ({ ...a, analytics: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                <span className="text-xs text-slate-400">Aceito o uso de dados para melhorias da plataforma</span>
              </label>
            </div>

            <Button type="submit" disabled={isPending}
              className="w-full gradient-brand text-white font-semibold h-11 shadow-lg shadow-primary/25 hover:opacity-90 transition-all mt-2">
              {isPending
                ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</span>
                : <span className="flex items-center gap-2">Criar conta <ArrowRight className="w-4 h-4" /></span>}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-400">
            Já tem conta?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
