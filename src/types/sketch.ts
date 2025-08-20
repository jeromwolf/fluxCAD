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

export interface Sketch {
  id: string
  name: string
  plane: SketchPlaneData
  entities: SketchEntity[]
  constraints: SketchConstraint[]
  isActive: boolean
}