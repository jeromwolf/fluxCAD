import React from 'react'
import * as THREE from 'three'
import { SceneObject as SceneObjectType } from '@/types/scene'

interface SceneObjectProps {
  object: SceneObjectType
  isSelected: boolean
  onClick: (e: any) => void
}

export default function SceneObject({ object, isSelected, onClick }: SceneObjectProps) {
  // 커스텀 지오메트리가 있는 경우 (extruded, revolved 등)
  if (object.customGeometry) {
    return (
      <group onClick={onClick}>
        <mesh
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          castShadow
          receiveShadow
          geometry={object.customGeometry}
          material={object.customMaterial || new THREE.MeshStandardMaterial({ color: isSelected ? '#facc15' : object.color })}
        />
        {isSelected && (
          <lineSegments position={object.position} rotation={object.rotation} scale={object.scale}>
            <edgesGeometry args={[object.customGeometry]} />
            <lineBasicMaterial color="#facc15" linewidth={2} />
          </lineSegments>
        )}
      </group>
    )
  }

  // 기본 프리미티브
  return (
    <group onClick={onClick}>
      <mesh
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        castShadow
        receiveShadow
      >
        {object.type === 'box' && <boxGeometry args={[2, 2, 2]} />}
        {object.type === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
        {object.type === 'cylinder' && <cylinderGeometry args={[1, 1, 2, 32]} />}
        {object.type === 'cone' && <coneGeometry args={[1, 2, 32]} />}
        <meshStandardMaterial color={isSelected ? '#facc15' : object.color} />
      </mesh>
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(2.1, 2.1, 2.1)]} />
          <lineBasicMaterial color="#facc15" linewidth={2} />
        </lineSegments>
      )}
    </group>
  )
}