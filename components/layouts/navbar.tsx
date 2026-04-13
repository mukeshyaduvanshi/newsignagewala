"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CircleCheckIcon,
  CircleHelpIcon,
  CircleIcon,
  Bell,
  Settings,
  User,
  LogOut,
  ShoppingCart,
  ArrowLeftRight,
} from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { SidebarTrigger } from "../ui/sidebar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/context/AuthContext";
import { ThemeToggleButton } from "../themes/theme-toggle-button";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toggleCartDrawer } from "@/lib/redux/features/cart-slice";
import { SwitchAccountModal } from "./switch-account-modal";

export function Navbar() {
  const isMobile = useIsMobile();
  const { user, logout, accessToken } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const [hasMultipleBrands, setHasMultipleBrands] = useState(false);
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if manager has multiple brands on mount
  useEffect(() => {
    if (mounted && user?.userType === "manager" && accessToken) {
      checkMultipleBrands();
    }
  }, [mounted, user?.userType, accessToken]);

  const checkMultipleBrands = async () => {
    try {
      const response = await fetch("/api/manager/switch-account/brands", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setHasMultipleBrands(result.data && result.data.length > 0);
      }
    } catch (error) {
      console.error("Error checking multiple brands:", error);
    }
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 w-full">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggleButton />
            <Avatar className="h-10 w-10">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 w-full">
        {/* Left Side - Sidebar Trigger */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />
        </div>

        {/* Right Side - Navigation + Profile */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => dispatch(toggleCartDrawer())}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {cartItemCount}
              </Badge>
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* Theme Toggle */}
          <ThemeToggleButton />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user?.companyLogo || "/avatars/user.png"}
                    alt={(user?.userType === "manager" && user?.teamMemberName) ? user.teamMemberName : (user?.name || "User")}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <AvatarFallback>
                    {(user?.userType === "manager" && user?.teamMemberName)
                      ? user.teamMemberName.charAt(0).toUpperCase()
                      : (user?.name?.charAt(0).toUpperCase() || "U")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xl font-semibold leading-none text-primary">
                    {user?.userType === "manager" && user?.teamMemberName
                      ? user.teamMemberName
                      : user?.name || "Guest User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground font-bold hover:text-foreground">
                    {user?.userType === "manager" && user?.teamMemberEmail
                      ? user.teamMemberEmail
                      : user?.email || "guest@example.com"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground font-bold hover:text-foreground">
                    {user?.userType === "manager" && user?.teamMemberPhone
                      ? user.teamMemberPhone
                      : user?.phone || "Not Provided"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize font-bold text">
                    {user?.userType === "manager" && user?.managerType
                      ? `${user.managerType} (${user.userType})`
                      : user?.userType || "user"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Switch Account - Only for managers with multiple brands */}
              {user?.userType === "manager" && hasMultipleBrands && (
                <>
                  <DropdownMenuItem
                    onClick={() => setSwitchAccountOpen(true)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeftRight className="h-4 w-4 text-primary" />
                    <span>Switch Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <User className="h-4 w-4 text-primary" />
                  <span>View Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Account Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 cursor-pointer text-destructive"
              >
                <span className="h-4 w-4">
                  <LogOut />
                </span>
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Switch Account Modal */}
      {user?.userType === "manager" && (
        <SwitchAccountModal
          open={switchAccountOpen}
          onOpenChange={setSwitchAccountOpen}
        />
      )}
    </header>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
