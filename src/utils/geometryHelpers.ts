import * as THREE from 'three'

// 박스의 실제 크기를 가져오는 헬퍼 함수
export function getBoxDimensions(object: any): { width: number; height: number; depth: number } {
  // 기본 BoxGeometry는 크기가 1x1x1이므로 scale을 곱해줘야 함
  return {
    width: object.scale[0] * 2,
    height: object.scale[1] * 2,
    depth: object.scale[2] * 2
  }
}

// 안전한 지오메트리 생성을 위한 래퍼
export function safeCreateGeometry(
  createFn: () => THREE.BufferGeometry
): THREE.BufferGeometry | null {
  try {
    const geometry = createFn()
    // 지오메트리 유효성 검사
    if (!geometry || !geometry.attributes || !geometry.attributes.position) {
      console.error('Invalid geometry created')
      return null
    }
    geometry.computeVertexNormals()
    return geometry
  } catch (error) {
    console.error('Geometry creation failed:', error)
    return null
  }
}

// 간단한 Chamfer Box (8각형 프리즘)
export function createSimpleChamferBox(
  width: number,
  height: number,
  depth: number,
  chamferSize: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  
  const w = width / 2
  const h = height / 2
  const c = Math.min(chamferSize, w * 0.3, h * 0.3) // 최대 30%까지만 chamfer
  
  // 8각형 모양 생성
  const points = [
    new THREE.Vector2(-w + c, -h),
    new THREE.Vector2(w - c, -h),
    new THREE.Vector2(w, -h + c),
    new THREE.Vector2(w, h - c),
    new THREE.Vector2(w - c, h),
    new THREE.Vector2(-w + c, h),
    new THREE.Vector2(-w, h - c),
    new THREE.Vector2(-w, -h + c)
  ]
  
  shape.setFromPoints(points)
  
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: depth,
    bevelEnabled: false
  }
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings)
}

// 간단한 Shell Box (속이 빈 박스)
export function createSimpleShellBox(
  width: number,
  height: number,
  depth: number,
  thickness: number
): THREE.BufferGeometry {
  // 매우 간단한 구현: wireframe 스타일의 박스
  const shape = new THREE.Shape()
  
  const w = width / 2
  const h = height / 2
  const t = Math.min(thickness, w * 0.3, h * 0.3)
  
  // 외부 사각형
  shape.moveTo(-w, -h)
  shape.lineTo(w, -h)
  shape.lineTo(w, h)
  shape.lineTo(-w, h)
  shape.lineTo(-w, -h)
  
  // 내부 구멍 (hole)
  const hole = new THREE.Path()
  hole.moveTo(-w + t, -h + t)
  hole.lineTo(-w + t, h - t)
  hole.lineTo(w - t, h - t)
  hole.lineTo(w - t, -h + t)
  hole.lineTo(-w + t, -h + t)
  
  shape.holes.push(hole)
  
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: depth,
    bevelEnabled: false
  }
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings)
}

// 지오메트리 병합 함수
export function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) {
    return new THREE.BufferGeometry()
  }
  
  if (geometries.length === 1) {
    return geometries[0]
  }
  
  // Three.js의 BufferGeometryUtils 사용
  try {
    // @ts-ignore - BufferGeometryUtils import 문제 임시 해결
    const BufferGeometryUtils = THREE.BufferGeometryUtils || window.THREE?.BufferGeometryUtils
    if (BufferGeometryUtils && BufferGeometryUtils.mergeGeometries) {
      return BufferGeometryUtils.mergeGeometries(geometries)
    }
  } catch (e) {
    console.warn('BufferGeometryUtils not available, using fallback')
  }
  
  // Fallback: 단순히 첫 번째 지오메트리 반환
  return geometries[0].clone()
}