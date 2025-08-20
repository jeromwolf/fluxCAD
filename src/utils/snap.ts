import * as THREE from 'three'

// 그리드에 스냅
export function snapToGrid(value: number, snapSize: number): number {
  return Math.round(value / snapSize) * snapSize
}

// 3D 위치를 그리드에 스냅
export function snapPositionToGrid(
  position: THREE.Vector3 | [number, number, number],
  snapSize: number
): [number, number, number] {
  let result: [number, number, number]
  
  if (Array.isArray(position)) {
    result = [
      snapToGrid(position[0], snapSize),
      snapToGrid(position[1], snapSize),
      snapToGrid(position[2], snapSize),
    ]
  } else {
    result = [
      snapToGrid(position.x, snapSize),
      snapToGrid(position.y, snapSize),
      snapToGrid(position.z, snapSize),
    ]
  }
  
  return result
}

// 각도를 특정 단위로 스냅 (예: 15도 단위)
export function snapAngle(angle: number, snapAngleDegrees: number = 15): number {
  const snapRadians = (snapAngleDegrees * Math.PI) / 180
  return Math.round(angle / snapRadians) * snapRadians
}

// 회전을 스냅
export function snapRotationToAngle(
  rotation: THREE.Euler | [number, number, number],
  snapAngleDegrees: number = 15
): [number, number, number] {
  if (Array.isArray(rotation)) {
    return [
      snapAngle(rotation[0], snapAngleDegrees),
      snapAngle(rotation[1], snapAngleDegrees),
      snapAngle(rotation[2], snapAngleDegrees),
    ]
  } else {
    return [
      snapAngle(rotation.x, snapAngleDegrees),
      snapAngle(rotation.y, snapAngleDegrees),
      snapAngle(rotation.z, snapAngleDegrees),
    ]
  }
}

// 가장 가까운 객체의 정점/모서리/면에 스냅
export function snapToObject(
  position: THREE.Vector3,
  objects: THREE.Object3D[],
  threshold: number = 1
): THREE.Vector3 | null {
  let closestPoint: THREE.Vector3 | null = null
  let minDistance = threshold

  for (const object of objects) {
    if (object instanceof THREE.Mesh) {
      const geometry = object.geometry
      const worldMatrix = object.matrixWorld
      
      // 정점에 스냅
      const positionAttribute = geometry.attributes.position
      for (let i = 0; i < positionAttribute.count; i++) {
        const vertex = new THREE.Vector3()
        vertex.fromBufferAttribute(positionAttribute, i)
        vertex.applyMatrix4(worldMatrix)
        
        const distance = position.distanceTo(vertex)
        if (distance < minDistance) {
          minDistance = distance
          closestPoint = vertex.clone()
        }
      }
    }
  }

  return closestPoint
}