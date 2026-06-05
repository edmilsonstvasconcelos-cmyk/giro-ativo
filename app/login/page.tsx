'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const cadastroOk = searchParams.get('cadastro') === 'ok'
  const nextPath   = searchParams.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos. Verifique seus dados.')
      setLoading(false)
      return
    }

    router.refresh()
    router.push(nextPath)
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError('Erro ao conectar com Google. Tente novamente.')
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'oklch(0.65 0.22 45)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'oklch(0.55 0.25 30)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center group hover:opacity-90 transition-opacity">
            <img src="/logo/giroativo-logo-dark.svg" alt="Giro Ativo" className="h-10 w-auto" />
          </Link>
          <p className="mt-3 text-slate-400 text-sm">Bem-vindo de volta</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {cadastroOk && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Conta criada com sucesso! Verifique seu e-mail e depois faça login.</span>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="empresa@exemplo.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-sm">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-white font-semibold h-11 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-90 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Entrar <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-500">
              <span className="bg-transparent px-3">ou continue com</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <Mail className="w-4 h-4 mr-2" />
            Entrar com Google
          </Button>

          <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
            <p className="text-center text-xs text-slate-500 mb-3">Ainda não tem conta?</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cadastro/comprador">
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-teal-500/40 hover:bg-white/10 transition-all cursor-pointer">
                  <span className="text-lg">🛒</span>
                  <span className="text-xs font-semibold text-slate-300">Sou Comprador</span>
                </div>
              </Link>
              <Link href="/cadastro/vendedor">
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-teal-500/40 hover:bg-white/10 transition-all cursor-pointer">
                  <span className="text-lg">🏭</span>
                  <span className="text-xs font-semibold text-slate-300">Sou Vendedor</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
