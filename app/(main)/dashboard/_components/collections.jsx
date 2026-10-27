"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCollection } from "@/actions/collection";
import { toast } from "sonner";
import CollectionPreview from "./collection-preview";
import CollectionForm from "@/components/collection-form";
import useFetch from "@/hooks/use-fetch";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Collections = ({ collections = [], entriesByCollection }) => {
  const router = useRouter();
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);

  const {
    loading: createCollectionLoading,
    fn: createCollectionFn,
    data: createdCollection,
  } = useFetch(createCollection);

  useEffect(() => {
    if (createdCollection) {
      setIsCollectionDialogOpen(false);
      router.refresh();
      toast.success(`Collection "${createdCollection.name}" created!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdCollection, createCollectionLoading]);

  const handleCreateCollection = async (data) => {
    createCollectionFn(data);
  };

  return (
    <section id="collections" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold gradient-title tracking-tight">Collections</h2>
          <p className="text-stone-500 text-sm">
            Organize and curate your thoughts into thematic folders.
          </p>
        </div>
        <Button
          onClick={() => setIsCollectionDialogOpen(true)}
          variant="outline"
          size="sm"
          className="rounded-xl border-orange-200 text-orange-900 hover:bg-orange-50 font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <FolderPlus className="h-4 w-4 text-orange-600" />
          <span>New Collection</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Create New Collection Card */}
        <CollectionPreview
          isCreateNew={true}
          onCreateNew={() => setIsCollectionDialogOpen(true)}
        />

        {/* Unorganized Collection */}
        {entriesByCollection?.unorganized?.length > 0 && (
          <CollectionPreview
            name="Unorganized"
            entries={entriesByCollection.unorganized}
            isUnorganized={true}
          />
        )}

        {/* User Collections */}
        {collections?.map((collection) => (
          <CollectionPreview
            key={collection.id}
            id={collection.id}
            name={collection.name}
            entries={entriesByCollection[collection.id] || []}
          />
        ))}

        <CollectionForm
          loading={createCollectionLoading}
          onSuccess={handleCreateCollection}
          open={isCollectionDialogOpen}
          setOpen={setIsCollectionDialogOpen}
        />
      </div>
    </section>
  );
};

export default Collections;
