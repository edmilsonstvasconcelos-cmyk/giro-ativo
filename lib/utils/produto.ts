import type { CondicaoProduto } from '@/types/supabase'

export const condicaoLabel: Record<CondicaoProduto, string> = {
  otimo:      'Ótimo',
  bom:        'Bom',
  regular:    'Regular',
  inservivel: 'Inservível',
}

export const condicaoBadgeColor: Record<CondicaoProduto, string> = {
  otimo:      'text-green-600 bg-green-500/10 border-green-500/20',
  bom:        'text-blue-600 bg-blue-500/10 border-blue-500/20',
  regular:    'text-amber-600 bg-amber-500/10 border-amber-500/20',
  inservivel: 'text-red-600 bg-red-500/10 border-red-500/20',
}

export function formatPreco(price: number | null, unit: string): string {
  if (price == null) return 'A consultar'
  return `${price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / ${unit}`
}
