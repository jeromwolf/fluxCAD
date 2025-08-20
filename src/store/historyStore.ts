import { create } from 'zustand'
import { SceneObject } from '@/types/scene'

interface HistoryAction {
  type: 'add' | 'update' | 'delete' | 'clear'
  data: any
  timestamp: number
}

interface HistoryState {
  // 히스토리 스택
  past: HistoryAction[]
  future: HistoryAction[]
  
  // 현재 상태를 히스토리에 추가
  pushAction: (action: HistoryAction) => void
  
  // 실행 취소
  undo: () => HistoryAction | null
  
  // 다시 실행
  redo: () => HistoryAction | null
  
  // 히스토리 초기화
  clearHistory: () => void
  
  // Undo/Redo 가능 여부
  canUndo: () => boolean
  canRedo: () => boolean
}

const MAX_HISTORY_SIZE = 50

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  pushAction: (action) => {
    set((state) => {
      const newPast = [...state.past, action]
      // 최대 크기 제한
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift()
      }
      return {
        past: newPast,
        future: [], // 새 액션이 추가되면 future 초기화
      }
    })
  },

  undo: () => {
    const { past, future } = get()
    if (past.length === 0) return null

    const action = past[past.length - 1]
    set({
      past: past.slice(0, -1),
      future: [action, ...future],
    })
    return action
  },

  redo: () => {
    const { past, future } = get()
    if (future.length === 0) return null

    const action = future[0]
    set({
      past: [...past, action],
      future: future.slice(1),
    })
    return action
  },

  clearHistory: () => {
    set({ past: [], future: [] })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}))