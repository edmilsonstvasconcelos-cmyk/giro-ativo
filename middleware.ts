import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Home de cada role após login
const ROLE_HOME: Record<string, string> = {
  vendedor:  '/vendedor',
  comprador: '/comprador',
  avaliador: '/avaliador',
  moderador: '/admin/moderacao',
  admin:     '/admin',
}

// Prefixos que exigem autenticação
const AUTH_REQUIRED = [
  '/vendedor', '/comprador', '/avaliador', '/admin',
  '/dashboard', '/meus-produtos', '/chat', '/visitas',
  '/perfil', '/configuracoes', '/onboarding',
]

// Prefixos com restrição por role — roles não listadas são redirecionadas para sua home
const ROLE_RESTRICTED: Array<{ prefix: string; allowed: string[] }> = [
  { prefix: '/vendedor',      allowed: ['vendedor', 'admin'] },
  { prefix: '/comprador',     allowed: ['comprador', 'admin'] },
  { prefix: '/avaliador',     allowed: ['avaliador', 'admin'] },
  { prefix: '/admin',         allowed: ['moderador', 'admin'] },
  { prefix: '/meus-produtos', allowed: ['vendedor', 'admin'] },
]

function requiresAuth(pathname: string) {
  return AUTH_REQUIRED.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isAuthOnlyPath(pathname: string) {
  // /login e /cadastro (raiz) só para não-autenticados
  if (pathname === '/login') return true
  if (pathname === '/cadastro') return true
  return false
}

function isRegistrationSubpath(pathname: string) {
  // /cadastro/comprador e /cadastro/vendedor são acessíveis durante o fluxo de registro
  return pathname.startsWith('/cadastro/')
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  function redirectTo(path: string) {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ''
    return NextResponse.redirect(url)
  }

  // ── Não autenticado ────────────────────────────────────────────────────────

  if (!user) {
    if (requiresAuth(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── Autenticado ────────────────────────────────────────────────────────────

  // Sub-rotas de cadastro (/cadastro/comprador, /cadastro/vendedor) são sempre
  // acessíveis para completar o fluxo mesmo já logado
  if (isRegistrationSubpath(pathname)) {
    return supabaseResponse
  }

  // Busca profile UMA vez por request (apenas quando necessário)
  const needsProfile =
    isAuthOnlyPath(pathname) ||
    requiresAuth(pathname) ||
    ROLE_RESTRICTED.some((r) => pathname.startsWith(r.prefix))

  if (!needsProfile) return supabaseResponse

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  // Usuário sem profile → ainda não completou cadastro
  if (!profile) {
    if (pathname === '/cadastro') return supabaseResponse
    return redirectTo('/cadastro')
  }

  const role = profile.role as string
  const roleHome = ROLE_HOME[role] ?? '/comprador'

  // Páginas de auth-only (login, /cadastro raiz) → redireciona para home do role
  if (isAuthOnlyPath(pathname)) {
    return redirectTo(roleHome)
  }

  // Proteção cruzada de roles
  for (const { prefix, allowed } of ROLE_RESTRICTED) {
    if (pathname.startsWith(prefix) && !allowed.includes(role)) {
      return redirectTo(roleHome)
    }
  }

  // Vendedores sem company → onboarding (após o cadastro podem não ter company ainda)
  if (
    role === 'vendedor' &&
    requiresAuth(pathname) &&
    pathname !== '/onboarding'
  ) {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!company) return redirectTo('/onboarding')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
