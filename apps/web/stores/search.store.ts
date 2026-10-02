import { create } from "zustand";

type SearchStore = {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

export const useSearchStore = create<SearchStore>((set) => ({
  isSearchOpen: false,

  openSearch: () => {
    set({ isSearchOpen: true });
  },

  closeSearch: () => {
    set({ isSearchOpen: false });
  },
}));
