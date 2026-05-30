import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // Scripts: self + Next.js inline + Supabase Realtime
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Estilos: self + inline (Tailwind purge usa inline em dev)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fontes
  "font-src 'self' https://fonts.gstatic.com",
  // Imagens: self + Supabase Storage + dados inline (previews)
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
  // Conexões: Supabase REST/Realtime/Auth
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://brasilapi.com.br",
  // Frames: nenhum (evitar clickjacking)
  "frame-ancestors 'none'",
  // Workers para Realtime
  "worker-src 'self' blob:",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Impede que o site seja carregado em iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Impede sniffing de MIME type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Controla quais informações de referrer são enviadas
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Força HTTPS por 1 ano (habilitar apenas após DNS/SSL configurados)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Permissions Policy — limita acesso a APIs sensíveis
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self), payment=()",
          },
          // Content Security Policy
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      // Supabase Storage (imagens de produtos, avatares)
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
};

export default nextConfig;
