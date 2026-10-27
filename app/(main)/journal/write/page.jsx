"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Star,
  Tag as TagIcon,
  X,
  Plus,
  BookOpen,
  Trophy,
  Sparkles,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  Target,
} from "lucide-react";
import {
  createJournalEntry,
  updateJournalEntry,
  getJournalEntry,
  getDraft,
  saveDraft,
  deleteDraft,
  getDailyWritingGoal,
  updateDailyWritingGoal,
} from "@/actions/journal";
import { createCollection, getCollections } from "@/actions/collection";
import { getMoodById, MOODS } from "@/app/lib/moods";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";
import { journalSchema } from "@/app/lib/schemas";
import "react-quill-new/dist/quill.snow.css";
import CollectionForm from "@/components/collection-form";
import DeleteDialog from "../[id]/_components/delete-dialog";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const SUGGESTED_TAGS = [
  "Gratitude",
  "Reflection",
  "Productivity",
  "Mindset",
  "Ideas",
  "Milestone",
  "Health",
  "Daily",
];

const GOAL_OPTIONS = [150, 300, 500, 750, 1000];

function calculateStats(htmlContent = "") {
  const plainText = htmlContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  const chars = plainText.length;
  return { words, readingTime, chars };
}

export default function JournalEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Tags & Favorites state
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Autosave state
  const [autosaveStatus, setAutosaveStatus] = useState("idle"); // "idle" | "saving" | "saved" | "unsaved"
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const autosaveTimerRef = useRef(null);

  // Daily writing goal state
  const [dailyGoal, setDailyGoal] = useState(300);
  const [showGoalSelector, setShowGoalSelector] = useState(false);

  // Quill ref for custom image insertion
  const quillRef = useRef(null);

  // Fetch Hooks
  const {
    loading: collectionsLoading,
    data: collections,
    fn: fetchCollections,
  } = useFetch(getCollections);

  const {
    loading: entryLoading,
    data: existingEntry,
    fn: fetchEntry,
  } = useFetch(getJournalEntry);

  const {
    loading: draftLoading,
    data: draftData,
    fn: fetchDraft,
  } = useFetch(getDraft);

  const { loading: savingDraft, fn: saveDraftFn } = useFetch(saveDraft);
  const { fn: deleteDraftFn } = useFetch(deleteDraft);
  const { fn: fetchDailyGoalFn } = useFetch(getDailyWritingGoal);
  const { fn: updateDailyGoalFn } = useFetch(updateDailyWritingGoal);

  const {
    loading: actionLoading,
    fn: actionFn,
    data: actionResult,
  } = useFetch(isEditMode ? updateJournalEntry : createJournalEntry);

  const {
    loading: createCollectionLoading,
    fn: createCollectionFn,
    data: createdCollection,
  } = useFetch(createCollection);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: "",
      content: "",
      mood: "",
      collectionId: "",
      tags: [],
      isFavorite: false,
    },
  });

  const contentValue = watch("content") || "";
  const titleValue = watch("title") || "";
  const moodValue = watch("mood") || "";
  const collectionValue = watch("collectionId") || "";

  // Calculate live word count & stats
  const { words, readingTime, chars } = useMemo(
    () => calculateStats(contentValue),
    [contentValue]
  );

  const goalPercentage = Math.min(100, Math.round((words / (dailyGoal || 300)) * 100));
  const isGoalAchieved = words >= (dailyGoal || 300) && (dailyGoal || 300) > 0;

  // Initial Data Fetch
  useEffect(() => {
    fetchCollections();
    fetchDailyGoalFn().then((res) => {
      if (res?.success && res.dailyGoal) {
        setDailyGoal(res.dailyGoal);
      }
    });

    if (editId) {
      setIsEditMode(true);
      fetchEntry(editId);
    } else {
      setIsEditMode(false);
      fetchDraft();
    }
  }, [editId]);

  // Handle setting form data from draft or existing entry
  useEffect(() => {
    if (isEditMode && existingEntry) {
      reset({
        title: existingEntry.title || "",
        content: existingEntry.content || "",
        mood: existingEntry.mood || "",
        collectionId: existingEntry.collectionId || "",
        tags: existingEntry.tags || [],
        isFavorite: Boolean(existingEntry.isFavorite),
      });
      setTags(existingEntry.tags || []);
      setIsFavorite(Boolean(existingEntry.isFavorite));
    } else if (!isEditMode && draftData?.success && draftData?.data) {
      const d = draftData.data;
      if (d.title || d.content || d.mood || (d.tags && d.tags.length)) {
        reset({
          title: d.title || "",
          content: d.content || "",
          mood: d.mood || "",
          collectionId: d.collectionId || "",
          tags: d.tags || [],
          isFavorite: false,
        });
        setTags(d.tags || []);
        setDraftRestored(true);
        setLastSavedTime(d.updatedAt ? new Date(d.updatedAt) : new Date());
        setAutosaveStatus("saved");
      }
    }
  }, [draftData, isEditMode, existingEntry]);

  // Handle collection creation success
  useEffect(() => {
    if (createdCollection) {
      setIsCollectionDialogOpen(false);
      fetchCollections();
      setValue("collectionId", createdCollection.id);
      toast.success(`Collection "${createdCollection.name}" created!`);
    }
  }, [createdCollection]);

  // Handle successful submission
  useEffect(() => {
    if (actionResult && !actionLoading) {
      if (!isEditMode) {
        deleteDraftFn();
      }

      router.push(
        `/collection/${
          actionResult.collectionId ? actionResult.collectionId : "unorganized"
        }`
      );

      toast.success(
        `Entry ${isEditMode ? "updated" : "published"} successfully!`
      );
    }
  }, [actionResult, actionLoading]);

  // -------------------------------------------------------------
  // AUTOSAVE LOGIC (Debounced 2.5s)
  // -------------------------------------------------------------
  const performAutosave = useCallback(async () => {
    if (isEditMode) return;
    const currentTitle = getValues("title");
    const currentContent = getValues("content");
    const currentMood = getValues("mood");
    const currentCollection = getValues("collectionId");

    // Only autosave if there is actual content
    if (!currentTitle && !currentContent && !currentMood) return;

    setAutosaveStatus("saving");
    try {
      const res = await saveDraftFn({
        title: currentTitle,
        content: currentContent,
        mood: currentMood,
        collectionId: currentCollection || null,
        tags: tags,
      });

      if (res?.success) {
        setAutosaveStatus("saved");
        setLastSavedTime(new Date());
      } else {
        setAutosaveStatus("unsaved");
      }
    } catch {
      setAutosaveStatus("unsaved");
    }
  }, [isEditMode, tags, getValues, saveDraftFn]);

  // Trigger debounced autosave on content/title/mood changes
  useEffect(() => {
    if (isEditMode) return;
    if (!titleValue && !contentValue && !moodValue) return;

    setAutosaveStatus("unsaved");

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      performAutosave();
    }, 2500);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [titleValue, contentValue, moodValue, collectionValue, tags, isEditMode, performAutosave]);

  // -------------------------------------------------------------
  // TAG MANAGEMENT
  // -------------------------------------------------------------
  const handleAddTag = (rawTag) => {
    const cleanTag = rawTag.trim().replace(/^#/, "");
    if (!cleanTag) return;
    if (tags.includes(cleanTag)) {
      toast.info(`Tag "#${cleanTag}" is already added`);
      return;
    }
    const updated = [...tags, cleanTag];
    setTags(updated);
    setValue("tags", updated, { shouldDirty: true });
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    setValue("tags", updated, { shouldDirty: true });
  };

  const handleKeyDownTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  // -------------------------------------------------------------
  // FAVORITES & DRAFTS
  // -------------------------------------------------------------
  const handleToggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    setValue("isFavorite", next, { shouldDirty: true });
    toast.success(next ? "Marked as Favorite entry ⭐" : "Removed from Favorites");
  };

  const handleManualSaveDraft = async () => {
    setAutosaveStatus("saving");
    const res = await saveDraftFn({
      title: titleValue,
      content: contentValue,
      mood: moodValue,
      collectionId: collectionValue || null,
      tags: tags,
    });
    if (res?.success) {
      setAutosaveStatus("saved");
      setLastSavedTime(new Date());
      toast.success("Draft saved successfully!");
    } else {
      toast.error("Failed to save draft");
    }
  };

  const handleDiscardDraft = async () => {
    if (confirm("Are you sure you want to discard this draft? All unsaved work will be deleted.")) {
      await deleteDraftFn();
      reset({
        title: "",
        content: "",
        mood: "",
        collectionId: "",
        tags: [],
        isFavorite: false,
      });
      setTags([]);
      setDraftRestored(false);
      setAutosaveStatus("idle");
      toast.info("Draft discarded");
    }
  };

  const handleSetDailyGoal = async (newGoal) => {
    setDailyGoal(newGoal);
    setShowGoalSelector(false);
    await updateDailyGoalFn(newGoal);
    toast.success(`Daily writing goal updated to ${newGoal} words`);
  };

  // Custom Image URL insertion
  const handleInsertImageUrl = () => {
    const url = prompt("Enter the public image URL to insert:");
    if (!url) return;
    try {
      new URL(url);
      const imgTag = `<p><img src="${url}" alt="Journal image" style="max-width: 100%; border-radius: 8px; margin: 12px 0;" /></p>`;
      setValue("content", (contentValue || "") + imgTag, { shouldDirty: true });
      toast.success("Image added to journal");
    } catch {
      toast.error("Please enter a valid HTTP/HTTPS image URL");
    }
  };

  // Submission handler
  const onSubmit = handleSubmit(async (data) => {
    const mood = getMoodById(data.mood);
    actionFn({
      ...data,
      tags,
      isFavorite,
      moodScore: mood.score,
      moodQuery: mood.pixabayQuery,
      ...(isEditMode && { id: editId }),
    });
  });

  const isLoading =
    collectionsLoading ||
    entryLoading ||
    draftLoading ||
    actionLoading ||
    savingDraft;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-title">
              {isEditMode ? "Edit Reflection" : "What's on your mind?"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Capture your thoughts, milestones, and emotions with mindful focus.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Favorite Toggle Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleFavorite}
              className={`transition-all duration-200 border-amber-200 ${
                isFavorite
                  ? "bg-amber-50 text-amber-700 border-amber-400 font-medium"
                  : "text-gray-600 hover:text-amber-600"
              }`}
              title="Toggle Favorite"
            >
              <Star
                className={`h-4 w-4 mr-1.5 transition-transform ${
                  isFavorite ? "fill-amber-400 text-amber-500 scale-110" : ""
                }`}
              />
              {isFavorite ? "Favorited" : "Favorite"}
            </Button>

            {/* Autosave Status Indicator (for non-edit mode) */}
            {!isEditMode && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-gray-50 border border-gray-200 text-gray-600">
                {autosaveStatus === "saving" && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                    <span>Autosaving...</span>
                  </>
                )}
                {autosaveStatus === "saved" && (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>
                      Draft saved {lastSavedTime ? lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "just now"}
                    </span>
                  </>
                )}
                {autosaveStatus === "unsaved" && (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Unsaved edits</span>
                  </>
                )}
                {autosaveStatus === "idle" && (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-gray-400" />
                    <span>Autosave active</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Draft Restored Notification Banner */}
        {!isEditMode && draftRestored && (
          <div className="flex items-center justify-between gap-3 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-sm text-amber-900 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                Restored your unpublished draft from{" "}
                <strong>
                  {lastSavedTime ? lastSavedTime.toLocaleDateString() : "earlier"}
                </strong>
                . You can continue writing or discard it.
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDiscardDraft}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Discard Draft
            </Button>
          </div>
        )}

        {isLoading && (
          <BarLoader className="mb-2" width={"100%"} color="orange" />
        )}

        {/* Real-time Telemetry & Daily Writing Goal Bar */}
        <div className="bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-orange-50/70 border border-orange-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-200/60">
            {/* Word count & Reading time */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                <BookOpen className="h-4 w-4 text-orange-500" />
                <span>{words}</span>
                <span className="font-normal text-gray-500 text-xs">words</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>{readingTime} min read</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="text-xs text-gray-500">
                {chars} characters
              </div>
            </div>

            {/* Daily Goal target config */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-orange-600" />
                Goal:
              </span>
              <div className="flex items-center gap-1">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSetDailyGoal(opt)}
                    className={`px-2 py-0.5 text-xs rounded-md font-medium transition-all ${
                      dailyGoal === opt
                        ? "bg-orange-600 text-white shadow-sm"
                        : "bg-white/80 text-gray-600 hover:bg-orange-100 hover:text-orange-900 border border-orange-200/60"
                    }`}
                  >
                    {opt}w
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Goal Progress Bar */}
          <div className="pt-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-gray-700">
                Daily Writing Progress
              </span>
              <span className={`font-semibold ${isGoalAchieved ? "text-emerald-600" : "text-orange-600"}`}>
                {words} / {dailyGoal} words ({goalPercentage}%)
              </span>
            </div>
            <div className="w-full bg-orange-100/80 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  isGoalAchieved
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                }`}
                style={{ width: `${goalPercentage}%` }}
              />
            </div>
            {isGoalAchieved && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium pt-1 animate-in fade-in">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>Daily writing goal achieved! Fantastic mindfulness practice today 🎉</span>
              </div>
            )}
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-800">
            Entry Title <span className="text-red-500">*</span>
          </label>
          <Input
            disabled={isLoading}
            {...register("title")}
            placeholder="Give your reflection a meaningful title..."
            className={`py-5 text-lg font-medium border-gray-300 focus:border-orange-500 transition-colors ${
              errors.title ? "border-red-500" : ""
            }`}
          />
          {errors.title && (
            <p className="text-red-500 text-xs">{errors.title.message}</p>
          )}
        </div>

        {/* Mood & Collection Dual Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mood Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-800">
              How are you feeling? <span className="text-red-500">*</span>
            </label>
            <Controller
              name="mood"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={`py-5 ${errors.mood ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select current mood..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MOODS).map((mood) => (
                      <SelectItem key={mood.id} value={mood.id}>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{mood.emoji}</span>
                          <span className="font-medium">{mood.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.mood && (
              <p className="text-red-500 text-xs">{errors.mood.message}</p>
            )}
          </div>

          {/* Collection / Category Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-800">
              Category / Collection (Optional)
            </label>
            <Controller
              name="collectionId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    if (value === "new") {
                      setIsCollectionDialogOpen(true);
                    } else {
                      field.onChange(value);
                    }
                  }}
                  value={field.value || ""}
                >
                  <SelectTrigger className="py-5">
                    <SelectValue placeholder="Choose a category or collection..." />
                  </SelectTrigger>
                  <SelectContent>
                    {collections?.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        📁 {col.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      <span className="text-orange-600 font-semibold flex items-center gap-1">
                        + Create New Collection
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-2 p-3.5 bg-gray-50/70 border border-gray-200/80 rounded-xl">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <TagIcon className="h-4 w-4 text-orange-500" />
              Tags & Topics
            </label>
            <span className="text-xs text-gray-400">
              Press Enter or comma to add
            </span>
          </div>

          {/* Active Tags */}
          <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 shadow-2xs"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-600 p-0.5 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDownTag}
              placeholder={tags.length ? "Add more..." : "Type tag (e.g. gratitude) and press Enter..."}
              className="text-xs bg-transparent border-none outline-none py-1 px-2 focus:ring-0 min-w-[140px] text-gray-700"
            />
          </div>

          {/* Tag Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="text-xs text-gray-500 mr-1">Suggestions:</span>
            {SUGGESTED_TAGS.map((stag) => {
              const active = tags.includes(stag);
              return (
                <button
                  key={stag}
                  type="button"
                  disabled={active}
                  onClick={() => handleAddTag(stag)}
                  className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                    active
                      ? "bg-gray-200/50 text-gray-400 border-transparent cursor-default"
                      : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"
                  }`}
                >
                  +{stag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rich-Text Editor Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-800">
              {getMoodById(moodValue)?.prompt ?? "Express your thoughts freely..."}
            </label>
            <button
              type="button"
              onClick={handleInsertImageUrl}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 hover:underline"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Embed Image URL
            </button>
          </div>

          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <div className="quill-wrapper border border-gray-300 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200 transition-all bg-white shadow-2xs">
                <ReactQuill
                  readOnly={isLoading}
                  theme="snow"
                  value={field.value}
                  onChange={field.onChange}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link", "image"],
                      ["blockquote", "code-block"],
                      [{ align: [] }],
                      [{ color: [] }, { background: [] }],
                      ["clean"],
                    ],
                  }}
                  className="min-h-[360px]"
                />
              </div>
            )}
          />
          {errors.content && (
            <p className="text-red-500 text-xs">{errors.content.message}</p>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              disabled={isLoading}
            >
              Back to Dashboard
            </Button>

            {!isEditMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleManualSaveDraft}
                disabled={savingDraft || (!isDirty && autosaveStatus === "saved")}
                className="text-gray-700 hover:text-orange-600"
              >
                {savingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin text-orange-500" />}
                Save as Draft
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isEditMode && existingEntry && (
              <DeleteDialog entryId={existingEntry.id} />
            )}

            <Button
              type="submit"
              variant="journal"
              disabled={actionLoading || (!isDirty && !isEditMode)}
              className="px-6 font-semibold shadow-md"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Entry" : "Publish Entry"}
            </Button>
          </div>
        </div>
      </form>

      {/* Collection Creation Modal */}
      <CollectionForm
        loading={createCollectionLoading}
        onSuccess={(data) => createCollectionFn(data)}
        open={isCollectionDialogOpen}
        setOpen={setIsCollectionDialogOpen}
      />
    </div>
  );
}
