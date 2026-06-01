import { create } from 'zustand'
import { VideoMetadata, ChatMessage, Citation } from './types'

interface AppState {
  urlA: string
  urlB: string
  setUrlA: (url: string) => void
  setUrlB: (url: string) => void
  isProcessing: boolean
  processingError: string | null
  sessionId: string | null
  videoA: VideoMetadata | null
  videoB: VideoMetadata | null
  setProcessingResult: (sessionId: string, videoA: VideoMetadata, videoB: VideoMetadata) => void
  setProcessingError: (error: string) => void
  setIsProcessing: (val: boolean) => void
  messages: ChatMessage[]
  isStreaming: boolean
  addUserMessage: (text: string) => string
  addAssistantMessage: () => string
  appendToken: (id: string, token: string) => void
  finalizeMessage: (id: string, citations: Citation[]) => void
  setIsStreaming: (val: boolean) => void
  activeTab: 'setup' | 'compare' | 'chat'
  setActiveTab: (tab: 'setup' | 'compare' | 'chat') => void
}

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

export const useAppStore = create<AppState>((set) => ({
  urlA: '',
  urlB: '',
  setUrlA: (url) => set({ urlA: url }),
  setUrlB: (url) => set({ urlB: url }),

  isProcessing: false,
  processingError: null,
  sessionId: null,
  videoA: null,
  videoB: null,
  setProcessingResult: (sessionId, videoA, videoB) =>
    set({
      sessionId,
      videoA,
      videoB,
      processingError: null,
      messages: []
    }),
  setProcessingError: (error) => set({ processingError: error }),
  setIsProcessing: (val) => set({ isProcessing: val }),

  messages: [],
  isStreaming: false,
  addUserMessage: (text) => {
    const id = makeId()
    set((state) => ({
      messages: [...state.messages, { id, role: 'user', content: text }]
    }))
    return id
  },
  addAssistantMessage: () => {
    const id = makeId()
    set((state) => ({
      messages: [...state.messages, { id, role: 'assistant', content: '', citations: [], isStreaming: true }]
    }))
    return id
  },
  appendToken: (id, token) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + token } : m
      )
    })),
  finalizeMessage: (id, citations) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, citations, isStreaming: false } : m
      )
    })),
  setIsStreaming: (val) => set({ isStreaming: val }),

  activeTab: 'setup',
  setActiveTab: (tab) => set({ activeTab: tab })
}))
