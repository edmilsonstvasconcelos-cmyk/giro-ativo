'use client'

import { useState, useRef } from 'react'
import { criarProposta } from '@/app/actions/propostas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  produtoId: string
  vendedorId: string
  precoAnunciado: number | null
  unit: string | null
}

export default function PropostaModal({ produtoId, vendedorId, precoAnunciado, unit }: Props) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<{ error?: string; success?: boolean } | null>(null)
  const formRef               = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const data = new FormData(e.currentTarget)
    const res  = await criarProposta(data)
    setResult(res)
    setLoading(false)

    if (res.success) {
      formRef.current?.reset()
      setTimeout(() => { setOpen(false); setResult(null) }, 2000)
    }
  }

  const preco = precoAnunciado ?? 0

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full gradient-brand text-white hover:opacity-90 shadow-md shadow-primary/20"
      >
        <TrendingUp className="w-4 h-4 mr-2" /> Fazer Proposta
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Fazer proposta</h2>
                {precoAnunciado && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Preço anunciado: R$ {precoAnunciado.toLocaleString('pt-BR')} / {unit}
                  </p>
                )}
              </div>
              <button
                onClick={() => !loading && setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="produto_id"  value={produtoId} />
              <input type="hidden" name="vendedor_id" value={vendedorId} />

              <div className="space-y-1.5">
                <Label htmlFor="preco_proposta">Seu valor proposto (R$)</Label>
                <Input
                  id="preco_proposta"
                  name="preco_proposta"
                  type="number"
                  min={1}
                  step="0.01"
                  defaultValue={preco > 0 ? preco : undefined}
                  placeholder="0,00"
                  required
                  className="text-lg font-semibold"
                />
                {precoAnunciado && (
                  <p className="text-xs text-muted-foreground">
                    Sugestão: proponha entre 80–100% do preço anunciado para maior chance de aceite.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mensagem">
                  Mensagem para o vendedor <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  rows={3}
                  placeholder="Explique sua proposta, prazo de retirada, forma de pagamento…"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              {result?.error && (
                <div className="flex items-center gap-2 text-sm text-red-600 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {result.error}
                </div>
              )}

              {result?.success && (
                <div className="flex items-center gap-2 text-sm text-green-700 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Proposta enviada! O vendedor será notificado.
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !!result?.success}
                className="w-full gradient-brand text-white hover:opacity-90"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando…</>
                  : 'Enviar proposta'}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              A proposta expira em 72h. O vendedor poderá aceitar, recusar ou fazer contraproposta.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
