"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateCollection } from "@/actions/collection";
import useFetch from "@/hooks/use-fetch";

export default function EditCollectionDialog({ collection }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(collection?.name || "");
  const [description, setDescription] = useState(collection?.description || "");

  const {
    loading: isUpdating,
    fn: updateCollectionFn,
  } = useFetch(updateCollection);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Collection name cannot be empty");
      return;
    }

    try {
      const res = await updateCollectionFn(collection.id, {
        name: name.trim(),
        description: description.trim(),
      });

      if (res) {
        toast.success(`Collection "${res.name}" updated!`);
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update collection");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hover:text-orange-600">
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Collection Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Thoughts, Project Ideas"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of reflections belong in this collection?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="journal"
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
