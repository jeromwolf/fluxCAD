import React from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { SketchEntity as SketchEntityType } from '@/types/sketch'

interface SketchEntityProps {
  entity: SketchEntityType
  planeNormal: [number, number, number]
  planeOrigin: [number, number, number]
  planeUp: [number, number, number]
}

export default React.memo(function SketchEntity({ entity, planeNormal, planeOrigin, planeUp }: SketchEntityProps) {
  // 2D 좌표를 3D 공간으로 변환
  const transform2DTo3D = (point2D: [number, number]): [number, number, number] => {
    const normal = new THREE.Vector3(...planeNormal).normalize()
    const up = new THREE.Vector3(...planeUp).normalize()
    const right = new THREE.Vector3().crossVectors(up, normal).normalize()
    
    const origin = new THREE.Vector3(...planeOrigin)
    const point3D = origin.clone()
      .add(right.clone().multiplyScalar(point2D[0]))
      .add(up.clone().multiplyScalar(point2D[1]))
    
    return point3D.toArray() as [number, number, number]
  }

  switch (entity.type) {
    case 'line':
      if (entity.points.length >= 2) {
        const points = entity.points.map(p => transform2DTo3D(p))
        return (
          <Line
            points={points}
            color="#1e40af"
            lineWidth={3}
            // @ts-ignore
            linewidth={3}
          />
        )
      }
      return null

    case 'circle':
      if (entity.points.length >= 1 && entity.properties?.radius) {
        const center = transform2DTo3D(entity.points[0])
        const radius = entity.properties.radius
        
        // 원을 그리기 위한 점들 생성
        const segments = 64
        const points: THREE.Vector3[] = []
        
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const point3D = transform2DTo3D([
            entity.points[0][0] + x,
            entity.points[0][1] + y
          ])
          points.push(new THREE.Vector3(...point3D))
        }
        
        return (
          <Line
            points={points}
            color="#1e40af"
            lineWidth={3}
            // @ts-ignore
            linewidth={3}
          />
        )
      }
      return null

    case 'rectangle':
      if (entity.points.length >= 2) {
        const p1 = entity.points[0]
        const p2 = entity.points[1]
        
        // 사각형의 네 모서리
        const corners = [
          transform2DTo3D([p1[0], p1[1]]),
          transform2DTo3D([p2[0], p1[1]]),
          transform2DTo3D([p2[0], p2[1]]),
          transform2DTo3D([p1[0], p2[1]]),
          transform2DTo3D([p1[0], p1[1]]) // 닫기
        ]
        
        return (
          <Line
            points={corners}
            color="#1e40af"
            lineWidth={2}
          />
        )
      }
      return null

    default:
      return null
  }
})