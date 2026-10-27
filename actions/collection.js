"use server";

import { checkUser } from "@/lib/checkUser";
import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCollections() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    user = await checkUser();
  }

  if (!user) {
    return [];
  }

  const collections = await db.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return collections;
}

export async function getCollection(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    const collection = await db.collection.findFirst({
      where: { id, userId: user.id },
    });

    return collection;
  } catch (error) {
    return null;
  }
}

export async function createCollection(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

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
        console.warn("Arcjet warning:", err.message);
      }
    }

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    const collection = await db.collection.create({
      data: {
        name: data.name,
        description: data.description,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    return collection;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateCollection(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    const existingCollection = await db.collection.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingCollection) throw new Error("Collection not found");

    const updated = await db.collection.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/collection/${id}`);
    return updated;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteCollection(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) user = await checkUser();
    if (!user) throw new Error("User not found");

    const collection = await db.collection.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!collection) throw new Error("Collection not found");

    await db.collection.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}
