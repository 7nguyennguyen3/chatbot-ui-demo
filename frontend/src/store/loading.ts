import { create } from "zustand";

interface LoadingState {
  userThreadLoading: boolean;
  setUserThreadLoading: (loading: boolean) => void;
  createThreadLoading: boolean;
  setCreateThreadLoading: (loading: boolean) => void;
}

const useLoadingStore = create<LoadingState>((set) => ({
  userThreadLoading: false,
  setUserThreadLoading: (userThreadLoading: boolean) =>
    set({ userThreadLoading }),
  createThreadLoading: false,
  setCreateThreadLoading: (createThreadLoading: boolean) =>
    set({ createThreadLoading }),
}));

export default useLoadingStore;
