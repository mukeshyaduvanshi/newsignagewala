// import type { NextRequest } from 'next/server';
// import { NextResponse } from 'next/server';

// /**
//  * Middleware function to handle user authentication and authorization.
//  *
//  * - JWT token `userToken` cookie me hota hai (id, type, status)
//  * - Public routes without login allowed
//  * - Account status check: new, blocked, terminate, approved
//  * - Role-based routes: userType ke hisaab se allowed paths
//  * - Agar user galat route pe jata hai (e.g. vend user /corp par)
//  *   -> usko uske ROLE ke home route par wapas redirect kar dete hain
//  */
// export function middleware(request: NextRequest) {
//     // User token from cookies
//     const userToken = request.cookies.get('refreshToken');
//     // console.log(userToken);
    

//     // user details from token
//     let userId: string | null = null;
//     let userType: string | null = null;

//     // Decode JWT payload from the token if it exists
//     if (userToken) {
//         try {
//             const base64Payload = userToken.value.split('.')[1];
//             const payloadString = Buffer.from(base64Payload, 'base64').toString('utf8');
//             const payload = JSON.parse(payloadString);
//             // console.log(payload);
            

//             userId = payload.userId;
//             userType = payload.userType;    // e.g. 'dev', 'kam', 'vend', 'corp', ...
//             // console.log(userId, userType);
            
//         } catch (error) {
//             console.error('Error decoding token:', error);
//         }
//     }

//     const { pathname } = request.nextUrl;

//     // Public routes that do not require authentication
//     const publicRoutes = [
//         '/auth/login',
//         '/auth/signup',
//     ];

//     // 🔓 If user is not logged in, allow only public routes
//     if (!userId) {
//         if (!publicRoutes.includes(pathname)) {
//             return NextResponse.redirect(new URL('/auth/login', request.url));
//         }
//         return NextResponse.next();
//     }

    

//     // 🏠 Role-based home routes (default/dashboard per role)
//     const roleHomeRoutes: Record<string, string> = {
//         admin: '/admin',
//         manager: '/manager',
//         brand: '/brand',
//         vendor: '/vendor',
//     };

//     // ✅ If user is approved and tries to access root ('/'), redirect to their dashboard

//     // 🔐 Role-based allowed route prefixes
//     const roleRoutes: Record<string, string[]> = {
//         admin: ['/admin'],
//         manager: ['/manager'],
//         brand: ['/brand'],
//         vendor: ['/vendor'],
//     };

//     const allowedRoutes = (userType && roleRoutes[userType]) || [];
//     const isAuthorized = allowedRoutes.some((route) => pathname.startsWith(route));

//     // ❌ Agar user apne allowed prefix ke bahar jaane ki koshish kare:
//     // e.g. vend user /corp pe, corp user /vend pe, etc.
//     if (!isAuthorized) {
//         // 👇 Yaha pe hum usko uske hi ROLE ke home route par wapas bhej rahe hain
//         const redirectTo = (userType && roleHomeRoutes[userType]) || '/auth/login';
//         return NextResponse.redirect(new URL(redirectTo, request.url));
//     }

//     // ✅ Sab thik hai, request aage ja sakti hai
//     return NextResponse.next();
// }

// // Configuration for the middleware to protect routes
// export const config = {
//     matcher: [
//         '/',
//         '/brand/:path*',
//         '/vendor/:path*',
//         '/admin/:path*',
//         '/manager/:path*',
//     ],
// };



import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
    const userToken = request.cookies.get('refreshToken');

    let userId: string | null = null;
    let userType: string | null = null;

    if (userToken) {
        try {
            const base64Payload = userToken.value.split('.')[1];
            const payloadString = Buffer.from(base64Payload, 'base64').toString('utf8');
            const payload = JSON.parse(payloadString);

            userId = payload.userId;
            userType = payload.userType;
        } catch (error) {
            console.error('Error decoding token:', error);
        }
    }

    const { pathname } = request.nextUrl;

    const publicRoutes = ['/auth/login', '/auth/signup'];

    if (!userId) {
        if (!publicRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
        return NextResponse.next();
    }

    const roleHomeRoutes: Record<string, string> = {
        admin: '/admin',
        manager: '/manager',
        brand: '/brand',
        vendor: '/vendor',
    };

    const roleRoutes: Record<string, string[]> = {
        admin: ['/admin'],
        manager: ['/manager'],
        brand: ['/brand'],
        vendor: ['/vendor'],
    };

    const allowedRoutes = (userType && roleRoutes[userType]) || [];
    const isAuthorized = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!isAuthorized) {
        const redirectTo = (userType && roleHomeRoutes[userType]) || '/auth/login';
        return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/brand/:path*',
        '/vendor/:path*',
        '/admin/:path*',
        '/manager/:path*',
    ],
};
