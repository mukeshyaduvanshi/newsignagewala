import { Navbar } from '@/components/layouts/navbar'
import { AppSidebar } from '@/components/layouts/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { CartDrawer } from '@/components/(user)/brand/cart/cart-drawer'
import { CartSync } from '@/components/(user)/brand/cart/cart-sync'
import React from 'react'

const MainDefaultProvider = ({ children }: { children: React.ReactNode }) => {
  //  It's a default layout provider for all default routes if needed any other context provider can be added here. for showing all default routes with sidebar.
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <CartSync />
      <CartDrawer />
    </SidebarProvider>
  )
}

export default MainDefaultProvider