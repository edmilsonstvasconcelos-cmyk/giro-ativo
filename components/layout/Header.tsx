'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Zap, Search, MessageSquare, Bell, Menu, X,
  LayoutDashboard, Package, Calendar, User, LogOut, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navLinks = [
    { href: '/produtos', label: 'Catálogo', icon: Search },
    { href: '#como-funciona', label: 'Como Funciona', icon: Search },
    { href: '#planos', label: 'Planos', icon: Search },
    { href: '/laudo-tecnico', label: 'Laudo Técnico', icon: Search },
  ]

  const authLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/meus-produtos', label: 'Meus Produtos', icon: Package },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/visitas', label: 'Visitas', icon: Calendar },
    { href: '/perfil', label: 'Perfil', icon: User },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[#E8E8E8] border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center group shrink-0 hover:opacity-90 transition-opacity">
          <img src="/logo/giroativo-logo.svg" alt="Giro Ativo" className="h-9 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[15px] font-medium text-[#6A7270] hover:text-[#0C322B] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/meus-produtos/novo">
                <Button size="sm" className="hidden sm:flex gradient-brand text-white gap-1.5 shadow-md shadow-primary/20 hover:opacity-90">
                  <Plus className="w-3.5 h-3.5" /> Publicar
                </Button>
              </Link>
              <Link href="/chat" className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <MessageSquare className="w-5 h-5" />
              </Link>
              <Link href="/visitas" className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Bell className="w-5 h-5" />
              </Link>
              <Link href="/perfil">
                <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-md hover:scale-105 transition-transform">
                  {user.email?.charAt(0).toUpperCase() ?? 'U'}
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden md:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-[#3A403E] font-semibold text-[15px] hover:bg-black/5">Entrar</Button>
              </Link>
              <Link href="/cadastro">
                <Button className="bg-[#0f766e] text-white hover:bg-[#0d645d] rounded-full px-6 h-10 font-semibold text-[15px] shadow-none">
                  Criar conta
                </Button>
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
            {user && authLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
