export type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'cone'
export type ObjectType = PrimitiveType | 'extruded' | 'revolved' | 'custom'

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
  customGeometry?: any // THREE.BufferGeometry
  customMaterial?: any // THREE.Material
}

export interface ViewportSettings {
  showGrid: boolean
  showAxes: boolean
  showStats: boolean
  backgroundColor: string
}