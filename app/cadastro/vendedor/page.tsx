'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator'
import { registerVendedor } from '@/app/actions/auth'
import { ArrowLeft, ArrowRight, Search, CheckCircle, Loader2, Zap, BarChart2, Building2, Star } from 'lucide-react'

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

function formatCNPJ(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

const planos = [
  {
    id: 'basico' as const,
    nome: 'Básico',
    preco: 'R$ 199/mês',
    icon: Zap,
    descricao: 'Para começar',
    features: ['Até 20 produtos', 'Comissão 3%', 'Chat e visitas'],
    recomendado: false,
  },
  {
    id: 'pro' as const,
    nome: 'Pro',
    preco: 'R$ 399/mês',
    icon: Star,
    descricao: 'Mais popular',
    features: ['Produtos ilimitados', 'Comissão 2%', 'Analytics', '2 laudos/mês'],
    recomendado: true,
  },
  {
    id: 'enterprise' as const,
    nome: 'Enterprise',
    preco: 'R$ 799/mês',
    icon: Building2,
    descricao: 'Alta demanda',
    features: ['API de integração', 'Laudos ilimitados', 'Conta gerenciada', 'Suporte prioritário'],
    recomendado: false,
  },
]

export default function CadastroVendedorPage() {
  const [planoSelecionado, setPlanoSelecionado] = useState<'basico' | 'pro' | 'enterprise'>('pro')
  const [senha, setSenha] = useState('')
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjFound, setCnpjFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [aceites, setAceites] = useState({ termos: false, marketing: false, analytics: false })
  const [form, setForm] = useState({
    cnpj: '', razao_social: '', nome_fantasia: '', nome_responsavel: '',
    email: '', telefone: '', cidade: '', estado: '',
  })

  function update(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function lookupCNPJ() {
    const digits = form.cnpj.replace(/\D/g, '')
    if (digits.length !== 14) { setError('CNPJ incompleto'); return }
    setCnpjLoading(true); setError(null)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setForm((p) => ({
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
      const result = await registerVendedor(fd)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'oklch(0.65 0.22 45)' }} />
      </div>

      <div className="w-full max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/cadastro" className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <img src="/logo/giroativo-logo-dark.svg" alt="Giro Ativo" className="h-7 w-auto" />
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-1">Criar conta de vendedor</h1>
          <p className="text-slate-400 text-sm mb-6">30 dias gratuitos em qualquer plano · Sem cartão de crédito agora</p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="plano" value={planoSelecionado} />

            {/* Seleção de plano */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Escolha seu plano</Label>
              <div className="grid grid-cols-3 gap-2">
                {planos.map((p) => {
                  const Icon = p.icon
                  const selected = planoSelecionado === p.id
                  return (
                    <button key={p.id} type="button" onClick={() => setPlanoSelecionado(p.id)}
                      className={`relative p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}>
                      {p.recomendado && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-teal-500 text-teal-950 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          Recomendado
                        </div>
                      )}
                      <Icon className={`w-4 h-4 mb-1.5 ${selected ? 'text-teal-400' : 'text-slate-400'}`} />
                      <p className={`text-sm font-bold ${selected ? 'text-white' : 'text-slate-300'}`}>{p.nome}</p>
                      <p className="text-teal-400 text-xs font-semibold">{p.preco}</p>
                      <ul className="mt-2 space-y-0.5">
                        {p.features.slice(0, 2).map((f) => (
                          <li key={f} className="text-[10px] text-slate-500">{f}</li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500">
                {planos.find((p) => p.id === planoSelecionado)?.features.join(' · ')}
              </p>
            </div>

            <div className="border-t border-white/10 pt-5 space-y-4">
              {/* CNPJ */}
              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="text-slate-300 text-sm">CNPJ *</Label>
                <div className="flex gap-2">
                  <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                    onChange={(e) => { update('cnpj', formatCNPJ(e.target.value)); setCnpjFound(false) }}
                    required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                  <Button type="button" onClick={lookupCNPJ} disabled={cnpjLoading}
                    variant="outline" className="shrink-0 border-white/10 bg-white/5 text-white hover:bg-white/10">
                    {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" />
                      : cnpjFound ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {cnpjFound && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Empresa encontrada na Receita Federal</p>}
              </div>

              {/* Razão social + Fantasia */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="razao_social" className="text-slate-300 text-sm">Razão Social *</Label>
                  <Input id="razao_social" name="razao_social" placeholder="EMPRESA LTDA"
                    value={form.razao_social} onChange={(e) => update('razao_social', e.target.value)}
                    required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nome_fantasia" className="text-slate-300 text-sm">Nome Fantasia</Label>
                  <Input id="nome_fantasia" name="nome_fantasia" placeholder="Como é conhecida"
                    value={form.nome_fantasia} onChange={(e) => update('nome_fantasia', e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
              </div>

              {/* Localização */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cidade" className="text-slate-300 text-sm">Cidade</Label>
                  <Input id="cidade" name="cidade" placeholder="São Paulo"
                    value={form.cidade} onChange={(e) => update('cidade', e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estado" className="text-slate-300 text-sm">Estado</Label>
                  <select id="estado" name="estado" value={form.estado}
                    onChange={(e) => update('estado', e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50">
                    <option value="" className="bg-slate-900">UF</option>
                    {ESTADOS.map((uf) => <option key={uf} value={uf} className="bg-slate-900">{uf}</option>)}
                  </select>
                </div>
              </div>

              {/* Responsável */}
              <div className="space-y-1.5">
                <Label htmlFor="nome_responsavel" className="text-slate-300 text-sm">Nome do responsável *</Label>
                <Input id="nome_responsavel" name="nome_responsavel" placeholder="Nome e Sobrenome"
                  value={form.nome_responsavel} onChange={(e) => update('nome_responsavel', e.target.value)}
                  required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
              </div>

              {/* Email + Telefone */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-300 text-sm">E-mail *</Label>
                  <Input id="email" name="email" type="email" placeholder="vendas@empresa.com"
                    value={form.email} onChange={(e) => update('email', e.target.value)}
                    required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-slate-300 text-sm">Telefone</Label>
                  <Input id="telefone" name="telefone" type="tel" placeholder="(11) 99999-9999"
                    value={form.telefone} onChange={(e) => update('telefone', e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <Label htmlFor="senha" className="text-slate-300 text-sm">Senha *</Label>
                <Input id="senha" name="senha" type="password" placeholder="••••••••"
                  value={senha} onChange={(e) => setSenha(e.target.value)}
                  required className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                <PasswordStrengthIndicator senha={senha} />
              </div>
            </div>

            {/* Consentimentos */}
            <div className="pt-2 space-y-2 border-t border-white/10">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" name="aceite_termos" checked={aceites.termos}
                  onChange={(e) => setAceites((a) => ({ ...a, termos: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500" />
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
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500" />
                <span className="text-xs text-slate-400">Aceito receber comunicações e ofertas</span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" name="analytics" checked={aceites.analytics}
                  onChange={(e) => setAceites((a) => ({ ...a, analytics: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500" />
                <span className="text-xs text-slate-400">Aceito o uso de dados para melhorias da plataforma</span>
              </label>
            </div>

            <Button type="submit" disabled={isPending}
              className="w-full gradient-brand text-white font-semibold h-11 shadow-lg shadow-primary/25 hover:opacity-90 transition-all">
              {isPending
                ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</span>
                : <span className="flex items-center gap-2">Criar conta e começar trial <ArrowRight className="w-4 h-4" /></span>}
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
