'use client'

import { useState, useEffect } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { toggleFavorito } from '@/app/actions/favoritos'

interface Props {
  produtoId:    string
  initialState: boolean | null  // null = não autenticado (usa localStorage)
}

const STORAGE_KEY = 'ga_favoritos'

function getLocalFavoritos(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

export default function FavoritoButton({ produtoId, initialState }: Props) {
  const isAuthenticated = initialState !== null
  const [saved,    setSaved]    = useState(initialState ?? false)
  const [loading,  setLoading]  = useState(false)
  const [hydrated, setHydrated] = useState(isAuthenticated)

  // Para usuários não autenticados: ler localStorage após hidratação
  useEffect(() => {
    if (!isAuthenticated) {
      setSaved(getLocalFavoritos().includes(produtoId))
      setHydrated(true)
    }
  }, [produtoId, isAuthenticated])

  async function toggle() {
    if (!hydrated) return
    setLoading(true)

    if (isAuthenticated) {
      const res = await toggleFavorito(produtoId)
      if (!res.error) setSaved(res.isFavorited)
    } else {
      const current = getLocalFavoritos()
      const next    = current.includes(produtoId)
        ? current.filter((id) => id !== produtoId)
        : [...current, produtoId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSaved(next.includes(produtoId))
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || !hydrated}
      aria-label={saved ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      className={`w-full flex items-center justify-center gap-2 h-9 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60 ${
        saved
          ? 'border-red-300 bg-red-50 text-red-600 dark:bg-red-500/10 dark:border-red-500/30'
          : 'border-border bg-card text-muted-foreground hover:border-red-200 hover:text-red-500'
      }`}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Heart className={`w-4 h-4 transition-all ${saved ? 'fill-red-500 text-red-500' : ''}`} />}
      {saved ? 'Salvo nos favoritos' : 'Salvar nos favoritos'}
    </button>
  )
}
