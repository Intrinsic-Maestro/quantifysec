import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (!user && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = user?.app_metadata?.role as string | undefined

  if (path.startsWith('/dashboard/ciso') && role !== 'ciso') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (path.startsWith('/dashboard/cfo') && role !== 'cfo') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (user && path === '/login') {
    const dest = role === 'cfo' ? '/dashboard/cfo' : '/dashboard/ciso'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}