'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X } from 'lucide-react'

const categories = [
  { label: 'Todas', value: '' },
  { label: 'Tubulações e Conexões', value: 'tubulacoes-conexoes' },
  { label: 'Elétrica e Automação', value: 'eletrica-automacao' },
  { label: 'Mecânica e Estruturas', value: 'mecanica-estruturas' },
  { label: 'Instrumentação', value: 'instrumentacao' },
  { label: 'Válvulas e Atuadores', value: 'valvulas-atuadores' },
  { label: 'Motores e Bombas', value: 'motores-bombas' },
  { label: 'EPIs e Segurança', value: 'epis-seguranca' },
  { label: 'Outros', value: 'outros' },
]

const estados = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const condicoes = [
  { label: 'Todas', value: '' },
  { label: 'Ótimo', value: 'otimo' },
  { label: 'Bom', value: 'bom' },
  { label: 'Regular', value: 'regular' },
  { label: 'Inservível', value: 'inservivel' },
]

export default function ProductFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value)
        else params.delete(key)
      })
      return params.toString()
    },
    [searchParams]
  )

  function handleFilter(key: string, value: string) {
    router.push(`${pathname}?${createQueryString({ [key]: value })}`)
  }

  const hasFilters = searchParams.size > 0

  return (
    <div className="space-y-5 p-4 rounded-xl border border-border bg-card sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filtros</h3>
        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Buscar</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Válvula, tubo, motor..."
            defaultValue={searchParams.get('q') ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFilter('q', (e.target as HTMLInputElement).value)
              }
            }}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Categoria</Label>
        <div className="space-y-1">
          {categories.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleFilter('categoria', value)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                searchParams.get('categoria') === value || (!searchParams.get('categoria') && !value)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Condição */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Condição</Label>
        <div className="flex flex-wrap gap-1.5">
          {condicoes.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleFilter('condicao', value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                searchParams.get('condicao') === value || (!searchParams.get('condicao') && !value)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* State */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Estado</Label>
        <select
          value={searchParams.get('estado') ?? ''}
          onChange={(e) => handleFilter('estado', e.target.value)}
          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Todos os estados</option>
          {estados.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Faixa de preço</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Mín"
            defaultValue={searchParams.get('preco_min') ?? ''}
            onBlur={(e) => handleFilter('preco_min', e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            type="number"
            placeholder="Máx"
            defaultValue={searchParams.get('preco_max') ?? ''}
            onBlur={(e) => handleFilter('preco_max', e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <Button
        onClick={() => router.push(pathname)}
        variant="outline"
        size="sm"
        className="w-full text-xs"
      >
        Aplicar filtros
      </Button>
    </div>
  )
}
