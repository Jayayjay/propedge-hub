import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChallengeStore {
  selectedId: number | null;
  setSelected: (id: number | null) => void;
}

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set) => ({
      selectedId: null,
      setSelected: (id) => set({ selectedId: id }),
    }),
    { name: "propedge.selectedChallenge" },
  ),
);
