import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/reset',
  '/authentication/login/minimal',
  '/authentication/login/creative', 
  '/authentication/login/cover',
  '/authentication/register/minimal',
  '/authentication/register/creative',
  '/authentication/register/cover',
  '/authentication/reset/minimal',
  '/authentication/reset/creative',
  '/authentication/reset/cover',
  '/authentication/verify/minimal',
  '/authentication/verify/creative',
  '/authentication/verify/cover',
  '/authentication/maintenance/minimal',
  '/authentication/maintenance/creative',
  '/authentication/maintenance/cover',
  '/authentication/404/minimal',
  '/authentication/404/creative',
  '/authentication/404/cover'
]

// Define static asset paths that should be ignored
const staticAssets = [
  '/_next',
  '/images',
  // '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/api'
]

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static assets, API routes, and Next.js internal routes
  if (staticAssets.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route)
  
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // For protected routes, let the client-side authentication handle it
  // This middleware will mainly handle server-side redirects if needed
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
    //  * - favicon.ico (favicon file)
     */
    // '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}