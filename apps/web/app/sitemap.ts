import type { MetadataRoute } from "next";

type SitemapMovie = {
  id: string;
  updatedAt?: string;
};

type SitemapResponse = {
  items: SitemapMovie[];
};

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3051";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3050";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/lobby`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...[
      "/lobby/movies",
      "/lobby/movies/upcoming",
      "/lobby/movies/released",
      "/lobby/movies/platform",
      "/lobby/movies/commemorative",
      "/lobby/postcards",
      "/lobby/lists",
      "/lobby/cinemas",
    ].map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
  const response = await fetch(`${apiUrl}/v1/movies/sitemap`, {
    next: { revalidate: 3600 },
  });

  const data: SitemapResponse = response.ok
    ? await response.json()
    : { items: [] };

  const dynamicRoutes: MetadataRoute.Sitemap = data.items.map((movie) => ({
    url: `${siteUrl}/movies/${movie.id}`,
    lastModified: movie.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
