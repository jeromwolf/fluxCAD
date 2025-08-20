// Boolean 연산 타입 정의
export type BooleanOperationType = 'union' | 'subtract' | 'intersect'

export interface BooleanOperation {
  id: string
  type: BooleanOperationType
  objectAId: string // 첫 번째 객체
  objectBId: string // 두 번째 객체
  resultObjectId?: string // 결과 객체 ID
  timestamp: number
}

export interface BooleanOperationResult {
  success: boolean
  resultGeometry?: any // THREE.BufferGeometry
  error?: string
}

// Boolean 연산 프로바이더 인터페이스
export interface BooleanOperationProvider {
  name: string
  isAvailable: () => boolean
  performOperation: (
    geometryA: any, // THREE.BufferGeometry
    geometryB: any, // THREE.BufferGeometry
    operation: BooleanOperationType
  ) => Promise<BooleanOperationResult>
}

// Boolean 연산 히스토리
export interface BooleanOperationHistory {
  operations: BooleanOperation[]
  canUndo: boolean
  canRedo: boolean
}