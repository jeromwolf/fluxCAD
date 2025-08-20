import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Plane } from '@react-three/drei'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Sketch } from '@/types/sketch'
import { useSketchStore } from '@/store/sketchStore'
import SketchEntity from './SketchEntity'
import SketchDimensionComponent from './SketchDimension'

interface SketchPlaneProps {
  sketch: Sketch
  onClick?: () => void
}

export default function SketchPlane({ sketch, onClick }: SketchPlaneProps) {
  const { plane } = sketch
  const planeRef = useRef<THREE.Mesh>(null)
  
  
  const sketchMode = useSketchStore((state) => state.sketchMode)
  const addEntity = useSketchStore((state) => state.addEntity)
  
  const [tempPoints, setTempPoints] = useState<[number, number][]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  
  // ESC 키로 그리기 취소
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        setIsDrawing(false)
        setTempPoints([])
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawing])
  
  // 평면의 회전을 계산
  const getRotation = (): [number, number, number] => {
    switch (plane.type) {
      case 'XY':
        return [0, 0, 0]
      case 'XZ':
        return [-Math.PI / 2, 0, 0]
      case 'YZ':
        return [0, Math.PI / 2, 0]
      default:
        // Custom plane - calculate rotation from normal
        const normal = new THREE.Vector3(...plane.normal)
        const up = new THREE.Vector3(0, 0, 1)
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal)
        const euler = new THREE.Euler().setFromQuaternion(quaternion)
        return [euler.x, euler.y, euler.z]
    }
  }
  
  // 3D 점을 2D 평면 좌표로 변환
  const worldToPlane2D = (worldPoint: THREE.Vector3): [number, number] => {
    const planeNormal = new THREE.Vector3(...plane.normal)
    const planeUp = new THREE.Vector3(...plane.up)
    const planeRight = new THREE.Vector3().crossVectors(planeUp, planeNormal).normalize()
    const planeOrigin = new THREE.Vector3(...plane.origin)
    
    const relativePoint = worldPoint.clone().sub(planeOrigin)
    const x = relativePoint.dot(planeRight)
    const y = relativePoint.dot(planeUp)
    
    return [x, y]
  }
  
  // 마우스 이벤트 처리
  const handlePointerDown = (event: any) => {
    
    if (!sketch.isActive || !sketchMode || sketchMode === 'select') {
      onClick?.()
      return
    }
    
    event.stopPropagation()
    const point2D = worldToPlane2D(event.point)
    
    switch (sketchMode) {
      case 'line':
        if (!isDrawing) {
          setTempPoints([point2D])
          setIsDrawing(true)
        } else {
          // 선 완성
          const firstPoint = tempPoints[0]
          addEntity(sketch.id, {
            type: 'line',
            points: [firstPoint, point2D]
          })
          setTempPoints([])
          setIsDrawing(false)
        }
        break
        
      case 'circle':
        if (!isDrawing) {
          setTempPoints([point2D])
          setIsDrawing(true)
        } else {
          // 원 완성
          const center = tempPoints[0]
          const radius = Math.sqrt(
            Math.pow(point2D[0] - center[0], 2) + 
            Math.pow(point2D[1] - center[1], 2)
          )
          addEntity(sketch.id, {
            type: 'circle',
            points: [center],
            properties: { radius }
          })
          setTempPoints([])
          setIsDrawing(false)
        }
        break
        
      case 'rectangle':
        if (!isDrawing) {
          setTempPoints([point2D])
          setIsDrawing(true)
        } else {
          // 사각형 완성
          const firstPoint = tempPoints[0]
          addEntity(sketch.id, {
            type: 'rectangle',
            points: [firstPoint, point2D]
          })
          setTempPoints([])
          setIsDrawing(false)
        }
        break
    }
  }
  
  const handlePointerMove = (event: any) => {
    if (!isDrawing || !sketch.isActive) return
    
    event.stopPropagation()
    const point2D = worldToPlane2D(event.point)
    
    // 임시 미리보기 업데이트
    if (tempPoints.length > 0) {
      setTempPoints([tempPoints[0], point2D])
    }
  }
  
  return (
    <group position={plane.origin}>
      
      {/* 평면 메시 */}
      <Plane
        ref={planeRef}
        args={[20, 20]}
        rotation={getRotation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <meshBasicMaterial
          color={sketch.isActive ? '#3b82f6' : '#e5e7eb'}
          opacity={sketch.isActive ? 0.3 : 0.2}
          transparent
          side={THREE.DoubleSide}
        />
      </Plane>
      
      {/* 평면 그리드 */}
      {sketch.isActive && (
        <group rotation={getRotation()}>
          <gridHelper args={[20, 20, '#94a3b8', '#e2e8f0']} />
        </group>
      )}
      
      {/* 평면 축 */}
      {sketch.isActive && (
        <group rotation={getRotation()}>
          {/* X축 (빨강) */}
          <primitive
            object={new THREE.ArrowHelper(
              new THREE.Vector3(1, 0, 0),
              new THREE.Vector3(0, 0, 0),
              5,
              0xff0000,
              1,
              0.5
            )}
          />
          {/* Y축 (초록) */}
          <primitive
            object={new THREE.ArrowHelper(
              new THREE.Vector3(0, 1, 0),
              new THREE.Vector3(0, 0, 0),
              5,
              0x00ff00,
              1,
              0.5
            )}
          />
        </group>
      )}
      
      {/* 스케치 엔티티 렌더링 */}
      {sketch.entities.map((entity) => {
        return (
          <SketchEntity
            key={entity.id}
            entity={entity}
            planeNormal={plane.normal}
            planeOrigin={plane.origin}
            planeUp={plane.up}
          />
        )
      })}
      
      {/* 임시 미리보기 */}
      {isDrawing && tempPoints.length > 0 && (
        <SketchEntity
          entity={{
            id: 'temp',
            type: sketchMode as any,
            points: tempPoints,
            properties: sketchMode === 'circle' && tempPoints.length > 1 
              ? { 
                  radius: Math.sqrt(
                    Math.pow(tempPoints[1][0] - tempPoints[0][0], 2) + 
                    Math.pow(tempPoints[1][1] - tempPoints[0][1], 2)
                  )
                }
              : undefined
          }}
          planeNormal={plane.normal}
          planeOrigin={plane.origin}
          planeUp={plane.up}
        />
      )}
      
      {/* 치수 렌더링 */}
      {sketch.dimensions.map((dimension) => (
        <SketchDimensionComponent
          key={dimension.id}
          dimension={dimension}
          planeNormal={plane.normal}
          planeOrigin={plane.origin}
          planeUp={plane.up}
        />
      ))}
    </group>
  )
}