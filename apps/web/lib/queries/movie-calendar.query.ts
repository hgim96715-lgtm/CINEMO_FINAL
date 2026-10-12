import {getMovieCalendar, MovieCalendarParams} from "@/lib/api/movies";
import {queryOptions} from "@tanstack/react-query";

export const movieCalendarQueryOptions=(params:MovieCalendarParams)=>queryOptions({
  queryKey:['my-cinema','calendar',params.year,params.month],
  queryFn:({signal})=>getMovieCalendar(params,signal),
  enabled:params.year>0&& params.month>=1 && params.month<=12,
  staleTime:5*60_000,
})