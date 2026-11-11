type LobbyCollectionSkeletonProps = {
  eyebrow: string;
  title: string;
  cards?: number;
  showDate?: boolean;
  posterWidthClassName?: string;
};

/** 실제 컬렉션과 같은 높이를 먼저 확보해, 데이터 도착 시 화면이 밀리지 않게 함. */
export function LobbyCollectionSkeleton({
  eyebrow,
  title,
  cards = 5,
  showDate = false,
  posterWidthClassName = "w-30 sm:w-36 max-sm:w-[42vw]",
}: LobbyCollectionSkeletonProps) {
  return (
    <section
      aria-busy="true"
      aria-label={`${title} 불러오는 중`}
      className="mt-12 sm:mt-16"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs tracking-[0.24em] text-cinemo-gold/75">
            {eyebrow}
          </p>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {title}
          </h2>
        </div>
        <span aria-hidden className="cinemo-skeleton h-5 w-14 rounded-full" />
      </div>

      <ol aria-hidden className="flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: cards }, (_, index) => (
          <li key={index} className={`${posterWidthClassName} shrink-0`}>
            <div className="cinemo-skeleton aspect-2/3 rounded-2xl" />
            <div className="mt-3 space-y-2">
              <div className="cinemo-skeleton h-4 w-4/5 rounded-full" />
              {showDate && <div className="cinemo-skeleton h-3 w-3/5 rounded-full" />}
            </div>
          </li>
        ))}
      </ol>
      <span className="sr-only">영화 목록을 불러오는 중</span>
    </section>
  );
}
