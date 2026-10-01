import type { MovieResponse } from "@cinemo/api-contract";

export async function getMovie(
  movieId: string,
): Promise<MovieResponse | null> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3050";

  const response = await fetch(`${apiUrl}/v1/movies/${movieId}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<MovieResponse>;
}
