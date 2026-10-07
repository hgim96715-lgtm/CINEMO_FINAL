"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "@daypicker/react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type CalendarProps = ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, ...props }: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays
      className={cn("w-fit p-1", className)}
      classNames={{
        ...defaultClassNames,
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col", defaultClassNames.months),
        month: cn("space-y-3", defaultClassNames.month),
        month_caption: cn(
          "relative flex h-8 items-center justify-center",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "pointer-events-none inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm font-semibold text-cinemo-text",
          defaultClassNames.caption_label,
        ),
        dropdowns: cn(
          "relative z-10 inline-flex items-center gap-2",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative inline-flex items-center",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none opacity-0",
          defaultClassNames.dropdown,
        ),
        months_dropdown: cn(
          "min-w-14",
          defaultClassNames.months_dropdown,
        ),
        years_dropdown: cn(
          "min-w-20",
          defaultClassNames.years_dropdown,
        ),
        nav: cn(
          "absolute inset-x-0 flex items-center justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "flex size-8 items-center justify-center rounded-lg text-cinemo-muted transition hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light disabled:pointer-events-none disabled:opacity-30",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "flex size-8 items-center justify-center rounded-lg text-cinemo-muted transition hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light disabled:pointer-events-none disabled:opacity-30",
          defaultClassNames.button_next,
        ),
        month_grid: cn("w-full border-separate border-spacing-y-1", defaultClassNames.month_grid),
        weekdays: cn("grid grid-cols-7", defaultClassNames.weekdays),
        weekday: cn(
          "w-8 text-center text-[11px] font-normal text-cinemo-muted",
          defaultClassNames.weekday,
        ),
        week: cn("grid grid-cols-7", defaultClassNames.week),
        day: cn("p-0 text-center", defaultClassNames.day),
        day_button: cn(
          "mx-auto flex size-8 items-center justify-center rounded-lg text-xs font-normal text-cinemo-text transition hover:bg-cinemo-gold/15 hover:text-cinemo-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinemo-gold/40",
          defaultClassNames.day_button,
        ),
        selected: cn(
          "[&>button]:bg-cinemo-gold [&>button]:font-semibold [&>button]:text-cinemo-bg [&>button]:hover:bg-cinemo-gold-light",
          defaultClassNames.selected,
        ),
        today: cn(
          "[&>button]:bg-white/10 [&>button]:text-cinemo-gold-light",
          defaultClassNames.today,
        ),
        outside: cn(
          "[&>button]:text-white/20 [&>button]:opacity-50",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "[&>button]:pointer-events-none [&>button]:opacity-20",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) =>
          orientation === "down" ? (
            <ChevronDown className={cn("size-4", chevronClassName)} />
          ) : orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClassName)} />
          ) : (
            <ChevronRight className={cn("size-4", chevronClassName)} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
