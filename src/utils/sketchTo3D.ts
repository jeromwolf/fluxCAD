import * as THREE from 'three'
import { SketchEntity } from '@/types/sketch'

// 스케치 엔티티를 THREE.Shape로 변환
export function createShapeFromSketch(entities: SketchEntity[]): THREE.Shape | null {
  if (entities.length === 0) return null

  const shape = new THREE.Shape()
  let firstPoint = true

  // 닫힌 형상인지 확인하기 위한 점들
  const points: THREE.Vector2[] = []

  entities.forEach((entity) => {
    switch (entity.type) {
      case 'line':
        if (entity.points.length >= 2) {
          const start = new THREE.Vector2(entity.points[0][0], entity.points[0][1])
          const end = new THREE.Vector2(entity.points[1][0], entity.points[1][1])
          
          if (firstPoint) {
            shape.moveTo(start.x, start.y)
            points.push(start)
            firstPoint = false
          } else {
            shape.lineTo(start.x, start.y)
            points.push(start)
          }
          shape.lineTo(end.x, end.y)
          points.push(end)
        }
        break

      case 'rectangle':
        if (entity.points.length >= 2) {
          const p1 = entity.points[0]
          const p2 = entity.points[1]
          const minX = Math.min(p1[0], p2[0])
          const maxX = Math.max(p1[0], p2[0])
          const minY = Math.min(p1[1], p2[1])
          const maxY = Math.max(p1[1], p2[1])

          if (firstPoint) {
            shape.moveTo(minX, minY)
            firstPoint = false
          }
          shape.lineTo(maxX, minY)
          shape.lineTo(maxX, maxY)
          shape.lineTo(minX, maxY)
          shape.lineTo(minX, minY)
          
          points.push(
            new THREE.Vector2(minX, minY),
            new THREE.Vector2(maxX, minY),
            new THREE.Vector2(maxX, maxY),
            new THREE.Vector2(minX, maxY)
          )
        }
        break

      case 'circle':
        if (entity.points.length >= 1 && entity.properties?.radius) {
          const center = new THREE.Vector2(entity.points[0][0], entity.points[0][1])
          const radius = entity.properties.radius
          
          // 원을 폴리곤으로 근사
          const segments = 32
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const x = center.x + Math.cos(angle) * radius
            const y = center.y + Math.sin(angle) * radius
            
            if (i === 0 && firstPoint) {
              shape.moveTo(x, y)
              firstPoint = false
            } else {
              shape.lineTo(x, y)
            }
            
            if (i < segments) {
              points.push(new THREE.Vector2(x, y))
            }
          }
        }
        break
    }
  })

  // 형상이 닫혀있는지 확인
  if (points.length > 2) {
    const first = points[0]
    const last = points[points.length - 1]
    const distance = first.distanceTo(last)
    
    // 시작점과 끝점이 가까우면 닫힌 형상으로 간주
    if (distance > 0.1) {
      shape.lineTo(first.x, first.y)
    }
  }

  return shape
}

// Extrude: 2D 스케치를 특정 높이로 돌출
export function extrudeSketch(
  entities: SketchEntity[],
  height: number,
  planeNormal: [number, number, number],
  planeOrigin: [number, number, number],
  planeUp: [number, number, number]
): THREE.Mesh | null {
  const shape = createShapeFromSketch(entities)
  if (!shape) return null

  // ExtrudeGeometry 설정
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: height,
    bevelEnabled: false,
    steps: 1
  }

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  
  // 평면에 맞게 회전
  const normal = new THREE.Vector3(...planeNormal)
  const up = new THREE.Vector3(...planeUp)
  const right = new THREE.Vector3().crossVectors(up, normal).normalize()
  
  // 변환 행렬 생성
  const matrix = new THREE.Matrix4()
  matrix.makeBasis(right, up, normal)
  matrix.setPosition(...planeOrigin)
  
  geometry.applyMatrix4(matrix)

  // 재질 생성
  const material = new THREE.MeshPhongMaterial({
    color: 0x2563eb,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  })

  return new THREE.Mesh(geometry, material)
}

// Revolve: 2D 스케치를 축 중심으로 회전
export function revolveSketch(
  entities: SketchEntity[],
  angle: number = Math.PI * 2, // 기본값: 360도
  segments: number = 32,
  axis: 'X' | 'Y' = 'Y',
  planeNormal: [number, number, number],
  planeOrigin: [number, number, number],
  planeUp: [number, number, number]
): THREE.Mesh | null {
  const shape = createShapeFromSketch(entities)
  if (!shape) return null

  // LatheGeometry용 포인트 추출
  const points = shape.getPoints(50).map(p => new THREE.Vector2(p.x, p.y))
  
  // LatheGeometry 생성
  const geometry = new THREE.LatheGeometry(points, segments, 0, angle)
  
  // 평면에 맞게 회전
  const normal = new THREE.Vector3(...planeNormal)
  const up = new THREE.Vector3(...planeUp)
  const right = new THREE.Vector3().crossVectors(up, normal).normalize()
  
  // 변환 행렬 생성
  const matrix = new THREE.Matrix4()
  matrix.makeBasis(right, up, normal)
  matrix.setPosition(...planeOrigin)
  
  geometry.applyMatrix4(matrix)

  // 재질 생성
  const material = new THREE.MeshPhongMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  })

  return new THREE.Mesh(geometry, material)
}