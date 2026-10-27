"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Plus, Folder } from "lucide-react";
import { getMoodById } from "@/app/lib/moods";

const FolderTab = ({ colorClass }) => (
  <div
    className={`absolute inset-x-6 -top-2.5 h-3 rounded-t-xl transform -skew-x-6 transition-all shadow-xs ${colorClass}`}
  />
);

const EntryPreview = ({ entry }) => (
  <div className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-xs px-3 py-2 rounded-xl text-xs truncate border border-stone-200/50 dark:border-stone-700/60 shadow-2xs flex items-center gap-2">
    <span>{getMoodById(entry.mood)?.emoji || "✨"}</span>
    <span className="font-medium text-stone-800 dark:text-stone-200 truncate">{entry.title}</span>
  </div>
);

const CollectionPreview = ({
  id,
  name,
  entries = [],
  isUnorganized = false,
  isCreateNew = false,
  onCreateNew,
}) => {
  if (isCreateNew) {
    return (
      <button
        onClick={onCreateNew}
        className="group relative h-[210px] cursor-pointer text-left w-full focus:outline-none"
      >
        <FolderTab colorClass="bg-orange-200/80 dark:bg-stone-800 group-hover:bg-orange-300 dark:group-hover:bg-stone-700" />
        <div className="relative h-full rounded-2xl p-6 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md border-2 border-dashed border-orange-300/80 dark:border-stone-700 hover:border-orange-500 dark:hover:border-orange-400 shadow-sm hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-orange-100/80 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 group-hover:scale-110 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 flex items-center justify-center transition-all shadow-xs">
            <Plus className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-orange-950 dark:text-orange-100 font-bold text-sm">Create New Collection</p>
            <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">Organize related reflections</p>
          </div>
        </div>
      </button>
    );
  }

  const tabClass = isUnorganized
    ? "bg-amber-300/90 dark:bg-amber-700/80 group-hover:bg-amber-400 dark:group-hover:bg-amber-600"
    : "bg-orange-300/90 dark:bg-orange-700/80 group-hover:bg-orange-400 dark:group-hover:bg-orange-600";

  return (
    <Link
      href={`/collection/${isUnorganized ? "unorganized" : id}`}
      className="group relative block h-[210px] cursor-pointer"
    >
      <FolderTab colorClass={tabClass} />
      <div className="relative h-full rounded-2xl p-6 bg-white/80 dark:bg-stone-900/85 backdrop-blur-md border border-orange-200/80 dark:border-stone-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${isUnorganized ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400" : "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400"} shadow-xs`}>
              <Folder className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                {name}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {entries.length} {entries.length === 1 ? "reflection" : "reflections"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {entries.length > 0 ? (
            entries
              .slice(0, 2)
              .map((entry) => <EntryPreview key={entry.id} entry={entry} />)
          ) : (
            <div className="text-xs text-stone-400 italic py-2">
              No entries saved in this collection yet.
            </div>
          )}

          {entries.length > 0 && (
            <div className="text-[11px] text-stone-400 text-right pt-1">
              Active {formatDistanceToNow(new Date(entries[0].createdAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CollectionPreview;
