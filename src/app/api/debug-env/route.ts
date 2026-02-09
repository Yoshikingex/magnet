import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    hasUser: !!process.env.BASIC_AUTH_USER,
    hasPass: !!process.env.BASIC_AUTH_PASS,
    userLength: process.env.BASIC_AUTH_USER?.length ?? 0,
    passLength: process.env.BASIC_AUTH_PASS?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
  })
}
