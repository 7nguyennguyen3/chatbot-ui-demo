import { create } from "zustand";

interface UserState {
  userId: string | null;
  setUserId: (userId: string | null) => void;
  userName: string | null;
  setUserName: (userName: string | null) => void;
  userEmail: string | null;
  setUserEmail: (userEmail: string | null) => void;
}

const useUserStore = create<UserState>((set) => ({
  userId: "",
  setUserId: (userId: string | null) => set({ userId }),
  userName: "",
  setUserName: (userName: string | null) => set({ userName }),
  userEmail: "",
  setUserEmail: (userEmail: string | null) => set({ userEmail }),
}));

export default useUserStore;
