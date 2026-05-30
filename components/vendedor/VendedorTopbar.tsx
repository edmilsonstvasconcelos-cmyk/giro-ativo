'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Menu, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react'

interface Props {
  companyName: string
  userEmail: string
  onMenuClick: () => void
}

export default function VendedorTopbar({ companyName, userEmail, onMenuClick }: Props) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initial = (companyName || userEmail || 'V')[0].toUpperCase()

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Mobile logo */}
      <Link href="/vendedor" className="lg:hidden">
        <img src="/logo/giroativo-logo.svg" alt="Giro Ativo" className="h-7 w-auto" />
      </Link>

      <div className="flex-1" />

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
        <Bell className="w-5 h-5 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
      </button>

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors"
        >
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initial}
          </div>
          <div className="hidden sm:block text-left max-w-[140px]">
            <p className="text-sm font-semibold leading-none truncate">{companyName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{userEmail}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold truncate">{companyName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              <Link href="/vendedor/configuracoes" onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                <User className="w-4 h-4 text-muted-foreground" /> Meu Perfil
              </Link>
              <Link href="/vendedor/configuracoes" onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                <Settings className="w-4 h-4 text-muted-foreground" /> Configurações
              </Link>
              <div className="border-t border-border" />
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                <LogOut className="w-4 h-4" /> Sair da conta
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
