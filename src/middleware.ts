import { NextResponse } from 'next/server';
import type { NextFetchEvent } from 'next/server';
import type { NextRequest } from 'next/server';
import axios from 'axios';
import { CONSTANTS } from '@/services/config/app-config';
import { redirect, usePathname } from 'next/navigation'

const notProtectedRoutes = ['/login', '/register', '/forgot-password' , '/update-password','/store'];
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    if (CONSTANTS.ENABLE_REDIRECT_FEATURE) {

      const isLoggedIn = (request.cookies.get('isLoggedIn')?.value != undefined) ? request.cookies.get('isLoggedIn')?.value : "";
      const url = request.nextUrl.clone();
      // console.log("currentUser", isLoggedIn);
      const isNotProtectedRoute = notProtectedRoutes.some((route) =>
        url.pathname.startsWith(route)
      );

      if (url.pathname.startsWith('/_next')) {
        return NextResponse.next();
      }
      if ((!isLoggedIn || isLoggedIn == "false") && isNotProtectedRoute === false) {
        // If the user is not authenticated and trying to access a protected route
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }

      if (url.pathname.startsWith('/login') === true && isLoggedIn == "true") {
        // If the user is authenticated and trying to access the login page, redirect to the dashboard
        url.pathname = '/';
        return NextResponse.redirect(url);
      }

      // const redirect = await fetch(
      //   `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}&method=get_redirecting_urls&entity=signin`,
      //   {
      //     method: 'GET',
      //   }
      // ).then((res: any) => res.json());


      // const url = request.nextUrl.clone();
      // if (url.pathname.startsWith('/_next')) {
      //   return NextResponse.next();
      // }
      // const matchingRedirect = redirect.message.find(
      //   (value: any) => value.from === url.pathname
      // );
      // if (matchingRedirect) {
      //   url.pathname = matchingRedirect.to;
      //   url.search = '';
      //   return Response.redirect(url, 308);
      // } else {
      //   return NextResponse.next();
      // }
    } else {
      console.log('Redirect feature is disabled.');
    }
  } catch (err) {
    console.error('Error fetching redirect data:', err);
    return NextResponse.next();
  }
}
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|images|favicon.ico|logo.png|sw.js).*)'],
};


