"use client";

import {useQuery} from "@tanstack/react-query";
import {movieCalendarQueryOptions} from "@/lib/queries/movie-calendar.query";
import type {MovieCalendarDay, MovieCalendarMovie} from "@/lib/api/movies";
import type {DayButtonProps} from "@daypicker/react";
import {cn} from "@/lib/utils";
import {Calendar} from "@/components/ui/calendar";
import {ko} from "@daypicker/react/locale";
import {useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from "@/components/ui/drawer";

const seoulDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const formatDateKey=(date:Date)=>{
  const parts=seoulDateFormatter.formatToParts(date);
  const year=parts.find((part)=>part.type==='year')?.value??'';
  const month=parts.find((part)=>part.type==='month')?.value??'';
  const day=parts.find((part)=>part.type==='day')?.value??'';
  return `${year}-${month}-${day}`;
}


export function MovieCalendar(){
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<MovieCalendarDay | null>(null);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const calendarQuery=useQuery(movieCalendarQueryOptions({year,month}));
  const moviesByDate=new Map<string,MovieCalendarDay['movies']>((calendarQuery.data??[]).map((day)=>[day.date,day.movies]))
  const MovieDayButton=(props:DayButtonProps) => {
    const {day,modifiers,className,...buttonProps} = props;
    const dateKey=formatDateKey(day.date);
    const movies=moviesByDate.get(dateKey)??[];
    
    return (
        <button
            {...buttonProps}
            className={cn(
                className,
                "group h-auto min-h-16 w-full flex-col justify-start gap-1 rounded-lg bg-transparent p-1 !text-cinemo-text hover:!bg-transparent focus:!bg-transparent focus-visible:!bg-transparent focus-visible:!text-cinemo-text focus-visible:!outline-none focus-visible:!ring-0",
            )}>
          <span
            className={cn(
              "relative z-10 flex size-8 items-center justify-center rounded-lg text-xs font-normal transition",
              modifiers.selected
                ? "bg-cinemo-gold text-cinemo-bg"
                : modifiers.today
                  ? "bg-white/10 text-cinemo-gold-light"
                  : "group-hover:bg-cinemo-gold/15 group-hover:text-cinemo-gold-light",
            )}
          >
            {day.date.getDate()}
          </span>
          {movies.length > 0 && (
              <span className="flex items-center justify-center">
            {movies.slice(0, 1).map((movie) => (
                <span key={movie.movieId} className="relative">
                  <MoviePoster
                    movie={movie}
                    className="h-10 w-7 sm:h-12 sm:w-8"
                  />
                  {movies.length > 1 && (
                    <span className="absolute -bottom-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-cinemo-gold px-1 text-[9px] font-semibold leading-4 text-cinemo-bg">
                      +{movies.length - 1}
                    </span>
                  )}
                </span>
            ))}
          </span>)}
        </button>
    );
  };
  return (
    <>
      <section className='rounded-2xl bg-[#101f21] p-4'>
        <Calendar
            mode="single"
            locale={ko}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            captionLayout="dropdown"
            navLayout="around"
            startMonth={new Date(new Date().getFullYear() - 100, 0, 1)}
            endMonth={new Date()}
            showOutsideDays
            selected={selectedDay ? new Date(`${selectedDay.date}T00:00:00`) : undefined}
            onSelect={(date) => {
              if (!date) {
                setSelectedDay(null);
                return;
              }

              const dateKey = formatDateKey(date);
              const movies = moviesByDate.get(dateKey) ?? [];

              setSelectedDay(
                movies.length > 0
                  ? {date: dateKey, movies}
                  : null,
              );
            }}
            className="mx-auto w-full"
            classNames={{
              month: "relative space-y-3",
              month_caption:
                "relative flex h-10 items-center justify-center px-12 sm:px-20",
              dropdowns:
                "relative z-10 inline-flex flex-nowrap items-center justify-center gap-2",
              years_dropdown:
                "min-w-20 whitespace-nowrap",
              months_dropdown:
                "min-w-16 whitespace-nowrap",
              caption_label:
                "pointer-events-none inline-flex min-w-16 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm font-semibold text-cinemo-text",
              today:
                "[&>button]:!bg-transparent [&>button]:!text-cinemo-text",
              selected:
                "[&>button]:!bg-transparent [&>button]:!text-cinemo-text [&>button]:!font-normal",
              button_previous:
                "absolute left-2 top-1 z-20 flex size-8 items-center justify-center rounded-lg text-cinemo-gold transition hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light disabled:pointer-events-none disabled:opacity-30",
              button_next:
                "absolute right-2 top-1 z-20 flex size-8 items-center justify-center rounded-lg !text-cinemo-gold transition hover:bg-cinemo-gold/10 hover:!text-cinemo-gold-light disabled:pointer-events-none disabled:!text-cinemo-gold/40",
              chevron:
                "size-4 !text-cinemo-gold stroke-cinemo-gold",
            }}
            components={{DayButton: MovieDayButton}}
        />
        {calendarQuery.isPending&&(
            <p className='mt-3 text-center text-xs text-cinemo-muted'>관람 기록을 불러오는 중...</p>
        )}
      </section>

      <Drawer
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDay(null);
          }
        }}
      >
        <DrawerContent className="border-white/10 bg-[#101f21] px-4 pb-6 text-cinemo-text">
          {selectedDay && (
            <>
              <DrawerHeader className="px-0 pb-3">
                <DrawerTitle className="text-base text-cinemo-gold-light">
                  {selectedDay.date.replaceAll("-", ".")} 관람 영화
                </DrawerTitle>
                <DrawerDescription className="text-cinemo-muted">
                  {selectedDay.movies.length}편의 영화 관람 기록이 있습니다.
                </DrawerDescription>
              </DrawerHeader>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedDay.movies.map((movie) => (
                  <Link
                    key={movie.movieId}
                    href={`/movies/${movie.movieId}`}
                    className="flex min-w-0 items-center gap-2 rounded-xl bg-white/3 p-2"
                  >
                    <MoviePoster movie={movie} />
                    <span className="line-clamp-2 text-xs text-cinemo-text">
                      {movie.title}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

function MoviePoster({
  movie,
  className = "h-12 w-8",
}: {
  movie: MovieCalendarMovie;
  className?: string;
}){
  if(!movie.posterUrl){
    return(
      <span
        className={cn("block aspect-[2/3] shrink-0 rounded bg-white/10", className)}
        aria-label={`${movie.title} 포스터 없음`}
      />
    )
  }
  return (
      <Image
        src={movie.posterUrl}
        alt={movie.title}
        width={28}
        height={40}
        className={cn(
          "block aspect-[2/3] shrink-0 rounded object-cover",
          className,
        )}
      />
  )
}
