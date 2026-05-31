'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Search, ShoppingCart, Calendar, MessageSquare,
  Menu, X, Bell, ChevronDown, User, FileText,
  Heart, LogOut, ShieldCheck, Settings,
} from 'lucide-react'

interface CompradorBadges {
  unreadMessages: number
  pendingProposals: number
  upcomingVisits: number
}

interface Props {
  displayName: string
  userEmail: string
  badges: CompradorBadges
}

const mainLinks = [
  { href: '/comprador/busca',     label: 'Explorar',      icon: Search },
  { href: '/comprador/pedidos',   label: 'Minhas Compras', icon: ShoppingCart },
  { href: '/comprador/visitas',   label: 'Visitas',        icon: Calendar },
  { href: '/comprador/mensagens', label: 'Mensagens',      icon: MessageSquare, badgeKey: 'unreadMessages' as const },
]

const dropdownLinks = [
  { href: '/comprador/configuracoes', label: 'Meu Perfil',        icon: User },
  { href: '/comprador/propostas',     label: 'Minhas Propostas',  icon: FileText },
  { href: '/comprador/laudos',        label: 'Meus Laudos',       icon: ShieldCheck },
  { href: '/comprador/favoritos',     label: 'Favoritos',         icon: Heart },
  { href: '/comprador/configuracoes', label: 'Configurações',     icon: Settings },
]

export default function CompradorNavbar({ displayName, userEmail, badges }: Props) {
  const pathname   = usePathname()
  const router     = useRouter()
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')

  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/comprador/busca?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileOpen(false)
    }
  }

  function isActive(href: string) {
    if (href === '/comprador') return pathname === '/comprador'
    return pathname.startsWith(href)
  }

  const totalBadge = badges.pendingProposals + badges.upcomingVisits

  const initial = (displayName || userEmail || 'C')[0].toUpperCase()

  return (
    <>
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/comprador" className="shrink-0">
            <img src="/logo/giroativo-logo.svg" alt="Giro Ativo" className="h-7 w-auto" />
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar materiais, equipamentos…"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </form>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {mainLinks.map(({ href, label, badgeKey }) => {
              const count = badgeKey ? (badges[badgeKey] ?? 0) : 0
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {label}
                  {count > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications bell */}
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {totalBadge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
              )}
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initial}
                </div>
                <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">{displayName}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    </div>
                    {dropdownLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={`${href}-${label}`}
                        href={href}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" /> {label}
                      </Link>
                    ))}
                    <div className="border-t border-border" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sair da conta
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
              <Link href="/comprador" onClick={() => setMobileOpen(false)}>
                <img src="/logo/giroativo-logo.svg" alt="Giro Ativo" className="h-7 w-auto" />
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Mobile search */}
            <div className="px-4 py-3 border-b border-border">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar produtos…"
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </form>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
              {mainLinks.map(({ href, label, icon: Icon, badgeKey }) => {
                const count = badgeKey ? (badges[badgeKey] ?? 0) : 0
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive(href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {count > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </Link>
                )
              })}

              <div className="pt-3 pb-1 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Conta</p>
              </div>
              {dropdownLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={`mobile-${href}-${label}`}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Icon className="w-4 h-4 shrink-0" /> {label}
                </Link>
              ))}
            </nav>

            <div className="px-2 pb-4 border-t border-border pt-3">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sair da conta
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
