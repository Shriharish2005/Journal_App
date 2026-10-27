"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ChevronRight,
  Flame,
  History,
  Leaf,
  PenBox,
  Plus,
  Smile,
  Sparkles,
  Star,
  Sun,
  Target,
  TrendingUp,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAnalytics } from "@/actions/analytics";
import { getMoodById } from "@/app/lib/moods";
import {
  MOOD_BAND_STYLES,
  buildEvolutionSeries,
  calculateLevel,
  calculateStreak,
  countThisWeek,
  getDailyInsight,
  getMoodBand,
} from "@/app/lib/insights";
import useFetch from "@/hooks/use-fetch";
import MoodAnalyticsSkeleton from "./analytics-loading";

const timeOptions = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "15d", label: "Last 15 days", days: 15 },
  { value: "30d", label: "Last 30 days", days: 30 },
];

const StatCard = ({ icon: Icon, iconClass, label, value, suffix, footer }) => (
  <Card className="rounded-2xl border-orange-100 bg-white/90 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <Icon className={`h-5 w-5 mb-3 ${iconClass}`} />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1.5 text-3xl font-extrabold text-slate-900">
        {value}
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {suffix}
        </span>
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {footer}
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </CardContent>
  </Card>
);

const CurveTooltip = ({ active, payload }) => {
  if (!active || !payload?.length || payload[0].value == null) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      <p className="font-medium">{p.label}</p>
      <p className="text-amber-600">Mood: {p.score}/100</p>
      <p className="text-slate-500">
        {p.count} {p.count === 1 ? "entry" : "entries"}
      </p>
    </div>
  );
};

