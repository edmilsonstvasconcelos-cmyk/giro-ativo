'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, ImagePlus, ArrowLeft, Loader2, MapPin } from 'lucide-react'
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

function formatNCM(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 4) return d
  if (d.length <= 6) return `${d.slice(0, 4)}.${d.slice(4)}`
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`
}

interface Preview { file: File; preview: string }

export default function NovoProdutoVendedorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [companyId, setCompanyId] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Preview[]>([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', price: '', unit: 'unidade',
    quantity: '1', condicao: 'bom', location: '', norma_tecnica: '', ncm: '',
    visita_disponivel: true, cep: '', latitude: '', longitude: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('companies').select('id').eq('user_id', user.id).single()
      if (!data) { router.push('/onboarding'); return }
      setCompanyId(data.id)
    })
  }, [])

  const onDrop = useCallback((accepted: File[]) => {
    const news = accepted.slice(0, 6 - previews.length).map((file) => ({
      file, preview: URL.createObjectURL(file),
    }))
    setPreviews((p) => [...p, ...news])
  }, [previews])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    disabled: previews.length >= 6,
  })

  function removeImage(i: number) {
    URL.revokeObjectURL(previews[i].preview)
    setPreviews((p) => p.filter((_, idx) => idx !== i))
    if (coverIndex === i) setCoverIndex(0)
    else if (coverIndex > i) setCoverIndex((c) => c - 1)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'ncm') { setForm((p) => ({ ...p, ncm: formatNCM(value) })); return }
    setForm((p) => ({ ...p, [name]: value }))
  }

  async function lookupCEP() {
    const digits = form.cep.replace(/\D/g, '')
    if (digits.length !== 8) { setError('CEP deve ter 8 dígitos'); return }
    setCepLoading(true); setError(null)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) throw new Error()

      const cidade = data.localidade ?? ''
      const estado = data.uf ?? ''
      const location = `${cidade}, ${estado}`
      setForm((p) => ({ ...p, location }))

      // Geocoding via Nominatim
      const q = encodeURIComponent(`${cidade}, ${estado}, Brasil`)
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { 'User-Agent': 'GiroAtivo/1.0' } }
      )
      const geo = await geoRes.json()
      if (geo?.[0]) {
        setForm((p) => ({
          ...p, location,
          latitude: parseFloat(geo[0].lat).toFixed(6),
          longitude: parseFloat(geo[0].lon).toFixed(6),
        }))
      }
    } catch {
      setError('CEP não encontrado.')
    } finally {
      setCepLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId) return
    if (!form.title.trim()) { setError('O título é obrigatório.'); return }
    setError(null); setLoading(true)

    try {
      const { data: product, error: err } = await supabase
        .from('products')
        .insert({
          company_id:       companyId,
          title:            form.title.trim(),
          description:      form.description || null,
          category_id:      form.category_id ? Number(form.category_id) : null,
          price:            form.price ? Number(form.price) : null,
          unit:             form.unit,
          quantity:         Number(form.quantity),
          condicao:         form.condicao as import('@/types/supabase').CondicaoProduto,
          location:         form.location || null,
          norma_tecnica:    form.norma_tecnica || null,
          ncm:              form.ncm || null,
          visita_disponivel: form.visita_disponivel,
          latitude:         form.latitude ? Number(form.latitude) : null,
          longitude:        form.longitude ? Number(form.longitude) : null,
        })
        .select('id').single()

      if (err || !product) throw err

      for (let i = 0; i < previews.length; i++) {
        const { file } = previews[i]
        const ext  = file.name.split('.').pop()
        const path = `${companyId}/${product.id}/${Date.now()}-${i}.${ext}`
        const { data: up } = await supabase.storage
          .from('product-images').upload(path, file, { cacheControl: '3600', upsert: false })
        if (up) {
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
          await supabase.from('product_images').insert({
            product_id: product.id, url: publicUrl, is_cover: i === coverIndex, ordem: i,
          })
        }
      }

      router.push('/vendedor/produtos')
    } catch {
      setError('Erro ao publicar produto. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/vendedor/produtos" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Publicar produto</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados do material excedente</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Fotos */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-primary" />
            Fotos <span className="text-xs text-muted-foreground font-normal">(máx. 6 · 5 MB cada)</span>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
            {previews.map((p, i) => (
              <div key={i} onClick={() => setCoverIndex(i)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${i === coverIndex ? 'border-primary shadow-lg' : 'border-border'}`}>
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                {i === coverIndex && <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] text-center py-0.5">CAPA</div>}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {previews.length < 6 && (
              <div {...getRootProps()}
                className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${previews.length === 0 ? 'col-span-3' : ''} ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <input {...getInputProps()} />
                <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">{isDragActive ? 'Solte aqui' : 'Adicionar'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Informações básicas */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Informações do produto</h2>

          <div className="space-y-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" name="title" placeholder="Ex: Válvula gaveta 6'' inox AISI 316 — sem uso" value={form.title} onChange={handleChange} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <textarea id="description" name="description" rows={4} placeholder="Estado, especificações técnicas, motivo da venda..."
              value={form.description} onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category_id">Categoria</Label>
              <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Selecione</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="condicao">Condição *</Label>
              <select id="condicao" name="condicao" value={form.condicao} onChange={handleChange} required
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="otimo">Ótimo — como novo, sem uso</option>
                <option value="bom">Bom — funcionando perfeitamente</option>
                <option value="regular">Regular — funcionando com desgaste</option>
                <option value="inservivel">Inservível — para peças / sucata</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="norma_tecnica">Norma técnica</Label>
              <Input id="norma_tecnica" name="norma_tecnica" placeholder="Ex: ASTM A312, NBR 5580" value={form.norma_tecnica} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ncm">NCM</Label>
              <Input id="ncm" name="ncm" placeholder="0000.00.00" value={form.ncm} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Preço e quantidade */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Preço e quantidade</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" placeholder="0,00 — deixe vazio para consultar" value={form.price} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unidade</Label>
              <select id="unit" name="unit" value={form.unit} onChange={handleChange}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantidade disponível</Label>
            <Input id="quantity" name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} />
          </div>
        </div>

        {/* Localização */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Localização</h2>
          <div className="space-y-1.5">
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input id="cep" name="cep" placeholder="00000-000" value={form.cep}
                onChange={(e) => setForm((p) => ({ ...p, cep: e.target.value.replace(/\D/g,'').replace(/(\d{5})(\d)/, '$1-$2').slice(0,9) }))}
                className="max-w-[160px]" />
              <Button type="button" onClick={lookupCEP} disabled={cepLoading} variant="outline" className="shrink-0">
                {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MapPin className="w-4 h-4 mr-1.5" />Buscar</>}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Localização (preenchida automaticamente)</Label>
            <Input id="location" name="location" placeholder="Ex: Fortaleza, CE" value={form.location} onChange={handleChange} />
          </div>
          {form.latitude && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Coordenadas: {form.latitude}, {form.longitude}
            </p>
          )}

          <div className="flex items-center gap-3">
            <input type="checkbox" id="visita_disponivel" checked={form.visita_disponivel}
              onChange={(e) => setForm((p) => ({ ...p, visita_disponivel: e.target.checked }))}
              className="h-4 w-4 rounded border-border" />
            <Label htmlFor="visita_disponivel" className="cursor-pointer">
              Visita técnica disponível <span className="text-xs text-muted-foreground">(compradores podem agendar visita presencial)</span>
            </Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/vendedor/produtos" className="flex-1">
            <Button type="button" variant="outline" className="w-full">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading || !companyId} className="flex-1 gradient-brand text-white hover:opacity-90 shadow-md">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Publicando...</span> : 'Publicar produto'}
          </Button>
        </div>
      </form>
    </div>
  )
}
