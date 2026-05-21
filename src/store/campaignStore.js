import { create } from 'zustand';

export const useCampaignStore = create((set) => ({
  // Campaign creation wizard state
  step: 1,
  selectedTemplate: null,
  csvData: [],
  csvStats: null,
  resumeFile: null,
  credentials: { email: '', appPassword: '' },
  senderInfo: { name: '', skills: '', portfolio: '', linkedin: '', experience: '' },

  // Actions
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 6) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setCsvData: (data) => set({ csvData: data }),
  setCsvStats: (stats) => set({ csvStats: stats }),
  setResumeFile: (file) => set({ resumeFile: file }),
  setCredentials: (creds) => set((state) => ({
    credentials: { ...state.credentials, ...creds },
  })),
  setSenderInfo: (info) => set((state) => ({
    senderInfo: { ...state.senderInfo, ...info },
  })),

  // Reset wizard
  resetWizard: () => set({
    step: 1,
    selectedTemplate: null,
    csvData: [],
    csvStats: null,
    resumeFile: null,
    credentials: { email: '', appPassword: '' },
    senderInfo: { name: '', skills: '', portfolio: '', linkedin: '', experience: '' },
  }),
}));
