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
      {/* 치수 텍스트 라벨 */}
      <group position={labelPosition}>
        {/* 배경 */}
        <mesh>
          <planeGeometry args={[3, 0.8]} />
          <meshBasicMaterial 
            color={dimension.isReference ? '#94a3b8' : '#22c55e'} 
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* 텍스트 배경 */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[2.8, 0.6]} />
          <meshBasicMaterial 
            color="white"
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* 임시 텍스트 표시용 작은 박스 */}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.1, 0.1]} />
          <meshBasicMaterial 
            color="black"
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      
      {/* 치수선 (거리 치수의 경우) */}
      {dimension.type === 'distance' && (
        <group>
          {/* 치수선 화살표 */}
          <mesh position={labelPosition.clone().add(new THREE.Vector3(0, -1, 0))}>
            <cylinderGeometry args={[0.05, 0.05, 2]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
      )}
      
      {/* 참조점 표시 */}
      <mesh position={labelPosition.clone().add(new THREE.Vector3(0, -2, 0))}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  )
}