"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

const SAMPLE_MOODS = [
  {
    id: "inspired",
    label: "Inspired",
    emoji: "💫",
    prompt: "What creative sparks or sudden realizations visited you today?",
    color: "from-purple-500 to-indigo-500",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
    borderLight: "border-purple-200 dark:border-purple-800/40",
    sampleText: "A walk through the park after the rain brought unexpected clarity about the project. Sometimes stepping away is the best way forward.",
  },
  {
    id: "peaceful",
    label: "Peaceful",
    emoji: "😌",
    prompt: "Where did you find stillness and calm amidst the noise today?",
    color: "from-sky-500 to-blue-500",
    bgLight: "bg-sky-50 dark:bg-sky-950/30",
    borderLight: "border-sky-200 dark:border-sky-800/40",
    sampleText: "Early morning tea without looking at a single screen. The room was bathed in golden light and everything felt balanced.",
  },
  {
    id: "overjoyed",
    label: "Overjoyed",
    emoji: "🤗",
    prompt: "What unforgettable moment made your heart overflow with gratitude?",
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    borderLight: "border-amber-200 dark:border-amber-800/40",
    sampleText: "Received unexpected news from an old friend. We laughed for an hour like no time had passed at all.",
  },
  {
    id: "motivated",
    label: "Motivated",
    emoji: "🎯",
    prompt: "What meaningful milestone did you conquer, step by step?",
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
    borderLight: "border-emerald-200 dark:border-emerald-800/40",
    sampleText: "Finally completed the draft after days of hesitation. Momentum doesn't arrive before action—it follows it.",
  },
  {
    id: "grateful",
    label: "Grateful",
    emoji: "🙏",
    prompt: "What subtle, quiet blessing are you holding close right now?",
    color: "from-rose-500 to-pink-500",
    bgLight: "bg-rose-50 dark:bg-rose-950/30",
    borderLight: "border-rose-200 dark:border-rose-800/40",
    sampleText: "Grateful for patient listeners and honest conversations. Good people make the hardest journeys feel warm.",
  },
];

export default function MoodPreview() {
  const [selectedMood, setSelectedMood] = useState(SAMPLE_MOODS[0]);

  return (
    <div className="max-w-4xl mx-auto mt-24">
      <div className="text-center space-y-2 mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-100/80 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200/50 dark:border-orange-800/50">
          Interactive Mood Sanctuary
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-orange-950 dark:text-orange-100 tracking-tight">
          How Are You Feeling Right Now?
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm md:text-base max-w-lg mx-auto">
          Tap an emotion to explore how tailored reflection prompts and safe spaces adapt to every state of mind.
        </p>
      </div>

      {/* Mood Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
        {SAMPLE_MOODS.map((mood) => {
          const isSelected = selectedMood.id === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "bg-white dark:bg-stone-800 text-orange-950 dark:text-orange-100 shadow-lg shadow-orange-500/15 border-2 border-orange-400 scale-105"
                  : "bg-white/60 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 border border-orange-200/50 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 hover:border-orange-300"
              }`}
            >
              <span className="text-lg">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Mood Card Preview */}
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-orange-200/80 dark:border-stone-800 shadow-xl transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-orange-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${selectedMood.color} flex items-center justify-center text-white text-2xl shadow-md`}>
              {selectedMood.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-orange-950 dark:text-orange-100">
                  {selectedMood.label} Reflection
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200 font-medium border border-orange-200/50 dark:border-orange-800/40">
                  Guided Prompt
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Emotional Resonance &bull; Safe &amp; Encrypted
              </p>
            </div>
          </div>

          <Link href={`/journal/write?mood=${selectedMood.id}`}>
            <Button
              variant="journal"
              size="sm"
              className="rounded-xl flex items-center gap-2 font-medium"
            >
              <span>Write with this mood</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Prompt Quote */}
        <div className={`mt-6 p-5 rounded-2xl ${selectedMood.bgLight} border ${selectedMood.borderLight}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Daily Inspiration Prompt
          </div>
          <p className="text-base md:text-lg font-serif italic text-stone-900 dark:text-stone-100 font-medium">
            &ldquo;{selectedMood.prompt}&rdquo;
          </p>
        </div>

        {/* Sample Journal Text */}
        <div className="mt-5 p-5 bg-white/70 dark:bg-stone-900/70 rounded-2xl border border-stone-200/50 dark:border-stone-800 space-y-2">
          <div className="text-xs uppercase font-semibold text-stone-400 tracking-wider">
            Sample Journal Entry
          </div>
          <p className="font-serif text-sm md:text-base text-stone-700 dark:text-stone-300 leading-relaxed italic">
            &ldquo;{selectedMood.sampleText}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
