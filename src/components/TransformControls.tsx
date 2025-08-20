import React, { useEffect, useRef } from 'react'
import { TransformControls as DreiTransformControls } from '@react-three/drei'
import { useSceneStore } from '@/store/sceneStore'
import { useAppStore } from '@/store/appStore'
import * as THREE from 'three'
import { snapPositionToGrid, snapRotationToAngle } from '@/utils/snap'

export default function TransformControls() {
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)
  const updateObject = useSceneStore((state) => state.updateObject)
  const transformMode = useAppStore((state) => state.transformMode)
  const toolMode = useAppStore((state) => state.toolMode)
  const snapSettings = useAppStore((state) => state.snapSettings)
  
  const objects = getObjectsArray()
  const selectedObject = objects.find(obj => obj.id === selectedObjectId)
  const controlsRef = useRef<any>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (controlsRef.current && selectedObject) {
      // Transform 중 실시간 스냅 적용
      const handleObjectChange = () => {
        if (meshRef.current && selectedObject && snapSettings.enabled) {
          if (snapSettings.gridSnap && transformMode === 'translate') {
            const snappedPosition = snapPositionToGrid(meshRef.current.position, snapSettings.snapSize)
            meshRef.current.position.set(...snappedPosition)
          }
          
          if (snapSettings.gridSnap && transformMode === 'rotate') {
            const snappedRotation = snapRotationToAngle(meshRef.current.rotation, 15)
            meshRef.current.rotation.set(...snappedRotation)
          }
        }
      }
      
      // Transform 완료시 상태 업데이트
      const handleChange = () => {
        if (meshRef.current && selectedObject) {
          updateObject(selectedObject.id, {
            position: meshRef.current.position.toArray() as [number, number, number],
            rotation: meshRef.current.rotation.toArray().slice(0, 3) as [number, number, number],
            scale: meshRef.current.scale.toArray() as [number, number, number],
          })
        }
      }

      controlsRef.current.addEventListener('objectChange', handleObjectChange)
      controlsRef.current.addEventListener('objectChange', handleChange)
      
      return () => {
        controlsRef.current?.removeEventListener('objectChange', handleObjectChange)
        controlsRef.current?.removeEventListener('objectChange', handleChange)
      }
    }
  }, [selectedObject, updateObject, snapSettings, transformMode])

  if (!selectedObject || toolMode !== 'transform') return null

  return (
    <>
      {/* 임시 메시 - 실제 객체 위치에 배치 */}
      <mesh
        ref={meshRef}
        position={selectedObject.position}
        rotation={selectedObject.rotation}
        scale={selectedObject.scale}
        visible={false}
      >
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
      
      {/* Transform 컨트롤 */}
      <DreiTransformControls
        ref={controlsRef}
        object={meshRef.current}
        mode={transformMode}
        showX
        showY
        showZ
      />
    </>
  )
}