import React from "react";
import {
  Sparkles,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  PenTool,
  ShieldCheck,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MoodPreview from "@/components/mood-preview";
import Link from "next/link";
import { getDailyPrompt } from "@/actions/public";

const stats = [
  { label: "Reflections Logged", value: "50,000+", icon: PenTool },
  { label: "Privacy Guaranteed", value: "100%", icon: ShieldCheck },
  { label: "Mindfulness Rating", value: "4.9 / 5", icon: Heart },
  { label: "Emotional Mood Spectrum", value: "20+ Moods", icon: Sparkles },
];

export default async function LandingPage() {
  const advice = await getDailyPrompt();

  return (
    <div className="relative container mx-auto px-4 pt-10 pb-20 max-w-7xl">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl gradient-title tracking-tight font-black">
          Your Space to Reflect. <br />
          <span className="text-stone-900 dark:text-stone-100">Your Story to Keep.</span>
        </h1>

        <p className="text-lg md:text-xl text-stone-700 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Capture honest reflections, track emotional wellness, and organize life&apos;s memories
          in a beautifully crafted, encrypted sanctuary.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-4 pt-3 pb-8">
          <Link href="/dashboard">
            <Button
              variant="journal"
              className="px-8 py-6 text-base rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600"
            >
              Start Journaling Free <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/journal/write">
            <Button
              variant="outline"
              className="px-8 py-6 text-base rounded-full border-orange-300/80 dark:border-stone-700 text-orange-950 dark:text-stone-200 hover:bg-orange-50/80 dark:hover:bg-stone-800/80 backdrop-blur-sm cursor-pointer font-semibold shadow-xs"
            >
              Write Reflection
            </Button>
          </Link>
        </div>

        {/* Realistic Journal Entry Hero Preview Card */}
        <div className="pt-2 max-w-3xl mx-auto">
          <div className="relative glass-card rounded-3xl p-6 md:p-8 shadow-2xl border border-orange-200/90 dark:border-stone-800 text-left backdrop-blur-md transition-all duration-300 hover:shadow-orange-500/10">
            {/* Top Toolbar */}
            <div className="border-b border-orange-100 dark:border-stone-800 pb-4 mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950/60 rounded-2xl flex items-center justify-center text-orange-700 dark:text-orange-400 shadow-xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-orange-600 dark:text-orange-400">
                    Daily Reflection
                  </div>
                  <div className="text-sm font-semibold text-orange-950 dark:text-orange-100">
                    Today &bull; Morning Quietude
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 rounded-full text-xs font-semibold border border-amber-200/60 dark:border-amber-800/50">
                  ✨ Peaceful
                </span>
              </div>
            </div>

            {/* Daily Prompt Banner */}
            <div className="bg-gradient-to-r from-orange-100/70 via-amber-100/50 to-orange-100/70 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-orange-950/40 rounded-2xl p-4 border border-orange-200/60 dark:border-stone-800 mb-5">
              <div className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Daily Inspiration Prompt
              </div>
              <blockquote className="text-base md:text-lg font-semibold text-orange-950 dark:text-orange-100 italic">
                &ldquo;{advice ? advice : "What is one small blessing that made you smile today?"}&rdquo;
              </blockquote>
            </div>

            {/* Simulated Journal Content */}
            <div className="space-y-3 text-stone-800 dark:text-stone-200 leading-relaxed text-sm md:text-base font-serif">
              <p>
                The morning quiet provided a welcome pause before the rush began. Taking ten minutes
                with a warm cup of coffee to write without judgment helped untangle my thoughts.
              </p>
              <p className="text-stone-600 dark:text-stone-400">
                I realized that progress doesn&apos;t always mean giant leaps&mdash;sometimes it&apos;s simply
                having the presence to celebrate small moments of peace and moving forward with gentle intention.
              </p>
            </div>

            {/* Bottom Meta Footer */}
            <div className="mt-6 pt-4 border-t border-orange-100 dark:border-stone-800 flex flex-wrap items-center justify-between text-xs text-stone-600 dark:text-stone-400 gap-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <PenTool className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  284 words
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  2 min read
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Saved &amp; encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Counter Banner */}
      <div className="mt-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md rounded-3xl border border-orange-200/60 dark:border-stone-800 shadow-sm">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="text-center p-3">
                <div className="inline-flex p-2.5 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-orange-950 dark:text-orange-100">
                  {item.value}
                </div>
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Mood Explorer */}
      <MoodPreview />

      {/* Bottom CTA Banner */}
      <div className="mt-28">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-8 md:p-14 text-center text-white shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-orange-100 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
              Free Forever for Mindful Writers
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Start Writing Your Story Today
            </h2>
            <p className="text-base md:text-lg text-orange-100 max-w-xl mx-auto leading-relaxed">
              Create your sanctuary in seconds. Unlock guided prompts, mood tracking,
              and encrypted cloud storage for your reflections.
            </p>
            <div className="pt-2">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-orange-950 hover:bg-orange-50 font-bold px-9 py-6 rounded-full shadow-2xl hover:scale-105 transition-transform cursor-pointer"
                >
                  Create Your Journal <ChevronRight className="ml-2 h-5 w-5 text-orange-600" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
