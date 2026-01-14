import { create } from 'zustand';
import { householdsService, Household } from '../services/households.service';
import { parseApiError } from '../services/api';

interface HouseholdsState {
  households: Household[];
  selectedHousehold: Household | null;
  loading: boolean;
  error: string | null;
  fetchHouseholds: () => Promise<void>;
  selectHousehold: (id: string) => Promise<void>;
  createHousehold: (data: Partial<Household>) => Promise<void>;
  updateHousehold: (id: string, data: Partial<Household>) => Promise<void>;
  deleteHousehold: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useHouseholdsStore = create<HouseholdsState>((set, get) => ({
  households: [],
  selectedHousehold: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchHouseholds: async () => {
    set({ loading: true, error: null });
    try {
      const households = await householdsService.getHouseholds();
      set({ households, loading: false });
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      set({
        error: apiError.message,
        loading: false,
      });
    }
  },

  selectHousehold: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const household = await householdsService.getHousehold(id);
      set({ selectedHousehold: household, loading: false });
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      set({
        error: apiError.message,
        loading: false,
      });
    }
  },

  createHousehold: async (data: Partial<Household>) => {
    set({ loading: true, error: null });
    try {
      await householdsService.createHousehold(data);
      await get().fetchHouseholds();
      set({ loading: false });
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      set({
        error: apiError.message,
        loading: false,
      });
      throw error;
    }
  },

  updateHousehold: async (id: string, data: Partial<Household>) => {
    set({ loading: true, error: null });
    try {
      await householdsService.updateHousehold(id, data);
      await get().fetchHouseholds();
      set({ loading: false });
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      set({
        error: apiError.message,
        loading: false,
      });
      throw error;
    }
  },

  deleteHousehold: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await householdsService.deleteHousehold(id);
      await get().fetchHouseholds();
      set({ loading: false });
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      set({
        error: apiError.message,
        loading: false,
      });
      throw error;
    }
  },
}));
