import { useCallback } from 'react'
import * as THREE from 'three'
import { useBooleanStore } from '@/store/booleanStore'
import { useSceneStore } from '@/store/sceneStore'
import { BooleanOperationType } from '@/types/boolean'
import { booleanOperationManager } from '@/services/boolean/BooleanOperationManager'
import { ThreeCSGProvider } from '@/services/boolean/providers/ThreeCSGProvider'
import { ThreeBVHCSGProvider } from '@/services/boolean/providers/ThreeBVHCSGProvider'

// 프로바이더 초기화
booleanOperationManager.registerProvider(new ThreeCSGProvider())
booleanOperationManager.registerProvider(new ThreeBVHCSGProvider())
// 실제 CSG 프로바이더를 활성화
booleanOperationManager.setActiveProvider('three-bvh-csg')

export function useBooleanOperations() {
  const selectedObjectIds = useBooleanStore((state) => state.selectedObjectIds)
  const addOperation = useBooleanStore((state) => state.addOperation)
  const clearSelection = useBooleanStore((state) => state.clearSelection)
  
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)
  const addObject = useSceneStore((state) => state.addObject)
  const deleteObject = useSceneStore((state) => state.deleteObject)

  const performBooleanOperation = useCallback(async (type: BooleanOperationType) => {
    if (selectedObjectIds.length < 2) {
      console.error('At least 2 objects must be selected')
      return false
    }

    const objects = getObjectsArray()
    const objectA = objects.find(obj => obj.id === selectedObjectIds[0])
    const objectB = objects.find(obj => obj.id === selectedObjectIds[1])

    if (!objectA || !objectB) {
      console.error('Selected objects not found')
      return false
    }

    try {
      // 지오메트리 가져오기 또는 생성
      const geometryA = objectA.customGeometry || createGeometry(objectA.type)
      const geometryB = objectB.customGeometry || createGeometry(objectB.type)

      if (!geometryA || !geometryB) {
        console.error('Could not get geometry for objects')
        return false
      }

      // 변환 적용
      const matrixA = new THREE.Matrix4()
      matrixA.compose(
        new THREE.Vector3(...objectA.position),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(...objectA.rotation)),
        new THREE.Vector3(...objectA.scale)
      )
      geometryA.applyMatrix4(matrixA)

      const matrixB = new THREE.Matrix4()
      matrixB.compose(
        new THREE.Vector3(...objectB.position),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(...objectB.rotation)),
        new THREE.Vector3(...objectB.scale)
      )
      geometryB.applyMatrix4(matrixB)

      // Boolean 연산 수행
      const result = await booleanOperationManager.performOperation(
        geometryA,
        geometryB,
        type
      )

      if (!result.success || !result.resultGeometry) {
        console.error('Boolean operation failed:', result.error)
        return false
      }

      // 결과 객체 생성
      const resultId = addObject('custom', {
        name: `${type}_${objectA.name}_${objectB.name}`,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: type === 'union' ? '#3b82f6' : type === 'subtract' ? '#ef4444' : '#a855f7',
        customGeometry: result.resultGeometry,
        customMaterial: new THREE.MeshPhongMaterial({
          color: type === 'union' ? 0x3b82f6 : type === 'subtract' ? 0xef4444 : 0xa855f7,
          transparent: true,
          opacity: 0.8
        })
      })

      // 연산 기록
      addOperation({
        type,
        objectAId: objectA.id,
        objectBId: objectB.id,
        resultObjectId: resultId
      })

      // 원본 객체 삭제 (옵션 - 나중에 설정으로 변경 가능)
      const deleteOriginals = true // 나중에 설정으로 변경
      if (deleteOriginals) {
        deleteObject(objectA.id)
        deleteObject(objectB.id)
      }

      // 선택 초기화
      clearSelection()

      return true
    } catch (error) {
      console.error('Boolean operation error:', error)
      return false
    }
  }, [selectedObjectIds, getObjectsArray, addObject, deleteObject, addOperation, clearSelection])

  return {
    performBooleanOperation,
    canPerformOperation: selectedObjectIds.length >= 2
  }
}

// 기본 프리미티브 지오메트리 생성
function createGeometry(type: string): THREE.BufferGeometry | null {
  switch (type) {
    case 'box':
      return new THREE.BoxGeometry(2, 2, 2)
    case 'sphere':
      return new THREE.SphereGeometry(1, 32, 32)
    case 'cylinder':
      return new THREE.CylinderGeometry(1, 1, 2, 32)
    case 'cone':
      return new THREE.ConeGeometry(1, 2, 32)
    default:
      return null
  }
}