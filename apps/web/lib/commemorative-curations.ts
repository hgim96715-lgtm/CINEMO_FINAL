export type CommemorativeCuration = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  startMonthDay: string;
  endMonthDayExclusive: string;
  movieTitles: string[];
};

export const COMMEMORATIVE_CURATIONS: CommemorativeCuration[] = [
  {
    slug: "student-independence-movement-day",
    eyebrow: "11월 3일 학생독립운동 기념일",
    title: "학생독립운동 기념일에 함께 보는 영화",
    description:
      "일제강점기 학생들의 독립운동 정신을 기억하는 영화",
    startMonthDay: "11-02",
    endMonthDayExclusive: "11-04",
    movieTitles: ["동주", "박열", "항거"],
  },
  {
    slug: "firefighters-day",
    eyebrow: "11월 9일 소방의 날",
    title: "소방의 날, 기억하고 감사하는 영화",
    description:
      "화재와 재난 현장에서 사람들을 지켜온 소방관들의 노고를 기억하는 영화",
    startMonthDay: "11-08",
    endMonthDayExclusive: "11-10",
    movieTitles: ["소방관", "엑시트", "타워"],
  },
];

function getSeoulMonthDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${month}-${day}`;
}

export function getActiveCommemorativeCuration(date = new Date()) {
  const monthDay = getSeoulMonthDay(date);

  return COMMEMORATIVE_CURATIONS.find(
    (curation) =>
      monthDay >= curation.startMonthDay &&
      monthDay < curation.endMonthDayExclusive,
  );
}
