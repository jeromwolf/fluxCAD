import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// 간단한 Fillet 구현 (박스의 모서리를 둥글게)
export function createFilletedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  smoothness: number = 4
): THREE.BufferGeometry {
  // RoundedBoxGeometry를 사용하거나 직접 구현
  const shape = new THREE.Shape()
  
  // 둥근 사각형 프로파일 생성
  const x = width / 2
  const y = height / 2
  const r = Math.min(radius, x, y)
  
  shape.moveTo(-x + r, -y)
  shape.lineTo(x - r, -y)
  shape.quadraticCurveTo(x, -y, x, -y + r)
  shape.lineTo(x, y - r)
  shape.quadraticCurveTo(x, y, x - r, y)
  shape.lineTo(-x + r, y)
  shape.quadraticCurveTo(-x, y, -x, y - r)
  shape.lineTo(-x, -y + r)
  shape.quadraticCurveTo(-x, -y, -x + r, -y)
  
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius
  }
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings)
}

// 간단한 Chamfer 구현 (박스의 모서리를 깎기)
export function createChamferedBox(
  width: number,
  height: number,
  depth: number,
  chamfer: number
): THREE.BufferGeometry {
  // 임시로 일반 박스 반환 (디버깅용)
  return new THREE.BoxGeometry(width, height, depth)
}

// Shell 구현 (박스의 속을 비우기)
export function createShelledBox(
  width: number,
  height: number,
  depth: number,
  thickness: number
): THREE.BufferGeometry {
  // 임시로 작은 박스 반환 (디버깅용)
  return new THREE.BoxGeometry(
    width - thickness * 2,
    height - thickness * 2,
    depth - thickness * 2
  )
}

// Pattern 생성 (선형 배열)
export function createLinearPattern(
  geometry: THREE.BufferGeometry,
  count: number,
  spacing: number,
  direction: THREE.Vector3 = new THREE.Vector3(1, 0, 0)
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = []
  
  for (let i = 0; i < count; i++) {
    const cloned = geometry.clone()
    const matrix = new THREE.Matrix4()
    const offset = direction.clone().multiplyScalar(i * spacing)
    matrix.makeTranslation(offset.x, offset.y, offset.z)
    cloned.applyMatrix4(matrix)
    geometries.push(cloned)
  }
  
  // BufferGeometryUtils를 사용하여 병합
  return BufferGeometryUtils.mergeGeometries(geometries)
}

// Pattern 생성 (원형 배열)
export function createCircularPattern(
  geometry: THREE.BufferGeometry,
  count: number,
  radius: number,
  axis: THREE.Vector3 = new THREE.Vector3(0, 1, 0),
  center: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = []
  const angleStep = (Math.PI * 2) / count
  
  for (let i = 0; i < count; i++) {
    const cloned = geometry.clone()
    const angle = i * angleStep
    
    // 회전 행렬 생성
    const matrix = new THREE.Matrix4()
    matrix.makeRotationAxis(axis, angle)
    
    // 반경만큼 이동
    const offset = new THREE.Vector3(radius, 0, 0)
    offset.applyMatrix4(matrix)
    offset.add(center)
    
    const translationMatrix = new THREE.Matrix4()
    translationMatrix.makeTranslation(offset.x, offset.y, offset.z)
    
    cloned.applyMatrix4(matrix)
    cloned.applyMatrix4(translationMatrix)
    
    geometries.push(cloned)
  }
  
  return mergeGeometries(geometries)
}

// 지오메트리 병합 헬퍼
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry()
  
  let vertexCount = 0
  let indexCount = 0
  
  // 총 버텍스와 인덱스 수 계산
  geometries.forEach(geo => {
    const position = geo.getAttribute('position')
    if (position) vertexCount += position.count
    if (geo.index) indexCount += geo.index.count
  })
  
  // 배열 생성
  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const indices = new Uint32Array(indexCount)
  
  let positionOffset = 0
  let indexOffset = 0
  let vertexOffset = 0
  
  // 각 지오메트리의 데이터를 병합
  geometries.forEach(geo => {
    const position = geo.getAttribute('position')
    const normal = geo.getAttribute('normal')
    
    if (position) {
      positions.set(position.array, positionOffset)
      positionOffset += position.array.length
    }
    
    if (normal) {
      normals.set(normal.array, positionOffset - position.array.length)
    }
    
    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices[indexOffset + i] = geo.index.array[i] + vertexOffset
      }
      indexOffset += geo.index.count
      vertexOffset += position.count
    }
  })
  
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  merged.setIndex(new THREE.BufferAttribute(indices, 1))
  
  merged.computeBoundingBox()
  merged.computeBoundingSphere()
  
  return merged
}