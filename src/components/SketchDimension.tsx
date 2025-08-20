import React from 'react'
import * as THREE from 'three'
import { SketchDimension } from '@/types/sketch'

interface SketchDimensionProps {
  dimension: SketchDimension
  planeNormal: [number, number, number]
  planeOrigin: [number, number, number] 
  planeUp: [number, number, number]
}

export default function SketchDimensionComponent({ 
  dimension, 
  planeNormal, 
  planeOrigin, 
  planeUp 
}: SketchDimensionProps) {
  // 2D 평면 좌표를 3D 월드 좌표로 변환
  const plane2DToWorld = (point2D: [number, number]): THREE.Vector3 => {
    const normal = new THREE.Vector3(...planeNormal)
    const up = new THREE.Vector3(...planeUp)
    const right = new THREE.Vector3().crossVectors(up, normal).normalize()
    const origin = new THREE.Vector3(...planeOrigin)
    
    return origin
      .clone()
      .add(right.multiplyScalar(point2D[0]))
      .add(up.multiplyScalar(point2D[1]))
  }

  const labelPosition = plane2DToWorld(dimension.position)

  return (
    <group>
      {/* 치수 텍스트 */}
      <group position={labelPosition}>
        <mesh>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial 
            color={dimension.isReference ? '#94a3b8' : '#2563eb'} 
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* 텍스트는 HTML 오버레이로 구현할 예정 */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.8, 0.3]} />
          <meshBasicMaterial 
            color="white"
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      
      {/* 치수선 (거리 치수의 경우) */}
      {dimension.type === 'distance' && (
        <group>
          {/* 여기에 치수선 렌더링 로직 추가 */}
        </group>
      )}
    </group>
  )
}