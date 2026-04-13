"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BusinessInformation from "@/components/(user)/businessDetails/businessInformation";
import BusinessKyc from "@/components/(user)/businessDetails/businessKyc";
import { GalleryVerticalEnd } from "lucide-react";
import { ThemeToggleButton } from "@/components/themes/theme-toggle-button";
import SwLogoSml from "@/public/icons/SwLogoSml";
import Signagebk from "@/public/icons/Signagebk";
import Image from "next/image";

const BusinessDetailsPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // If both are completed, redirect to home
  if (user.isBusinessInformation && user.isBusinessKyc) {
    router.push("/home");
    return null;
  }

  // Determine which component to show
  let ComponentToShow;
  if (!user.isBusinessInformation) {
    ComponentToShow = BusinessInformation;
  } else if (user.isBusinessInformation && !user.isBusinessKyc) {
    ComponentToShow = BusinessKyc;
  } else {
    return null;
  }

  return (
    <>
      <div
        className={`fixed flex justify-between items-start top-0 w-full  z-10 px-4 py-2 `}
      >
        <div>
          <a href="/">
            <SwLogoSml className="size-16" />
          </a>
        </div>
        <div
        // className={`${
        //   scrolled ? "bg-black/50 backdrop-blur shadow-md rounded-md" : ""
        // }`}
        >
          <ThemeToggleButton />
        </div>
      </div>
      <div className="grid min-h-svh max-h-svh lg:grid-cols-2">
        <div className="flex flex-1 items-start lg:items-center mt-30 lg:mt-0 justify-center">
          <div className="w-full max-w-xs">
            <ComponentToShow />
          </div>
        </div>
        <div className="hidden lg:block relative">
          <Image
            src="/blackboard.jpg"
            alt="Image"
            // fill
            loading="eager"
            width={1200}
            height={1800}
            className={`w-full h-screen object-cover transition-all duration-300 `}
          />
          <div className="absolute inset-0 flex items-center justify-center ">
            <Signagebk animate={true} />
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessDetailsPage;