const MoodAnalytics = () => {
  const [period, setPeriod] = useState("7d");
  const { user, isLoaded } = useUser();
  const { loading, data: analytics, fn: fetchAnalytics } = useFetch(getAnalytics);

  useEffect(() => {
    fetchAnalytics(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const days = timeOptions.find((o) => o.value === period)?.days || 7;
  const entries = analytics?.data?.entries;
  const overview = analytics?.data?.overview;

  const series = useMemo(
    () => buildEvolutionSeries(entries || [], days),
    [entries, days]
  );

  if (loading || loading === null || !analytics?.data || !isLoaded) {
    return <MoodAnalyticsSkeleton />;
  }

  const streak = calculateStreak(overview.entryDates);
  const weekly = countThisWeek(overview.entryDates);
  const { level, percent, remaining } = calculateLevel(overview.totalSessions);
  const insight = getDailyInsight(overview.recentAverageScore);
  const firstName = user?.firstName || user?.username || "there";
  const noEntriesEver = overview.totalSessions === 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <h2 className="flex items-center gap-2 text-3xl md:text-4xl font-extrabold text-slate-900">
        Welcome, {firstName}
        <Sun className="h-7 w-7 text-amber-400 fill-amber-300" />
      </h2>

      {noEntriesEver ? (
        <Card className="border-2 border-dashed border-orange-200/90 bg-gradient-to-b from-white/95 via-orange-50/40 to-amber-50/30 rounded-3xl p-8 md:p-14 text-center shadow-sm">
          <CardContent className="p-0 flex flex-col items-center max-w-lg mx-auto">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-300/40">
                <PenBox className="h-9 w-9 stroke-[2.2]" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 p-1.5 bg-white rounded-full shadow-md text-amber-500">
                <Sparkles className="h-4 w-4 fill-amber-400" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-orange-950 mb-3 tracking-tight">
              Begin Your Journaling Journey
            </h3>
            <p className="text-orange-900/75 text-sm md:text-base leading-relaxed mb-8 max-w-md">
              You haven&rsquo;t written any entries yet. Capture your thoughts,
              track your mood, and build a private timeline of your life
              reflections.
            </p>
            <Link href="/journal/write" className="w-full sm:w-auto">
              <Button
                variant="journal"
                size="lg"
                className="w-full sm:w-auto px-8 py-6 rounded-full text-base font-bold shadow-xl hover:shadow-orange-300/60 hover:scale-105 transition-all flex items-center justify-center gap-2.5"
              >
                <Plus className="h-5 w-5 stroke-[2.5]" />
                Write Your First Entry
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Flame}
              iconClass="text-amber-500"
              label="Streak"
              value={streak}
              suffix={streak === 1 ? "day" : "days"}
              footer="Keep showing up"
            />
            <StatCard
              icon={TrendingUp}
              iconClass="text-blue-500"
              label="Sessions"
              value={overview.totalSessions}
              suffix="total"
              footer="Explore your progress"
            />
            <StatCard
              icon={Pencil}
              iconClass="text-emerald-500"
              label="Words"
              value={overview.totalWords.toLocaleString()}
              suffix="written"
              footer="Your thoughts matter"
            />
            <StatCard
              icon={Smile}
              iconClass="text-violet-500"
              label="Average mood"
              value={overview.overallAverageScore}
              suffix="/ 10"
              footer="Track your well-being"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Evolution curve */}
              <Card className="rounded-2xl border-orange-100 bg-white/90 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-slate-600">
                    <Activity className="h-4 w-4 text-slate-400" />
                    Evolution curve
                  </CardTitle>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[140px] rounded-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  {analytics.data.entries.length === 0 ? (
                    <div className="h-[260px] flex items-center justify-center text-sm text-slate-500">
                      No entries in this period yet.
                    </div>
                  ) : (
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={series}
                          margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="evolutionFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            interval={days > 7 ? Math.ceil(days / 7) - 1 : 0}
                          />
                          <YAxis
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                          />
                          <Tooltip content={<CurveTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#fbbf24"
                            strokeWidth={2.5}
                            fill="url(#evolutionFill)"
                            connectNulls
                            dot={{ r: 3.5, fill: "#fbbf24", strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity history */}
              <Card className="rounded-2xl border-orange-100 bg-white/90 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-slate-600">
                    <History className="h-4 w-4 text-slate-400" />
                    Activity history
                  </CardTitle>
                  <a
                    href="#collections"
                    className="text-xs font-bold uppercase tracking-wide text-amber-500 hover:text-amber-600"
                  >
                    Explore all
                  </a>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {overview.recentEntries.map((e) => {
                    const d = new Date(e.createdAt);
                    const band = MOOD_BAND_STYLES[getMoodBand(e.moodScore)];
                    const mood = getMoodById(e.mood);
                    return (
                      <Link
                        key={e.id}
                        href={`/journal/${e.id}`}
                        className="flex items-center gap-4 rounded-xl border border-slate-100 px-4 py-3 hover:border-orange-200 hover:bg-orange-50/40 transition-colors"
                      >
                        <div className="w-10 shrink-0 text-center leading-tight">
                          <div className="text-[10px] uppercase text-slate-400">
                            {format(d, "MMM")}
                          </div>
                          <div className="text-xl font-bold text-slate-800">
                            {format(d, "d")}
                          </div>
                        </div>
                        <p className="flex-1 truncate text-sm text-slate-700">
                          {e.title} {mood?.emoji}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${band.className}`}
                        >
                          {band.label}
                        </span>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Daily insight */}
              <Card className="rounded-2xl border-orange-100 bg-gradient-to-b from-white to-orange-50/50 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Sun className="h-4 w-4" />
                    Daily insight
                  </div>
                  <h3 className="text-xl font-extrabold leading-snug text-slate-900">
                    Mission: {insight.mission}
                  </h3>
                  <p className="text-sm text-slate-700">&ldquo;{insight.quote}&rdquo;</p>
                  <div className="pt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                      <Leaf className="h-4 w-4" />
                      Advice
                    </div>
                    <p className="text-sm text-slate-700">{insight.advice}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Goals */}
              <Card className="rounded-2xl border-orange-100 bg-white/90 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Goals</p>
                        <p className="text-[11px] text-slate-400">From your entries</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500">
                      {weekly} weekly
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <span className="flex items-center gap-2">
                        Progress
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">
                          Level {level}
                        </span>
                      </span>
                      <span className="text-slate-800">{percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Next step
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        Write {remaining} more {remaining === 1 ? "entry" : "entries"} to level up
                      </p>
                    </div>
                    <Link
                      href="/journal/write"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500 hover:bg-amber-200 transition-colors"
                      aria-label="Write a new entry"
                    >
                      <Star className="h-5 w-5 fill-amber-400" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MoodAnalytics;
