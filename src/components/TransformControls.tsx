import React, { useEffect, useRef } from 'react'
import { TransformControls as DreiTransformControls } from '@react-three/drei'
import { useSceneStore } from '@/store/sceneStore'
import { useAppStore } from '@/store/appStore'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { snapPositionToGrid, snapRotationToAngle } from '@/utils/snap'

export default function TransformControls() {
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const updateObject = useSceneStore((state) => state.updateObject)
  const transformMode = useAppStore((state) => state.transformMode)
  const toolMode = useAppStore((state) => state.toolMode)
  const snapSettings = useAppStore((state) => state.snapSettings)
  
  const controlsRef = useRef<any>(null)
  const { scene } = useThree()
  
  // 선택된 객체의 실제 Three.js 메시 찾기
  const selectedMesh = selectedObjectId ? scene.getObjectByName(selectedObjectId) as THREE.Mesh : null

  useEffect(() => {
    if (controlsRef.current && selectedMesh) {
      // Transform 중 실시간 스냅 적용
      const handleObjectChange = () => {
        if (selectedMesh && snapSettings.enabled) {
          if (snapSettings.gridSnap && transformMode === 'translate') {
            const snappedPosition = snapPositionToGrid(selectedMesh.position, snapSettings.snapSize)
            selectedMesh.position.set(...snappedPosition)
          }
          
          if (snapSettings.gridSnap && transformMode === 'rotate') {
            const snappedRotation = snapRotationToAngle(selectedMesh.rotation, 15)
            selectedMesh.rotation.set(...snappedRotation)
          }
        }
      }
      
      // Transform 완료시 상태 업데이트
      const handleChange = () => {
        if (selectedMesh && selectedObjectId) {
          updateObject(selectedObjectId, {
            position: selectedMesh.position.toArray() as [number, number, number],
            rotation: selectedMesh.rotation.toArray().slice(0, 3) as [number, number, number],
            scale: selectedMesh.scale.toArray() as [number, number, number],
          })
        }
      }

      controlsRef.current.addEventListener('objectChange', handleObjectChange)
      controlsRef.current.addEventListener('change', handleChange)
      
      return () => {
        controlsRef.current?.removeEventListener('objectChange', handleObjectChange)
        controlsRef.current?.removeEventListener('change', handleChange)
      }
    }
  }, [selectedMesh, selectedObjectId, updateObject, snapSettings, transformMode])

  if (!selectedMesh || toolMode !== 'transform') return null

  return (
    <DreiTransformControls
      ref={controlsRef}
      object={selectedMesh}
      mode={transformMode}
      size={1.5}
      showX
      showY
      showZ
      space="world"
      translationSnap={snapSettings.enabled && snapSettings.gridSnap ? snapSettings.snapSize : null}
      rotationSnap={snapSettings.enabled && snapSettings.gridSnap ? Math.PI / 12 : null}
      scaleSnap={snapSettings.enabled && snapSettings.gridSnap ? 0.1 : null}
    />
  )
}