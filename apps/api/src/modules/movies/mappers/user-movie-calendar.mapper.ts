type CalendarMovie = {
  movieId: string;
  title: string;
  posterUrl: string | null;
  genres: string[];
};

type CalendarDay = {
  date: string;
  movies: CalendarMovie[];
};

type CalendarRecord={
  watchedAt:Date|null;
  movie:{
    id:string;
    titles:Array<{title:string;}>
    media:Array<{url:string;}>
    movieGenres:Array<{name:string;}>
  }
};

export function toUserMovieCalendarResponse(records:CalendarRecord[]):CalendarDay[]{
  const calendar=new Map<string,CalendarDay>();
  
  for (const record of records){
    if(!record.watchedAt) continue;
    const date=record.watchedAt.toISOString().slice(0,10);
    const day=calendar.get(date)?? {date,movies:[]};
    
    day.movies.push({
      movieId: record.movie.id,
      title: record.movie.titles[0]?.title ?? "",
      posterUrl: record.movie.media[0]?.url ?? null,
      genres: record.movie.movieGenres.map((genre) => genre.name),
    });
    calendar.set(date,day);
  }
  return Array.from(calendar.values());
  
}