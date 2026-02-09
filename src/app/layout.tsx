import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'マグネット管理ツール',
  description: '代理店別店舗ランキング管理ダッシュボード',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
