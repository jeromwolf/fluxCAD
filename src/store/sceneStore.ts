import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { SceneObject, PrimitiveType, ObjectType } from '@/types/scene'
import { useHistoryStore } from './historyStore'

interface SceneState {
  // 씬에 있는 모든 객체들
  objects: Map<string, SceneObject>
  
  // 선택된 객체 ID
  selectedObjectId: string | null
  
  // 클립보드 (복사된 객체)
  clipboard: SceneObject | null
  
  // 객체 배열 getter
  getObjectsArray: () => SceneObject[]
  
  // 객체 추가
  addObject: (type: ObjectType, params?: Partial<SceneObject>) => string
  
  // 객체 업데이트
  updateObject: (id: string, updates: Partial<SceneObject>) => void
  
  // 객체 삭제
  deleteObject: (id: string) => void
  
  // 객체 선택
  selectObject: (id: string | null) => void
  
  // 객체 복사
  copyObject: (id: string) => void
  
  // 객체 붙여넣기
  pasteObject: () => void
  
  // 객체 복제 (복사 + 즉시 붙여넣기)
  duplicateObject: (id: string) => void
  
  // 씬 초기화
  clearScene: () => void
  
  // Undo/Redo
  undo: () => void
  redo: () => void
}

const defaultObjectParams: Record<PrimitiveType, Partial<SceneObject>> = {
  box: {
    scale: [2, 2, 2],
    color: '#3b82f6',
  },
  sphere: {
    scale: [2, 2, 2],
    color: '#10b981',
  },
  cylinder: {
    scale: [2, 2, 2],
    color: '#f59e0b',
  },
  cone: {
    scale: [2, 2, 2],
    color: '#ef4444',
  },
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: new Map(),
  selectedObjectId: null,
  clipboard: null,

  getObjectsArray: () => {
    return Array.from(get().objects.values())
  },

  addObject: (type, params) => {
    const id = uuidv4()
    const defaultParams = type in defaultObjectParams ? defaultObjectParams[type as PrimitiveType] : {}
    
    // 객체를 랜덤한 위치에 생성
    const randomX = (Math.random() - 0.5) * 8
    const randomZ = (Math.random() - 0.5) * 8
    
    const newObject: SceneObject = {
      id,
      type,
      name: `${type}_${id.substring(0, 8)}`,
      position: [randomX, 1, randomZ],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#3b82f6',
      visible: true,
      ...defaultParams,
      ...params,
    }

    // 히스토리에 기록
    useHistoryStore.getState().pushAction({
      type: 'add',
      data: { object: newObject },
      timestamp: Date.now(),
    })

    set((state) => {
      const newObjects = new Map(state.objects)
      newObjects.set(id, newObject)
      return { objects: newObjects, selectedObjectId: id }
    })

    return id
  },

  updateObject: (id, updates) => {
    set((state) => {
      const object = state.objects.get(id)
      if (!object) return state

      const newObjects = new Map(state.objects)
      newObjects.set(id, { ...object, ...updates })
      return { objects: newObjects }
    })
  },

  deleteObject: (id) => {
    set((state) => {
      const newObjects = new Map(state.objects)
      newObjects.delete(id)
      
      const selectedObjectId = state.selectedObjectId === id ? null : state.selectedObjectId
      
      return { objects: newObjects, selectedObjectId }
    })
  },

  selectObject: (id) => {
    set({ selectedObjectId: id })
  },

  copyObject: (id) => {
    const { objects } = get()
    const object = objects.get(id)
    if (object) {
      set({ clipboard: { ...object } })
    }
  },

  pasteObject: () => {
    const { clipboard } = get()
    if (!clipboard) return

    const id = uuidv4()
    const newObject: SceneObject = {
      ...clipboard,
      id,
      name: `${clipboard.name}_copy`,
      // 위치를 약간 이동시켜 겹치지 않게 함
      position: [
        clipboard.position[0] + 1,
        clipboard.position[1],
        clipboard.position[2] + 1,
      ],
    }

    set((state) => {
      const newObjects = new Map(state.objects)
      newObjects.set(id, newObject)
      return { objects: newObjects, selectedObjectId: id }
    })
  },

  duplicateObject: (id) => {
    const { objects } = get()
    const object = objects.get(id)
    if (!object) return

    const newId = uuidv4()
    const newObject: SceneObject = {
      ...object,
      id: newId,
      name: `${object.name}_copy`,
      position: [
        object.position[0] + 1,
        object.position[1],
        object.position[2] + 1,
      ],
    }

    set((state) => {
      const newObjects = new Map(state.objects)
      newObjects.set(newId, newObject)
      return { objects: newObjects, selectedObjectId: newId }
    })
  },

  clearScene: () => {
    const { objects } = get()
    
    // 히스토리에 기록
    useHistoryStore.getState().pushAction({
      type: 'clear',
      data: { objects: Array.from(objects.values()) },
      timestamp: Date.now(),
    })

    set({ objects: new Map(), selectedObjectId: null, clipboard: null })
  },

  undo: () => {
    const historyStore = useHistoryStore.getState()
    const action = historyStore.undo()
    if (!action) return

    const { objects } = get()

    switch (action.type) {
      case 'add':
        // 추가된 객체를 삭제
        set((state) => {
          const newObjects = new Map(state.objects)
          newObjects.delete(action.data.object.id)
          return { 
            objects: newObjects, 
            selectedObjectId: state.selectedObjectId === action.data.object.id ? null : state.selectedObjectId 
          }
        })
        break

      case 'delete':
        // 삭제된 객체를 복원
        set((state) => {
          const newObjects = new Map(state.objects)
          newObjects.set(action.data.object.id, action.data.object)
          return { objects: newObjects }
        })
        break

      case 'update':
        // 이전 상태로 되돌리기
        set((state) => {
          const newObjects = new Map(state.objects)
          newObjects.set(action.data.id, action.data.oldState)
          return { objects: newObjects }
        })
        break

      case 'clear':
        // 모든 객체 복원
        set(() => {
          const newObjects = new Map()
          action.data.objects.forEach((obj: SceneObject) => {
            newObjects.set(obj.id, obj)
          })
          return { objects: newObjects, selectedObjectId: null }
        })
        break
    }
  },

  redo: () => {
    const historyStore = useHistoryStore.getState()
    const action = historyStore.redo()
    if (!action) return

    switch (action.type) {
      case 'add':
        // 객체를 다시 추가
        set((state) => {
          const newObjects = new Map(state.objects)
          newObjects.set(action.data.object.id, action.data.object)
          return { objects: newObjects, selectedObjectId: action.data.object.id }
        })
        break

      case 'delete':
        // 객체를 다시 삭제
        set((state) => {
          const newObjects = new Map(state.objects)
          newObjects.delete(action.data.object.id)
          return { 
            objects: newObjects, 
            selectedObjectId: state.selectedObjectId === action.data.object.id ? null : state.selectedObjectId 
          }
        })
        break

      case 'update':
        // 새로운 상태로 다시 변경
        set((state) => {
          const newObjects = new Map(state.objects)
          newObjects.set(action.data.id, action.data.newState)
          return { objects: newObjects }
        })
        break

      case 'clear':
        // 씬을 다시 초기화
        set({ objects: new Map(), selectedObjectId: null, clipboard: null })
        break
    }
  },
}))