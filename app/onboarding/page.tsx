'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Building2, CheckCircle, Loader2, Search } from 'lucide-react'

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    telefone: '',
    cidade: '',
    estado: '',
  })
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjFound, setCnpjFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'cnpj') {
      setForm((prev) => ({ ...prev, cnpj: formatCNPJ(value) }))
      setCnpjFound(false)
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  async function lookupCNPJ() {
    const digits = form.cnpj.replace(/\D/g, '')
    if (digits.length !== 14) {
      setError('Digite o CNPJ completo (14 dígitos).')
      return
    }
    setCnpjLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!res.ok) throw new Error('CNPJ não encontrado')
      const data = await res.json()
      setForm((prev) => ({
        ...prev,
        razao_social: data.razao_social ?? '',
        nome_fantasia: data.nome_fantasia ?? '',
        cidade: data.municipio ?? '',
        estado: data.uf ?? '',
      }))
      setCnpjFound(true)
    } catch {
      setError('CNPJ não encontrado na Receita Federal. Verifique o número informado.')
    } finally {
      setCnpjLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.cnpj || !form.razao_social || !form.estado) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: dbError } = await supabase.from('companies').insert({
      user_id: user.id,
      cnpj: form.cnpj,
      razao_social: form.razao_social,
      nome_fantasia: form.nome_fantasia || null,
      telefone: form.telefone || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
    })

    if (dbError) {
      if (dbError.code === '23505') {
        setError('Este CNPJ já está cadastrado na plataforma.')
      } else {
        setError('Erro ao salvar os dados. Tente novamente.')
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'oklch(0.65 0.22 45)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: 'oklch(0.55 0.25 30)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center mb-4">
            <img src="/logo/giroativo-logo-dark.svg" alt="Giro Ativo" className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white">Complete seu perfil</h1>
          <p className="mt-2 text-slate-400 text-sm">
            Precisamos dos dados da sua empresa para ativar sua conta
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">✓</div>
            <span className="text-xs text-slate-400">Conta</span>
          </div>
          <div className="h-px w-8 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full border-2 border-teal-500 flex items-center justify-center text-teal-400 text-xs font-bold">2</div>
            <span className="text-xs text-teal-400 font-medium">Empresa</span>
          </div>
          <div className="h-px w-8 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-slate-500 text-xs font-bold">3</div>
            <span className="text-xs text-slate-500">Pronto</span>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-teal-400" />
            <h2 className="font-semibold text-white">Dados da empresa</h2>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CNPJ with lookup */}
            <div className="space-y-1.5">
              <Label htmlFor="cnpj" className="text-slate-300 text-sm">
                CNPJ <span className="text-red-400">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cnpj"
                  name="cnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={handleChange}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50"
                />
                <Button
                  type="button"
                  onClick={lookupCNPJ}
                  disabled={cnpjLoading}
                  variant="outline"
                  className="shrink-0 border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  {cnpjLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : cnpjFound ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {cnpjFound && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Empresa encontrada na Receita Federal
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="razao_social" className="text-slate-300 text-sm">
                Razão Social <span className="text-red-400">*</span>
              </Label>
              <Input
                id="razao_social"
                name="razao_social"
                type="text"
                placeholder="EMPRESA LTDA"
                value={form.razao_social}
                onChange={handleChange}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nome_fantasia" className="text-slate-300 text-sm">
                Nome Fantasia
              </Label>
              <Input
                id="nome_fantasia"
                name="nome_fantasia"
                type="text"
                placeholder="Como é conhecida no mercado"
                value={form.nome_fantasia}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cidade" className="text-slate-300 text-sm">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  type="text"
                  placeholder="São Paulo"
                  value={form.cidade}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estado" className="text-slate-300 text-sm">
                  Estado <span className="text-red-400">*</span>
                </Label>
                <select
                  id="estado"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  required
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <option value="" className="bg-slate-900">Selecione</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf} className="bg-slate-900">{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="text-slate-300 text-sm">Telefone / WhatsApp</Label>
              <Input
                id="telefone"
                name="telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.telefone}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-white font-semibold h-11 shadow-lg shadow-primary/25 hover:opacity-90 transition-all mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : (
                'Ativar minha conta →'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
