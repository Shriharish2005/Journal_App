"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenBox, FolderOpen, Calendar, BarChart2, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import { SignedIn } from "@clerk/nextjs";

export default function HeaderNav() {
  const pathname = usePathname();
  const [activeNav, setActiveNav] = useState(null);

  useEffect(() => {
    if (pathname.startsWith("/journal/write")) {
      setActiveNav("create");
    } else if (pathname === "/" || pathname === "/dashboard") {
      setActiveNav("dashboard");
    } else if (pathname.startsWith("/calendar")) {
      setActiveNav("calendar");
    } else if (pathname.startsWith("/collection")) {
      setActiveNav("collections");
    } else if (pathname.startsWith("/analytics") || pathname.startsWith("/stats")) {
      setActiveNav("analytics");
    } else {
      setActiveNav(null);
    }
  }, [pathname]);

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      signedInOnly: true,
    },
    {
      id: "calendar",
      label: "Calendar",
      href: "/calendar",
      icon: Calendar,
      signedInOnly: true,
    },
    {
      id: "collections",
      label: "Collections",
      href: "/collections",
      icon: FolderOpen,
      signedInOnly: true,
    },
    {
      id: "analytics",
      label: "Analytics",
      href: "/analytics",
      icon: BarChart2,
      signedInOnly: true,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Navigation Pills (SignedIn) */}
      <SignedIn>
        <div className="hidden lg:flex items-center p-1 bg-orange-100/50 backdrop-blur-sm rounded-xl border border-orange-200/50 shadow-inner">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;
            return (
              <Link key={item.id} href={item.href} onClick={() => setActiveNav(item.id)}>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white text-orange-950 shadow-xs shadow-orange-500/10 font-bold"
                      : "text-stone-600 hover:text-orange-800 hover:bg-white/50"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-orange-600" : "text-stone-400"}`} />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </SignedIn>

      {/* Action CTA: Write New */}
      <Link href="/journal/write" onClick={() => setActiveNav("create")}>
        <Button
          variant="journal"
          size="sm"
          className="rounded-xl px-3.5 py-2 flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-medium"
        >
          <PenBox className="h-4 w-4" />
          <span className="hidden sm:inline">Write Entry</span>
        </Button>
      </Link>
    </div>
  );
}
