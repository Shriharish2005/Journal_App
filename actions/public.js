"use server";

import { revalidateTag, unstable_cache } from "next/cache";

export async function getPixabayImage(query) {
  try {
    if (!process.env.PIXABAY_API_KEY) return null;
    const res = await fetch(
      `https://pixabay.com/api/?q=${query}&key=${process.env.PIXABAY_API_KEY}&min_width=1280&min_height=720&image_type=illustration&category=feelings`
    );
    const data = await res.json();
    return data.hits[0]?.largeImageURL || null;
  } catch (error) {
    console.error("Pixabay API Error:", error);
    return null;
  }
}

export const getDailyPrompt = unstable_cache(
  async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch("https://api.adviceslip.com/advice", {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      return data.slip?.advice || "What is one small blessing that made you smile today?";
    } catch (error) {
      return "What is one small blessing that made you smile today?";
    }
  },
  ["daily-prompt"],
  {
    revalidate: 86400,
    tags: ["daily-prompt"],
  }
);

export async function revalidateDailyPrompt() {
  revalidateTag("daily-prompt");
}
