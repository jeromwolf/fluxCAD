// 고급 모델링 도구 타입 정의
export type ModelingOperationType = 'fillet' | 'chamfer' | 'shell' | 'pattern'

export interface FilletOperation {
  type: 'fillet'
  radius: number
  edges: string[] // 선택된 엣지 ID들
}

export interface ChamferOperation {
  type: 'chamfer'
  distance: number
  edges: string[] // 선택된 엣지 ID들
}

export interface ShellOperation {
  type: 'shell'
  thickness: number
  faces: string[] // 제거할 면 ID들
}

export interface PatternOperation {
  type: 'pattern'
  patternType: 'linear' | 'circular'
  count: number
  spacing?: number // linear pattern
  angle?: number // circular pattern
  axis?: [number, number, number]
}

export type ModelingOperation = FilletOperation | ChamferOperation | ShellOperation | PatternOperation

// 엣지 선택 모드
export interface EdgeSelection {
  objectId: string
  edgeIndices: number[]
}

// 면 선택 모드
export interface FaceSelection {
  objectId: string
  faceIndices: number[]
}