import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

function unauthorizedResponse() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Magnet Admin"',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  })
}

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorizedResponse()
  }

  const base64Credentials = authHeader.split(' ')[1]
  if (!base64Credentials) {
    return unauthorizedResponse()
  }

  let decoded: string
  try {
    decoded = atob(base64Credentials)
  } catch {
    return unauthorizedResponse()
  }

  // パスワードに ":" が含まれる可能性があるため、最初の ":" のみで分割
  const colonIndex = decoded.indexOf(':')
  if (colonIndex === -1) {
    return unauthorizedResponse()
  }
  const username = decoded.slice(0, colonIndex)
  const password = decoded.slice(colonIndex + 1)

  const validUser = process.env.BASIC_AUTH_USER
  const validPass = process.env.BASIC_AUTH_PASS

  if (!validUser || !validPass) {
    console.error('BASIC_AUTH_USER or BASIC_AUTH_PASS is not configured')
    return new NextResponse('Server configuration error', { status: 500 })
  }

  if (username !== validUser || password !== validPass) {
    return unauthorizedResponse()
  }

  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
  )
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  return response
}
