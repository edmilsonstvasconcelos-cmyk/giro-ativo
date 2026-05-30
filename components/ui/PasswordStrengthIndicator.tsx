'use client'

import { calcularForcaSenha, senhaRequisitos } from '@/lib/validations/auth'
import { Check, X } from 'lucide-react'

const nivelLabel = ['', 'Fraca', 'Regular', 'Forte', 'Muito forte'] as const
const nivelColor = [
  '',
  'bg-red-500',
  'bg-amber-400',
  'bg-blue-500',
  'bg-green-500',
] as const

interface Props {
  senha: string
}

export default function PasswordStrengthIndicator({ senha }: Props) {
  const score = calcularForcaSenha(senha)
  if (!senha) return null

  return (
    <div className="space-y-2 mt-1">
      {/* Barra de progresso */}
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`flex-1 rounded-full transition-all duration-300 ${
              score >= n ? nivelColor[score] : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Label de força */}
      <p className={`text-xs font-medium ${
        score <= 1 ? 'text-red-500' :
        score === 2 ? 'text-amber-500' :
        score === 3 ? 'text-blue-500' : 'text-green-600'
      }`}>
        {nivelLabel[score]}
      </p>

      {/* Checklist de requisitos */}
      <ul className="space-y-1">
        {senhaRequisitos.map((req) => {
          const ok = req.ok(senha)
          return (
            <li key={req.label} className="flex items-center gap-1.5 text-xs">
              {ok
                ? <Check className="w-3 h-3 text-green-500 shrink-0" />
                : <X className="w-3 h-3 text-muted-foreground/50 shrink-0" />}
              <span className={ok ? 'text-green-600' : 'text-muted-foreground'}>
                {req.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
