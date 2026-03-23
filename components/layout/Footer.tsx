import Link from 'next/link'
import { Zap, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center mb-3 hover:opacity-90 transition-opacity">
              <img src="/logo/giroativo-logo.svg" alt="Giro Ativo" className="h-8 w-auto dark:hidden" />
              <img src="/logo/giroativo-logo-dark.svg" alt="Giro Ativo" className="h-8 w-auto hidden dark:block" />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Marketplace B2B de materiais industriais excedentes. Conectamos vendedores e compradores com segurança e eficiência.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/produtos" className="hover:text-foreground transition-colors">Marketplace</Link></li>
              <li><Link href="/cadastro" className="hover:text-foreground transition-colors">Cadastrar empresa</Link></li>
              <li><Link href="/meus-produtos/novo" className="hover:text-foreground transition-colors">Publicar produto</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Contato</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> contato@giroativo.com.br</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> (11) 99999-0000</li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> São Paulo, SP</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Giro Ativo. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
