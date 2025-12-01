import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Return early if env vars are missing
    if (!supabaseUrl || !supabaseAnonKey) {
      return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // If there's an error getting user, just continue
    if (error) {
      return supabaseResponse;
    }

    // Protected routes
    const protectedRoutes = ["/dashboard", "/log-meal", "/history", "/analytics", "/settings"];
    const authRoutes = ["/login", "/signup"];
    const pathname = request.nextUrl.pathname;

    // Redirect to login if accessing protected route without auth
    if (protectedRoutes.some((route) => pathname.startsWith(route)) && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Redirect to dashboard if accessing auth routes while logged in
    if (authRoutes.some((route) => pathname.startsWith(route)) && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    // If middleware fails, just continue to avoid breaking the app
    console.error("Middleware error:", error);
    return NextResponse.next({
      request,
    });
  }
}

