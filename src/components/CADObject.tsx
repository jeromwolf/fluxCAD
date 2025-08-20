import React from 'react'
import { useCADGeometry, GeometryType } from '@/hooks/useCADGeometry'
import * as THREE from 'three'

interface CADObjectProps {
  type: GeometryType
  params: any
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  color?: string
}

export default function CADObject({
  type,
  params,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  color = '#3b82f6'
}: CADObjectProps) {
  const { geometry, isLoading, error } = useCADGeometry(type, params)

  if (isLoading || !geometry) {
    return null
  }

  if (error) {
    console.error('CAD Object error:', error)
    return null
  }

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} />
    </mesh>
  )
}