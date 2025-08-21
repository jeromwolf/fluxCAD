import { create } from 'zustand'
import { ProjectData } from '@/lib/fileIO/types'
import { useSceneStore } from './sceneStore'
import { useSketchStore } from './sketchStore'
import { useAppStore } from './appStore'

interface ProjectState {
  // 프로젝트 메타데이터
  projectName: string
  projectAuthor: string
  projectDescription: string
  projectCreated: Date
  projectModified: Date
  
  // 카메라 상태
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  
  // 프로젝트 관리 함수
  setProjectInfo: (info: {
    name?: string
    author?: string
    description?: string
  }) => void
  
  updateModifiedDate: () => void
  
  // 프로젝트 데이터 수집
  collectProjectData: () => ProjectData
  
  // 프로젝트 데이터 복원
  loadProjectData: (data: ProjectData) => void
  
  // 새 프로젝트
  newProject: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'Untitled Project',
  projectAuthor: '',
  projectDescription: '',
  projectCreated: new Date(),
  projectModified: new Date(),
  cameraPosition: [10, 10, 10],
  cameraTarget: [0, 0, 0],
  
  setProjectInfo: (info) => {
    set((state) => ({
      projectName: info.name ?? state.projectName,
      projectAuthor: info.author ?? state.projectAuthor,
      projectDescription: info.description ?? state.projectDescription,
      projectModified: new Date()
    }))
  },
  
  updateModifiedDate: () => {
    set({ projectModified: new Date() })
  },
  
  collectProjectData: () => {
    const state = get()
    const sceneStore = useSceneStore.getState()
    const sketchStore = useSketchStore.getState()
    const appStore = useAppStore.getState()
    
    return {
      version: '1.0.0',
      metadata: {
        name: state.projectName,
        author: state.projectAuthor,
        description: state.projectDescription,
        created: state.projectCreated,
        modified: state.projectModified
      },
      scene: {
        objects: sceneStore.getObjectsArray(),
        selectedObjectId: sceneStore.selectedObjectId
      },
      sketches: sketchStore.getSketchesArray(),
      viewport: {
        camera: {
          position: state.cameraPosition,
          target: state.cameraTarget,
          up: [0, 1, 0] as [number, number, number]
        },
        settings: {
          showGrid: true,
          showAxes: true,
          backgroundColor: '#f3f4f6'
        }
      }
    }
  },
  
  loadProjectData: (data) => {
    // 프로젝트 메타데이터 복원
    set({
      projectName: data.metadata.name,
      projectAuthor: data.metadata.author || '',
      projectDescription: data.metadata.description || '',
      projectCreated: data.metadata.created,
      projectModified: data.metadata.modified
    })
    
    // 카메라 상태 복원
    if (data.viewport?.camera) {
      set({
        cameraPosition: data.viewport.camera.position,
        cameraTarget: data.viewport.camera.target
      })
    }
    
    // 씬 복원
    const sceneStore = useSceneStore.getState()
    sceneStore.clearScene()
    data.scene.objects.forEach(obj => {
      sceneStore.addObject(obj.type, obj)
    })
    
    // 스케치 복원
    const sketchStore = useSketchStore.getState()
    // 기존 스케치 모두 삭제
    sketchStore.getSketchesArray().forEach(sketch => {
      sketchStore.deleteSketch(sketch.id)
    })
    // 새 스케치 추가
    data.sketches.forEach(sketch => {
      const newId = sketchStore.createSketch(sketch.plane.type, sketch.plane.origin)
      const newSketch = sketchStore.sketches.get(newId)
      if (newSketch) {
        // 스케치 데이터 복사
        newSketch.name = sketch.name
        newSketch.entities = sketch.entities
        newSketch.dimensions = sketch.dimensions
        newSketch.constraints = sketch.constraints
      }
    })
    
    // 선택 상태 복원
    if (data.scene.selectedObjectId) {
      sceneStore.selectObject(data.scene.selectedObjectId)
    }
  },
  
  newProject: () => {
    const now = new Date()
    set({
      projectName: 'Untitled Project',
      projectAuthor: '',
      projectDescription: '',
      projectCreated: now,
      projectModified: now,
      cameraPosition: [10, 10, 10],
      cameraTarget: [0, 0, 0]
    })
    
    // 씬 초기화
    useSceneStore.getState().clearScene()
    
    // 스케치 초기화
    const sketchStore = useSketchStore.getState()
    sketchStore.getSketchesArray().forEach(sketch => {
      sketchStore.deleteSketch(sketch.id)
    })
  }
}))