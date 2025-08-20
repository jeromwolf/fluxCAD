import React from 'react'
import * as THREE from 'three'
import { SceneObject as SceneObjectType } from '@/types/scene'

interface SceneObjectProps {
  object: SceneObjectType
  isSelected: boolean
  onClick: (e: any) => void
}

export default function SceneObject({ object, isSelected, onClick }: SceneObjectProps) {
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