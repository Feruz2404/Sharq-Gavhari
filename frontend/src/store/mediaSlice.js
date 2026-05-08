// Zustand store slice for tracking image upload state per UploadId.
// Ephemeral only — never persisted to localStorage.
import { create } from 'zustand'

export const useMediaStore = create((set) => ({
  uploads: {}, // { [uploadId]: { stage, progress, error, result } }

  setStage: (id, stage) => set((s) => ({
    uploads: { ...s.uploads, [id]: { ...(s.uploads[id] || {}), stage } },
  })),
  setProgress: (id, progress) => set((s) => ({
    uploads: { ...s.uploads, [id]: { ...(s.uploads[id] || {}), progress } },
  })),
  setError: (id, error) => set((s) => ({
    uploads: { ...s.uploads, [id]: { ...(s.uploads[id] || {}), stage: 'failed', error } },
  })),
  setResult: (id, result) => set((s) => ({
    uploads: { ...s.uploads, [id]: { ...(s.uploads[id] || {}), stage: 'done', result } },
  })),
  reset: (id) => set((s) => {
    const next = { ...s.uploads }
    delete next[id]
    return { uploads: next }
  }),
}))
