export type SketchPlane = 'XY' | 'XZ' | 'YZ' | 'Custom'

export interface SketchPlaneData {
  type: SketchPlane
  origin: [number, number, number]
  normal: [number, number, number]
  up: [number, number, number]
}

export type SketchEntityType = 'line' | 'circle' | 'rectangle' | 'arc' | 'point'

export interface SketchEntity {
  id: string
  type: SketchEntityType
  points: [number, number][] // 2D points on the sketch plane
  properties?: {
    radius?: number
    startAngle?: number
    endAngle?: number
    width?: number
    height?: number
  }
  constraints?: SketchConstraint[]
}

export type ConstraintType = 
  | 'coincident'
  | 'parallel'
  | 'perpendicular'
  | 'horizontal'
  | 'vertical'
  | 'distance'
  | 'angle'
  | 'radius'
  | 'equal'

export interface SketchConstraint {
  id: string
  type: ConstraintType
  entities: string[] // Entity IDs
  value?: number
}

// 치수 타입 정의
export type DimensionType = 'distance' | 'radius' | 'diameter' | 'angle'

export interface SketchDimension {
  id: string
  type: DimensionType
  entities: string[] // Entity IDs or point indices
  value: number
  label: string
  position: [number, number] // 2D position on sketch plane for label
  isReference: boolean // true면 참조 치수 (편집 불가)
}

export interface Sketch {
  id: string
  name: string
  plane: SketchPlaneData
  entities: SketchEntity[]
  constraints: SketchConstraint[]
  dimensions: SketchDimension[]
  isActive: boolean
}