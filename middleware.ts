import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/ai-dashboard',
  '/admin',
  '/api/cro',
  '/api/scraping',
];

// Routes that require admin role (for mutations)
const ADMIN_ROUTES = [
  '/admin',
  '/api/cro/deploy',
  '/api/scraping',
];

// Rate limit store (in-memory — use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 100, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  record.count += 1;
  return { ok: true, remaining: limit - record.count };
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // ── Trusted IP extraction ────────────────────────────────────────
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  // ── Rate limiting (all API routes) ──────────────────────────────
  if (pathname.startsWith('/api/')) {
    const limit = checkRateLimit(ip, 100, 60_000);
    res.headers.set('X-RateLimit-Limit', '100');
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining));

    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // ── CSRF Protection ─────────────────────────────────────────────
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const hasSession = !!(
      req.cookies.get('lc_session')?.value ||
      req.cookies.get('sb-access-token')?.value
    );
    const hasApiKey = req.headers.get('authorization')?.startsWith('Bearer ');

    if (hasSession && !hasApiKey) {
      const csrfToken =
        req.headers.get('x-csrf-token') ||
        req.headers.get('x-xsrf-token') ||
        req.headers.get('x-requested-with');

      // Allow same-origin fetches without CSRF token (CORS handles cross-origin)
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');
      const host = req.headers.get('host');

      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            // Cross-origin request without CSRF token
            return NextResponse.json(
              { error: 'Cross-origin requests require CSRF token' },
              { status: 403 }
            );
          }
        } catch {
          // Invalid origin header — allow through (CORS will handle it)
        }
      }
    }
  }

  // ── Auth guard for protected routes ─────────────────────────────
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected) {
    const hasSessionCookie =
      req.cookies.get('lc_session')?.value ||
      req.cookies.get('sb-access-token')?.value;

    const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
    const isAdmin = req.cookies.get('lc_role')?.value === 'admin';

    if (isAdminRoute && req.method !== 'GET' && !isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Allow GET on public-facing demo routes without auth
    const isDemoRoute = pathname === '/dashboard' || pathname.startsWith('/ai-dashboard');
    if (req.method === 'GET' && isDemoRoute && !hasSessionCookie) {
      res.headers.set('X-Demo-Mode', 'true');
    } else if (!hasSessionCookie && req.method !== 'GET') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    } else if (!hasSessionCookie && req.method === 'GET' && !isDemoRoute) {
      const loginUrl = new URL('/dashboard', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Security headers (OWASP) ────────────────────────────────────
  const securityHeaders: Record<string, string> = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=self, microphone=self, geolocation=self',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.vercel.app; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  return res;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/ai-dashboard/:path*',
    '/admin/:path*',
  ],
};
