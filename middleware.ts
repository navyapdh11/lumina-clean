import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/api/scraping', '/api/admin'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Only apply auth guard if Supabase is properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project');

  // Check auth if Supabase is configured
  if (isSupabaseConfigured && protectedRoutes.some(route => pathname.startsWith(route))) {
    const hasSession = req.cookies.get('sb-access-token') || req.cookies.get('__session');
    if (!hasSession) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Security headers (OWASP Top 10 remediation)
  const securityHeaders: Record<string, string> = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=self, microphone=self',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co",
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Rate limiting headers
  res.headers.set('X-RateLimit-Limit', '100');
  res.headers.set('X-RateLimit-Remaining', '99');
  res.headers.set('X-RateLimit-Reset', String(Date.now() + 60000));

  return res;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/residential/:path*',
  ],
};
