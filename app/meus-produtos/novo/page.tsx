'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Header from '@/components/layout/Header'
import { Upload, X, ImagePlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const categories = [
  { id: 1, nome: 'Tubulações e Conexões' },
  { id: 2, nome: 'Elétrica e Automação' },
  { id: 3, nome: 'Mecânica e Estruturas' },
  { id: 4, nome: 'Instrumentação' },
  { id: 5, nome: 'Válvulas e Atuadores' },
  { id: 6, nome: 'Motores e Bombas' },
  { id: 7, nome: 'EPIs e Segurança' },
  { id: 8, nome: 'Outros' },
]

const units = ['unidade', 'kg', 'tonelada', 'm', 'm²', 'm³', 'litro', 'lote', 'caixa', 'par']

interface PreviewFile {
  file: File
  preview: string
}

export default function NovoProdutoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [previews, setPreviews] = useState<PreviewFile[]>([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', price: '', unit: 'unidade',
    quantity: '1', condition: 'usado', location: '',
  })

  useEffect(() => {
    async function getCompany() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
      if (!data) { router.push('/onboarding'); return }
      setCompanyId(data.id)
    }
    getCompany()
  }, [])

  const onDrop = useCallback((accepted: File[]) => {
    const newPreviews = accepted.slice(0, 6 - previews.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPreviews((prev) => [...prev, ...newPreviews])
  }, [previews])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: previews.length >= 6,
  })

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index].preview)
    setPreviews((prev) => prev.filter((_, i) => i !== index))
    if (coverIndex === index) setCoverIndex(0)
    else if (coverIndex > index) setCoverIndex((c) => c - 1)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId) return
    if (!form.title.trim()) { setError('O título é obrigatório.'); return }
    setError(null)
    setLoading(true)

    try {
      // Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          company_id: companyId,
          title: form.title.trim(),
          description: form.description || null,
          category_id: form.category_id ? Number(form.category_id) : null,
          price: form.price ? Number(form.price) : null,
          unit: form.unit,
          quantity: Number(form.quantity),
          condition: form.condition as 'novo' | 'seminovo' | 'usado',
          location: form.location || null,
        })
        .select('id')
        .single()

      if (productError || !product) throw productError

      // Upload images
      const imageInserts = []
      for (let i = 0; i < previews.length; i++) {
        const { file } = previews[i]
        const ext = file.name.split('.').pop()
        const path = `${companyId}/${product.id}/${Date.now()}-${i}.${ext}`

        const { data: uploadData } = await supabase.storage
          .from('product-images')
          .upload(path, file, { cacheControl: '3600', upsert: false })

        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
          imageInserts.push({
            product_id: product.id,
            url: publicUrl,
            is_cover: i === coverIndex,
            ordem: i,
          })
        }
      }

      if (imageInserts.length > 0) {
        await supabase.from('product_images').insert(imageInserts)
      }

      router.push(`/produtos/${product.id}`)
    } catch {
      setError('Erro ao publicar produto. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/meus-produtos" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Publicar produto</h1>
            <p className="text-sm text-muted-foreground">Preencha as informações do material excedente</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <ImagePlus className="w-4 h-4 text-primary" />
              Fotos do produto
              <span className="text-xs text-muted-foreground font-normal">(máx. 6 fotos · 5 MB cada)</span>
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {previews.map((p, i) => (
                <div
                  key={i}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    i === coverIndex ? 'border-primary shadow-lg shadow-primary/20' : 'border-border'
                  }`}
                  onClick={() => setCoverIndex(i)}
                >
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  {i === coverIndex && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] text-center py-0.5 font-medium">CAPA</div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {previews.length < 6 && (
                <div
                  {...getRootProps()}
                  className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all col-span-${previews.length === 0 ? 3 : 1} ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground text-center">{isDragActive ? 'Solte aqui' : 'Adicionar'}</span>
                </div>
              )}
            </div>
            {previews.length > 0 && (
              <p className="text-xs text-muted-foreground">Clique em uma foto para definir como capa</p>
            )}
          </div>

          {/* Basic info */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Informações do produto</h2>

            <div className="space-y-1.5">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Válvula gaveta 6'' inox AISI 316 — sem uso"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Detalhe o estado, especificações técnicas, motivo da venda..."
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category_id">Categoria</Label>
                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="condition">Condição *</Label>
                <select
                  id="condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  required
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="novo">Novo</option>
                  <option value="seminovo">Seminovo</option>
                  <option value="usado">Usado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Preço e quantidade</h2>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00 — deixe vazio para consultar"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit">Unidade</Label>
                <select
                  id="unit"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantidade disponível</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Localização (Cidade/UF)</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Ex: São Paulo, SP"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/meus-produtos" className="flex-1">
              <Button type="button" variant="outline" className="w-full">Cancelar</Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !companyId}
              className="flex-1 gradient-brand text-white shadow-md shadow-primary/20 hover:opacity-90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publicando...
                </span>
              ) : 'Publicar produto'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
