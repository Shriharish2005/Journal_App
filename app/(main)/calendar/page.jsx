import { getJournalEntries, getDailyWritingGoal } from "@/actions/journal";
import JournalExplorer from "../dashboard/_components/journal-explorer";

export const metadata = {
  title: "Calendar - Journal",
  description: "View and explore your journal entries by calendar date, week, and month.",
};

export default async function CalendarPage() {
  const entriesData = await getJournalEntries();
  const entries = entriesData?.data?.entries || [];

  const goalData = await getDailyWritingGoal();
  const dailyGoal = goalData?.dailyGoal || 300;

  return (
    <div className="px-4 py-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-orange-950">
          Calendar
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Explore your daily entries, writing streaks, and timeline.
        </p>
      </div>

      <JournalExplorer entries={entries} dailyGoal={dailyGoal} />
    </div>
  );
}
