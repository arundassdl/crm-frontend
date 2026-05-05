import { NextResponse } from 'next/server';
import type { NextFetchEvent } from 'next/server';
import type { NextRequest } from 'next/server';
import axios from 'axios';
import { CONSTANTS } from '@/services/config/app-config';
import { redirect, usePathname } from 'next/navigation'
import { getAllowedRolesForPath } from '@/lib/route-role-utils';

const notProtectedRoutes = ['/login', '/register', '/forgot-password' , '/update-password'];
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    if (CONSTANTS.ENABLE_REDIRECT_FEATURE) {


      // const userroleCookie = request.cookies.get('role_profile')?.value;
      

      const isLoggedIn = (request.cookies.get('isLoggedIn')?.value != undefined) ? request.cookies.get('isLoggedIn')?.value : "";

      const AccessTokenData = (request.cookies.get('AccessTokenData')?.value != undefined) ? request.cookies.get('AccessTokenData')?.value : "";
      // let menuListData = "";
      // if (request.cookies.get('menuListData')?.value != undefined) {
      //    menuListData : string = request.cookies.get('menuListData')?.value ?? 'Guest'
      // }
      const menuListData : string = request.cookies.get('menuListData')?.value ?? ''
      
      const url = request.nextUrl.clone();
      // console.log(AccessTokenData, "currentUser", isLoggedIn, menuListData);
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

      if (url.pathname.startsWith('/login') === true && isLoggedIn == "true" ) {
        // If the user is authenticated and trying to access the login page, redirect to the dashboard
        console.log('return login page to home page');
        url.pathname = '/';
        return NextResponse.redirect(url);
      }

      if (isLoggedIn == "true" && url.pathname.startsWith('/login') === false  && isNotProtectedRoute === false) {
          // Allow root route (/) for all authenticated users to prevent redirect loop
          if (url.pathname === '/') {
            return NextResponse.next();
          }

          // console.log(url.pathname, 'url.pathname');
          const userroleCookie = (request.cookies.get('role_profile')?.value != undefined) ? request.cookies.get('role_profile')?.value : "";
          // console.log(userroleCookie, 'localstorage middleware');
          const separator = "/detail";
          const indexOfSeparator = url.pathname.indexOf(separator);
          let resultString;
          if (indexOfSeparator !== -1) {
            resultString = url.pathname.substring(0, indexOfSeparator);
          } else {
            // If the separator is not found, the original string is returned
            resultString = url.pathname; 
          }

          // console.log(resultString, 'resultString');

          // Only check roles if menuListData is available
          if (menuListData && menuListData.trim() !== '') {
            const allowedRoles = getAllowedRolesForPath(resultString, menuListData);
            // console.log(allowedRoles, 'allowedRoles');
            
            // If no roles found for this path and menuListData exists, allow access (might be a public route)
            // Only redirect if roles are defined and user doesn't have access
            if (allowedRoles.length > 0 && !allowedRoles.some(role =>  role === userroleCookie )) {
              // console.log('Unauthorized url');
              url.pathname = '/';
              return NextResponse.redirect(url);
            }
          }
          // If menuListData is empty, allow access (menu might not be loaded yet)
      }
      


      // if (allowedRoles.length > 0) {
      //   return NextResponse.redirect(new URL("/", url));
      // } else {
      //   url.pathname = '/';
      //   return NextResponse.redirect(url);
      // }

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
    
    // Return next response if no redirect was triggered
    return NextResponse.next();
  } catch (err) {
    console.error('Error fetching redirect data:', err);
    return NextResponse.next();
  }
}
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|images|favicon.ico|logo.png|sw.js).*)'],
};


