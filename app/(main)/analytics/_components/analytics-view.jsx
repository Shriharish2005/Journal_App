"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Flame,
  TrendingUp,
  Calendar as CalendarIcon,
  BookOpen,
  Smile,
  Sparkles,
  CheckCircle2,
  Award,
  Trophy,
  PenBox,
  Zap,
  Heart,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Target,
  Star,
  Copy,
  Check,
  Layers,
  Compass,
  Lock,
  Shield,
  ArrowRight,
  Info,
} from "lucide-react";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getMoodById } from "@/app/lib/moods";
import { calculateLevel, getDailyInsight } from "@/app/lib/insights";
import { toast } from "sonner";

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 Days", days: 7 },
  { value: "15d", label: "Last 15 Days", days: 15 },
  { value: "30d", label: "Last 30 Days", days: 30 },
  { value: "90d", label: "Last 3 Months", days: 90 },
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEVEL_TITLES = [
  "Newcomer",
  "Reflector",
  "Journalist",
  "Storyteller",
  "Chronicler",
  "Wordsmith",
  "Mindful Scribe",
  "Master Philosopher",
];

const TIER_CONFIG = {
  bronze: {
    label: "Bronze Tier",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    accentColor: "#d97706",
  },
  silver: {
    label: "Silver Tier",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    accentColor: "#64748b",
  },
  gold: {
    label: "Gold Tier",
    badgeClass: "bg-yellow-100 text-yellow-950 border-yellow-400 font-bold",
    accentColor: "#eab308",
  },
  diamond: {
    label: "Diamond Tier",
    badgeClass: "bg-cyan-100 text-cyan-950 border-cyan-300 font-bold",
    accentColor: "#06b6d4",
  },
};

