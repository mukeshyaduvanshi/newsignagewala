"use client";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { AuthProvider } from "@/lib/context/AuthContext";
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/sidebar";
import { NetworkIndicatorClient } from "@/components/ui/network-indicator-client";
import StoreProvider from "@/lib/redux/store-provider";

export const RootProvider = ({ children }: { children: React.ReactNode }) => {
  // Root Provider is working as a root layout because it is wrap all client side context providers and it is not a triger for the any other layout or components and not allow any other layout to wrap inside it.
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <StoreProvider>
          <AuthProvider>
            <NetworkIndicatorClient />
            <main className="w-full">
              {children}
            </main>
          </AuthProvider>
        </StoreProvider>
      </ThemeProvider>
    </>
  );
};
