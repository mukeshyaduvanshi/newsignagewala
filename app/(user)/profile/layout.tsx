import MainDefaultProvider from '@/lib/provider/MainDefaultProvider'
import React from 'react'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <MainDefaultProvider>{children}</MainDefaultProvider>
  )
}

export default Layout
