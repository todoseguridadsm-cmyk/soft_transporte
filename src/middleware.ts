import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, permissions')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'cliente'

    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      if (role === 'admin' || role === 'empleado') url.pathname = '/dashboard'
      else if (role === 'chofer') url.pathname = '/dashboard/trips'
      else url.pathname = '/dashboard/client'
      return NextResponse.redirect(url)
    }

    // Protect Dashboard Routes based on permissions
    const path = request.nextUrl.pathname
    if (path.startsWith('/dashboard') && role === 'empleado') {
      const permissions = profile?.permissions || []
      
      const restrictedRoutes = [
        { route: '/dashboard/trips', id: 'trips' },
        { route: '/dashboard/expenses', id: 'expenses' },
        { route: '/dashboard/sales', id: 'sales' },
        { route: '/dashboard/company-expenses', id: 'company_expenses' },
        { route: '/dashboard/checks', id: 'checks' },
        { route: '/dashboard/clients', id: 'clients' },
        { route: '/dashboard/suppliers', id: 'suppliers' },
        { route: '/dashboard/drivers', id: 'drivers' },
        { route: '/dashboard/vehicles', id: 'vehicles' },
        { route: '/dashboard/company', id: 'company' },
        { route: '/dashboard/partners-wallet', id: 'partners' },
        { route: '/dashboard/users', id: 'users' }, // only admin
      ]

      // Si intenta acceder a /dashboard exactamente y no tiene permiso 'home', lo redirigimos a su primer permiso válido
      if (path === '/dashboard' && !permissions.includes('home')) {
        const url = request.nextUrl.clone()
        const firstPerm = permissions[0]
        if (firstPerm) {
          const matchingRoute = restrictedRoutes.find(r => r.id === firstPerm)
          url.pathname = matchingRoute ? matchingRoute.route : '/dashboard/trips'
        } else {
          url.pathname = '/login'
        }
        return NextResponse.redirect(url)
      }

      for (const res of restrictedRoutes) {
        if (path.startsWith(res.route)) {
          if (res.id === 'users' || !permissions.includes(res.id)) {
            // No tiene permiso
            const url = request.nextUrl.clone()
            url.pathname = permissions.includes('home') ? '/dashboard' : (permissions.length > 0 ? restrictedRoutes.find(r => r.id === permissions[0])?.route || '/login' : '/login')
            return NextResponse.redirect(url)
          }
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
