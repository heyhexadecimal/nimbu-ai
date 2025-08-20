import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Nimbu AI',
  description: 'Your personal AI assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}