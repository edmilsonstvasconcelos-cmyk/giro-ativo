import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { MapPin, Package, Eye } from 'lucide-react'

interface ProductCardProps {
  id: string
  title: string
  price: number | null
  unit: string
  condition: string
  location: string | null
  category: string | null
  views: number
  cover?: string | null
  companyName: string
}

const conditionLabel: Record<string, string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  usado: 'Usado',
}

const conditionColor: Record<string, string> = {
  novo: 'bg-green-500/10 text-green-600 border-green-500/20',
  seminovo: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  usado: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
}

export default function ProductCard({
  id, title, price, unit, condition, location, category, views, cover, companyName
}: ProductCardProps) {
  return (
    <Link href={`/produtos/${id}`} className="group">
      <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Package className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${conditionColor[condition] ?? conditionColor.usado}`}>
              {conditionLabel[condition] ?? condition}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {category && (
            <span className="text-xs text-primary font-medium">{category}</span>
          )}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          <div className="mt-auto pt-2 border-t border-border">
            {price != null ? (
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-primary">
                  {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-xs text-muted-foreground">/ {unit}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground italic">A consultar</span>
            )}

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {location ?? 'Brasil'}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />
                {views}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{companyName}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
