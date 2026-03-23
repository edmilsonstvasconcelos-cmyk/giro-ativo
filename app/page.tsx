import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
  Search, ArrowRight, ShieldCheck, Zap, Users2, RefreshCw, MessageSquare,
  Package, Wrench, Factory, Cable, Gauge, Flame, HardHat, Box
} from 'lucide-react'

const categories = [
  { label: 'Tubulações', slug: 'tubulacoes-conexoes', icon: Wrench },
  { label: 'Elétrica', slug: 'eletrica-automacao', icon: Cable },
  { label: 'Mecânica', slug: 'mecanica-estruturas', icon: Factory },
  { label: 'Instrumentação', slug: 'instrumentacao', icon: Gauge },
  { label: 'Válvulas', slug: 'valvulas-atuadores', icon: Flame },
  { label: 'Motores', slug: 'motores-bombas', icon: Zap },
  { label: 'EPI & Segurança', slug: 'epis-seguranca', icon: HardHat },
  { label: 'Outros', slug: 'outros', icon: Box },
]

const stats = [
  { value: '500+', label: 'Empresas cadastradas' },
  { value: '2.000+', label: 'Produtos ativos' },
  { value: 'R$ 10M+', label: 'Em negócios realizados' },
  { value: '98%', label: 'Taxa de satisfação' },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#124b43] relative pt-16 pb-28 md:pt-24 md:pb-36 overflow-hidden min-h-[90vh] flex items-center">
          {/* Subtle gradient glow in background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4FD1C5] blur-[150px] opacity-[0.03] rounded-full pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              
              {/* Left Column: Text & CTA */}
              <div className="text-left w-full lg:w-[45%] relative z-20">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1b5c53]/80 border border-[#2b7a6d] text-sm font-medium mb-8 text-[#a9e5db] shadow-lg backdrop-blur-sm">
                  <div className="bg-[#4FD1C5] p-1 rounded-sm"><RefreshCw className="w-3.5 h-3.5 text-[#124b43] stroke-[3]" /></div>
                  Economia Circular Industrial
                </div>

                <h1 className="text-5xl lg:text-[4.5rem] font-bold text-white leading-[1.1] tracking-tight mb-6">
                  Seu estoque parado.<br />
                  <span className="text-[#4FD1C5]">Negócio em movimento.</span>
                </h1>

                <p className="text-lg text-slate-200 mt-4 mb-10 leading-[1.6] font-light max-w-[90%]">
                  Conectamos empresas que têm materiais industriais excedentes com compradores qualificados. Com laudo técnico, visita presencial e pagamento seguro com escrow.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Link href="/cadastro">
                    <Button className="bg-white text-[#0B6A66] hover:bg-slate-100 font-bold h-14 px-8 rounded-2xl w-full sm:w-auto text-lg shadow-xl shadow-black/10">
                      Quero Vender meu Estoque
                    </Button>
                  </Link>
                  <Link href="/produtos">
                    <Button variant="outline" className="border-[#0B6A66] text-white hover:bg-[#0B6A66]/20 font-bold h-14 px-8 rounded-2xl w-full sm:w-auto text-lg shadow-none bg-transparent">
                      Quero Comprar
                    </Button>
                  </Link>
                </div>

                {/* Feature checks */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10 text-sm font-semibold text-[#4FD1C5]">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/> Laudo Técnico Certificado</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/> Pagamento com Escrow</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/> Visita Técnica</span>
                </div>
              </div>

              {/* Right Column: 3D Floating Dashboards */}
              <div className="relative hidden lg:block w-full lg:w-[55%] h-[600px]">
                
                {/* Back Window: Inventory Management */}
                <div className="absolute top-0 right-14 w-[80%] h-[320px] bg-[#1d3d37]/90 backdrop-blur-3xl border border-[#3e766a] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] overflow-hidden animate-float-slow">
                  <div className="px-4 py-3 border-b border-[#3e766a]/50 flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#4FD1C5]/20 flex items-center justify-center text-[#4FD1C5] font-bold text-xs">G</div>
                    <div className="text-white font-medium text-sm w-full flex justify-between items-center">
                      Inventory Management
                      <div className="flex items-center gap-3">
                        <div className="bg-black/20 rounded-full px-3 py-1 flex items-center gap-2 text-xs text-slate-400 border border-white/5">
                          <Search className="w-3 h-3" /> Search
                        </div>
                        <div className="bg-black/20 rounded px-2 py-1 text-xs font-semibold text-slate-300">Time-slider</div>
                      </div>
                    </div>
                  </div>
                  {/* Treemap mockup */}
                  <div className="p-4 grid grid-cols-3 gap-3 h-[250px]">
                    <div className="col-span-1 border-2 border-[#4FD1C5] rounded-xl bg-[#4FD1C5]/10 p-4 flex flex-col justify-between shadow-[inset_0_0_20px_rgba(79,209,197,0.15)] glow-block">
                       <span className="text-[#a6d8d1] text-xs font-medium">Metals</span>
                       <span className="text-white text-2xl font-bold tracking-tight">€2.5M <span className="text-xs text-slate-400 font-normal">Value</span></span>
                    </div>
                    <div className="col-span-2 grid grid-cols-3 grid-rows-2 gap-3">
                       <div className="border border-[#3e766a] rounded-xl bg-gradient-to-br from-[#244f47] to-[#1a3832] p-3 flex flex-col justify-between col-span-2">
                         <span className="text-[#a4b5b1] text-xs font-medium">Polymers</span>
                         <span className="text-white text-lg font-bold">€2M <span className="text-[10px] text-slate-400 font-normal">Items</span></span>
                       </div>
                       <div className="border border-[#55406d] rounded-xl bg-[#2e263d] p-3 flex flex-col justify-between">
                         <span className="text-[#c6b8d9] text-xs font-medium">Electronics</span>
                         <span className="text-white text-lg font-bold">€30k <span className="text-[10px] text-slate-400 font-normal">Items</span></span>
                       </div>
                       <div className="border border-[#725a34] rounded-xl bg-[#362e1e] p-3 col-span-1">
                         <span className="text-[#d8cdb8] text-xs font-medium">Woods</span>
                       </div>
                       <div className="border border-[#3e766a] rounded-xl bg-[#244f47] p-3 col-span-2 grid grid-cols-2 gap-2">
                         <div className="bg-black/20 rounded-md p-2 flex flex-col justify-end"><span className="text-[#a4b5b1] text-[10px]">Alloys</span></div>
                         <div className="bg-black/20 rounded-md p-2 flex flex-col justify-end"><span className="text-[#a4b5b1] text-[10px]">Others</span></div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Middle Window: Network Graph */}
                <div className="absolute top-[170px] -right-4 w-[85%] h-[240px] bg-[#1a3832]/95 backdrop-blur-xl border border-[#376b60] rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden animate-float z-20">
                  <div className="px-4 py-3 border-b border-[#376b60]/50 flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#4FD1C5]/20 flex items-center justify-center text-[#4FD1C5] font-bold text-xs">G</div>
                    <div className="flex gap-10 w-full items-center">
                       <div>
                         <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Average Deal Value</div>
                         <div className="text-xl text-white font-bold">R$ 82K</div>
                       </div>
                       <div className="px-6 border-l border-[#376b60]">
                         <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Market Liquidity Score</div>
                         <div className="text-xl text-[#4FD1C5] font-bold">High 8.5</div>
                       </div>
                       <div className="ml-auto text-right">
                         <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Active Certified Buyers</div>
                         <div className="text-xl text-white font-bold">1.2k+</div>
                       </div>
                    </div>
                  </div>
                  {/* Network mock */}
                  <div className="relative w-full h-[150px] flex items-center justify-center overflow-hidden p-4">
                     <span className="absolute top-2 left-4 text-[10px] text-slate-500 font-medium">Market Heat Map</span>
                     {/* SVG connecting lines */}
                     <svg className="absolute inset-0 w-full h-full opacity-50">
                       <line x1="20%" y1="60%" x2="50%" y2="40%" stroke="#4FD1C5" strokeWidth="1" />
                       <line x1="20%" y1="60%" x2="40%" y2="80%" stroke="#4FD1C5" strokeWidth="1" />
                       <line x1="50%" y1="40%" x2="80%" y2="50%" stroke="#4FD1C5" strokeWidth="1" />
                       <line x1="50%" y1="40%" x2="60%" y2="20%" stroke="#818cf8" strokeWidth="1" />
                       <line x1="80%" y1="50%" x2="60%" y2="80%" stroke="#4FD1C5" strokeWidth="1" />
                       <line x1="40%" y1="80%" x2="60%" y2="80%" stroke="#4FD1C5" strokeWidth="1" strokeDasharray="3 3"/>
                     </svg>
                     {/* Nodes */}
                     <div className="absolute left-[20%] top-[60%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1a3832] border-2 border-[#4FD1C5] flex items-center justify-center z-10"><div className="w-2 h-2 rounded-full bg-[#4FD1C5]"></div></div>
                     <div className="absolute left-[50%] top-[40%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#4FD1C5]/10 border border-[#4FD1C5] flex items-center justify-center z-10 animate-pulse-glow"><div className="w-3 h-3 rounded-full bg-[#4FD1C5]"></div></div>
                     <div className="absolute left-[40%] top-[80%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#1a3832] border-2 border-[#818cf8] z-10"></div>
                     <div className="absolute left-[80%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#4FD1C5]/20 border border-[#4FD1C5] flex items-center justify-center animate-pulse z-10"><div className="w-2 h-2 rounded-full bg-[#4FD1C5]"></div></div>
                     <div className="absolute left-[60%] top-[20%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#818cf8] shadow-[0_0_10px_#818cf8] z-10"></div>
                     <div className="absolute left-[60%] top-[80%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a3832] border-2 border-[#4FD1C5] z-10"></div>
                     
                     {/* Small constellation on right */}
                     <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-[100px] h-[100px] opacity-30">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#4FD1C5" strokeWidth="0.5" strokeDasharray="2 2"/>
                        <circle cx="50" cy="50" r="20" fill="none" stroke="#4FD1C5" strokeWidth="0.5" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="#4FD1C5" strokeWidth="0.5" />
                        <line x1="10" y1="50" x2="90" y2="50" stroke="#4FD1C5" strokeWidth="0.5" />
                     </svg>
                  </div>
                </div>

                {/* Front Window: Area Chart */}
                <div className="absolute bottom-4 -left-4 w-[95%] h-[250px] bg-[#102d27]/98 backdrop-blur-3xl border border-[#2b5a50] rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-float-fast z-30">
                  <div className="px-5 py-4 flex items-center justify-between z-10 relative">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 font-medium"><div className="w-5 h-5 rounded bg-[#4FD1C5]/20 flex items-center justify-center text-[#4FD1C5] font-bold text-[9px]">G</div> Recovered Cash Flow</div>
                      <div className="text-[2rem] text-[#4FD1C5] font-extrabold tracking-tight leading-none mt-1">R$ 15.083 <span className="text-sm font-normal text-slate-400 ml-1">Total</span></div>
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                         <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4FD1C5]"></div> Metals</span>
                         <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#818cf8]"></div> Electronics</span>
                      </div>
                    </div>
                    <div className="text-right border-l border-[#2b5a50]/50 pl-5">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Gross Transaction Volume</div>
                      <div className="text-2xl text-white font-bold">R$ 1.1M</div>
                      <div className="text-xs text-slate-500 mt-1">GTV R$ 1.1M</div>
                    </div>
                  </div>
                  
                  {/* Area chart SVG perfectly fitting */}
                  <div className="absolute bottom-0 left-0 w-full h-[140px] z-0">
                    <svg className="w-[110%] h-full -ml-[5%]" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M0,100 L0,80 Q25,95 50,60 T100,30 L100,100 Z" fill="url(#gradA)" opacity="0.25"/>
                      <path d="M0,100 L0,90 Q25,100 50,75 T100,50 L100,100 Z" fill="url(#gradB)" opacity="0.35"/>
                      
                      <path d="M0,80 Q25,95 50,60 T100,30" fill="none" stroke="#4FD1C5" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(79,209,197,0.8)]"/>
                      <path d="M0,90 Q25,100 50,75 T100,50" fill="none" stroke="#818cf8" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"/>
                      <defs>
                        <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4FD1C5"/><stop offset="100%" stopColor="transparent"/></linearGradient>
                        <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8"/><stop offset="100%" stopColor="transparent"/></linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Tooltip dot & label */}
                    <div className="absolute left-[65%] top-[45%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#102d27] border-[3px] border-[#4FD1C5] shadow-[0_0_15px_#4FD1C5] z-10"></div>
                    <div className="absolute left-[65%] top-[10%] -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-md px-3 py-1.5 border border-[#4FD1C5]/30 shadow-lg z-10">
                        <div className="text-white text-xs font-bold leading-none">R$ 15.083 <span className="text-[10px] text-slate-400 font-normal">Total</span></div>
                        <div className="text-[9px] text-slate-500 mt-1">Aug 2026</div>
                    </div>
                  </div>
                </div>

                {/* AI Support Badge (Floating at front bottom right) */}
                <div className="absolute bottom-2 right-4 z-40 animate-pulse-slow group">
                  <div className="relative">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 text-white text-xs font-semibold px-4 py-2 rounded-full absolute -top-12 -right-2 whitespace-nowrap shadow-2xl transition-opacity opacity-0 group-hover:opacity-100">
                      AI-Powered Support
                    </div>
                    <div className="w-[72px] h-[72px] bg-[#0B6A66] rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-4 border-[#124b43] hover:scale-105 transition-transform cursor-pointer">
                      <MessageSquare className="w-8 h-8 text-white fill-white/10" />
                      <div className="absolute 0 top-0 right-0 w-6 h-6 bg-[#4FD1C5] rounded-full flex items-center justify-center text-[10px] font-black text-[#124b43] border-2 border-[#124b43]">IA</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Explore por categoria</h2>
            <p className="text-muted-foreground">Encontre exatamente o que sua operação precisa</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map(({ label, slug, icon: Icon }) => (
              <Link
                key={slug}
                href={`/produtos?categoria=${slug}`}
                className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl gradient-brand/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Como funciona</h2>
              <p className="text-muted-foreground">Simples, rápido e seguro</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Factory,
                  step: '01',
                  title: 'Cadastre sua empresa',
                  desc: 'Crie sua conta PJ com CNPJ verificado. Processo rápido e 100% online.',
                },
                {
                  icon: Package,
                  step: '02',
                  title: 'Publique ou procure',
                  desc: 'Anuncie materiais excedentes com fotos e preço, ou busque o que precisa com filtros precisos.',
                },
                {
                  icon: Users2,
                  step: '03',
                  title: 'Negocie diretamente',
                  desc: 'Use o chat interno, solicite visita técnica e feche o negócio com total confiança.',
                },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="relative p-6 rounded-2xl border border-border bg-card group hover:border-primary/30 hover:shadow-lg transition-all">
                  <div className="absolute -top-4 left-6 text-5xl font-black text-primary/10 group-hover:text-primary/15 transition-colors">{step}</div>
                  <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="p-10 rounded-3xl gradient-hero border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
                style={{ background: 'oklch(0.65 0.22 45)' }} />
              <ShieldCheck className="w-12 h-12 text-teal-400 mx-auto mb-4 relative z-10" />
              <h2 className="text-3xl font-bold text-white mb-3 relative z-10">
                Pronto para começar?
              </h2>
              <p className="text-slate-400 mb-7 relative z-10">
                Cadastre sua empresa gratuitamente e comece a comprar ou vender materiais industriais hoje.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
                <Link href="/cadastro">
                  <Button size="lg" className="gradient-brand text-white shadow-lg shadow-primary/30 hover:opacity-90 h-11 px-8">
                    Criar conta gratuita
                  </Button>
                </Link>
                <Link href="/produtos">
                  <Button size="lg" variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10 h-11">
                    Ver marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
