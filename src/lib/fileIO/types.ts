import { SceneObject } from '@/types/scene'
import { Sketch } from '@/types/sketch'

// 파일 타입 열거형
export enum FileType {
  STL = 'stl',
  OBJ = 'obj',
  FLUXCAD = 'fluxcad',
  STEP = 'step',
  IGES = 'iges',
  GLTF = 'gltf',
  FBX = 'fbx',
  BREP = 'brep'
}

// 파일 정보 인터페이스
export interface FileInfo {
  name: string
  type: FileType
  size: number
  lastModified: Date
}

// 파일 내보내기 옵션
export interface ExportOptions {
  binary?: boolean
  precision?: number
  includeNormals?: boolean
  includeColors?: boolean
  includeTextures?: boolean
  scale?: number
}

// 파일 가져오기 옵션
export interface ImportOptions {
  scale?: number
  center?: boolean
  merge?: boolean
  material?: any
}

// 파일 내보내기 결과
export interface ExportResult {
  success: boolean
  data?: Blob | string
  error?: string
  warnings?: string[]
}

// 파일 가져오기 결과
export interface ImportResult {
  success: boolean
  objects?: SceneObject[]
  sketches?: Sketch[]
  error?: string
  warnings?: string[]
}

// 파일 포맷 핸들러 인터페이스
export interface FileFormatHandler {
  type: FileType
  extensions: string[]
  mimeTypes: string[]
  
  // 지원 여부 확인
  canImport: boolean
  canExport: boolean
  
  // 파일 검증
  validate(file: File | Blob): Promise<boolean>
  
  // 가져오기/내보내기
  import?(file: File | Blob, options?: ImportOptions): Promise<ImportResult>
  export?(objects: SceneObject[], options?: ExportOptions): Promise<ExportResult>
  
  // 프로젝트 파일용 (선택적)
  exportProject?(data: ProjectData, options?: ExportOptions): Promise<ExportResult>
  importProject?(file: File | Blob, options?: ImportOptions): Promise<ProjectImportResult>
}

// 프로젝트 데이터 (fluxCAD 파일용)
export interface ProjectData {
  version: string
  metadata: {
    name: string
    author?: string
    created: Date
    modified: Date
    description?: string
  }
  scene: {
    objects: SceneObject[]
    selectedObjectId: string | null
  }
  sketches: Sketch[]
  viewport: {
    camera: {
      position: [number, number, number]
      target: [number, number, number]
      up: [number, number, number]
    }
    settings: {
      showGrid: boolean
      showAxes: boolean
      backgroundColor: string
    }
  }
  // 확장 가능한 추가 데이터
  extensions?: Record<string, any>
}

// 프로젝트 가져오기 결과
export interface ProjectImportResult extends ImportResult {
  projectData?: ProjectData
}

// 파일 매니저 이벤트
export interface FileIOEvent {
  type: 'import-start' | 'import-progress' | 'import-complete' | 'export-start' | 'export-progress' | 'export-complete'
  fileType: FileType
  fileName?: string
  progress?: number
  result?: ImportResult | ExportResult
}