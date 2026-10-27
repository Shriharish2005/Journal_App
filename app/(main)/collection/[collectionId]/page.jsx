import { getJournalEntries } from "@/actions/journal";
import { getCollections } from "@/actions/collection";
import { JournalFilters } from "./_components/journal-filters";
import DeleteCollectionDialog from "./_components/delete-collection";
import EditCollectionDialog from "./_components/edit-collection";

export default async function CollectionPage({ params }) {
  const { collectionId } = await params;
  const entries = await getJournalEntries({ collectionId });
  const collections =
    collectionId !== "unorganized" ? await getCollections() : null;
  const collection = collections?.find((c) => c.id === collectionId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold gradient-title">
            {collectionId === "unorganized"
              ? "Unorganized Entries"
              : collection?.name || "Collection"}
          </h1>
          {collection?.description && (
            <p className="text-sm text-gray-500 font-light">{collection?.description}</p>
          )}
        </div>

        {collection && (
          <div className="flex items-center gap-2">
            <EditCollectionDialog collection={collection} />
            <DeleteCollectionDialog
              collection={collection}
              entriesCount={entries?.data?.entries?.length || 0}
            />
          </div>
        )}
      </div>

      {/* Client-side Filters Component */}
      <JournalFilters entries={entries?.data?.entries || []} />
    </div>
  );
}
