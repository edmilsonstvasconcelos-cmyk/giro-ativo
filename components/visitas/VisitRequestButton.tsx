'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, X } from 'lucide-react'

export default function VisitRequestButton({ productId, sellerId }: { productId: string; sellerId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ proposed_date: '', proposed_time: '', message: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: buyer } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!buyer) { router.push('/onboarding'); return }

    const { error } = await supabase.from('visit_requests').insert({
      product_id: productId,
      buyer_id: buyer.id,
      seller_id: sellerId,
      proposed_date: form.proposed_date,
      proposed_time: form.proposed_time || null,
      message: form.message || null,
    })

    setLoading(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => { setOpen(false); setSuccess(false) }, 2000)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Solicitar visita técnica
      </Button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Solicitar Visita Técnica</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {success ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-semibold text-green-600">Solicitação enviada!</p>
                <p className="text-sm text-muted-foreground mt-1">O vendedor irá confirmar em breve.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="proposed_date" className="text-sm">Data desejada *</Label>
                  <Input
                    id="proposed_date"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={form.proposed_date}
                    onChange={(e) => setForm((p) => ({ ...p, proposed_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proposed_time" className="text-sm">Horário preferido</Label>
                  <Input
                    id="proposed_time"
                    type="time"
                    value={form.proposed_time}
                    onChange={(e) => setForm((p) => ({ ...p, proposed_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="visit_message" className="text-sm">Mensagem (opcional)</Label>
                  <textarea
                    id="visit_message"
                    rows={3}
                    placeholder="Descreva o objetivo da visita..."
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 gradient-brand text-white hover:opacity-90">
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Solicitar'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
