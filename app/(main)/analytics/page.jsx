import { getJournalEntries, getDailyWritingGoal } from "@/actions/journal";
import AnalyticsView from "./_components/analytics-view";

export const metadata = {
  title: "Statistics & Streaks - Journal",
  description: "View comprehensive statistics, writing streaks, habit analytics, and mood charts.",
};

export default async function AnalyticsPage() {
  const entriesData = await getJournalEntries();
  const entries = entriesData?.data?.entries || [];

  const goalData = await getDailyWritingGoal();
  const dailyGoal = goalData?.dailyGoal || 300;

  return <AnalyticsView entries={entries} dailyGoal={dailyGoal} />;
}
