"use client";
import { ThemeToggleButton } from "@/components/themes/theme-toggle-button";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import SwLogoSml from "@/public/icons/SwLogoSml";
import Signagebk from "@/public/icons/Signagebk";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ForgotPasswordPage() {
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
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-start lg:items-center justify-center">
            <div className="w-full max-w-xs">
              <ForgotPasswordForm />
            </div>
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
              Request Password Reset Now
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
