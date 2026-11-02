"use client";

type HeroCarouselIndicatorsProps = {
  postcardIds: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function HeroCarouselIndicators({
  postcardIds,
  activeIndex,
  onSelect,
}: HeroCarouselIndicatorsProps) {
  const indicators = postcardIds.map((id, index) => ({
    key: id,
    label: `${index + 1}번째 엽서 보기`,
    index,
  }));

  return (
    <div className="flex shrink-0 justify-end gap-2">
      {indicators.map((indicator) => {
        const isActive = indicator.index === activeIndex;

        return (
          <button
            key={indicator.key}
            type="button"
            aria-label={indicator.label}
            aria-current={isActive}
            onClick={() => onSelect(indicator.index)}
            className={`h-2 rounded-full transition-all ${
              isActive ? "w-8 bg-cinemo-gold" : "w-2 bg-white/40"
            }`}
          />
        );
      })}
    </div>
  );
}
