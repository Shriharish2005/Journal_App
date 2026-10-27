import {
  differenceInCalendarDays,
  format,
  startOfDay,
  subDays,
} from "date-fns";

// ---------- Mood helpers ----------
export const getMoodBand = (score) => {
  if (score >= 7) return "good";
  if (score >= 5) return "neutral";
  return "low";
};

export const MOOD_BAND_STYLES = {
  good: { label: "Good", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  neutral: { label: "Neutral", className: "bg-amber-50 text-amber-600 border-amber-200" },
  low: { label: "Low", className: "bg-rose-50 text-rose-600 border-rose-200" },
};

// ---------- Streak (consecutive local days with >= 1 entry) ----------
export function calculateStreak(isoDates = []) {
  if (!isoDates.length) return 0;
  const days = new Set(
    isoDates.map((d) => format(new Date(d), "yyyy-MM-dd"))
  );
  const today = startOfDay(new Date());
  let cursor = days.has(format(today, "yyyy-MM-dd")) ? today : subDays(today, 1);
  let streak = 0;
  while (days.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

// ---------- Evolution curve: one point per day, mood scaled 0-100 ----------
export function buildEvolutionSeries(entries = [], numDays = 7) {
  const today = startOfDay(new Date());
  const buckets = {};
  entries.forEach((e) => {
    const key = format(new Date(e.createdAt), "yyyy-MM-dd");
    buckets[key] = buckets[key] || { total: 0, count: 0 };
    buckets[key].total += e.moodScore;
    buckets[key].count += 1;
  });

  return Array.from({ length: numDays }, (_, i) => {
    const day = subDays(today, numDays - 1 - i);
    const b = buckets[format(day, "yyyy-MM-dd")];
    return {
      key: format(day, "yyyy-MM-dd"),
      label: format(day, "MMM d"),
      score: b ? Math.round((b.total / b.count) * 10) : null,
      count: b ? b.count : 0,
    };
  });
}

// ---------- Goals / levels ----------
export const ENTRIES_PER_LEVEL = 10;

export function calculateLevel(totalSessions = 0) {
  const level = Math.floor(totalSessions / ENTRIES_PER_LEVEL) + 1;
  const into = totalSessions % ENTRIES_PER_LEVEL;
  return {
    level,
    percent: Math.round((into / ENTRIES_PER_LEVEL) * 100),
    remaining: ENTRIES_PER_LEVEL - into,
  };
}

export function countThisWeek(isoDates = []) {
  const cutoff = subDays(startOfDay(new Date()), 6);
  return isoDates.filter((d) => new Date(d) >= cutoff).length;
}

// ---------- Daily insight (rule based, rotates by day) ----------
const INSIGHTS = {
  low: [
    {
      mission: "CONNECT AND COMFORT",
      quote: "Reach out to one friend or family member today to share a small moment of your day.",
      advice: "It is okay to feel low. A small conversation can help you feel much closer to others.",
    },
    {
      mission: "BREATHE AND RESET",
      quote: "Take five slow breaths and write down one thing that feels manageable right now.",
      advice: "Hard days pass. Naming what you feel is already a step toward easing it.",
    },
    {
      mission: "GENTLE MOVEMENT",
      quote: "Step outside for a ten minute walk, with no goal other than fresh air.",
      advice: "Light movement can shift your mood more than you'd expect.",
    },
  ],
  neutral: [
    {
      mission: "NOTICE THE SMALL THINGS",
      quote: "Write down three small details from today that you would normally overlook.",
      advice: "Steady days are a good time to build awareness, which makes the bright days easier to spot.",
    },
    {
      mission: "TRY SOMETHING NEW",
      quote: "Do one thing differently today, like a new route, a new song or a new recipe.",
      advice: "A little novelty can lift a flat day without needing a big change.",
    },
  ],
  good: [
    {
      mission: "SAVOR THE MOMENT",
      quote: "Capture what is going well today in detail so you can revisit it later.",
      advice: "Reflecting on good moments helps them last longer and builds resilience for harder days.",
    },
    {
      mission: "SPREAD THE GOOD",
      quote: "Send a thank-you message to someone who made your week better.",
      advice: "Gratitude strengthens connection, for you and for them.",
    },
    {
      mission: "BUILD ON MOMENTUM",
      quote: "Pick one goal you've been postponing and take the first small step now.",
      advice: "Good energy is the best time to start something meaningful.",
    },
  ],
  none: [
    {
      mission: "START YOUR STORY",
      quote: "Write a few lines about how you feel right now, with no pressure to be perfect.",
      advice: "Every journaling habit begins with a single entry.",
    },
  ],
};

export function getDailyInsight(recentAverageScore) {
  const band =
    recentAverageScore == null ? "none" : getMoodBand(recentAverageScore);
  const pool = INSIGHTS[band];
  const dayOfYear = differenceInCalendarDays(
    new Date(),
    new Date(new Date().getFullYear(), 0, 0)
  );
  return pool[dayOfYear % pool.length];
}
