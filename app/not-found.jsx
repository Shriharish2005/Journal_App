import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center max-w-lg mx-auto">
      {/* Decorative Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-white shadow-xl shadow-orange-500/20 animate-float">
          <Compass className="h-12 w-12" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-md">
          <BookOpen className="h-4 w-4" />
        </div>
      </div>

      <h1 className="text-7xl font-black gradient-title tracking-tight mb-2">
        404
      </h1>
      <h2 className="text-2xl font-bold text-orange-950 dark:text-orange-100 mb-3">
        Page Drifted Away
      </h2>
      <p className="text-stone-600 dark:text-stone-400 mb-8 text-sm md:text-base leading-relaxed">
        The reflection or page you are looking for does not exist or may have been moved to another collection.
      </p>

      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="journal" className="rounded-full px-6 py-5 flex items-center gap-2 cursor-pointer shadow-md">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Sanctuary</span>
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-full px-6 py-5 border-orange-200 dark:border-stone-700 text-orange-950 dark:text-stone-200 hover:bg-orange-50 dark:hover:bg-stone-800 cursor-pointer">
            Open Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
