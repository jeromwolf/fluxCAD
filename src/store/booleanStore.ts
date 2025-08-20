import { create } from 'zustand'
import { BooleanOperation, BooleanOperationType } from '@/types/boolean'
import { v4 as uuidv4 } from 'uuid'

interface BooleanState {
  // 선택된 객체들 (Boolean 연산을 위한)
  selectedObjectIds: string[]
  
  // Boolean 연산 모드
  operationMode: BooleanOperationType | null
  
  // 연산 히스토리
  operations: BooleanOperation[]
  
  // 액션들
  setSelectedObjects: (ids: string[]) => void
  addSelectedObject: (id: string) => void
  removeSelectedObject: (id: string) => void
  clearSelection: () => void
  
  setOperationMode: (mode: BooleanOperationType | null) => void
  
  addOperation: (operation: Omit<BooleanOperation, 'id' | 'timestamp'>) => void
  getLatestOperation: () => BooleanOperation | null
}

export const useBooleanStore = create<BooleanState>((set, get) => ({
  selectedObjectIds: [],
  operationMode: null,
  operations: [],

  setSelectedObjects: (ids) => {
    set({ selectedObjectIds: ids })
  },

  addSelectedObject: (id) => {
    set((state) => {
      if (state.selectedObjectIds.includes(id)) {
        return state
      }
      return {
        selectedObjectIds: [...state.selectedObjectIds, id]
      }
    })
  },

  removeSelectedObject: (id) => {
    set((state) => ({
      selectedObjectIds: state.selectedObjectIds.filter(objId => objId !== id)
    }))
  },

  clearSelection: () => {
    set({ selectedObjectIds: [] })
  },

  setOperationMode: (mode) => {
    set({ operationMode: mode })
  },

  addOperation: (operation) => {
    const newOperation: BooleanOperation = {
      ...operation,
      id: uuidv4(),
      timestamp: Date.now()
    }
    
    set((state) => ({
      operations: [...state.operations, newOperation]
    }))
  },

  getLatestOperation: () => {
    const operations = get().operations
    return operations.length > 0 ? operations[operations.length - 1] : null
  }
}))