export default function AnalyticsView({ entries = [], dailyGoal = 300 }) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "habits" | "moods" | "badges"
  const [badgeFilter, setBadgeFilter] = useState("all"); // "all" | "in_progress" | "unlocked" | "locked"
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [hasCopiedSummary, setHasCopiedSummary] = useState(false);

  const numDays = useMemo(() => {
    return PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.days || 30;
  }, [selectedPeriod]);

  // -------------------------------------------------------------
  // 1. ADVANCED STATS & AGGREGATIONS
  // -------------------------------------------------------------
  const allStats = useMemo(() => {
    const totalEntries = entries.length;
    let totalWords = 0;
    let totalScore = 0;
    let favoriteCount = 0;
    let goalsHitCount = 0;
    const moodCounts = {};
    const scores = [];

    // Time of day buckets
    const timeOfDay = {
      morning: { label: "Morning (5AM - 12PM)", count: 0, icon: Sunrise, color: "#f59e0b" },
      afternoon: { label: "Afternoon (12PM - 5PM)", count: 0, icon: Sun, color: "#ea580c" },
      evening: { label: "Evening (5PM - 10PM)", count: 0, icon: Sunset, color: "#8b5cf6" },
      night: { label: "Night Owl (10PM - 5AM)", count: 0, icon: Moon, color: "#3b82f6" },
    };

    entries.forEach((e) => {
      const plainText = (e.content || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
      totalWords += wordCount;

      const score = e.moodScore || 5;
      totalScore += score;
      scores.push(score);

      if (e.isFavorite) favoriteCount += 1;
      if (wordCount >= dailyGoal) goalsHitCount += 1;

      const m = e.mood || "neutral";
      moodCounts[m] = (moodCounts[m] || 0) + 1;

      // Time of day
      const hour = new Date(e.createdAt).getHours();
      if (hour >= 5 && hour < 12) timeOfDay.morning.count += 1;
      else if (hour >= 12 && hour < 17) timeOfDay.afternoon.count += 1;
      else if (hour >= 17 && hour < 22) timeOfDay.evening.count += 1;
      else timeOfDay.night.count += 1;
    });

    const avgWords = totalEntries ? Math.round(totalWords / totalEntries) : 0;
    const avgScore = totalEntries ? Number((totalScore / totalEntries).toFixed(1)) : 0;
    const totalHours = (totalWords / (130 * 60)).toFixed(1);
    const totalReadingTime = Math.max(1, Math.ceil(totalWords / 200));
    const goalHitRate = totalEntries ? Math.round((goalsHitCount / totalEntries) * 100) : 0;

    // Emotional Equilibrium (Standard Deviation)
    let emotionalStability = 85;
    if (scores.length > 1) {
      const mean = totalScore / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);
      emotionalStability = Math.max(50, Math.min(99, Math.round(100 - stdDev * 15)));
    }

    // Dominant Mood
    const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
    const dominantMoodId = sortedMoods[0]?.[0] || null;
    const dominantMoodObj = dominantMoodId ? getMoodById(dominantMoodId) : null;

    // Dominant writing time persona
    const sortedTimes = Object.entries(timeOfDay).sort((a, b) => b[1].count - a[1].count);
    const dominantTimeSlot = sortedTimes[0] ? sortedTimes[0][1] : timeOfDay.morning;

    return {
      totalEntries,
      totalWords,
      avgWords,
      avgScore,
      totalHours,
      totalReadingTime,
      favoriteCount,
      goalsHitCount,
      goalHitRate,
      emotionalStability,
      dominantMoodObj,
      moodCounts,
      timeOfDay,
      dominantTimeSlot,
    };
  }, [entries, dailyGoal]);

  // -------------------------------------------------------------
  // 2. STREAKS COMPUTATION
  // -------------------------------------------------------------
  const streakStats = useMemo(() => {
    if (!entries.length) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        thisWeekDays: [],
        nextMilestone: 3,
        milestoneProgress: 0,
        habitScore: 0,
      };
    }

    const uniqueDateStrings = Array.from(
      new Set(entries.map((e) => format(new Date(e.createdAt), "yyyy-MM-dd")))
    ).sort();

    const dateSet = new Set(uniqueDateStrings);
    const today = startOfDay(new Date());

    // Current Streak
    let cursor = dateSet.has(format(today, "yyyy-MM-dd")) ? today : subDays(today, 1);
    let currentStreak = 0;
    while (dateSet.has(format(cursor, "yyyy-MM-dd"))) {
      currentStreak += 1;
      cursor = subDays(cursor, 1);
    }

    // Longest Streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    uniqueDateStrings.forEach((dateStr) => {
      const curDate = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.round((curDate - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak += 1;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      prevDate = curDate;
    });

    // Days logged this current week
    const currentWeekStart = subDays(today, today.getDay());
    const thisWeekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      const isLogged = dateSet.has(format(d, "yyyy-MM-dd"));
      return {
        name: WEEKDAY_NAMES[i],
        date: d,
        isLogged,
        isToday: isSameDay(d, today),
      };
    });

    // Milestone calculation (3, 7, 14, 30, 60, 100 days)
    const milestones = [3, 7, 14, 30, 60, 100, 365];
    const nextMilestone = milestones.find((m) => m > currentStreak) || currentStreak + 10;
    const prevMilestone = [...milestones].reverse().find((m) => m <= currentStreak) || 0;
    const milestoneProgress = Math.min(
      100,
      Math.max(
        0,
        Math.round(((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
      )
    );

    // Habit Strength Score (0 - 100)
    const loggedThisWeekCount = thisWeekDays.filter((d) => d.isLogged).length;
    const habitScore = Math.min(
      100,
      Math.round(currentStreak * 10 + (loggedThisWeekCount / 7) * 40 + (allStats.goalHitRate || 0) * 0.3)
    );

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      thisWeekDays,
      nextMilestone,
      milestoneProgress,
      habitScore,
    };
  }, [entries, allStats.goalHitRate]);

  // -------------------------------------------------------------
  // 3. PERIOD-FILTERED TIMELINE DATA
  // -------------------------------------------------------------
  const timelineData = useMemo(() => {
    const today = startOfDay(new Date());
    const buckets = {};

    entries.forEach((e) => {
      const key = format(new Date(e.createdAt), "yyyy-MM-dd");
      buckets[key] = buckets[key] || { totalScore: 0, count: 0, words: 0 };
      buckets[key].totalScore += e.moodScore || 5;
      buckets[key].count += 1;

      const plainText = (e.content || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      buckets[key].words += plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    });

    return Array.from({ length: numDays }, (_, i) => {
      const d = subDays(today, numDays - 1 - i);
      const dateKey = format(d, "yyyy-MM-dd");
      const b = buckets[dateKey];
      return {
        date: format(d, "MMM d"),
        rawDate: dateKey,
        score: b ? Number((b.totalScore / b.count).toFixed(1)) : null,
        words: b ? b.words : 0,
        entries: b ? b.count : 0,
      };
    });
  }, [entries, numDays]);

  // -------------------------------------------------------------
  // 4. DAY OF WEEK JOURNALING RHYTHM
  // -------------------------------------------------------------
  const weekdayDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    entries.forEach((e) => {
      const day = new Date(e.createdAt).getDay();
      counts[day] += 1;
    });
    return WEEKDAY_NAMES.map((name, idx) => ({
      name,
      entries: counts[idx],
    }));
  }, [entries]);

  // -------------------------------------------------------------
  // 5. MOOD CATEGORY BREAKDOWN
  // -------------------------------------------------------------
  const moodBreakdown = useMemo(() => {
    const bands = {
      positive: { label: "Joyful & Energetic (8-10)", count: 0, color: "#10b981", emoji: "✨" },
      neutral: { label: "Balanced & Calm (5-7)", count: 0, color: "#f59e0b", emoji: "🌿" },
      reflective: { label: "Low & Reflective (1-4)", count: 0, color: "#f43f5e", emoji: "🌧️" },
    };

    entries.forEach((e) => {
      const score = e.moodScore || 5;
      if (score >= 8) bands.positive.count += 1;
      else if (score >= 5) bands.neutral.count += 1;
      else bands.reflective.count += 1;
    });

    const total = entries.length || 1;
    return Object.entries(bands).map(([key, item]) => ({
      key,
      ...item,
      percentage: Math.round((item.count / total) * 100),
    }));
  }, [entries]);

  // -------------------------------------------------------------
  // 6. ENHANCED UNLOCKABLE ACHIEVEMENT BADGES (12 MILESTONES)
  // -------------------------------------------------------------
  const badges = useMemo(() => {
    const total = entries.length;
    const words = allStats.totalWords;
    const streak = streakStats.longestStreak;
    const distinctMoods = Object.keys(allStats.moodCounts).length;
    const favs = allStats.favoriteCount;
    const goals = allStats.goalsHitCount;
    const morningCount = allStats.timeOfDay.morning.count;
    const nightCount = allStats.timeOfDay.night.count;

    return [
      {
        id: "first_step",
        title: "First Reflection",
        description: "Created your very first journal entry",
        lore: "Every profound journey of mindfulness begins with the courage to put that very first honest thought onto paper.",
        tip: "Click 'Write New' in the top navigation and express whatever is in your heart today.",
        tier: "bronze",
        xp: 50,
        icon: Sparkles,
        color: "from-amber-400 to-orange-500",
        currentValue: total,
        targetValue: 1,
        unit: "entry",
        unlocked: total >= 1,
        progress: total >= 1 ? 100 : 0,
      },
      {
        id: "streak_3",
        title: "Spark of Habit",
        description: "Maintained a 3-day writing streak",
        lore: "Three days in a row is the proven threshold where a conscious action shifts into an effortless daily habit.",
        tip: "Write a short sentence or two each evening to maintain consistency.",
        tier: "bronze",
        xp: 100,
        icon: Flame,
        color: "from-orange-500 to-red-500",
        currentValue: streak,
        targetValue: 3,
        unit: "days",
        unlocked: streak >= 3,
        progress: Math.min(100, Math.round((streak / 3) * 100)),
      },
      {
        id: "streak_7",
        title: "Weekly Warrior",
        description: "Completed an uninterrupted 7-day streak",
        lore: "Seven consecutive days of reflection means you survived the full spectrum of a week with mindfulness and clarity.",
        tip: "Consistency beats perfection. Even a quick 1-minute check-in keeps your streak alive.",
        tier: "silver",
        xp: 250,
        icon: Trophy,
        color: "from-yellow-500 to-amber-600",
        currentValue: streak,
        targetValue: 7,
        unit: "days",
        unlocked: streak >= 7,
        progress: Math.min(100, Math.round((streak / 7) * 100)),
      },
      {
        id: "streak_14",
        title: "Fortress of Habit",
        description: "Maintained a 14-day writing streak",
        lore: "Two consecutive weeks of daily journaling firmly anchors reflection into your core identity.",
        tip: "You have built remarkable momentum. Continue to trust the process of daily reflection.",
        tier: "gold",
        xp: 500,
        icon: Shield,
        color: "from-amber-500 to-yellow-600",
        currentValue: streak,
        targetValue: 14,
        unit: "days",
        unlocked: streak >= 14,
        progress: Math.min(100, Math.round((streak / 14) * 100)),
      },
      {
        id: "streak_30",
        title: "Iron Will Legend",
        description: "Maintained an unbroken 30-day streak",
        lore: "A full month of non-stop reflection represents true mastery of mindfulness, resilience, and discipline.",
        tip: "You have composed an entire monthly chapter of your life story. Extraordinary accomplishment!",
        tier: "diamond",
        xp: 1000,
        icon: Award,
        color: "from-cyan-500 to-blue-600",
        currentValue: streak,
        targetValue: 30,
        unit: "days",
        unlocked: streak >= 30,
        progress: Math.min(100, Math.round((streak / 30) * 100)),
      },
      {
        id: "words_1000",
        title: "Thought Flow",
        description: "Wrote over 1,000 words in reflections",
        lore: "1,000 words represents genuine dedication to exploring the depths of your inner world.",
        tip: "Elaborate on why you felt certain feelings to naturally increase your depth and word count.",
        tier: "bronze",
        xp: 100,
        icon: BookOpen,
        color: "from-emerald-400 to-teal-600",
        currentValue: words,
        targetValue: 1000,
        unit: "words",
        unlocked: words >= 1000,
        progress: Math.min(100, Math.round((words / 1000) * 100)),
      },
      {
        id: "words_5000",
        title: "Scribe of Depth",
        description: "Accumulated 5,000+ words across journal",
        lore: "5,000 words is a mini-novel of your lived experiences, emotional growth, and honest perspectives.",
        tip: "Stream-of-consciousness writing allows you to pour your heart onto the screen effortlessly.",
        tier: "silver",
        xp: 300,
        icon: PenBox,
        color: "from-blue-500 to-indigo-600",
        currentValue: words,
        targetValue: 5000,
        unit: "words",
        unlocked: words >= 5000,
        progress: Math.min(100, Math.round((words / 5000) * 100)),
      },
      {
        id: "words_10000",
        title: "Century Memoirist",
        description: "Surpassed 10,000 words written",
        lore: "A landmark milestone. You possess a rich personal memoir that will serve as a lifetime treasure.",
        tip: "Take a moment to read your earliest reflections and appreciate how much you have grown.",
        tier: "gold",
        xp: 600,
        icon: BookOpen,
        color: "from-purple-500 to-pink-600",
        currentValue: words,
        targetValue: 10000,
        unit: "words",
        unlocked: words >= 10000,
        progress: Math.min(100, Math.round((words / 10000) * 100)),
      },
      {
        id: "mood_explorer",
        title: "Emotional Explorer",
        description: "Logged 5 or more unique mood states",
        lore: "Acknowledging the diverse spectrum of emotions—joy, calm, frustration, hope—fosters true emotional intelligence.",
        tip: "Be completely candid with your feelings; every emotion carries valuable wisdom.",
        tier: "silver",
        xp: 150,
        icon: Compass,
        color: "from-pink-500 to-rose-600",
        currentValue: distinctMoods,
        targetValue: 5,
        unit: "moods",
        unlocked: distinctMoods >= 5,
        progress: Math.min(100, Math.round((distinctMoods / 5) * 100)),
      },
      {
        id: "goal_crusher",
        title: "Goal Crusher",
        description: "Reached your daily word goal 3 times",
        lore: "Consistently meeting your goals shows that focused intention directly yields measurable achievement.",
        tip: "Write freely without self-editing until your goal indicator fills up.",
        tier: "silver",
        xp: 200,
        icon: Target,
        color: "from-violet-500 to-purple-700",
        currentValue: goals,
        targetValue: 3,
        unit: "goals",
        unlocked: goals >= 3,
        progress: Math.min(100, Math.round((goals / 3) * 100)),
      },
      {
        id: "treasured",
        title: "Memory Vault",
        description: "Favorited 3 or more meaningful memories",
        lore: "Curating your favorite reflections creates a personalized sanctuary you can return to for warmth and perspective.",
        tip: "Click the star icon ⭐ on entries that capture a moment of triumph, peace, or breakthrough.",
        tier: "bronze",
        xp: 100,
        icon: Star,
        color: "from-amber-400 to-yellow-600",
        currentValue: favs,
        targetValue: 3,
        unit: "memories",
        unlocked: favs >= 3,
        progress: Math.min(100, Math.round((favs / 3) * 100)),
      },
      {
        id: "dawn_reflector",
        title: "Dawn Reflector",
        description: "Captured thoughts in the morning clarity",
        lore: "Morning writing catches your mind in its freshest, untainted state before the world's demands begin.",
        tip: "Log a quick morning reflection between 5 AM and 12 PM with your morning coffee.",
        tier: "bronze",
        xp: 100,
        icon: Sunrise,
        color: "from-orange-400 to-amber-500",
        currentValue: morningCount,
        targetValue: 1,
        unit: "morning log",
        unlocked: morningCount >= 1,
        progress: morningCount >= 1 ? 100 : 0,
      },
      {
        id: "night_owl",
        title: "Midnight Philosopher",
        description: "Captured thoughts in the quiet night hours",
        lore: "Nighttime contemplation offers serene quietude for deep, unhurried introspection and emotional debriefing.",
        tip: "Wind down with an evening entry after 9 PM before resting.",
        tier: "silver",
        xp: 150,
        icon: Moon,
        color: "from-indigo-400 to-purple-600",
        currentValue: nightCount,
        targetValue: 1,
        unit: "night log",
        unlocked: nightCount >= 1,
        progress: nightCount >= 1 ? 100 : 0,
      },
    ];
  }, [entries, allStats, streakStats.longestStreak]);

  // Gamification Totals
  const { totalXP, earnedXP, xpProgress, nextBadge } = useMemo(() => {
    const totalXP = badges.reduce((sum, b) => sum + b.xp, 0);
    const earnedXP = badges.filter((b) => b.unlocked).reduce((sum, b) => sum + b.xp, 0);
    const xpProgress = Math.round((earnedXP / totalXP) * 100);

    // Next closest badge to unlock
    const lockedBadges = badges.filter((b) => !b.unlocked);
    const sortedByProgress = [...lockedBadges].sort((a, b) => b.progress - a.progress);
    const nextBadge = sortedByProgress[0] || null;

    return { totalXP, earnedXP, xpProgress, nextBadge };
  }, [badges]);

  // Filtered badges based on active pill
  const filteredBadges = useMemo(() => {
    if (badgeFilter === "unlocked") return badges.filter((b) => b.unlocked);
    if (badgeFilter === "in_progress") return badges.filter((b) => !b.unlocked && b.progress > 0);
    if (badgeFilter === "locked") return badges.filter((b) => !b.unlocked);
    return badges;
  }, [badges, badgeFilter]);

  // Level & gamification
  const levelInfo = useMemo(() => {
    const { level, percent, remaining } = calculateLevel(entries.length);
    const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
    return { level, percent, remaining, title };
  }, [entries.length]);

  const dailyInsight = useMemo(() => {
    return getDailyInsight(allStats.avgScore);
  }, [allStats.avgScore]);

  // Copy Summary Handler
  const handleCopySummary = () => {
    const text = `📖 Journal Statistics Summary
• Current Streak: ${streakStats.currentStreak} days (Best: ${streakStats.longestStreak} days)
• Total Entries: ${allStats.totalEntries}
• Total Words: ${allStats.totalWords.toLocaleString()}
• Average Mood Score: ${allStats.avgScore}/10 (${allStats.dominantMoodObj?.label || "Balanced"})
• Journaler Tier: Level ${levelInfo.level} (${levelInfo.title})
• Consistency Index: ${streakStats.habitScore}%
• Achievements: ${badges.filter((b) => b.unlocked).length}/${badges.length} Unlocked (${earnedXP} XP)`;

    navigator.clipboard.writeText(text);
    setHasCopiedSummary(true);
    toast.success("Summary copied to clipboard!");
    setTimeout(() => setHasCopiedSummary(false), 3000);
  };

  // Custom tooltips
  const MoodTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length || payload[0].value == null) return null;
    return (
      <div className="rounded-xl border border-orange-200 bg-white/95 backdrop-blur-xs p-3 shadow-md text-xs space-y-1">
        <p className="font-bold text-gray-800">{label}</p>
        <p className="text-orange-600 font-semibold flex items-center gap-1">
          <Smile className="h-3.5 w-3.5" /> Mood Score: {payload[0].value} / 10
        </p>
        {payload[0].payload.entries > 0 && (
          <p className="text-gray-500">{payload[0].payload.entries} entry logged</p>
        )}
      </div>
    );
  };

  const WordTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-amber-200 bg-white/95 backdrop-blur-xs p-3 shadow-md text-xs space-y-1">
        <p className="font-bold text-gray-800">{label}</p>
        <p className="text-amber-700 font-semibold flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" /> Words: {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* ----------------- HERO HEADER WITH AMBIENT GLOW ----------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 text-white p-8 md:p-10 shadow-xl shadow-orange-600/20">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-orange-100 text-xs font-semibold uppercase tracking-wider border border-white/20">
              <Sparkles className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              <span>Personal Reflection Intelligence</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-xs">
              Statistics & Insights
            </h1>
            <p className="text-orange-100/90 text-sm md:text-base leading-relaxed">
              Explore your emotional rhythm, track writing habits, celebrate milestones, and discover how mindfulness shapes your well-being.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px] rounded-xl border-white/30 bg-white/15 text-white backdrop-blur-md font-medium shadow-xs focus:ring-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleCopySummary}
              className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-md rounded-xl flex items-center gap-2"
            >
              {hasCopiedSummary ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">Export Summary</span>
            </Button>
          </div>
        </div>

        {/* Quick Hero Telemetry Bar */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-white">
          <div>
            <p className="text-2xs uppercase tracking-wider text-orange-200 font-semibold">Habit Strength</p>
            <p className="text-2xl font-black text-white mt-0.5">{streakStats.habitScore}%</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-wider text-orange-200 font-semibold">Reflection Hours</p>
            <p className="text-2xl font-black text-white mt-0.5">~{allStats.totalHours} hrs</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-wider text-orange-200 font-semibold">Equilibrium Index</p>
            <p className="text-2xl font-black text-white mt-0.5">{allStats.emotionalStability}%</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-wider text-orange-200 font-semibold">Daily Goal Hit Rate</p>
            <p className="text-2xl font-black text-white mt-0.5">{allStats.goalHitRate}%</p>
          </div>
        </div>
      </div>

      {/* ----------------- INTERACTIVE TAB SWITCHER ----------------- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-orange-100/70 rounded-2xl border border-orange-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-orange-600 text-white shadow-md shadow-orange-500/30 scale-102"
                : "text-orange-950/80 hover:text-orange-600 hover:bg-white/80"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>All Telemetry</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("habits")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "habits"
                ? "bg-orange-600 text-white shadow-md shadow-orange-500/30 scale-102"
                : "text-orange-950/80 hover:text-orange-600 hover:bg-white/80"
            }`}
          >
            <Flame className="h-4 w-4 text-orange-500" />
            <span>Streaks & Volume</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("moods")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "moods"
                ? "bg-orange-600 text-white shadow-md shadow-orange-500/30 scale-102"
                : "text-orange-950/80 hover:text-orange-600 hover:bg-white/80"
            }`}
          >
            <Smile className="h-4 w-4 text-amber-500" />
            <span>Emotional Spectrum</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("badges")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "badges"
                ? "bg-orange-600 text-white shadow-md shadow-orange-500/30 scale-102"
                : "text-orange-950/80 hover:text-orange-600 hover:bg-white/80"
            }`}
          >
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})</span>
          </button>
        </div>
      </div>

      {/* ----------------- KPI STATISTICS CARDS ----------------- */}
      {(activeTab === "all" || activeTab === "habits") && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          {/* Current Streak */}
          <Card className="rounded-2xl border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50/40 shadow-xs hover:shadow-md transition-all group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Streak
                </span>
                <div className="h-9 w-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-400/40 group-hover:scale-110 transition-transform">
                  <Flame className="h-5 w-5 fill-current" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-orange-950">
                  {streakStats.currentStreak}
                </span>
                <span className="text-xs font-bold text-orange-600 uppercase">
                  {streakStats.currentStreak === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-100 flex items-center justify-between text-xs text-muted-foreground">
                <span>Personal Record</span>
                <strong className="text-orange-950 flex items-center gap-1 font-bold">
                  <Trophy className="h-3 w-3 text-amber-500" /> {streakStats.longestStreak} days
                </strong>
              </div>
            </CardContent>
          </Card>

          {/* Total Words Written */}
          <Card className="rounded-2xl border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 shadow-xs hover:shadow-md transition-all group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Words Logged
                </span>
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-400/40 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {allStats.totalWords.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-600 uppercase">words</span>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-muted-foreground">
                <span>Avg. per Entry</span>
                <strong className="text-emerald-950 font-bold">{allStats.avgWords} words</strong>
              </div>
            </CardContent>
          </Card>

          {/* Total Entries */}
          <Card className="rounded-2xl border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-sky-50/40 shadow-xs hover:shadow-md transition-all group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Entries
                </span>
                <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-400/40 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {allStats.totalEntries}
                </span>
                <span className="text-xs font-bold text-blue-600 uppercase">sessions</span>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between text-xs text-muted-foreground">
                <span>Reading Time</span>
                <strong className="text-blue-950 font-bold">~{allStats.totalReadingTime} mins</strong>
              </div>
            </CardContent>
          </Card>

          {/* Average Mood Score */}
          <Card className="rounded-2xl border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-purple-50/40 shadow-xs hover:shadow-md transition-all group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Average Mood
                </span>
                <div className="h-9 w-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm shadow-violet-400/40 group-hover:scale-110 transition-transform text-lg">
                  {allStats.dominantMoodObj?.emoji || "😊"}
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {allStats.avgScore}
                </span>
                <span className="text-xs font-bold text-violet-600 uppercase">/ 10</span>
              </div>
              <div className="mt-3 pt-3 border-t border-violet-100 flex items-center justify-between text-xs text-muted-foreground truncate">
                <span>Dominant State</span>
                <strong className="text-violet-950 font-bold truncate">
                  {allStats.dominantMoodObj?.label || "Balanced"}
                </strong>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------- STREAK TELEMETRY & LEVEL PROGRESS ----------------- */}
      {(activeTab === "all" || activeTab === "habits") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Weekly Streak Tracker */}
          <Card className="rounded-3xl border-orange-200/70 bg-white p-6 shadow-xs md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Flame className="h-4 w-4 fill-orange-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 leading-tight">Weekly Reflection Pace</h3>
                  <p className="text-xs text-muted-foreground">Keep the momentum going by showing up every day</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-orange-100 text-orange-800">
                {streakStats.thisWeekDays.filter((d) => d.isLogged).length} / 7 Days
              </span>
            </div>

            {/* Day Pills */}
            <div className="grid grid-cols-7 gap-2 text-center pt-2">
              {streakStats.thisWeekDays.map((d, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    d.isLogged
                      ? "bg-gradient-to-b from-orange-500 to-amber-500 text-white border-orange-400 shadow-sm scale-102"
                      : d.isToday
                      ? "bg-orange-50 border-orange-300 text-orange-900 border-dashed"
                      : "bg-gray-50/80 border-gray-100 text-gray-400"
                  }`}
                >
                  <span className="text-xs font-bold">{d.name}</span>
                  {d.isLogged ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-current opacity-30" />
                  )}
                </div>
              ))}
            </div>

            {/* Next Milestone Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50/60 to-orange-50 border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-300">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="text-2xs font-bold uppercase text-orange-900 tracking-wider">
                    Next Streak Milestone
                  </p>
                  <p className="text-sm font-extrabold text-orange-950">
                    {streakStats.nextMilestone}-Day Streak ({streakStats.nextMilestone - streakStats.currentStreak} days away)
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-44">
                <div className="flex justify-between text-2xs font-bold text-orange-800 mb-1">
                  <span>Milestone Progress</span>
                  <span>{streakStats.milestoneProgress}%</span>
                </div>
                <div className="w-full bg-orange-200/80 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-orange-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${streakStats.milestoneProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Journaler Tier Level */}
          <Card className="rounded-3xl border-orange-200/70 bg-gradient-to-b from-white via-orange-50/20 to-amber-50/30 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <h3 className="font-extrabold text-gray-900">Journaler Tier</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-amber-100 text-amber-800">
                  Tier {levelInfo.level}
                </span>
              </div>
              <p className="text-2xl font-black text-orange-950 tracking-tight">
                {levelInfo.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your continuous commitment to mindfulness unlocks higher tiers.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-orange-100">
              <div className="flex justify-between text-xs font-bold text-gray-600 mb-1.5">
                <span>Level {levelInfo.level} Progress</span>
                <span>{levelInfo.percent}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${levelInfo.percent}%` }}
                />
              </div>
              <p className="text-2xs text-gray-400 mt-2 text-right">
                {levelInfo.remaining} more {levelInfo.remaining === 1 ? "entry" : "entries"} to Tier {levelInfo.level + 1}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ----------------- CHARTS ROW 1: MOOD EVOLUTION ----------------- */}
      {(activeTab === "all" || activeTab === "moods") && (
        <Card className="rounded-3xl border-orange-200/70 bg-white p-6 shadow-xs animate-in fade-in duration-300">
          <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Smile className="h-5 w-5 text-orange-500" />
                Mood Trajectory Curve ({PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label})
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Daily emotional wellness plotted on a 1–10 scale to visualize trends over time.
              </p>
            </div>
          </CardHeader>

          {entries.length === 0 ? (
            <div className="h-72 w-full rounded-2xl border border-dashed border-orange-200 bg-orange-50/20 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <Smile className="h-9 w-9 text-orange-400 stroke-[1.5]" />
              <p className="font-bold text-orange-950 text-sm">No Mood Data Recorded Yet</p>
              <p className="text-xs text-orange-900/70 max-w-sm">
                Write an entry with your mood to start mapping your emotional trajectory over time.
              </p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tickCount={6}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip content={<MoodTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#ea580c"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#moodGradient)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* ----------------- CHARTS ROW 2: WORDS & WEEKDAY RHYTHM ----------------- */}
      {(activeTab === "all" || activeTab === "habits") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* Daily Words Written */}
          <Card className="rounded-3xl border-orange-200/70 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-5">
              <div>
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  Writing Volume (Words Logged)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daily output over {PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label.toLowerCase()}.
                </p>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="h-60 w-full rounded-2xl border border-dashed border-orange-200 bg-orange-50/20 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <BookOpen className="h-8 w-8 text-amber-400 stroke-[1.5]" />
                <p className="font-bold text-orange-950 text-sm">No Word Volume Yet</p>
                <p className="text-xs text-orange-900/70 max-w-xs">
                  Daily word counts will be charted here as you write.
                </p>
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                    />
                    <Tooltip content={<WordTooltip />} />
                    <Bar dataKey="words" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Day of Week Writing Habits */}
          <Card className="rounded-3xl border-orange-200/70 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-5">
              <div>
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-orange-600" />
                  Writing Habits by Weekday
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Identify which days you are most inclined to journal.
                </p>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="h-60 w-full rounded-2xl border border-dashed border-orange-200 bg-orange-50/20 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <CalendarIcon className="h-8 w-8 text-orange-400 stroke-[1.5]" />
                <p className="font-bold text-orange-950 text-sm">No Weekly Activity Yet</p>
                <p className="text-xs text-orange-900/70 max-w-xs">
                  See which days of the week you reflect the most once you begin logging.
                </p>
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(val) => [`${val} entries`, "Frequency"]}
                      cursor={{ fill: "rgba(251, 146, 60, 0.1)" }}
                    />
                    <Bar dataKey="entries" radius={[6, 6, 0, 0]}>
                      {weekdayDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.entries > 0 ? "#ea580c" : "#e2e8f0"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ----------------- CHARTS ROW 3: TIME OF DAY PERSONA & MOOD SPECTRUM ----------------- */}
      {(activeTab === "all" || activeTab === "moods") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Mood Category Distribution */}
          <Card className="rounded-3xl border-orange-200/70 bg-white p-6 shadow-xs md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                <h3 className="font-extrabold text-gray-900">Emotional Spectrum Distribution</h3>
              </div>
              <span className="text-xs text-muted-foreground">All logged reflections</span>
            </div>

            <div className="space-y-4 pt-2">
              {moodBreakdown.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-gray-800">
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </span>
                    <span className="text-gray-500">
                      {item.count} {item.count === 1 ? "entry" : "entries"} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Time of Day Persona */}
          <Card className="rounded-3xl border-orange-200/70 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/40 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sun className="h-5 w-5 text-orange-500" />
                <h3 className="font-extrabold text-gray-900">Writing Rhythm</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Your preferred time of day to reflect and put pen to paper.
              </p>

              <div className="space-y-2.5">
                {Object.entries(allStats.timeOfDay).map(([key, item]) => {
                  const Icon = item.icon;
                  const percentage = allStats.totalEntries
                    ? Math.round((item.count / allStats.totalEntries) * 100)
                    : 0;
                  return (
                    <div key={key} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-orange-100 shadow-2xs">
                      <div className="flex items-center gap-2 font-semibold text-gray-800">
                        <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                        <span className="truncate">{item.label.split(" ")[0]}</span>
                      </div>
                      <span className="font-bold text-gray-600">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-orange-100 text-2xs text-muted-foreground text-center">
              Persona: <strong className="text-orange-950 font-bold">{allStats.dominantTimeSlot.label.split(" ")[0]} Reflector</strong>
            </div>
          </Card>
        </div>
      )}

      {/* ----------------- SECTION 4: ENHANCED TROPHY CABINET & BADGES ----------------- */}
      {(activeTab === "all" || activeTab === "badges") && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Trophy Cabinet Master Banner */}
          <Card className="rounded-3xl border-orange-200/80 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30 p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <h3 className="text-2xl font-black text-orange-950 tracking-tight">
                    Achievements & Trophy Cabinet
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
                  Milestones unlock as you build consistency, explore emotional range, and put honest thoughts onto the page. Click any badge to inspect requirements and tips!
                </p>
              </div>

              {/* XP & Progress Summary */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-white/90 border border-orange-200/80 p-4 rounded-2xl shadow-2xs">
                <div className="space-y-1 min-w-[120px]">
                  <p className="text-2xs font-bold uppercase tracking-wider text-orange-900/70">Mastery XP</p>
                  <p className="text-xl font-black text-orange-950">{earnedXP} / {totalXP} XP</p>
                  <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden mt-1">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>

                <div className="h-10 w-px bg-orange-200 hidden sm:block" />

                <div className="space-y-1 min-w-[100px]">
                  <p className="text-2xs font-bold uppercase tracking-wider text-orange-900/70">Badges Unlocked</p>
                  <p className="text-xl font-black text-orange-950">
                    {badges.filter((b) => b.unlocked).length} <span className="text-xs font-bold text-muted-foreground">/ {badges.length}</span>
                  </p>
                  <p className="text-2xs font-semibold text-emerald-600">
                    {Math.round((badges.filter((b) => b.unlocked).length / badges.length) * 100)}% Complete
                  </p>
                </div>
              </div>
            </div>

            {/* Next Milestone Recommendation */}
            {nextBadge && (
              <div className="mt-5 pt-4 border-t border-orange-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                  <span className="font-bold text-orange-950">Next Target:</span>
                  <span className="font-semibold text-orange-900">{nextBadge.title}</span>
                  <span className="text-muted-foreground hidden sm:inline">— {nextBadge.description}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBadge(nextBadge)}
                  className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Inspect Milestone <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </Card>

          {/* Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-white border border-orange-200 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => setBadgeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  badgeFilter === "all"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                All ({badges.length})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter("in_progress")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  badgeFilter === "in_progress"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                In Progress ({badges.filter((b) => !b.unlocked && b.progress > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter("unlocked")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  badgeFilter === "unlocked"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                Unlocked ({badges.filter((b) => b.unlocked).length})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter("locked")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  badgeFilter === "locked"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                Locked ({badges.filter((b) => !b.unlocked).length})
              </button>
            </div>

            <span className="text-2xs font-semibold text-muted-foreground">
              💡 Tip: Click any badge to view detailed lore and unlock requirements
            </span>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBadges.map((b) => {
              const Icon = b.icon;
              const tier = TIER_CONFIG[b.tier] || TIER_CONFIG.bronze;

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBadge(b)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedBadge(b);
                  }}
                  className={`group relative rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between select-none ${
                    b.unlocked
                      ? "bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border-amber-300 ring-2 ring-amber-400/30 shadow-sm hover:shadow-xl hover:-translate-y-1.5"
                      : "bg-white border-orange-200/80 hover:border-orange-400/90 shadow-xs hover:shadow-lg hover:-translate-y-1.5"
                  }`}
                >
                  {/* Top Bar: Tier Badge & XP Indicator */}
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <span
                        className={`text-2xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${tier.badgeClass}`}
                      >
                        {tier.label}
                      </span>
                      <span className="text-2xs font-bold text-orange-900/80 bg-orange-100/70 px-2 py-0.5 rounded-full">
                        +{b.xp} XP
                      </span>
                    </div>

                    {/* Badge Icon Emblem */}
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="relative">
                        <div
                          className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-105 ${
                            b.unlocked
                              ? `bg-gradient-to-tr ${b.color} ring-2 ring-white shadow-amber-500/25`
                              : "bg-gradient-to-tr from-slate-200 via-orange-100 to-amber-200 text-orange-800"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        {b.unlocked ? (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-xs">
                            <Lock className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-gray-950 group-hover:text-orange-950 transition-colors leading-tight truncate">
                          {b.title}
                        </h4>
                        <p className="text-2xs text-muted-foreground font-medium mt-0.5">
                          {b.unlocked ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Unlocked & Achieved
                            </span>
                          ) : (
                            <span>{b.currentValue} / {b.targetValue} {b.unit}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 leading-snug line-clamp-2">
                      {b.description}
                    </p>
                  </div>

                  {/* Progress Track & Hover Prompt */}
                  <div className="mt-4 pt-3 border-t border-orange-100/80">
                    <div className="flex justify-between items-center text-2xs font-bold text-gray-500 mb-1">
                      <span>{b.unlocked ? "Complete" : "Progress"}</span>
                      <span className={b.unlocked ? "text-emerald-600 font-bold" : "text-orange-950"}>
                        {b.progress}%
                      </span>
                    </div>

                    <div className="w-full bg-orange-100/70 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          b.unlocked
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : "bg-gradient-to-r from-orange-500 to-amber-500"
                        }`}
                        style={{ width: `${b.progress}%` }}
                      />
                    </div>

                    <p className="text-2xs text-orange-600 font-semibold mt-2 text-right opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                      Inspect details <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- SECTION 5: MINDFUL INSIGHT CARD ----------------- */}
      {dailyInsight && (
        <Card className="rounded-3xl border-orange-200 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white p-7 shadow-lg shadow-orange-500/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-100">
                <Sparkles className="h-4 w-4 fill-amber-200 text-amber-200" />
                <span>Mindful Reflection & Guidance</span>
              </div>
              <h4 className="text-xl md:text-2xl font-black tracking-tight text-white">
                {dailyInsight.mission}
              </h4>
              <p className="text-sm md:text-base leading-relaxed text-orange-50 italic font-serif">
                &ldquo;{dailyInsight.quote}&rdquo;
              </p>
            </div>
            <div className="md:w-80 shrink-0 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-orange-100 leading-relaxed font-medium">
              {dailyInsight.advice}
            </div>
          </div>
        </Card>
      )}

      {/* ----------------- BADGE INSPECTOR MODAL DIALOG ----------------- */}
      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border border-orange-200 shadow-2xl">
          {selectedBadge && (
            <div className="space-y-5">
              <DialogHeader className="text-center sm:text-center space-y-3">
                {/* 3D-Styled Emblem */}
                <div className="mx-auto relative">
                  <div
                    className={`h-20 w-20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-orange-500/25 transition-transform ${
                      selectedBadge.unlocked
                        ? `bg-gradient-to-tr ${selectedBadge.color} ring-4 ring-amber-300 scale-105`
                        : "bg-gradient-to-tr from-slate-700 via-slate-800 to-zinc-900 text-orange-300"
                    }`}
                  >
                    {React.createElement(selectedBadge.icon, { className: "h-10 w-10 stroke-[2.2]" })}
                  </div>
                  {selectedBadge.unlocked ? (
                    <div className="absolute -bottom-1 right-1/2 translate-x-7 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 right-1/2 translate-x-7 h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <span
                    className={`text-2xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      TIER_CONFIG[selectedBadge.tier]?.badgeClass
                    }`}
                  >
                    {TIER_CONFIG[selectedBadge.tier]?.label}
                  </span>
                  <span className="text-2xs font-bold text-orange-950 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                    +{selectedBadge.xp} XP
                  </span>
                  {selectedBadge.unlocked && (
                    <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ✨ Unlocked
                    </span>
                  )}
                </div>

                <DialogTitle className="text-2xl font-black text-orange-950">
                  {selectedBadge.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedBadge.description}
                </DialogDescription>
              </DialogHeader>

              {/* Lore & Story Box */}
              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 text-xs text-orange-950 space-y-1.5 leading-relaxed">
                <p className="font-bold uppercase text-2xs tracking-wider text-orange-800 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Significance
                </p>
                <p className="italic text-orange-900/90">&ldquo;{selectedBadge.lore}&rdquo;</p>
              </div>

              {/* Progress Box */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-gray-600">Requirement Progress</span>
                  <span className={selectedBadge.unlocked ? "text-emerald-600" : "text-orange-950"}>
                    {selectedBadge.currentValue} / {selectedBadge.targetValue} {selectedBadge.unit} ({selectedBadge.progress}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      selectedBadge.unlocked
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : "bg-gradient-to-r from-orange-500 to-amber-500"
                    }`}
                    style={{ width: `${selectedBadge.progress}%` }}
                  />
                </div>
                <p className="text-2xs text-muted-foreground pt-1">
                  <strong>Pro-Tip:</strong> {selectedBadge.tip}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedBadge(null)}
                  className="rounded-xl flex-1 text-xs font-semibold"
                >
                  Close
                </Button>
                <Link href="/journal/write" className="flex-1" onClick={() => setSelectedBadge(null)}>
                  <Button variant="journal" className="rounded-xl w-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                    <PenBox className="h-3.5 w-3.5" />
                    <span>Write Entry</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
