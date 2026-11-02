export type CommemorativeCuration = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  startMonthDay: string;
  endMonthDayExclusive: string;
  movieTitles: string[];
  movieReasons: Record<string, string>;
};

export const COMMEMORATIVE_CURATIONS: CommemorativeCuration[] = [
  {
    slug: "student-independence-movement-day",
    eyebrow: "11월 3일 학생독립운동 기념일",
    title: "붓 대신 들었던 함성, 11월 3일을 기억하며",
    description:
      "일제강점기, 학생들이 거리로 나와 자유를 외쳤던 날을 기억하는 영화",
    startMonthDay: "11-02",
    endMonthDayExclusive: "11-04",
    movieTitles: ["동주", "박열", "항거"],
    movieReasons: {
      동주: "시와 글로 시대의 어둠에 맞선 윤동주와 송몽규의 이야기",
      박열: "일제에 맞선 박열과 가네코 후미코의 뜨거운 저항",
      항거: "서대문형무소에서 끝까지 저항한 유관순의 이야기",
    },
  },
  {
    slug: "firefighters-day",
    eyebrow: "11월 9일 소방의 날",
    title: "불길 속으로 걸어간 사람들을 기억하며",
    description:
      "화재와 재난 현장에서 사람들을 지켜온 소방관들의 노고를 기억하는 영화",
    startMonthDay: "11-08",
    endMonthDayExclusive: "11-10",
    movieTitles: ["소방관", "엑시트", "타워"],
    movieReasons: {
      소방관: "누군가의 오늘을 지키기 위해 위험 속으로 뛰어든 사람들의 이야기",
      엑시트: "재난 속에서 서로를 구하며 끝까지 탈출구를 찾는 이야기",
      타워: "초고층 화재 속에서 사람들을 살리기 위해 고군분투하는 사람들의 이야기",
    },
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

export function getCommemorativeMovieReason(
  curation: CommemorativeCuration | undefined,
  title: string,
) {
  return curation?.movieReasons[title] ?? null;
}
