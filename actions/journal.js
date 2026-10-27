"use server";

import { checkUser } from "@/lib/checkUser";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getMoodById, MOODS } from "@/app/lib/moods";
import { getPixabayImage } from "./public";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

export async function createJournalEntry(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Protect with Arcjet if key configured
    if (process.env.ARCJET_KEY) {
      try {
        const req = await request();
        const decision = await aj.protect(req, {
          userId,
          requested: 1,
        });

        if (decision.isDenied()) {
          if (decision.reason.isRateLimit()) {
            throw new Error("Too many requests. Please try again later.");
          }
          throw new Error("Request blocked");
        }
      } catch (err) {
        if (err.message?.includes("Too many requests") || err.message?.includes("Request blocked")) {
          throw err;
        }
        console.warn("Arcjet rate limit check skipped:", err.message);
      }
    }

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      user = await checkUser();
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Get mood data
    const mood = MOODS[data.mood.toUpperCase()];
    if (!mood) throw new Error("Invalid mood");

    // Get mood image from Pixabay
    const moodImageUrl = await getPixabayImage(data.moodQuery);

    // Normalize tags
    const tags = Array.isArray(data.tags)
      ? data.tags.map((t) => t.trim().replace(/^#/, "")).filter(Boolean)
      : [];

    // Create the entry
    const entry = await db.entry.create({
      data: {
        title: data.title,
        content: data.content,
        mood: mood.id,
        moodScore: mood.score,
        moodImageUrl,
        userId: user.id,
        collectionId: data.collectionId || null,
        tags: tags,
        isFavorite: Boolean(data.isFavorite),
      },
    });

    // Delete existing draft after successful publication
    await db.draft.deleteMany({
      where: { userId: user.id },
    });

    revalidatePath("/dashboard");
    return entry;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getJournalEntries({
  collectionId,
  isFavorite,
  tag,
  orderBy = "desc",
} = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      user = await checkUser();
    }

    if (!user) return { success: true, data: { entries: [] } };

    // Build where clause based on filters
    const where = {
      userId: user.id,
      ...(collectionId === "unorganized"
        ? { collectionId: null }
        : collectionId
        ? { collectionId }
        : {}),
      ...(typeof isFavorite === "boolean" ? { isFavorite } : {}),
      ...(tag ? { tags: { has: tag.replace(/^#/, "") } } : {}),
    };

    // Get entries
    const entries = await db.entry.findMany({
      where,
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: orderBy,
      },
    });

    // Add mood data to each entry
    const entriesWithMoodData = entries.map((entry) => ({
      ...entry,
      moodData: getMoodById(entry.mood),
    }));

    return {
      success: true,
      data: {
        entries: entriesWithMoodData,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getJournalEntry(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    const entry = await db.entry.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!entry) throw new Error("Entry not found");

    return entry;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteJournalEntry(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    // Check if entry exists and belongs to user
    const entry = await db.entry.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!entry) throw new Error("Entry not found");

    // Delete the entry
    await db.entry.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return entry;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateJournalEntry(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    // Check if entry exists and belongs to user
    const existingEntry = await db.entry.findFirst({
      where: {
        id: data.id,
        userId: user.id,
      },
    });

    if (!existingEntry) throw new Error("Entry not found");

    // Get mood data
    const mood = MOODS[data.mood.toUpperCase()];
    if (!mood) throw new Error("Invalid mood");

    // Get new mood image if mood changed
    let moodImageUrl = existingEntry.moodImageUrl;
    if (existingEntry.mood !== mood.id) {
      moodImageUrl = await getPixabayImage(data.moodQuery);
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.map((t) => t.trim().replace(/^#/, "")).filter(Boolean)
      : existingEntry.tags || [];

    // Update the entry
    const updatedEntry = await db.entry.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        mood: mood.id,
        moodScore: mood.score,
        moodImageUrl,
        collectionId: data.collectionId || null,
        tags: tags,
        isFavorite: typeof data.isFavorite === "boolean" ? data.isFavorite : existingEntry.isFavorite,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/journal/${data.id}`);
    return updatedEntry;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function toggleFavoriteEntry(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    const entry = await db.entry.findFirst({
      where: { id, userId: user.id },
    });

    if (!entry) throw new Error("Entry not found");

    const updated = await db.entry.update({
      where: { id },
      data: { isFavorite: !entry.isFavorite },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/journal/${id}`);
    return { success: true, isFavorite: updated.isFavorite };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getDraft() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) {
      throw new Error("User not found");
    }

    const draft = await db.draft.findUnique({
      where: { userId: user.id },
    });

    return { success: true, data: draft };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function saveDraft(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) {
      throw new Error("User not found");
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.map((t) => t.trim().replace(/^#/, "")).filter(Boolean)
      : [];

    const draft = await db.draft.upsert({
      where: { userId: user.id },
      create: {
        title: data.title || "",
        content: data.content || "",
        mood: data.mood || null,
        tags: tags,
        collectionId: data.collectionId || null,
        userId: user.id,
      },
      update: {
        title: data.title,
        content: data.content,
        mood: data.mood,
        tags: tags,
        collectionId: data.collectionId || null,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: draft };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteDraft() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    await db.draft.deleteMany({
      where: { userId: user.id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getDailyWritingGoal() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    return { success: true, dailyGoal: user?.dailyGoal || 300 };
  } catch (error) {
    return { success: false, dailyGoal: 300 };
  }
}

export async function updateDailyWritingGoal(dailyGoal) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    const parsedGoal = Math.max(50, Math.min(5000, Number(dailyGoal) || 300));
    const updated = await db.user.update({
      where: { id: user.id },
      data: { dailyGoal: parsedGoal },
    });

    revalidatePath("/dashboard");
    return { success: true, dailyGoal: updated.dailyGoal };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
