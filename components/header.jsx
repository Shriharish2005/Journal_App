import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import UserMenu from "./user-menu";
import HeaderNav from "./header-nav";
import { checkUser } from "@/lib/checkUser";

async function Header() {
  await checkUser();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-orange-200/50 transition-colors shadow-xs">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-all">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-orange-950">
            Journal
          </span>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-3">
          <HeaderNav />

          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-orange-300 text-orange-950 hover:bg-orange-50 font-semibold cursor-pointer shadow-xs"
              >
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="pl-1 border-l border-orange-200/60 flex items-center">
              <UserMenu />
            </div>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}

export default Header;
