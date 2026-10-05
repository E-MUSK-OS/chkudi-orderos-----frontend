import { create } from 'zustand';

interface ConnectionState {
  isOffline: boolean;
  isBackendDown: boolean;
  setOffline: (status: boolean) => void;
  setBackendDown: (status: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isOffline: false,
  isBackendDown: false,
  setOffline: (status) => set({ isOffline: status }),
  setBackendDown: (status) => set({ isBackendDown: status }),
}));
