import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import DeleteDialog from "./_components/delete-dialog";
import EditButton from "./_components/edit-button";
import FavoriteButton from "./_components/favorite-button";
import { getMoodById } from "@/app/lib/moods";
import { getJournalEntry } from "@/actions/journal";
import { BookOpen, Clock, Tag as TagIcon } from "lucide-react";

function calculateStats(htmlContent = "") {
  const plainText = htmlContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  const chars = plainText.length;
  return { words, readingTime, chars };
}

export default async function JournalEntryPage({ params }) {
  const { id } = await params;
  const entry = await getJournalEntry(id);
  const mood = getMoodById(entry.mood);
  const { words, readingTime } = calculateStats(entry.content);

  return (
    <>
      {/* Header with Mood Image */}
      {entry.moodImageUrl && (
        <div className="relative h-48 md:h-64 w-full">
          <Image
            src={entry.moodImageUrl}
            alt="Mood visualization"
            className="object-contain"
            fill
            priority
          />
        </div>
      )}

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-4xl md:text-5xl font-bold gradient-title">
                  {entry.title}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 pt-1">
                <span>Created {format(new Date(entry.createdAt), "PPP")}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-gray-600">
                  <BookOpen className="h-3.5 w-3.5 text-orange-500" />
                  {words} {words === 1 ? "word" : "words"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-gray-600">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  {readingTime} min read
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FavoriteButton entryId={id} initialIsFavorite={entry.isFavorite} />
              <EditButton entryId={id} />
              <DeleteDialog entryId={id} />
            </div>
          </div>

          {/* Badges & Tags Section */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {entry.collection && (
              <Link href={`/collection/${entry.collection.id}`}>
                <Badge className="bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-200">
                  📁 {entry.collection.name}
                </Badge>
              </Link>
            )}

            <Badge
              variant="outline"
              style={{
                backgroundColor: `var(--${mood?.color}-50)`,
                color: `var(--${mood?.color}-700)`,
                borderColor: `var(--${mood?.color}-200)`,
              }}
            >
              {mood?.emoji} Feeling {mood?.label}
            </Badge>

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-1">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50/80 text-amber-800 border border-amber-200/60"
                  >
                    <TagIcon className="h-3 w-3 text-amber-500" />
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Content Section */}
        <div className="ql-snow">
          <div
            className="ql-editor !p-0 leading-relaxed text-gray-800"
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        </div>

        {/* Footer */}
        <div className="text-sm text-gray-500 pt-4 border-t flex flex-wrap justify-between items-center gap-2">
          <span>Last updated {format(new Date(entry.updatedAt), "PPP 'at' p")}</span>
          <span className="text-xs text-gray-400">
            {words} words • {readingTime} min read
          </span>
        </div>
      </div>
    </>
  );
}
