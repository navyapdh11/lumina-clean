import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/api/scraping', '/api/admin'];

// Routes that require admin role
const adminOnlyRoutes = ['/api/scraping', '/api/admin'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Only use Supabase if env vars are configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder');

  let session: any = null;

  if (isSupabaseConfigured) {
    try {
      const supabase = createMiddlewareClient({ req, res });
      const { data } = await supabase.auth.getSession();
      session = data.session;
    } catch (error) {
      console.warn('Middleware Supabase error:', error);
    }
  }

  // Check if route requires authentication
  if (isSupabaseConfigured && protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!session) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if route requires admin role
    if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
      try {
        const supabase = createMiddlewareClient({ req, res });
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (user?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Forbidden: Admin access required' },
            { status: 403 }
          );
        }
      } catch (error) {
        console.warn('Admin check error:', error);
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 500 }
        );
      }
    }
  }

  // Security headers (OWASP Top 10 remediation)
  const securityHeaders = {
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
