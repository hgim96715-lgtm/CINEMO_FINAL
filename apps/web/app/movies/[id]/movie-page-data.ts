import { cache } from "react";

import { getMovie } from "../../../lib/api/movies";

export const getMovieForPage = cache((movieId: string) => getMovie(movieId));
