'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, ShoppingCart, FileText,
  Calendar, ClipboardCheck, MessageSquare, Wallet,
  CreditCard, Star, Settings, X,
} from 'lucide-react'
import type { VendedorBadges } from './VendedorShell'

const sections = [
  {
    items: [
      { href: '/vendedor',               label: 'Dashboard',      icon: LayoutDashboard, badgeKey: null                },
      { href: '/vendedor/produtos',      label: 'Meus Produtos',  icon: Package,         badgeKey: 'activeProducts'    },
      { href: '/vendedor/pedidos',       label: 'Pedidos',        icon: ShoppingCart,    badgeKey: 'newPedidos'        },
      { href: '/vendedor/propostas',     label: 'Propostas',      icon: FileText,        badgeKey: 'pendingPropostas'  },
      { href: '/vendedor/visitas',       label: 'Visitas',        icon: Calendar,        badgeKey: 'pendingVisits'     },
      { href: '/vendedor/laudos',        label: 'Laudos',         icon: ClipboardCheck,  badgeKey: null                },
      { href: '/vendedor/mensagens',     label: 'Mensagens',      icon: MessageSquare,   badgeKey: 'unreadMessages'    },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/vendedor/financeiro',    label: 'Financeiro',     icon: Wallet,          badgeKey: null },
      { href: '/vendedor/plano',         label: 'Meu Plano',      icon: CreditCard,      badgeKey: null },
      { href: '/vendedor/reputacao',     label: 'Reputação',      icon: Star,            badgeKey: null },
      { href: '/vendedor/configuracoes', label: 'Configurações',  icon: Settings,        badgeKey: null },
    ],
  },
]

interface Props {
  badges: VendedorBadges
  isOpen: boolean
  onClose: () => void
}

export default function VendedorSidebar({ badges, isOpen, onClose }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/vendedor') return pathname === '/vendedor'
    return pathname.startsWith(href)
  }

  const badgeValue = (key: string | null): number => {
    if (!key) return 0
    return (badges as unknown as Record<string, number>)[key] ?? 0
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-card border-r border-border transition-transform duration-200',
        'lg:relative lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
        <Link href="/vendedor">
          <img src="/logo/giroativo-logo.svg" alt="Giro Ativo" className="h-8 w-auto" />
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, badgeKey }) => {
                const active = isActive(href)
                const count = badgeValue(badgeKey)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {count > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center bg-primary text-white">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Versão */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <p className="text-[10px] text-muted-foreground/60">GiroAtivo MVP · Sprint 3</p>
      </div>
    </aside>
  )
}
