import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-perez-pericia';
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('auth_token')?.value;

  const isAuthRoute = pathname === '/login' || pathname === '/cadastro';
  const isPrivateRoute = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/processos') ||
    pathname.startsWith('/kanban') ||
    pathname.startsWith('/financeiro') ||
    pathname.startsWith('/agenda') ||
    pathname.startsWith('/configuracoes') ||
    pathname.startsWith('/admin');

  const isAdminRoute = pathname.startsWith('/admin');

  if (isPrivateRoute) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
      });

      if (isAdminRoute && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  if (isAuthRoute && token) {
    try {
      await jwtVerify(token, key, {
        algorithms: ['HS256'],
      });
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      const response = NextResponse.next();
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
