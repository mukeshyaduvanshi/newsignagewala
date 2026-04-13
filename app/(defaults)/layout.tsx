import { AppSidebar } from "@/components/layouts/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import MainDefaultProvider from "@/lib/provider/MainDefaultProvider";
import React from "react";

const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
  return (
        <MainDefaultProvider>{children}</MainDefaultProvider>
  );
};

export default DefaultLayout;
