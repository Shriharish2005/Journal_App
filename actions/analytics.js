"use server";

import { checkUser } from "@/lib/checkUser";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

const PERIOD_DAYS = { "7d": 7, "15d": 15, "30d": 30 };

function countWords(html = "") {
  const text = (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

const EMPTY = {
  timeline: [],
  stats: {
    totalEntries: 0,
    averageScore: 0,
    mostFrequentMood: null,
    dailyAverage: 0,
  },
  entries: [],
  overview: {
    totalSessions: 0,
    totalWords: 0,
    overallAverageScore: 0,
    entryDates: [],
    recentEntries: [],
    latestMood: null,
    recentAverageScore: null,
  },
};

export async function getAnalytics(period = "30d") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) user = await checkUser();
  if (!user) return { success: true, data: EMPTY };

  const days = PERIOD_DAYS[period] || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // All entries (content only used to count words, never sent to the client)
  const all = await db.entry.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      content: true,
      mood: true,
      moodScore: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalSessions = all.length;
  const totalWords = all.reduce((sum, e) => sum + countWords(e.content), 0);
  const overallAverageScore = totalSessions
    ? Number(
        (all.reduce((s, e) => s + e.moodScore, 0) / totalSessions).toFixed(1)
      )
    : 0;

  const entries = all
    .filter((e) => e.createdAt >= startDate)
    .map(({ content, ...rest }) => ({
      ...rest,
      createdAt: rest.createdAt.toISOString(),
    }));

  // Per-day averages (UTC key; the client re-buckets in the user's timezone)
  const byDate = entries.reduce((acc, e) => {
    const date = e.createdAt.split("T")[0];
    acc[date] = acc[date] || { total: 0, count: 0 };
    acc[date].total += e.moodScore;
    acc[date].count += 1;
    return acc;
  }, {});

  const timeline = Object.entries(byDate).map(([date, d]) => ({
    date,
    averageScore: Number((d.total / d.count).toFixed(1)),
    entryCount: d.count,
  }));

  const moodCounts = entries.reduce((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {});

  const stats = {
    totalEntries: entries.length,
    averageScore: entries.length
      ? Number(
          (entries.reduce((s, e) => s + e.moodScore, 0) / entries.length).toFixed(1)
        )
      : 0,
    mostFrequentMood:
      Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    dailyAverage: Number((entries.length / days).toFixed(1)),
  };

  const recent = all.slice(-5).reverse();
  const last3 = all.slice(-3);

  return {
    success: true,
    data: {
      timeline,
      stats,
      entries,
      overview: {
        totalSessions,
        totalWords,
        overallAverageScore,
        entryDates: all.map((e) => e.createdAt.toISOString()),
        recentEntries: recent.map((e) => ({
          id: e.id,
          title: e.title,
          mood: e.mood,
          moodScore: e.moodScore,
          createdAt: e.createdAt.toISOString(),
        })),
        latestMood: all.length ? all[all.length - 1].mood : null,
        recentAverageScore: last3.length
          ? Number(
              (last3.reduce((s, e) => s + e.moodScore, 0) / last3.length).toFixed(1)
            )
          : null,
      },
    },
  };
}
