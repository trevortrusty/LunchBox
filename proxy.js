import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'

export async function proxy(request) {
  const response = NextResponse.next()
  const session = await getIronSession(request, response, sessionOptions)

  if (!session.userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/shifts/:path*', '/tasks/:path*'],
}
