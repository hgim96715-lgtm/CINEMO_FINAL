import {NestFactory} from "@nestjs/core";
import {BatchAppModule} from "@/batch-app.module";
import {MovieRankingSyncService} from "@/modules/movies/movie-ranking-sync.service";
import {Logger} from "@nestjs/common";

const getYesterdaySeoulDate = (): string => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(
    parts.find((part) => part.type === "year")?.value,
  );
  const month = Number(
    parts.find((part) => part.type === "month")?.value,
  );
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const yesterday = new Date(Date.UTC(year, month - 1, day - 1));

  return yesterday.toISOString().slice(0, 10).replaceAll("-", "");
};

const logger = new Logger("MovieRankingSync");

async function bootstrap(){
  const app=await NestFactory.createApplicationContext(BatchAppModule);
  try{
    const movieRankingSyncService=app.get(MovieRankingSyncService);
    const targetDate=getYesterdaySeoulDate();
    await movieRankingSyncService.run(targetDate);
  }finally{
    await app.close();
  }
}

bootstrap ()
.then (() => process.exit (0))
.catch (( error ) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error(`[FATAL] ${message}`, stack);
  process.exit (1);
});
