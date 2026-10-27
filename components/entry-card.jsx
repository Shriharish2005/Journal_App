"use client";

import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { Star, BookOpen, Clock, Tag as TagIcon, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { toggleFavoriteEntry, deleteJournalEntry } from "@/actions/journal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function calculateStats(htmlContent = "") {
  const plainText = (htmlContent || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  return { words, readingTime, plainText };
}

const EntryCard = ({ entry, onDelete }) => {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(Boolean(entry.isFavorite));
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const { words, readingTime, plainText } = calculateStats(entry.content);

  const handleToggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const res = await toggleFavoriteEntry(entry.id);
      if (res?.success) {
        toast.success(res.isFavorite ? "Marked as Favorite ⭐" : "Removed from Favorites");
      } else {
        setIsFavorite(!nextState);
        toast.error("Could not update favorite status");
      }
    } catch {
      setIsFavorite(!nextState);
      toast.error("Error updating favorite status");
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDeleting(true);
    try {
      await deleteJournalEntry(entry.id);
      toast.success("Entry deleted successfully");
      setDeleteOpen(false);
      setIsDeleted(true);
      if (onDelete) onDelete(entry.id);
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleted) return null;

  return (
    <Card className="group relative bg-white/85 backdrop-blur-md border border-orange-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden">
      {/* Mood Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 opacity-80 group-hover:opacity-100 transition-opacity" />

      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          {/* Main Content Link */}
          <Link href={`/journal/${entry.id}`} className="space-y-2.5 flex-1 block">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 rounded-xl bg-orange-100/70 border border-orange-200/50 shadow-xs group-hover:scale-110 transition-transform">
                {entry.moodData?.emoji || "✨"}
              </span>
              <div>
                <h3 className="font-bold text-lg text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                  {entry.title}
                </h3>
                <time className="text-xs text-stone-400">
                  {format(new Date(entry.createdAt), "MMMM d, yyyy")}
                </time>
              </div>
            </div>
            <p className="text-stone-600 line-clamp-2 text-sm leading-relaxed font-serif">
              {plainText}
            </p>
          </Link>

          {/* Quick Actions (Favorite, Edit, Delete) */}
          <div className="flex items-center gap-1 shrink-0 bg-stone-50/80 p-1 rounded-xl border border-stone-200/60">
            {/* Favorite Button */}
            <button
              type="button"
              onClick={handleToggleFav}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isFavorite
                  ? "bg-amber-100/80 text-amber-500"
                  : "text-stone-400 hover:text-amber-500 hover:bg-amber-50"
              }`}
              title="Toggle Favorite"
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite ? "fill-amber-400 text-amber-500 scale-110" : ""
                }`}
              />
            </button>

            {/* Edit Button */}
            <Link
              href={`/journal/write?edit=${entry.id}`}
              className="p-1.5 rounded-lg hover:bg-orange-50 text-stone-400 hover:text-orange-600 transition-colors cursor-pointer"
              title="Edit Entry"
            >
              <Pencil className="h-4 w-4" />
            </Link>

            {/* Delete Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Delete Entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border border-orange-200">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-stone-900">
                    Delete this reflection?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-stone-600">
                    Are you sure you want to delete &ldquo;{entry.title}&rdquo;? This will remove the entry and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <Button
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl cursor-pointer"
                    disabled={isDeleting}
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Delete Entry
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Badges: Tags, Collection & Word Count */}
        <div className="mt-5 pt-3.5 border-t border-orange-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {entry.collection && (
              <span className="px-2.5 py-0.5 bg-orange-100 text-orange-900 rounded-full font-semibold border border-orange-200/60">
                📁 {entry.collection.name}
              </span>
            )}
            {entry.tags && entry.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50/80 text-amber-900 rounded-full text-[11px] font-medium border border-amber-200/60"
              >
                <TagIcon className="h-2.5 w-2.5 text-amber-600" />
                #{tag}
              </span>
            ))}
            {entry.tags && entry.tags.length > 3 && (
              <span className="text-stone-400 text-xs font-medium">
                +{entry.tags.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-stone-500 text-xs font-medium">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 rounded-md text-orange-800">
              <BookOpen className="h-3 w-3 text-orange-600" />
              {words}w
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-md text-amber-800">
              <Clock className="h-3 w-3 text-amber-600" />
              {readingTime}m
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryCard;
