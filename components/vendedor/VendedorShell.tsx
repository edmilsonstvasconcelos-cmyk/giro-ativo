'use client'

import { useState } from 'react'
import VendedorSidebar from './VendedorSidebar'
import VendedorTopbar from './VendedorTopbar'

export interface VendedorBadges {
  activeProducts: number
  newPedidos: number
  pendingPropostas: number
  pendingVisits: number
  unreadMessages: number
}

interface Props {
  children: React.ReactNode
  companyName: string
  userEmail: string
  badges: VendedorBadges
}

export default function VendedorShell({ children, companyName, userEmail, badges }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <VendedorSidebar
        badges={badges}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <VendedorTopbar
          companyName={companyName}
          userEmail={userEmail}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
