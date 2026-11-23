import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { DevPanel } from '@/features/dev-panel/DevPanel'

import { Providers } from './providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'commerce-perf-lab',
  description: '쇼핑몰 프론트엔드 성능 실험',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <DevPanel />
        </Providers>
      </body>
    </html>
  )
}
