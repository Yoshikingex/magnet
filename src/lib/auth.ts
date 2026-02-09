import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * API Route用: Basic認証チェック
 * 認証失敗時はResponseを返す。成功時はnullを返す。
 */
export function checkBasicAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Magnet Admin"' },
    })
  }

  const base64Credentials = authHeader.split(' ')[1]
  if (!base64Credentials) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Magnet Admin"' },
    })
  }

  let decoded: string
  try {
    decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  } catch {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Magnet Admin"' },
    })
  }

  const colonIndex = decoded.indexOf(':')
  if (colonIndex === -1) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Magnet Admin"' },
    })
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
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Magnet Admin"' },
    })
  }

  return null
}

/**
 * Server Component用: Basic認証チェック
 * headersからauthorizationを取得して検証する
 */
export async function checkPageAuth(): Promise<{ authorized: boolean }> {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { authorized: false }
  }

  const base64Credentials = authHeader.split(' ')[1]
  if (!base64Credentials) {
    return { authorized: false }
  }

  let decoded: string
  try {
    decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  } catch {
    return { authorized: false }
  }

  const colonIndex = decoded.indexOf(':')
  if (colonIndex === -1) {
    return { authorized: false }
  }

  const username = decoded.slice(0, colonIndex)
  const password = decoded.slice(colonIndex + 1)

  const validUser = process.env.BASIC_AUTH_USER
  const validPass = process.env.BASIC_AUTH_PASS

  if (!validUser || !validPass) {
    console.error('BASIC_AUTH_USER or BASIC_AUTH_PASS is not configured')
    return { authorized: false }
  }

  if (username !== validUser || password !== validPass) {
    return { authorized: false }
  }

  return { authorized: true }
}
