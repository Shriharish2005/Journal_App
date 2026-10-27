"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  PenBox,
  Plus,
  BookOpen,
  Clock,
  Sparkles,
  Smile,
  X,
  ExternalLink,
  Star,
  Target,
  Tag as TagIcon,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  format,
  parseISO,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addDays,
  subDays,
} from "date-fns";
import { toggleFavoriteEntry, deleteJournalEntry } from "@/actions/journal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function calculateStats(htmlContent = "") {
  const plainText = (htmlContent || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  return { words, readingTime, plainText };
}

export default function JournalExplorer({ entries = [], dailyGoal = 300 }) {
  const router = useRouter();
  const [localEntries, setLocalEntries] = useState(entries);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // "day" | "week" | "month"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTag, setSelectedTag] = useState("all");
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  const today = startOfDay(new Date());

  // -------------------------------------------------------------
  // FAVORITE TOGGLE HANDLER
  // -------------------------------------------------------------
  const handleToggleFav = async (e, entryId) => {
    e.preventDefault();
    e.stopPropagation();

    const targetEntry = localEntries.find((item) => item.id === entryId);
    if (!targetEntry) return;

    const nextState = !targetEntry.isFavorite;

    setLocalEntries((prev) =>
      prev.map((item) =>
        item.id === entryId ? { ...item, isFavorite: nextState } : item
      )
    );

    try {
      const res = await toggleFavoriteEntry(entryId);
      if (res?.success) {
        toast.success(
          res.isFavorite ? "Added to Favorites ⭐" : "Removed from Favorites"
        );
      } else {
        setLocalEntries((prev) =>
          prev.map((item) =>
            item.id === entryId ? { ...item, isFavorite: !nextState } : item
          )
        );
        toast.error("Could not update favorite status");
      }
    } catch {
      setLocalEntries((prev) =>
        prev.map((item) =>
          item.id === entryId ? { ...item, isFavorite: !nextState } : item
        )
      );
      toast.error("Error updating favorite status");
    }
  };

  // -------------------------------------------------------------
  // DELETE ENTRY HANDLER
  // -------------------------------------------------------------
  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);

    try {
      await deleteJournalEntry(entryToDelete.id);
      setLocalEntries((prev) => prev.filter((item) => item.id !== entryToDelete.id));
      toast.success("Entry deleted successfully");
      setEntryToDelete(null);
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // ALL UNIQUE TAGS
  // -------------------------------------------------------------
  const allTags = useMemo(() => {
    const tagSet = new Set();
    localEntries.forEach((entry) => {
      if (Array.isArray(entry.tags)) {
        entry.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [localEntries]);

  // -------------------------------------------------------------
  // 1. STREAKS & MISSED DAYS TELEMETRY
  // -------------------------------------------------------------
  const streakStats = useMemo(() => {
    if (!localEntries || !localEntries.length) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        todayLogged: false,
        missedThisWeek: 0,
      };
    }

    const entryDateStrings = new Set();
    localEntries.forEach((e) => {
      if (e.createdAt) {
        const d = new Date(e.createdAt);
        entryDateStrings.add(format(d, "yyyy-MM-dd"));
      }
    });

    const todayStr = format(today, "yyyy-MM-dd");
    const todayLogged = entryDateStrings.has(todayStr);

    let currentStreak = 0;
    let checkDate = todayLogged ? today : subDays(today, 1);

    while (entryDateStrings.has(format(checkDate, "yyyy-MM-dd"))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }

    const sortedDates = Array.from(entryDateStrings).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prev = null;

    sortedDates.forEach((dateStr) => {
      const d = parseISO(dateStr);
      if (!prev) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      prev = d;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    });

    if (currentStreak > longestStreak) longestStreak = currentStreak;

    let missedThisWeek = 0;
    for (let i = 1; i <= 6; i++) {
      const pastDay = subDays(today, i);
      const str = format(pastDay, "yyyy-MM-dd");
      if (!entryDateStrings.has(str)) {
        missedThisWeek++;
      }
    }

    return {
      currentStreak,
      longestStreak,
      totalDays: entryDateStrings.size,
      todayLogged,
      missedThisWeek,
    };
  }, [localEntries, today]);

  // Today's Words written towards daily goal
  const todayWords = useMemo(() => {
    return localEntries
      .filter((e) => isToday(new Date(e.createdAt)))
      .reduce((sum, e) => sum + calculateStats(e.content).words, 0);
  }, [localEntries]);

  const goalPercentage = Math.min(100, Math.round((todayWords / (dailyGoal || 300)) * 100));

  // -------------------------------------------------------------
  // 2. SEARCH & FILTER ENGINE
  // -------------------------------------------------------------
  const filteredEntries = useMemo(() => {
    return localEntries.filter((entry) => {
      if (onlyFavorites && !entry.isFavorite) return false;

      if (selectedTag !== "all") {
        if (!entry.tags || !entry.tags.includes(selectedTag)) return false;
      }

      if (selectedMoodFilter !== "all") {
        if (entry.mood?.toLowerCase() !== selectedMoodFilter.toLowerCase()) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = entry.title?.toLowerCase().includes(q);
        const { plainText } = calculateStats(entry.content);
        const contentMatch = plainText.toLowerCase().includes(q);
        const colMatch = entry.collection?.name?.toLowerCase().includes(q);
        const tagMatch = entry.tags?.some((t) => t.toLowerCase().includes(q));

        const dateStr = entry.createdAt
          ? format(new Date(entry.createdAt), "MMMM d yyyy").toLowerCase()
          : "";
        const dateMatch = dateStr.includes(q);

        if (!titleMatch && !contentMatch && !colMatch && !tagMatch && !dateMatch) {
          return false;
        }
      }

      return true;
    });
  }, [localEntries, searchQuery, selectedMoodFilter, onlyFavorites, selectedTag]);

  // Map entries by YYYY-MM-DD
  const entriesByDateMap = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((entry) => {
      if (entry.createdAt) {
        const key = format(new Date(entry.createdAt), "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(entry);
      }
    });
    return map;
  }, [filteredEntries]);

  // -------------------------------------------------------------
  // 3. CALENDAR GENERATION (Monthly)
  // -------------------------------------------------------------
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayIndex = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      days.push({
        date: d,
        isCurrentMonth: true,
      });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({
          date: d,
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [currentMonthDate]);

  // -------------------------------------------------------------
  // 4. WEEK DAYS GENERATION (Weekly View)
  // -------------------------------------------------------------
  const weekDays = useMemo(() => {
    const curr = startOfDay(selectedDate);
    const dayOfWeek = curr.getDay();
    const weekStart = subDays(curr, dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const entriesOnSelectedDate = entriesByDateMap.get(selectedDateKey) || [];

  return (
    <div className="space-y-6">
      {/* Telemetry Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Current Streak */}
        <Card className="border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Writing Streak
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-orange-600">
                  {streakStats.currentStreak}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {streakStats.currentStreak === 1 ? "day" : "days"}
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-100/80 flex items-center justify-center text-orange-600 shadow-inner">
              <Flame className="h-5 w-5 fill-orange-500 text-orange-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Longest Streak */}
        <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Best Streak
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-600">
                  {streakStats.longestStreak}
                </span>
                <span className="text-xs font-medium text-gray-500">days</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-600 shadow-inner">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        {/* Daily Goal Telemetry */}
        <Card className="border-teal-200/80 bg-gradient-to-br from-teal-50 via-white to-emerald-50 shadow-2xs hover:shadow-xs transition-shadow col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5 w-full mr-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Today's Goal
                </p>
                <span className="text-2xs font-semibold text-teal-700">
                  {goalPercentage}%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-teal-700">
                  {todayWords}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  /{dailyGoal}w
                </span>
              </div>
              <div className="w-full bg-teal-100 rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${goalPercentage}%` }}
                />
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-teal-100/80 flex items-center justify-center text-teal-700 shrink-0">
              <Target className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Status */}
        <Card className="border-orange-200/80 bg-gradient-to-br from-white via-orange-50/30 to-white shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Today's Log
              </p>
              <div className="flex items-center gap-1.5 pt-0.5">
                {streakStats.todayLogged ? (
                  <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Logged!
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Pending
                  </span>
                )}
              </div>
            </div>
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                streakStats.todayLogged
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {streakStats.todayLogged ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <PenBox className="h-5 w-5" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Missed Days */}
        <Card className="border-orange-200/80 bg-gradient-to-br from-white via-rose-50/20 to-white shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Missed (7d)
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-bold ${
                    streakStats.missedThisWeek > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {streakStats.missedThisWeek}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {streakStats.missedThisWeek === 1 ? "day" : "days"}
                </span>
              </div>
            </div>
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                streakStats.missedThisWeek > 0
                  ? "bg-rose-100 text-rose-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              <CalendarIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation & View Controls */}
      <div className="bg-white border border-orange-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries by title, thoughts, tag (#mindset), or date..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Favorites Toggle, Mood, & View Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`rounded-xl border transition-all h-9 ${
                onlyFavorites
                  ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold shadow-2xs"
                  : "border-gray-200 text-gray-600 hover:text-amber-600 hover:border-amber-200"
              }`}
            >
              <Star
                className={`h-4 w-4 mr-1.5 ${
                  onlyFavorites ? "fill-amber-500 text-amber-500" : ""
                }`}
              />
              Favorites
            </Button>

            <select
              value={selectedMoodFilter}
              onChange={(e) => setSelectedMoodFilter(e.target.value)}
              className="text-xs rounded-xl border border-gray-200 px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-2xs h-9 cursor-pointer"
            >
              <option value="all">All Moods</option>
              <option value="happy">😊 Happy</option>
              <option value="peaceful">😌 Peaceful</option>
              <option value="thoughtful">🤔 Thoughtful</option>
              <option value="anxious">😰 Anxious</option>
              <option value="sad">😢 Sad</option>
              <option value="grateful">🙏 Grateful</option>
            </select>

            <div className="inline-flex rounded-xl p-1 bg-gray-100/80 border border-gray-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === "day"
                    ? "bg-white text-orange-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Daily View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === "week"
                    ? "bg-white text-orange-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Weekly View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === "month"
                    ? "bg-white text-orange-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly View
              </button>
            </div>

            <Link href="/journal/write">
              <Button
                variant="journal"
                size="sm"
                className="rounded-xl shadow-xs font-semibold h-9"
              >
                <Plus className="h-4 w-4 mr-1" />
                Write
              </Button>
            </Link>
          </div>
        </div>

        {/* Tag Filters Row */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs border-t border-gray-100">
            <span className="text-gray-400 font-medium mr-1 flex items-center gap-1">
              <TagIcon className="h-3 w-3 text-orange-500" />
              Tags:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              className={`px-2.5 py-0.5 rounded-full border transition-all ${
                selectedTag === "all"
                  ? "bg-orange-600 text-white border-orange-600 font-semibold shadow-2xs"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? "all" : tag)}
                className={`px-2.5 py-0.5 rounded-full border transition-all ${
                  selectedTag === tag
                    ? "bg-orange-600 text-white border-orange-600 font-semibold shadow-2xs"
                    : "bg-orange-50/70 text-orange-800 border-orange-200/80 hover:bg-orange-100"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* VIEW 1: MONTHLY CALENDAR GRID */}
        {viewMode === "month" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-800">
                  {format(currentMonthDate, "MMMM yyyy")}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-medium">
                  {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentMonthDate(
                      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
                    )
                  }
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMonthDate(new Date());
                    setSelectedDate(new Date());
                  }}
                  className="h-8 px-2.5 text-xs rounded-lg font-medium"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentMonthDate(
                      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
                    )
                  }
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                const dateKey = format(date, "yyyy-MM-dd");
                const dayEntries = entriesByDateMap.get(dateKey) || [];
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                const isPast = isBefore(date, today);
                const isMissed = isPast && isCurrentMonth && dayEntries.length === 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDate(date);
                      setViewMode("day");
                    }}
                    className={`min-h-[92px] md:min-h-[105px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      !isCurrentMonth
                        ? "bg-gray-50/50 border-gray-100 text-gray-300 opacity-60"
                        : isSelected
                        ? "border-orange-500 ring-2 ring-orange-200 bg-orange-50/40 shadow-xs"
                        : isTodayDate
                        ? "border-orange-300 bg-orange-50/20"
                        : "bg-white border-gray-100 hover:border-orange-200 hover:bg-orange-50/15"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center transition-colors ${
                          isTodayDate
                            ? "bg-orange-600 text-white shadow-2xs"
                            : isSelected
                            ? "bg-orange-100 text-orange-900"
                            : "text-gray-700 group-hover:text-orange-600"
                        }`}
                      >
                        {format(date, "d")}
                      </span>

                      {dayEntries.length > 0 && (
                        <div className="flex items-center gap-1">
                          {dayEntries.some((e) => e.isFavorite) && (
                            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          )}
                          <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {dayEntries.length}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 my-1">
                      {dayEntries.length > 0 ? (
                        dayEntries.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className="text-2xs font-medium px-1.5 py-0.5 rounded-md bg-white border border-orange-100 text-gray-800 truncate shadow-2xs flex items-center gap-1"
                          >
                            <span>{e.moodData?.emoji || "📝"}</span>
                            <span className="truncate">{e.title}</span>
                          </div>
                        ))
                      ) : isMissed ? (
                        <div className="text-2xs font-medium px-1 py-0.5 rounded text-amber-600 bg-amber-50/80 flex items-center gap-0.5">
                          <AlertCircle className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                          <span className="truncate">Missed Day</span>
                        </div>
                      ) : isTodayDate ? (
                        <div className="text-2xs font-medium px-1 py-0.5 rounded text-orange-600 bg-orange-50 flex items-center gap-0.5">
                          <PenBox className="h-2.5 w-2.5 text-orange-500 shrink-0" />
                          <span>Ready to write</span>
                        </div>
                      ) : null}

                      {dayEntries.length > 2 && (
                        <div className="text-3xs text-gray-400 text-center">
                          +{dayEntries.length - 2} more
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      {dayEntries.length > 0 ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      ) : isMissed ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: WEEKLY TIMELINE VIEW */}
        {viewMode === "week" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold text-gray-800">
                Week of {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
              </h3>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(subDays(selectedDate, 7))}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="h-8 px-2.5 text-xs rounded-lg font-medium"
                >
                  Current Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDays.map((day, idx) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayEntries = entriesByDateMap.get(dateKey) || [];
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const isPast = isBefore(day, today);
                const isMissed = isPast && dayEntries.length === 0;

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-3.5 space-y-3 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-200 bg-orange-50/30"
                        : isTodayDate
                        ? "border-orange-300 bg-orange-50/15"
                        : "bg-white border-gray-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">
                          {format(day, "EEE")}
                        </p>
                        <p
                          className={`text-base font-bold ${
                            isTodayDate ? "text-orange-600" : "text-gray-800"
                          }`}
                        >
                          {format(day, "MMM d")}
                        </p>
                      </div>

                      {dayEntries.length > 0 ? (
                        <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </span>
                      ) : isMissed ? (
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Missed
                        </span>
                      ) : isTodayDate ? (
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          Today
                        </span>
                      ) : (
                        <span className="text-2xs text-gray-400">Upcoming</span>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      {dayEntries.length > 0 ? (
                        dayEntries.map((e) => {
                          const { words } = calculateStats(e.content);
                          return (
                            <div
                              key={e.id}
                              className="p-2.5 rounded-xl border border-orange-100 bg-white shadow-2xs hover:border-orange-300 transition-colors space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <Link
                                  href={`/journal/${e.id}`}
                                  className="text-xs font-semibold text-gray-900 hover:text-orange-600 line-clamp-2"
                                >
                                  {e.title}
                                </Link>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(ev) => handleToggleFav(ev, e.id)}
                                    className="text-gray-400 hover:text-amber-500 p-0.5"
                                    title="Toggle Favorite"
                                  >
                                    <Star
                                      className={`h-3.5 w-3.5 ${
                                        e.isFavorite
                                          ? "fill-amber-400 text-amber-500"
                                          : ""
                                      }`}
                                    />
                                  </button>
                                  <Link
                                    href={`/journal/write?edit=${e.id}`}
                                    className="text-gray-400 hover:text-orange-600 p-0.5"
                                    title="Edit Entry"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setEntryToDelete(e)}
                                    className="text-gray-400 hover:text-red-500 p-0.5"
                                    title="Delete Entry"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-3xs text-gray-500">
                                <span>{e.moodData?.emoji || "📝"}</span>
                                <span>{words}w</span>
                                {e.collection && (
                                  <span className="truncate text-orange-700">
                                    📁 {e.collection.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-xs text-gray-400">
                          {isMissed ? (
                            <span className="text-amber-600 font-medium">
                              No entry logged
                            </span>
                          ) : (
                            "No entry"
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(day);
                        setViewMode("day");
                      }}
                      className="w-full text-xs text-orange-600 hover:bg-orange-50 h-7"
                    >
                      View Details →
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: DAILY FOCUSED VIEW */}
        {viewMode === "day" && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 border-b pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </h3>
                  {isToday(selectedDate) && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {entriesOnSelectedDate.length}{" "}
                  {entriesOnSelectedDate.length === 1 ? "reflection" : "reflections"}{" "}
                  recorded on this day
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  className="h-8 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous Day
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="h-8 text-xs rounded-lg"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="h-8 rounded-lg"
                >
                  Next Day <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            {entriesOnSelectedDate.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entriesOnSelectedDate.map((entry) => {
                  const { words, readingTime, plainText } = calculateStats(entry.content);
                  return (
                    <div
                      key={entry.id}
                      className="bg-gradient-to-br from-white to-orange-50/20 border border-orange-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{entry.moodData?.emoji || "✨"}</span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200/60">
                              Feeling {entry.moodData?.label || entry.mood}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Favorite Button */}
                            <button
                              type="button"
                              onClick={(ev) => handleToggleFav(ev, entry.id)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors"
                              title="Toggle favorite"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  entry.isFavorite
                                    ? "fill-amber-400 text-amber-500 scale-110"
                                    : ""
                                }`}
                              />
                            </button>

                            {/* Edit Button */}
                            <Link
                              href={`/journal/write?edit=${entry.id}`}
                              className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors"
                              title="Edit Entry"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setEntryToDelete(entry)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <Link href={`/journal/${entry.id}`}>
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                            {entry.title}
                          </h4>
                        </Link>

                        {/* Snippet */}
                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                          {plainText}
                        </p>

                        {/* Tags */}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {entry.tags.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-3xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60"
                              >
                                <TagIcon className="h-2.5 w-2.5 text-amber-500" />
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-3 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <BookOpen className="h-3.5 w-3.5 text-orange-500" />
                            {words}w
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            {readingTime} min
                          </span>
                        </div>

                        <Link
                          href={`/journal/${entry.id}`}
                          className="font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline"
                        >
                          Read Entry <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/30 space-y-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mx-auto">
                  <PenBox className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-gray-800">
                    No reflections logged for {format(selectedDate, "MMMM d, yyyy")}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Take a mindful moment to record your thoughts, gratitude, or emotions.
                  </p>
                </div>
                <Link href="/journal/write">
                  <Button variant="journal" size="sm" className="rounded-xl shadow-xs font-semibold">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Write Entry for Today
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Delete Confirmation Dialog for Explorer */}
      <AlertDialog
        open={Boolean(entryToDelete)}
        onOpenChange={(isOpen) => !isOpen && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this journal entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete &quot;{entryToDelete?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleDeleteEntry}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Delete Entry
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
