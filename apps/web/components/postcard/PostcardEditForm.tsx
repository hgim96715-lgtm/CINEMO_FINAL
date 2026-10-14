"use client";

import { PostcardCreateForm } from "@/components/postcard/PostcardCreateForm";
import type { Postcard } from "@/lib/api/postcards";
import { useQuery } from "@tanstack/react-query";
import { movieDetailQueryOptions } from "@/lib/queries/movie-detail.query";

type PostcardEditFormProps = {
  postcard: Postcard;
};

export function PostcardEditForm({ postcard }: PostcardEditFormProps) {
  const movieQuery = useQuery(movieDetailQueryOptions(postcard.movieId));
  const movie = movieQuery.data;

  const poster =
    movie?.media.find(
      (media) => media.mediaType === "POSTER" && media.isPrimary,
    ) ?? movie?.media.find((media) => media.mediaType === "POSTER");

  const backdrop =
    movie?.media.find(
      (media) => media.mediaType === "BACKDROP" && media.isPrimary,
    ) ?? movie?.media.find((media) => media.mediaType === "BACKDROP");

  const background = backdrop ?? poster;

  return (
    <PostcardCreateForm
      movieId={postcard.movieId}
      movieTitle={movie?.titles[0]?.title ?? postcard.movie?.title ?? "영화"}
      backgroundUrl={background?.url ?? postcard.movie?.posterUrl}
      backgroundType={backdrop ? "BACKDROP" : "POSTER"}
      postcard={postcard}
    />
  );
}
