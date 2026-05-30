import Link from 'next/link'
import { Building2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Criar conta — Giro Ativo' }

export default function CadastroPage() {
  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'oklch(0.65 0.22 45)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'oklch(0.55 0.25 30)' }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <img src="/logo/giroativo-logo-dark.svg" alt="Giro Ativo" className="h-10 w-auto mx-auto" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Como você vai usar o Giro Ativo?</h1>
          <p className="mt-2 text-slate-400 text-sm">Escolha o perfil que melhor descreve sua empresa</p>
        </div>

        {/* Cards de escolha */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Comprador */}
          <Link href="/cadastro/comprador" className="group">
            <div className="glass rounded-2xl p-7 border border-white/10 hover:border-teal-500/40 hover:bg-white/10 transition-all duration-200 h-full flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-7 h-7 text-teal-400" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Sou Comprador</h2>
              <p className="text-slate-400 text-sm leading-relaxed flex-1">
                Quero encontrar e adquirir materiais industriais excedentes de outras empresas.
              </p>

              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" /> Pessoa física ou jurídica</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" /> Acesso gratuito ao marketplace</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" /> Chat e visitas técnicas</li>
              </ul>

              <div className="mt-6 flex items-center gap-2 text-teal-400 text-sm font-semibold group-hover:gap-3 transition-all">
                Criar conta de comprador <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Vendedor */}
          <Link href="/cadastro/vendedor" className="group">
            <div className="glass rounded-2xl p-7 border border-white/10 hover:border-teal-500/40 hover:bg-white/10 transition-all duration-200 h-full flex flex-col relative overflow-hidden">
              {/* Badge recomendado */}
              <div className="absolute top-4 right-4 bg-teal-500 text-teal-950 text-xs font-bold px-2.5 py-1 rounded-full">
                Mais comum
              </div>

              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7 text-teal-400" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Sou Vendedor</h2>
              <p className="text-slate-400 text-sm leading-relaxed flex-1">
                Quero anunciar materiais excedentes do almoxarifado da minha empresa e receber compradores qualificados.
              </p>

              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" /> Apenas pessoa jurídica (CNPJ)</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" /> Laudo técnico certificado</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" /> Pagamento seguro com escrow</li>
              </ul>

              <div className="mt-6 flex items-center gap-2 text-teal-400 text-sm font-semibold group-hover:gap-3 transition-all">
                Criar conta de vendedor <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
