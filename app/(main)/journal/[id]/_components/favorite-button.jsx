"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavoriteEntry } from "@/actions/journal";
import { toast } from "sonner";

export default function FavoriteButton({ entryId, initialIsFavorite = false }) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const res = await toggleFavoriteEntry(entryId);
      if (res?.success) {
        setIsFavorite(res.isFavorite);
        toast.success(
          res.isFavorite ? "Added to favorite entries ⭐" : "Removed from favorites"
        );
      } else {
        setIsFavorite(!nextState);
        toast.error("Failed to update favorite status");
      }
    } catch (err) {
      setIsFavorite(!nextState);
      toast.error(err.message || "Failed to update favorite status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={`transition-all duration-200 border-amber-200 hover:border-amber-400 ${
        isFavorite
          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "text-gray-600 hover:text-amber-600"
      }`}
      title={isFavorite ? "Remove from favorites" : "Star this entry"}
    >
      <Star
        className={`h-4 w-4 mr-1.5 transition-transform ${
          isFavorite ? "fill-amber-400 text-amber-500 scale-110" : ""
        }`}
      />
      {isFavorite ? "Favorited" : "Favorite"}
    </Button>
  );
}
