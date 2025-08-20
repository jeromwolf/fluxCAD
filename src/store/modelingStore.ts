import { create } from 'zustand'
import { ModelingOperationType, EdgeSelection, FaceSelection } from '@/types/modeling'

interface ModelingState {
  // 현재 모델링 도구 모드
  modelingMode: ModelingOperationType | null
  
  // 선택된 엣지들
  selectedEdges: EdgeSelection[]
  
  // 선택된 면들
  selectedFaces: FaceSelection[]
  
  // Fillet/Chamfer 반경
  filletRadius: number
  chamferDistance: number
  
  // Shell 두께
  shellThickness: number
  
  // Pattern 설정
  patternType: 'linear' | 'circular'
  patternCount: number
  patternSpacing: number
  patternAngle: number
  
  // 액션들
  setModelingMode: (mode: ModelingOperationType | null) => void
  addSelectedEdge: (objectId: string, edgeIndex: number) => void
  removeSelectedEdge: (objectId: string, edgeIndex: number) => void
  clearSelectedEdges: () => void
  
  addSelectedFace: (objectId: string, faceIndex: number) => void
  removeSelectedFace: (objectId: string, faceIndex: number) => void
  clearSelectedFaces: () => void
  
  setFilletRadius: (radius: number) => void
  setChamferDistance: (distance: number) => void
  setShellThickness: (thickness: number) => void
  
  setPatternSettings: (settings: {
    type?: 'linear' | 'circular'
    count?: number
    spacing?: number
    angle?: number
  }) => void
}

export const useModelingStore = create<ModelingState>((set) => ({
  modelingMode: null,
  selectedEdges: [],
  selectedFaces: [],
  filletRadius: 2.0,
  chamferDistance: 1.0,
  shellThickness: 1.0,
  patternType: 'linear',
  patternCount: 3,
  patternSpacing: 5.0,
  patternAngle: 45,

  setModelingMode: (mode) => {
    set({ 
      modelingMode: mode,
      selectedEdges: [],
      selectedFaces: []
    })
  },

  addSelectedEdge: (objectId, edgeIndex) => {
    set((state) => {
      const existing = state.selectedEdges.find(e => e.objectId === objectId)
      if (existing) {
        if (!existing.edgeIndices.includes(edgeIndex)) {
          return {
            selectedEdges: state.selectedEdges.map(e =>
              e.objectId === objectId
                ? { ...e, edgeIndices: [...e.edgeIndices, edgeIndex] }
                : e
            )
          }
        }
      } else {
        return {
          selectedEdges: [...state.selectedEdges, {
            objectId,
            edgeIndices: [edgeIndex]
          }]
        }
      }
      return state
    })
  },

  removeSelectedEdge: (objectId, edgeIndex) => {
    set((state) => ({
      selectedEdges: state.selectedEdges.map(e =>
        e.objectId === objectId
          ? { ...e, edgeIndices: e.edgeIndices.filter(i => i !== edgeIndex) }
          : e
      ).filter(e => e.edgeIndices.length > 0)
    }))
  },

  clearSelectedEdges: () => {
    set({ selectedEdges: [] })
  },

  addSelectedFace: (objectId, faceIndex) => {
    set((state) => {
      const existing = state.selectedFaces.find(f => f.objectId === objectId)
      if (existing) {
        if (!existing.faceIndices.includes(faceIndex)) {
          return {
            selectedFaces: state.selectedFaces.map(f =>
              f.objectId === objectId
                ? { ...f, faceIndices: [...f.faceIndices, faceIndex] }
                : f
            )
          }
        }
      } else {
        return {
          selectedFaces: [...state.selectedFaces, {
            objectId,
            faceIndices: [faceIndex]
          }]
        }
      }
      return state
    })
  },

  removeSelectedFace: (objectId, faceIndex) => {
    set((state) => ({
      selectedFaces: state.selectedFaces.map(f =>
        f.objectId === objectId
          ? { ...f, faceIndices: f.faceIndices.filter(i => i !== faceIndex) }
          : f
      ).filter(f => f.faceIndices.length > 0)
    }))
  },

  clearSelectedFaces: () => {
    set({ selectedFaces: [] })
  },

  setFilletRadius: (radius) => {
    set({ filletRadius: radius })
  },

  setChamferDistance: (distance) => {
    set({ chamferDistance: distance })
  },

  setShellThickness: (thickness) => {
    set({ shellThickness: thickness })
  },

  setPatternSettings: (settings) => {
    set((state) => ({
      patternType: settings.type ?? state.patternType,
      patternCount: settings.count ?? state.patternCount,
      patternSpacing: settings.spacing ?? state.patternSpacing,
      patternAngle: settings.angle ?? state.patternAngle
    }))
  }
}))