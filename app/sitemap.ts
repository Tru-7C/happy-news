import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://happy-news-two.vercel.app",
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}