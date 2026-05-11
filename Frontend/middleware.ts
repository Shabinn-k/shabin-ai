import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
]

const AUTH_PATHS = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('shabin-auth')?.value

  // Parse Zustand persisted state from cookie - check if token exists
  const isAuthenticated = !!token

  // If user hits auth page while logged in, redirect to chat
  if (AUTH_PATHS.some((p) => pathname === p) && isAuthenticated) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  // Protect /chat and /admin routes
  if ((pathname.startsWith('/chat') || pathname.startsWith('/admin')) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}