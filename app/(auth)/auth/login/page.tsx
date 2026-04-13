"use client";

import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggleButton } from "@/components/themes/theme-toggle-button";
import SwLogoSml from "@/public/icons/SwLogoSml";
import Signagebk from "@/public/icons/Signagebk";
import Vendoricon from "@/public/icons/Vendoricon";
import Fabricatoricon from "@/public/icons/Fabricatoricon";
import Citiesicon from "@/public/icons/Citiesicon";
import Producticone from "@/public/icons/Producticone";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
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
      <div className="flex flex-col">
        <div className=" grid min-h-svh  lg:grid-cols-2">
          <div className="flex lg:flex-1 lg:flex-row items-center mt-20 flex-col-reverse lg:mt-0  justify-end gap-10 lg:gap-0 lg:justify-center">
            <div className="w-full max-w-xs mb-10 lg:mb-0">
              {/* Login Form */}
              <LoginForm />
            </div>
            <div className="lg:hidden  w-full px-4 max-w-[550px]">
              <Signagebk animate={true} />
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
                Login and Start Managing your Signage
              </div>
            </div>
          </div>
        </div>

        {/* why choose signagewala  */}
        <div className="min-w-screen bg-green-600 text-slate-50 text-center flex flex-col gap-8 items-center pt-6 pb-6 pl-4 pr-4">
          <h1 className="text-3xl lg:text-4xl font-bold">
            Why Choose Signagewala?
          </h1>
          <p className="text-lg lg:text-xl max-w-2xl mx-auto opacity-90">
            India's most trusted signage management platform
          </p>
        </div>

        {/* we empower businesses */}
        <div className="relative bg-emerald-900 text-white py-8 px-4 lg:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* number of vendors  */}
              <div className="bg-white text-gray-800 shadow-emerald-500 shadow-xl rounded-xl p-4 flex items-center transform transition-transform duration-300 hover:scale-105 focus-within:scale-105">
                <div className="pr-3 border-r-2 border-gray-200">
                  <Vendoricon aria-hidden="true" />
                </div>
                <div className="pl-3 flex flex-col items-start">
                  <span className="text-2xl lg:text-3xl text-orange-600 font-bold">
                    300+
                  </span>
                  <span className="text-xs lg:text-sm uppercase text-gray-600">
                    Vendors
                  </span>
                </div>
              </div>

              {/* number of fabricators  */}
              <div className="bg-white text-gray-800 shadow-emerald-500 shadow-xl rounded-xl p-4 flex items-center transform transition-transform duration-300 hover:scale-105 focus-within:scale-105">
                <div className="pr-3 border-r-2 border-gray-200">
                  <Fabricatoricon aria-hidden="true" />
                </div>
                <div className="pl-3 flex flex-col items-start">
                  <span className="text-2xl lg:text-3xl text-emerald-700 font-bold">
                    250+
                  </span>
                  <span className="text-xs lg:text-sm uppercase text-gray-600">
                    Fabricators
                  </span>
                </div>
              </div>

              {/* geographical coverage  */}
              <div className="bg-white text-gray-800 shadow-emerald-500 shadow-xl rounded-xl p-4 flex items-center transform transition-transform duration-300 hover:scale-105 focus-within:scale-105">
                <div className="pr-3 border-r-2 border-gray-200">
                  <Citiesicon aria-hidden="true" />
                </div>
                <div className="pl-3 flex flex-col items-start">
                  <span className="text-2xl lg:text-3xl text-blue-500 font-bold">
                    138
                  </span>
                  <span className="text-xs lg:text-sm uppercase text-gray-600">
                    Towns and Cities
                  </span>
                </div>
              </div>

              {/* product range  */}
              <div className="bg-white text-gray-800 shadow-emerald-500 shadow-xl rounded-xl p-4 flex items-center transform transition-transform duration-300 hover:scale-105 focus-within:scale-105">
                <div className="pr-3 border-r-2 border-gray-200">
                  <Producticone aria-hidden="true" />
                </div>
                <div className="pl-3 flex flex-col items-start">
                  <span className="text-2xl lg:text-3xl text-yellow-500 font-bold">
                    3000+
                  </span>
                  <span className="text-xs lg:text-sm uppercase text-gray-600">
                    Products
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Visibility  */}
        <section className="bg-amber-50 text-slate-700 py-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl lg:text-2xl mb-8 leading-relaxed">
              Maximize{" "}
              <span className="uppercase text-amber-600 font-bold text-2xl lg:text-3xl">
                Brand Visibility
              </span>{" "}
              with precision and speed
            </h2>

            <div className="w-full max-w-2xl mx-auto mb-8">
              <Image
                alt="India map showing distribution of workers and vendors across the country"
                src="/indiamapworkers.png"
                width={600}
                height={675}
                className="w-full h-auto rounded-lg shadow-lg"
                priority={false}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            </div>

            <p className="text-base lg:text-lg mb-8 max-w-3xl mx-auto leading-relaxed text-slate-600">
              Partner with our vetted network of trusted vendors and skilled
              fabricators across India to execute your brand campaigns faster
              and more reliably than ever before.
            </p>

            <Link
              href="/auth/signup"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-300 shadow-lg"
              aria-label="Sign up to learn more about brand visibility solutions"
            >
              Get Started Today
            </Link>
          </div>
        </section>

        {/* build your signage library  */}
        <section className="bg-cyan-50 text-slate-700 py-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl lg:text-2xl mb-8 leading-relaxed">
              Create Your Comprehensive{" "}
              <span className="uppercase text-cyan-600 font-bold text-2xl lg:text-3xl">
                Signage Library
              </span>{" "}
              for complete control
            </h2>

            <div className="w-full max-w-2xl mx-auto mb-8">
              <Image
                alt="Digital library interface showing organized signage assets and management tools"
                src="/library.png"
                width={600}
                height={475}
                className="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>

            <p className="text-base lg:text-lg mb-8 max-w-3xl mx-auto leading-relaxed text-slate-600">
              Centralize all your signage assets with detailed information
              including dimensions, media specifications, contact details, and
              GPS coordinates. Streamline future rebranding campaigns with
              organized, accessible data at your fingertips.
            </p>

            <Link
              href="/auth/register"
              className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300 shadow-lg"
              aria-label="Register to start building your signage library"
            >
              Build Your Library
            </Link>
          </div>
        </section>

        {/* Color Consistency  */}
        <section className="bg-violet-50 text-slate-700 py-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl lg:text-2xl mb-8 leading-relaxed">
              Ensure Perfect{" "}
              <span className="uppercase text-violet-600 font-bold text-2xl lg:text-3xl">
                Brand Color
              </span>{" "}
              consistency nationwide
            </h2>

            <div className="w-full max-w-2xl mx-auto mb-8">
              <Image
                alt="Color swatch palette showing brand color matching and printing consistency tools"
                src="/colorswatch.png"
                width={600}
                height={451}
                className="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>

            <div className="text-base lg:text-lg mb-8 max-w-3xl mx-auto leading-relaxed text-slate-600">
              <p className="mb-4">
                Color variations across different printers can compromise your
                brand identity. Our{" "}
                <span className="bg-red-700 text-white px-2 py-1 rounded font-medium">
                  standardized
                </span>{" "}
                color matching system ensures your{" "}
                <span className="bg-red-800 text-white px-2 py-1 rounded font-medium">
                  brand colors
                </span>{" "}
                remain consistent across all vendors and locations.
              </p>
              <p className="mb-4">
                We provide custom printer profiles for all approved equipment
                and facilitate physical color swatch sharing with new vendors
                for precise color matching.
              </p>
              <p className="font-bold text-violet-700 text-xl">
                Consistent Colors = Strong Brand Identity
              </p>
            </div>

            <Link
              href="/auth/register"
              className="inline-block bg-violet-500 hover:bg-violet-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-300 shadow-lg"
              aria-label="Register to maintain brand color consistency"
            >
              Ensure Color Accuracy
            </Link>
          </div>
        </section>

        {/* Online Order Tender Syste */}
        <section className="bg-pink-50 text-slate-700 py-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl lg:text-2xl mb-8 leading-relaxed">
              Smart{" "}
              <span className="uppercase text-pink-600 font-bold text-2xl lg:text-3xl">
                Order Tender
              </span>{" "}
              system for optimal vendor selection
            </h2>

            <div className="w-full max-w-2xl mx-auto mb-8">
              <Image
                alt="Online tender system interface showing vendor selection and order management"
                src="/onlinetender.png"
                width={600}
                height={575}
                className="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>

            <p className="text-base lg:text-lg mb-8 max-w-3xl mx-auto leading-relaxed text-slate-600">
              Choose from your pre-selected trusted vendors or leverage our
              intelligent tender system to automatically match you with the
              best-rated vendors from our network of 5,000+ registered
              professionals, based on quality metrics and delivery performance.
            </p>

            <Link
              href="/auth/register"
              className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300 shadow-lg"
              aria-label="Register to access the order tender system"
            >
              Start Tendering
            </Link>
          </div>
        </section>

        {/* Festive Suggestive Notifications  */}
        <section className="bg-emerald-50 text-slate-700 py-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl lg:text-2xl mb-8 leading-relaxed">
              Stay ahead with{" "}
              <span className="uppercase text-emerald-600 font-bold text-2xl lg:text-3xl">
                Festive Ready
              </span>{" "}
              campaign alerts
            </h2>

            <div className="w-full max-w-2xl mx-auto mb-8">
              <Image
                alt="Festive branding calendar and notification system for campaign planning"
                src="/festivebranding.png"
                width={600}
                height={311}
                className="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>

            <p className="text-base lg:text-lg mb-8 max-w-3xl mx-auto leading-relaxed text-slate-600">
              Receive timely notifications about upcoming local and regional
              festivals to plan your seasonal campaigns in advance. Never miss
              an opportunity to maximize your brand presence during peak festive
              periods.
            </p>

            <Link
              href="/auth/register"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300 shadow-lg"
              aria-label="Register to receive festive ready notifications"
            >
              Enable Alerts
            </Link>
          </div>
        </section>

        {/* Live tracking of executions  */}
        <section className="bg-blue-50 text-slate-700 py-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl lg:text-2xl mb-8 leading-relaxed">
              Monitor{" "}
              <span className="uppercase text-blue-600 font-bold text-2xl lg:text-3xl">
                Campaign Execution
              </span>{" "}
              in real-time
            </h2>

            <div className="w-full max-w-2xl mx-auto mb-8">
              <Image
                alt="Real-time tracking dashboard showing live execution status and progress monitoring"
                src="/realtime.png"
                width={600}
                height={711}
                className="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>

            <p className="text-base lg:text-lg mb-8 max-w-3xl mx-auto leading-relaxed text-slate-600">
              Track every aspect of your campaigns through our comprehensive
              dashboard. Receive instant notifications when milestones are
              reached and projects are completed, ensuring complete visibility
              and control over your investments.
            </p>

            <Link
              href="/auth/register"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
              aria-label="Register to track branding executions in real-time"
            >
              Start Tracking
            </Link>
          </div>
        </section>

        {/* Audit features */}
        <section className="bg-red-50 text-slate-700 py-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl lg:text-2xl mb-8 leading-relaxed">
              Conduct Professional{" "}
              <span className="uppercase text-red-600 font-bold text-2xl lg:text-3xl">
                Signage Audits
              </span>{" "}
              for continuous improvement
            </h2>

            <div className="w-full max-w-2xl mx-auto mb-8">
              <Image
                alt="Signage audit interface showing inspection tools and quality assessment features"
                src="/audit.png"
                width={600}
                height={570}
                className="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>

            <p className="text-base lg:text-lg mb-8 max-w-3xl mx-auto leading-relaxed text-slate-600">
              Implement systematic quality assessments and surprise audits to
              maintain high standards across all locations. Use detailed
              insights to optimize future campaigns and ensure consistent brand
              representation.
            </p>

            <Link
              href="/auth/register"
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300 shadow-lg"
              aria-label="Register to initiate signage audits"
            >
              Schedule Audits
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
