import "server-only";

import { cache } from "react";
import { getMovie } from "./movies";

export const getCachedMovie = cache((movieId: string) => getMovie(movieId));
