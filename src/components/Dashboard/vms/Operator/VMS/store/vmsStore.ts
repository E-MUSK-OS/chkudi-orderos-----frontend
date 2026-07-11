import { create } from "zustand";

import type {
  CameraState,
  RecordingState,
  SessionState,
  UploadState,
  ScanItem,
  NetworkState,
  ScannerState,
  VMSStore,
} from "../types/vms.types";

const initialState = {
  camera: {
    connected: false,
    permission: false,
    deviceName: "",
  },

  recording: {
    isRecording: false,
    trackingId: null,
    duration: 0,
    blob: null,
    startedAt: null,
  },

  session: {
    sessionId: null,
    operatorName: "",
    shift: "",
    isActive: false,
  },

  uploads: {
    pending: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
  },

  uploadQueue: [],

  scans: [],

  network: {
    online: true,
  },

  scanner: {
    connected: false,
    lastScan: null,
  },
};

export const useVMSStore = create<VMSStore>((set) => ({
  ...initialState,

  setCamera: (camera) =>
    set((state) => ({
      camera: {
        ...state.camera,
        ...camera,
      },
    })),

  setRecording: (recording) =>
    set((state) => ({
      recording: {
        ...state.recording,
        ...recording,
      },
    })),

  setSession: (session) =>
    set((state) => ({
      session: {
        ...state.session,
        ...session,
      },
    })),

  setUploads: (uploads) =>
    set((state) => ({
      uploads: {
        ...state.uploads,
        ...uploads,
      },
    })),

  setNetwork: (network) =>
    set((state) => ({
      network: {
        ...state.network,
        ...network,
      },
    })),

  setScanner: (scanner) =>
    set((state) => ({
      scanner: {
        ...state.scanner,
        ...scanner,
      },
    })),

  addScan: (scan) =>
    set((state) => ({
      scans: [scan, ...state.scans].slice(0, 50),
    })),

  addUpload: (item) =>
    set((state) => ({
      uploadQueue: [item, ...state.uploadQueue],
    })),

  updateUpload: (id, data) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id
          ? {
              ...item,
              ...data,
            }
          : item,
      ),
    })),

  removeUpload: (id) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((item) => item.id !== id),
    })),

  reset: () => set(initialState),
}));
