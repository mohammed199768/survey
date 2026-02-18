import { NextRequest, NextResponse } from 'next/server';

const ADMIN_LOGIN_PATH = '/admin/login';
const NONCE_HEADER = 'x-nonce';

const resolveApiBaseUrl = (request: NextRequest): string => {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (configured) {
    return configured.endsWith('/api') ? configured : `${configured}/api`;
  }
  return `${request.nextUrl.origin}/api`;
};

const buildCsp = (nonce: string): string => {
  if (process.env.NODE_ENV !== 'production') {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: http:",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
  }

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
};

const applySecurityHeaders = (response: NextResponse, nonce: string): NextResponse => {
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  response.headers.set(NONCE_HEADER, nonce);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
};

const verifyAdminSession = async (request: NextRequest): Promise<boolean> => {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return false;
  }

  const verifyUrl = `${resolveApiBaseUrl(request)}/admin/auth/verify`;

  try {
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
        accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!verifyResponse.ok) {
      return false;
    }

    const payload = (await verifyResponse.json().catch(() => null)) as { valid?: boolean } | null;
    return payload?.valid === true;
  } catch {
    return false;
  }
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);

  const isProtectedAdminRoute =
    pathname.startsWith('/admin') && pathname !== ADMIN_LOGIN_PATH;

  if (isProtectedAdminRoute) {
    const hasValidSession = await verifyAdminSession(request);
    if (!hasValidSession) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set('from', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(redirectResponse, nonce);
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applySecurityHeaders(response, nonce);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
