"use client";

import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import Flogo from "@/public/icons/Flogo";
import { useAuth } from "@/lib/context/AuthContext";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function CompanySwitcher() {
  const { user } = useAuth();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex-col items-start h-auto py-3"
        >
          <a href="/" className="w-full flex flex-col items-center">
            <div className="w-full px-4">
              <Flogo />
            </div>
          </a>
        </SidebarMenuButton>
        <hr className="my-2 border-t border-border" />
        {user?.companyName && (
          <div className="text-xs text-muted-foreground font-normal flex justify-center items-center gap-1">
            for <span className="font-semibold">{user.companyName}</span>
          </div>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
