import type { DailyMovieWeatherGrid } from "@cinemo/shared/daily-movie-push";

const seoulTime = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", hourCycle: "h23",
});

type Weather = "rain" | "cold" | "snow";
let weatherHour: string | undefined;
const weatherCache = new Map<string, Promise<Weather | undefined>>();

async function readWeather(now: Date, key: string, grid: DailyMovieWeatherGrid): Promise<Weather | undefined> {
  // Use the previous observation until the latest hourly report is available.
  const [day, hour] = seoulTime.format(new Date(now.getTime() - 15 * 60_000)).split(" ");
  const query = new URLSearchParams({
    serviceKey: key, dataType: "JSON", numOfRows: "20",
    base_date: day.replace(/-/g, ""), base_time: hour + "00", nx: String(grid.nx), ny: String(grid.ny),
  });
  try {
    const response = await fetch(`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?${query}`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return;
    const data = await response.json() as {
      response?: { body?: { items?: { item?: { category: string; obsrValue: string }[] } } };
    };
    const rows = data.response?.body?.items?.item ?? [];
    const precipitation = rows.find(({ category }) => category === "PTY")?.obsrValue;
    if (["2", "3", "6", "7"].includes(String(precipitation))) return "snow";
    if (["1", "4", "5"].includes(String(precipitation))) return "rain";
    const temperature = rows.find(({ category }) => category === "T1H")?.obsrValue;
    if (temperature != null && String(temperature).trim() && Number(temperature) <= 8) return "cold";
  } catch {
    // Recommendations still use the time of day when weather is unavailable.
  }
}

export async function dailyMovieContext(now: Date, grid?: DailyMovieWeatherGrid) {
  const hour = seoulTime.format(now).split(" ")[1];
  const key = process.env.KMA_WEATHER_SERVICE_KEY;
  if (key && grid) {
    const bucket = seoulTime.format(new Date(now.getTime() - 15 * 60_000));
    if (weatherHour !== bucket) {
      weatherCache.clear();
      weatherHour = bucket;
    }
    const cell = `${grid.nx},${grid.ny}`;
    let pending = weatherCache.get(cell);
    if (!pending && weatherCache.size < 512) {
      pending = readWeather(now, key, grid);
      weatherCache.set(cell, pending);
    }
    const weather = await pending;
    if (weather === "rain") return { headline: "☔ 비 오는 날, 영화 한 편", genres: ["드라마", "로맨스", "미스터리"], weather: true };
    if (weather === "snow") return { headline: "❄️ 눈 오는 날, 영화 한 편", genres: ["가족", "판타지", "로맨스"], weather: true };
    if (weather === "cold") return { headline: "🧣 쌀쌀한 날, 이 영화 어때요?", genres: ["코미디", "가족", "로맨스"], weather: true };
  }
  if (Number(hour) >= 21 || Number(hour) < 6) return { headline: "🌙 늦은 밤, 이 영화 어때요?", genres: ["미스터리", "스릴러", "드라마"], weather: false };
  if (Number(hour) >= 18) return { headline: "🍿 저녁에 보기 좋은 영화 한 편", genres: ["코미디", "드라마", "로맨스"], weather: false };
  return { headline: "🎬 오늘 시간 나면 이 영화 어때요?", genres: ["모험", "코미디", "애니메이션"], weather: false };
}
