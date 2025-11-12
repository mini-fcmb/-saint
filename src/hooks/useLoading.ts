// src/hooks/useLoading.ts
import { create } from 'zustand';

interface LoadingState {
  count: number;
  isLoading: boolean;
  /** Set loading state directly (true/false) */
  setLoading: (value: boolean) => void;
  /** Increase loading count (for multiple async tasks) */
  increment: () => void;
  /** Decrease loading count */
  decrement: () => void;
}

export const useLoading = create<LoadingState>((set) => ({
  count: 0,
  isLoading: false,

  setLoading: (value: boolean) =>
    set({
      isLoading: value,
      count: value ? 1 : 0,
    }),

  increment: () =>
    set((state) => ({
      count: state.count + 1,
      isLoading: true,
    })),

  decrement: () =>
    set((state) => {
      const newCount = Math.max(0, state.count - 1);
      return {
        count: newCount,
        isLoading: newCount > 0,
      };
    }),
}));