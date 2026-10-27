import Header from "@/components/header";
import "./globals.css";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import "react-quill-new/dist/quill.snow.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Journal - Daily Reflection & Mood Tracker",
  description:
    "A private, beautifully designed digital journal with intelligent mood tracking, rich text formatting, and emotional wellness analytics.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth" suppressHydrationWarning>
        <body
          className={`${inter.className} bg-gradient-to-b from-orange-50/90 via-amber-50/50 to-orange-50/90 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 text-stone-900 dark:text-stone-100 min-h-screen flex flex-col antialiased selection:bg-orange-200 selection:text-orange-950 dark:selection:bg-orange-900 dark:selection:text-orange-100 transition-colors duration-300`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            {/* Subtle Ambient Background Lighting Orbs */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-300/25 dark:bg-orange-600/10 rounded-full blur-3xl animate-float" />
              <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-amber-200/25 dark:bg-amber-600/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] bg-orange-200/20 dark:bg-orange-700/10 rounded-full blur-3xl" />
              <div className="inset-0 bg-[url('/bg.jpg')] opacity-25 dark:opacity-10 fixed -z-10 mix-blend-multiply" />
            </div>

            <Header />
            
            <main className="flex-1 pb-16">{children}</main>
            
            <Toaster richColors position="top-right" closeButton />
            
            <footer className="mt-auto border-t border-orange-200/60 dark:border-stone-800 bg-white/60 dark:bg-stone-950/70 backdrop-blur-md transition-colors">
              <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  {/* Brand Column */}
                  <div className="md:col-span-2 space-y-3">
                    <Link href="/" className="inline-flex items-center gap-2 group">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <span className="text-2xl font-black tracking-tight text-orange-950 dark:text-orange-100">
                        Journal
                      </span>
                    </Link>
                    <p className="text-sm text-stone-600 dark:text-stone-400 max-w-sm leading-relaxed">
                      Your personal space to reflect, track emotional wellness, and organize life&apos;s memories with absolute privacy and peace of mind.
                    </p>
                  </div>

                  {/* Navigation Links */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-950/70 dark:text-orange-200/70 mb-3">
                      Sanctuary
                    </h4>
                    <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                      <li>
                        <Link href="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link href="/journal/write" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                          Write New Entry
                        </Link>
                      </li>
                      <li>
                        <Link href="/calendar" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                          Calendar Timeline
                        </Link>
                      </li>
                      <li>
                        <Link href="/collections" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                          Collections & Folders
                        </Link>
                      </li>
                      <li>
                        <Link href="/analytics" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                          Mood Analytics
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Copyright */}
                <div className="pt-8 border-t border-orange-200/40 dark:border-stone-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-500">
                  <p>&copy; {new Date().getFullYear()} Journal. Crafted with mindfulness for thoughtful writers.</p>
                  <div className="flex items-center gap-4">
                    <span>Next.js 15</span>
                    <span>&bull;</span>
                    <span>Tailwind CSS</span>
                    <span>&bull;</span>
                    <span>Prisma ORM</span>
                  </div>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
