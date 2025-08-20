import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { Sketch, SketchPlane, SketchPlaneData, SketchEntity, SketchDimension, SketchConstraint, DimensionType, ConstraintType } from '@/types/sketch'

interface SketchState {
  // 모든 스케치
  sketches: Map<string, Sketch>
  
  // 현재 활성 스케치 ID
  activeSketchId: string | null
  
  // 스케치 도구 모드
  sketchMode: 'select' | 'line' | 'circle' | 'rectangle' | null
  
  // 스케치 배열 getter
  getSketchesArray: () => Sketch[]
  
  // 스케치 생성
  createSketch: (plane: SketchPlane, origin?: [number, number, number]) => string
  
  // 스케치 활성화/비활성화
  activateSketch: (id: string | null) => void
  
  // 스케치 엔티티 추가
  addEntity: (sketchId: string, entity: Omit<SketchEntity, 'id'>) => void
  
  // 스케치 모드 설정
  setSketchMode: (mode: 'select' | 'line' | 'circle' | 'rectangle' | 'dimension' | 'constraint' | null) => void
  
  // 스케치 삭제
  deleteSketch: (id: string) => void
  
  // 활성 스케치 가져오기
  getActiveSketch: () => Sketch | null
  
  // 치수 관련 함수들
  addDimension: (sketchId: string, dimension: Omit<SketchDimension, 'id'>) => void
  updateDimension: (sketchId: string, dimensionId: string, value: number) => void
  removeDimension: (sketchId: string, dimensionId: string) => void
  
  // 구속조건 관련 함수들
  addConstraint: (sketchId: string, constraint: Omit<SketchConstraint, 'id'>) => void
  removeConstraint: (sketchId: string, constraintId: string) => void
}

const getPlaneData = (plane: SketchPlane, origin: [number, number, number] = [0, 0, 0]): SketchPlaneData => {
  switch (plane) {
    case 'XY':
      return {
        type: plane,
        origin: [0, 0, 0],
        normal: [0, 0, 1],
        up: [0, 1, 0]
      }
    case 'XZ':
      return {
        type: plane,
        origin: [0, 0, 0],
        normal: [0, 1, 0],
        up: [0, 0, 1]
      }
    case 'YZ':
      return {
        type: plane,
        origin: [0, 0, 0],
        normal: [1, 0, 0],
        up: [0, 1, 0]
      }
    default:
      return {
        type: 'Custom',
        origin,
        normal: [0, 0, 1],
        up: [0, 1, 0]
      }
  }
}

export const useSketchStore = create<SketchState>((set, get) => ({
  sketches: new Map(),
  activeSketchId: null,
  sketchMode: null,

  getSketchesArray: () => {
    return Array.from(get().sketches.values())
  },

  createSketch: (plane, origin) => {
    // console.log('createSketch called with plane:', plane)
    const id = uuidv4()
    const sketch: Sketch = {
      id,
      name: `Sketch_${id.substring(0, 8)}`,
      plane: getPlaneData(plane, origin),
      entities: [],
      constraints: [],
      dimensions: [],
      isActive: false
    }
    
    // console.log('Creating sketch:', sketch)
    
    set((state) => {
      const newSketches = new Map(state.sketches)
      newSketches.set(id, sketch)
      // console.log('Sketches after creation:', newSketches.size)
      return { sketches: newSketches }
    })
    
    return id
  },

  activateSketch: (id) => {
    set((state) => {
      const newSketches = new Map(state.sketches)
      
      // 모든 스케치 비활성화
      newSketches.forEach((sketch) => {
        sketch.isActive = false
      })
      
      // 선택된 스케치 활성화
      if (id && newSketches.has(id)) {
        const sketch = newSketches.get(id)!
        sketch.isActive = true
      }
      
      return { 
        sketches: newSketches, 
        activeSketchId: id,
        sketchMode: id ? 'select' : null
      }
    })
  },

  addEntity: (sketchId, entity) => {
    set((state) => {
      const sketch = state.sketches.get(sketchId)
      if (!sketch) return state
      
      const newEntity: SketchEntity = {
        ...entity,
        id: uuidv4()
      }
      
      const newSketches = new Map(state.sketches)
      const updatedSketch = {
        ...sketch,
        entities: [...sketch.entities, newEntity]
      }
      newSketches.set(sketchId, updatedSketch)
      
      return { sketches: newSketches }
    })
  },

  setSketchMode: (mode) => {
    set({ sketchMode: mode })
  },

  deleteSketch: (id) => {
    set((state) => {
      const newSketches = new Map(state.sketches)
      newSketches.delete(id)
      
      return { 
        sketches: newSketches,
        activeSketchId: state.activeSketchId === id ? null : state.activeSketchId
      }
    })
  },

  getActiveSketch: () => {
    const { sketches, activeSketchId } = get()
    return activeSketchId ? sketches.get(activeSketchId) || null : null
  },

  // 치수 관련 함수들
  addDimension: (sketchId, dimension) => {
    set((state) => {
      const sketch = state.sketches.get(sketchId)
      if (!sketch) return state
      
      const newDimension: SketchDimension = {
        ...dimension,
        id: uuidv4()
      }
      
      const newSketches = new Map(state.sketches)
      const updatedSketch = {
        ...sketch,
        dimensions: [...sketch.dimensions, newDimension]
      }
      newSketches.set(sketchId, updatedSketch)
      
      return { sketches: newSketches }
    })
  },

  updateDimension: (sketchId, dimensionId, value) => {
    set((state) => {
      const sketch = state.sketches.get(sketchId)
      if (!sketch) return state
      
      const newSketches = new Map(state.sketches)
      const updatedSketch = {
        ...sketch,
        dimensions: sketch.dimensions.map(dim => 
          dim.id === dimensionId ? { ...dim, value, label: `${value.toFixed(2)}` } : dim
        )
      }
      newSketches.set(sketchId, updatedSketch)
      
      return { sketches: newSketches }
    })
  },

  removeDimension: (sketchId, dimensionId) => {
    set((state) => {
      const sketch = state.sketches.get(sketchId)
      if (!sketch) return state
      
      const newSketches = new Map(state.sketches)
      const updatedSketch = {
        ...sketch,
        dimensions: sketch.dimensions.filter(dim => dim.id !== dimensionId)
      }
      newSketches.set(sketchId, updatedSketch)
      
      return { sketches: newSketches }
    })
  },

  // 구속조건 관련 함수들
  addConstraint: (sketchId, constraint) => {
    set((state) => {
      const sketch = state.sketches.get(sketchId)
      if (!sketch) return state
      
      const newConstraint: SketchConstraint = {
        ...constraint,
        id: uuidv4()
      }
      
      const newSketches = new Map(state.sketches)
      const updatedSketch = {
        ...sketch,
        constraints: [...sketch.constraints, newConstraint]
      }
      newSketches.set(sketchId, updatedSketch)
      
      return { sketches: newSketches }
    })
  },

  removeConstraint: (sketchId, constraintId) => {
    set((state) => {
      const sketch = state.sketches.get(sketchId)
      if (!sketch) return state
      
      const newSketches = new Map(state.sketches)
      const updatedSketch = {
        ...sketch,
        constraints: sketch.constraints.filter(constraint => constraint.id !== constraintId)
      }
      newSketches.set(sketchId, updatedSketch)
      
      return { sketches: newSketches }
    })
  }
}))