import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-auth-token',
        sameSite: 'none',
        secure: true,
      },
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Middleware - Missing Supabase environment variables!');
  }

  // This will refresh the session if it's expired
  const { data: { user } } = await supabase.auth.getUser();

  const allCookies = request.cookies.getAll().map(c => c.name).join(', ');
  console.log('Middleware - Path:', request.nextUrl.pathname, 'User:', user?.id || 'none', 'Cookies:', allCookies);

  // Protected routes logic
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/auth');

  if (isDashboard && !user) {
    console.log('Middleware - Redirecting to / (No User)');
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isAuthPage && user && request.nextUrl.pathname !== '/auth/callback') {
    console.log('Middleware - Redirecting to /dashboard (User Found)');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
};
