
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose';
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const pathname = req.nextUrl.pathname;
  const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
  // console.log('Middleware invoked. JWT_SECRET:', JWT_SECRET);
  let isTokenValid = false;
  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);
      isTokenValid = true;
    } catch (e) {
      isTokenValid = false;
    }
  }
  // Debug: log all cookies and path
  // console.log('--- Middleware Debug ---')
  // console.log('Pathname:', pathname)
  // console.log('All cookies:', req.cookies.getAll())
  // console.log('Auth token:', token)

  // Update public and protected route logic to match actual app structure
  const isPublicRoute =
    pathname.startsWith('/login') || pathname.startsWith('/register');

  // Protect main app sections
  const isProtectedRoute =
    pathname === '/' ||
    pathname.startsWith('/campaigns') ||
    pathname.startsWith('/email-lists') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/templates');
  // console.log('Middleware check:', { pathname, token, isPublicRoute, isProtectedRoute });
  if (!isTokenValid && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isTokenValid && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: [
    '/login',
    '/register',
    '/campaigns/:path*',
    '/email-lists/:path*',
    '/reports/:path*',
    '/templates/:path*',
    '/'
  ],
}
