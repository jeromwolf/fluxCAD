import { create } from 'zustand'
import { ViewportSettings } from '@/types/scene'

interface SnapSettings {
  enabled: boolean
  gridSnap: boolean
  objectSnap: boolean
  snapSize: number
}

export type MeasurementMode = 'none' | 'distance' | 'angle'

interface AppState {
  // CAD 모드 여부
  useCAD: boolean
  setUseCAD: (useCAD: boolean) => void
  
  // 뷰포트 설정
  viewportSettings: ViewportSettings
  updateViewportSettings: (settings: Partial<ViewportSettings>) => void
  
  // 도구 모드
  toolMode: 'select' | 'create' | 'transform'
  setToolMode: (mode: 'select' | 'create' | 'transform') => void
  
  // Transform 모드
  transformMode: 'translate' | 'rotate' | 'scale'
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void
  
  // 측정 모드
  measurementMode: MeasurementMode
  setMeasurementMode: (mode: MeasurementMode) => void
  
  // 생성할 객체 타입
  createType: 'box' | 'sphere' | 'cylinder' | 'cone'
  setCreateType: (type: 'box' | 'sphere' | 'cylinder' | 'cone') => void
  
  // 스냅 설정
  snapSettings: SnapSettings
  updateSnapSettings: (settings: Partial<SnapSettings>) => void
}

export const useAppStore = create<AppState>((set) => ({
  useCAD: false, // 임시로 CAD 모드 비활성화
  setUseCAD: (useCAD) => set({ useCAD }),
  
  viewportSettings: {
    showGrid: true,
    showAxes: true,
    showStats: true,
    backgroundColor: '#f5f5f5',
  },
  updateViewportSettings: (settings) =>
    set((state) => ({
      viewportSettings: { ...state.viewportSettings, ...settings },
    })),
  
  toolMode: 'select',
  setToolMode: (toolMode) => set({ toolMode }),
  
  transformMode: 'translate',
  setTransformMode: (transformMode) => set({ transformMode }),
  
  measurementMode: 'none',
  setMeasurementMode: (measurementMode) => set({ measurementMode }),
  
  createType: 'box',
  setCreateType: (createType) => set({ createType }),
  
  snapSettings: {
    enabled: false,
    gridSnap: true,
    objectSnap: true,
    snapSize: 0.5,
  },
  updateSnapSettings: (settings) =>
    set((state) => ({
      snapSettings: { ...state.snapSettings, ...settings },
    })),
}))