"use client";

import { SignupForm } from "@/components/auth/signup-form";
import { ThemeToggleButton } from "@/components/themes/theme-toggle-button";
import SwLogoSml from "@/public/icons/SwLogoSml";
import Signagebk from "@/public/icons/Signagebk";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function SignupPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll event to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);
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
          className={`${
            scrolled ? "bg-black/50 backdrop-blur shadow-md rounded-md" : ""
          }`}
        >
          <ThemeToggleButton />
        </div>
      </div>
      <div className="grid min-h-svh max-h-svh lg:grid-cols-2">
        <div className="flex flex-1 items-start lg:items-center mt-30 lg:mt-0 justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
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
            className={`w-full h-screen object-cover transition-all duration-300 ${
              mounted && resolvedTheme === "light" ? "invert" : ""
            }`}
          />
          <div className="absolute inset-0 flex items-center justify-center ">
            <Signagebk animate={true} />
            <div className="absolute inset-1 flex items-center justify-center -top-30">
              Register to Manage your
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
