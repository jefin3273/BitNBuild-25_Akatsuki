import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Fixed typo here - was missing underscore
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          res.cookies.set(name, "", { ...options, maxAge: 0 })
        },
      },
    }
  )

  // Get session
  const { data: { session } } = await supabase.auth.getSession()

  // Define routes
  const protectedRoutes = [
    '/profile',
    '/client-dashboard',
    '/freelancer-dashboard',
  ];
  const authRoutes = ['/auth/signin', '/auth/signup'];

  const isProtectedRoute = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/auth/signin', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth routes to appropriate dashboard
  if (session && isAuthRoute) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('email', session.user.email!)
        .single();

      if (profile) {
        const dashboardUrl = profile.role === 'client'
          ? '/client-dashboard'
          : '/freelancer-dashboard';
        return NextResponse.redirect(new URL(dashboardUrl, req.url));
      }
    } catch (error) {
      console.error('Error fetching user profile in middleware:', error);
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"], // Added |api to exclude API routes
}