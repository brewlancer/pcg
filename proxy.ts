import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const currentPath = request.nextUrl.pathname;

    if (currentPath === '/login') {
        return NextResponse.next();
    }

    const session = request.cookies.get('pcg_session')?.value;

    if (!session || session !== 'authenticated') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
