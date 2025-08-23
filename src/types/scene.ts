import * as THREE from 'three'

export type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'cone'
export type ObjectType = PrimitiveType | 'extruded' | 'revolved' | 'custom' | 'imported' | 'lofted' | 'swept' | 'filleted' | 'chamfered' | 'shelled' | 'patterned'

export type MaterialType = 'basic' | 'standard' | 'physical' | 'metal' | 'plastic' | 'glass' | 'wood' | 'ceramic'

export interface SceneObject {
  id: string
  type: ObjectType
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  name: string
  visible: boolean
  // 커스텀 지오메트리를 위한 속성
  customGeometry?: THREE.BufferGeometry
  customMaterial?: THREE.Material
  // 추가 속성들
  opacity?: number
  wireframe?: boolean
  children?: SceneObject[]
  geometry?: THREE.BufferGeometry
  material?: MaterialType
  materialType?: MaterialType
  parameters?: any
  dimensions?: {
    width?: number
    height?: number
    depth?: number
    radius?: number
    radiusTop?: number
    radiusBottom?: number
  }
  // 스케치 관련
  sketchId?: string
  extrudeDepth?: number
  revolveAngle?: number
  revolveSegments?: number
  // 패턴 관련
  patternType?: 'linear' | 'circular'
  patternCount?: number
  patternSpacing?: number
  patternAxis?: [number, number, number]
  patternCenter?: [number, number, number]
  patternRadius?: number
  patternAngle?: number
}

export interface ViewportSettings {
  showGrid: boolean
  showAxes: boolean
  showStats: boolean
  backgroundColor: string
}