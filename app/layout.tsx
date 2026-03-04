import type { Metadata } from 'next'
import { Bebas_Neue } from 'next/font/google'
import './globals.css'

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' })

export const metadata: Metadata = {
  title: 'HR Portal',
  description: 'Employee HR Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bebasNeue.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
