import React from 'react'
import * as THREE from 'three'

export default function SimpleSketchPlane() {
  return (
    <group>
      {/* XY 평면 - 파란색 */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color="#3b82f6" opacity={0.3} transparent side={THREE.DoubleSide} />
      </mesh>
      
      {/* XZ 평면 - 초록색 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color="#10b981" opacity={0.3} transparent side={THREE.DoubleSide} />
      </mesh>
      
      {/* YZ 평면 - 빨간색 */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color="#ef4444" opacity={0.3} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}