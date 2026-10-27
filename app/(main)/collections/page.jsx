import { getCollections } from "@/actions/collection";
import { getJournalEntries } from "@/actions/journal";
import Collections from "../dashboard/_components/collections";

export const metadata = {
  title: "Collections - Journal",
  description: "Organize and browse your collections of journal entries.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();
  const entriesData = await getJournalEntries();
  const entries = entriesData?.data?.entries || [];

  // Group entries by collection
  const entriesByCollection = entries.reduce((acc, entry) => {
    const collectionId = entry.collectionId || "unorganized";
    if (!acc[collectionId]) {
      acc[collectionId] = [];
    }
    acc[collectionId].push(entry);
    return acc;
  }, {});

  return (
    <div className="px-4 py-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-orange-950">
          Collections
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Group your thoughts, memories, and reflections into organized themes.
        </p>
      </div>

      <Collections
        collections={collections || []}
        entriesByCollection={entriesByCollection}
      />
    </div>
  );
}
