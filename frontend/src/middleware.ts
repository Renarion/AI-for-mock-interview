import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// No auth middleware - all routes are public; auth is handled client-side with JWT
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
