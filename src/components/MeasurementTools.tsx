import React, { useState, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Line, Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/store/appStore'

interface MeasurementPoint {
  position: THREE.Vector3
  id: string
}

interface Measurement {
  id: string
  type: 'distance' | 'angle'
  points: MeasurementPoint[]
  value: number
  unit: string
}

export default function MeasurementTools() {
  const { raycaster, camera, scene } = useThree()
  const measurementMode = useAppStore((state) => state.measurementMode)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [tempPoints, setTempPoints] = useState<MeasurementPoint[]>([])
  const [hoveredPoint, setHoveredPoint] = useState<THREE.Vector3 | null>(null)

  // 거리 계산
  const calculateDistance = (p1: THREE.Vector3, p2: THREE.Vector3): number => {
    return p1.distanceTo(p2)
  }

  // 각도 계산 (3점 사이의 각도)
  const calculateAngle = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number => {
    const v1 = new THREE.Vector3().subVectors(p1, p2).normalize()
    const v2 = new THREE.Vector3().subVectors(p3, p2).normalize()
    const angle = Math.acos(v1.dot(v2))
    return angle * (180 / Math.PI) // 라디안을 도로 변환
  }

  // 마우스 이동 시 스냅 포인트 찾기
  const handlePointerMove = (event: any) => {
    if (measurementMode === 'none') return

    // Raycasting으로 교차점 찾기
    const intersects = raycaster.intersectObjects(scene.children, true)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      setHoveredPoint(point)
    } else {
      setHoveredPoint(null)
    }
  }

  // 클릭 시 측정 포인트 추가
  const handleClick = (event: any) => {
    if (measurementMode === 'none' || !hoveredPoint) return

    const newPoint: MeasurementPoint = {
      position: hoveredPoint.clone(),
      id: `point-${Date.now()}`
    }

    if (measurementMode === 'distance') {
      if (tempPoints.length < 2) {
        setTempPoints([...tempPoints, newPoint])
        
        if (tempPoints.length === 1) {
          // 두 번째 점이 추가되면 측정 완료
          const distance = calculateDistance(tempPoints[0].position, newPoint.position)
          const measurement: Measurement = {
            id: `measurement-${Date.now()}`,
            type: 'distance',
            points: [...tempPoints, newPoint],
            value: distance,
            unit: 'mm'
          }
          setMeasurements([...measurements, measurement])
          setTempPoints([])
        }
      }
    } else if (measurementMode === 'angle') {
      if (tempPoints.length < 3) {
        setTempPoints([...tempPoints, newPoint])
        
        if (tempPoints.length === 2) {
          // 세 번째 점이 추가되면 각도 측정 완료
          const angle = calculateAngle(
            tempPoints[0].position,
            tempPoints[1].position,
            newPoint.position
          )
          const measurement: Measurement = {
            id: `measurement-${Date.now()}`,
            type: 'angle',
            points: [...tempPoints, newPoint],
            value: angle,
            unit: '°'
          }
          setMeasurements([...measurements, measurement])
          setTempPoints([])
        }
      }
    }
  }

  // ESC 키로 측정 취소
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTempPoints([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 측정 삭제
  const deleteMeasurement = (id: string) => {
    setMeasurements(measurements.filter(m => m.id !== id))
  }

  return (
    <>
      {/* 이벤트 핸들러를 위한 투명한 평면 */}
      <mesh
        visible={false}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* 호버 포인트 표시 */}
      {hoveredPoint && measurementMode !== 'none' && (
        <mesh position={hoveredPoint}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      )}

      {/* 임시 포인트 표시 */}
      {tempPoints.map((point) => (
        <mesh key={point.id} position={point.position}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#0000ff" />
        </mesh>
      ))}

      {/* 임시 라인 표시 */}
      {tempPoints.length > 0 && hoveredPoint && (
        <Line
          points={[...tempPoints.map(p => p.position), hoveredPoint]}
          color="#0000ff"
          lineWidth={2}
          dashed
          dashScale={5}
        />
      )}

      {/* 완성된 측정 표시 */}
      {measurements.map((measurement) => {
        if (measurement.type === 'distance') {
          const midPoint = new THREE.Vector3()
            .addVectors(measurement.points[0].position, measurement.points[1].position)
            .multiplyScalar(0.5)

          return (
            <group key={measurement.id}>
              {/* 측정선 */}
              <Line
                points={measurement.points.map(p => p.position)}
                color="#00ff00"
                lineWidth={2}
              />
              
              {/* 측정점 */}
              {measurement.points.map((point) => (
                <mesh key={point.id} position={point.position}>
                  <sphereGeometry args={[0.1, 16, 16]} />
                  <meshBasicMaterial color="#00ff00" />
                </mesh>
              ))}

              {/* 측정값 표시 */}
              <Html position={midPoint} center>
                <div className="bg-white px-2 py-1 rounded shadow-lg border border-gray-300">
                  <span className="text-sm font-medium">
                    {measurement.value.toFixed(2)} {measurement.unit}
                  </span>
                  <button
                    onClick={() => deleteMeasurement(measurement.id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </Html>
            </group>
          )
        } else if (measurement.type === 'angle') {
          const centerPoint = measurement.points[1].position

          return (
            <group key={measurement.id}>
              {/* 각도 라인 */}
              <Line
                points={[measurement.points[0].position, measurement.points[1].position]}
                color="#ff00ff"
                lineWidth={2}
              />
              <Line
                points={[measurement.points[1].position, measurement.points[2].position]}
                color="#ff00ff"
                lineWidth={2}
              />
              
              {/* 측정점 */}
              {measurement.points.map((point) => (
                <mesh key={point.id} position={point.position}>
                  <sphereGeometry args={[0.1, 16, 16]} />
                  <meshBasicMaterial color="#ff00ff" />
                </mesh>
              ))}

              {/* 각도값 표시 */}
              <Html position={centerPoint} center>
                <div className="bg-white px-2 py-1 rounded shadow-lg border border-gray-300">
                  <span className="text-sm font-medium">
                    {measurement.value.toFixed(1)}{measurement.unit}
                  </span>
                  <button
                    onClick={() => deleteMeasurement(measurement.id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </Html>
            </group>
          )
        }
        return null
      })}
    </>
  )
}