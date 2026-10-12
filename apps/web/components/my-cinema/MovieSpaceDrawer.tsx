"use client";

import {useState} from "react";
import {ChevronDown} from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const tabs = [
  { value: "watched", label: "본 영화" },
  { value: "calendar", label: "달력" },
  { value: "saved", label: "찜한 영화" },
  { value: "postcards", label: "엽서" },
] as const;

export type MovieSpaceTab = (typeof tabs)[number]["value"];

type MovieSpaceOptionProps = {
  label: string;
  count?: number;
  selected: boolean;
  onSelect: () => void;
};

function MovieSpaceOption({
  label,
  count,
  selected,
  onSelect,
}: MovieSpaceOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
        selected
          ? "border-cinemo-gold/60 bg-cinemo-gold/10 text-cinemo-gold"
          : "border-white/10 bg-white/3 text-white/75 hover:border-white/25 hover:text-white"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="text-sm opacity-60">{count}</span>
      )}
    </button>
  );
}

type MovieSpaceDrawerProps = {
  activeTab: MovieSpaceTab;
  onChange: (tab: MovieSpaceTab) => void;
  counts?: Partial<Record<MovieSpaceTab, number>>;
};

export function MovieSpaceDrawer({
  activeTab,
  onChange,
  counts = {},
}: MovieSpaceDrawerProps) {
  const [open, setOpen] = useState(false);
  const currentTab =
    tabs.find((tab) => tab.value === activeTab) ?? tabs[0];

  const handleChange = (tab: MovieSpaceTab) => {
    onChange(tab);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white transition hover:border-cinemo-gold/50"
          />
        }
      >
        {currentTab.label}
        <ChevronDown className="size-4" />
      </DrawerTrigger>

      <DrawerContent className="border-white/10 bg-[#101f21] text-white">
        <DrawerHeader>
          <DrawerTitle className="text-white">내 영화</DrawerTitle>
          <DrawerDescription className="text-cinemo-muted">
            보고 싶은 영화와 감상 기록을 선택
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-2 px-4 pb-6">
          {tabs.map((tab) => (
            <MovieSpaceOption
              key={tab.value}
              label={tab.label}
              count={counts[tab.value]}
              selected={tab.value === activeTab}
              onSelect={() => handleChange(tab.value)}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
