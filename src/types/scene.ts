export type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'cone'

export interface SceneObject {
  id: string
  type: PrimitiveType
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  name: string
  visible: boolean
}

export interface ViewportSettings {
  showGrid: boolean
  showAxes: boolean
  showStats: boolean
  backgroundColor: string
}