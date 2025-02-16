import './globals.css'

import { ThemeEnum } from '@repo/types/enums'
import clsx from 'clsx'

import { Providers } from './providers'

import { getNamespacedStorageKey } from '@/lib/storage'

const themeStorageKey = getNamespacedStorageKey('theme')
const themeBootstrapScript = `
!function(){
  try {
    document.documentElement.classList.remove('dark', 'light')
    const theme = JSON.parse(localStorage.getItem('${themeStorageKey}') || '{}')
    if (theme === '${ThemeEnum.DARK}') {
      document.documentElement.classList.add('dark')
    } else if(theme === '${ThemeEnum.LIGHT}') {
      document.documentElement.classList.remove('dark')
    } else if(theme === '${ThemeEnum.SYSTEM}' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    };
  } catch(e) {}
}()
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx('antialiased')}>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
