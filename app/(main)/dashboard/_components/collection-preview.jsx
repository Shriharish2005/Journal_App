"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Plus, Folder, Sparkles } from "lucide-react";
import { getMoodById } from "@/app/lib/moods";

const FolderTab = ({ colorClass }) => (
  <div
    className={`absolute inset-x-6 -top-2.5 h-3 rounded-t-xl transform -skew-x-6 transition-all shadow-xs ${colorClass}`}
  />
);

const EntryPreview = ({ entry }) => (
  <div className="bg-white/80 backdrop-blur-xs px-3 py-2 rounded-xl text-xs truncate border border-stone-200/50 shadow-2xs flex items-center gap-2">
    <span>{getMoodById(entry.mood)?.emoji || "✨"}</span>
    <span className="font-medium text-stone-800 truncate">{entry.title}</span>
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
        <FolderTab colorClass="bg-orange-200/80 group-hover:bg-orange-300" />
        <div className="relative h-full rounded-2xl p-6 bg-white/60 backdrop-blur-md border-2 border-dashed border-orange-300/80 hover:border-orange-500 shadow-sm hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-orange-100/80 text-orange-600 group-hover:scale-110 group-hover:bg-orange-200 flex items-center justify-center transition-all shadow-xs">
            <Plus className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-orange-950 font-bold text-sm">Create New Collection</p>
            <p className="text-stone-500 text-xs mt-0.5">Organize related reflections</p>
          </div>
        </div>
      </button>
    );
  }

  const tabClass = isUnorganized
    ? "bg-amber-300/90 group-hover:bg-amber-400"
    : "bg-orange-300/90 group-hover:bg-orange-400";

  return (
    <Link
      href={`/collection/${isUnorganized ? "unorganized" : id}`}
      className="group relative block h-[210px] cursor-pointer"
    >
      <FolderTab colorClass={tabClass} />
      <div className="relative h-full rounded-2xl p-6 bg-white/80 backdrop-blur-md border border-orange-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${isUnorganized ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-700"} shadow-xs`}>
              <Folder className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-stone-900 group-hover:text-orange-600 transition-colors truncate">
                {name}
              </h3>
              <p className="text-xs text-stone-500">
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
