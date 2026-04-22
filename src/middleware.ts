import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const HANA_VOTE_HOST = 'hana-vote.vercel.app'
const PREFIX = '/hana-vote'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  if (!hostname.startsWith(HANA_VOTE_HOST)) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl

  if (pathname.startsWith(PREFIX)) {
    const stripped = pathname.slice(PREFIX.length) || '/'
    const url = request.nextUrl.clone()
    url.pathname = stripped
    return NextResponse.redirect(url)
  }

  const url = request.nextUrl.clone()
  url.pathname = `${PREFIX}${pathname === '/' ? '' : pathname}`
  url.search = search
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)',
  ],
}
