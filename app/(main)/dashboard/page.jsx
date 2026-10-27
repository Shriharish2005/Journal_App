import { getCollections } from "@/actions/collection";
import { getJournalEntries, getDailyWritingGoal } from "@/actions/journal";
import MoodAnalytics from "./_components/mood-analytics";
import Collections from "./_components/collections";
import JournalExplorer from "./_components/journal-explorer";

const Dashboard = async () => {
  const collections = await getCollections();
  const entriesData = await getJournalEntries();
  const entries = entriesData?.data?.entries || [];

  const goalData = await getDailyWritingGoal();
  const dailyGoal = goalData?.dailyGoal || 300;

  // Group entries by collection
  const entriesByCollection = entries.reduce(
    (acc, entry) => {
      const collectionId = entry.collectionId || "unorganized";
      if (!acc[collectionId]) {
        acc[collectionId] = [];
      }
      acc[collectionId].push(entry);
      return acc;
    },
    {}
  );

  return (
    <div className="px-4 py-8 space-y-10 max-w-7xl mx-auto">
      {/* Calendar Navigation, Streaks, Daily/Weekly/Monthly Views, Search, Tags, Favorites & Goals */}
      <JournalExplorer entries={entries} dailyGoal={dailyGoal} />

      {/* Analytics Section */}
      <section className="space-y-4 pt-4 border-t border-orange-200/60">
        <MoodAnalytics />
      </section>

      {/* Collections Section */}
      <section id="collections" className="pt-4 border-t border-orange-200/60">
        <Collections
          collections={collections}
          entriesByCollection={entriesByCollection}
        />
      </section>
    </div>
  );
};

export default Dashboard;
