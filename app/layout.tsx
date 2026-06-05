import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Giro Ativo — Marketplace B2B de Materiais Industriais',
    template: '%s | Giro Ativo',
  },
  description:
    'Compre e venda materiais industriais excedentes com segurança. Conexão direta entre empresas.',
  keywords: ['marketplace industrial', 'materiais excedentes', 'B2B', 'tubulações', 'válvulas'],
  openGraph: {
    title: 'Giro Ativo — Marketplace B2B de Materiais Industriais',
    description: 'Compre e venda materiais industriais excedentes com segurança.',
    type: 'website',
    locale: 'pt_BR',
  },
  icons: {
    icon: '/logo/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
