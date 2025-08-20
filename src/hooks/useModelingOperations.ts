import { useCallback } from 'react'
import * as THREE from 'three'
import { useSceneStore } from '@/store/sceneStore'
import { useModelingStore } from '@/store/modelingStore'
import { ModelingOperationType } from '@/types/modeling'
import {
  createFilletedBox,
  createChamferedBox,
  createShelledBox,
  createLinearPattern,
  createCircularPattern
} from '@/utils/modelingOperations'

export function useModelingOperations() {
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)
  const addObject = useSceneStore((state) => state.addObject)
  const deleteObject = useSceneStore((state) => state.deleteObject)
  
  const filletRadius = useModelingStore((state) => state.filletRadius)
  const chamferDistance = useModelingStore((state) => state.chamferDistance)
  const shellThickness = useModelingStore((state) => state.shellThickness)
  const patternType = useModelingStore((state) => state.patternType)
  const patternCount = useModelingStore((state) => state.patternCount)
  const patternSpacing = useModelingStore((state) => state.patternSpacing)

  const performModelingOperation = useCallback(async (type: ModelingOperationType) => {
    if (!selectedObjectId) {
      console.error('No object selected')
      return false
    }

    const objects = getObjectsArray()
    const selectedObject = objects.find(obj => obj.id === selectedObjectId)
    
    if (!selectedObject) {
      console.error('Selected object not found')
      return false
    }

    try {
      let resultGeometry: THREE.BufferGeometry | null = null
      let operationName = ''

      switch (type) {
        case 'fillet':
          // 박스인 경우만 간단한 fillet 적용
          if (selectedObject.type === 'box') {
            resultGeometry = createFilletedBox(2, 2, 2, filletRadius)
            operationName = `Filleted_${selectedObject.name}`
          } else {
            console.warn('Fillet is currently only supported for box objects')
            return false
          }
          break

        case 'chamfer':
          // 박스인 경우만 간단한 chamfer 적용
          if (selectedObject.type === 'box') {
            resultGeometry = createChamferedBox(2, 2, 2, chamferDistance)
            operationName = `Chamfered_${selectedObject.name}`
          } else {
            console.warn('Chamfer is currently only supported for box objects')
            return false
          }
          break

        case 'shell':
          // 박스인 경우만 간단한 shell 적용
          if (selectedObject.type === 'box') {
            resultGeometry = createShelledBox(2, 2, 2, shellThickness)
            operationName = `Shelled_${selectedObject.name}`
          } else {
            console.warn('Shell is currently only supported for box objects')
            return false
          }
          break

        case 'pattern':
          // 현재 객체의 지오메트리 가져오기
          const sourceGeometry = selectedObject.customGeometry || createGeometry(selectedObject.type)
          if (!sourceGeometry) {
            console.error('Could not get geometry for pattern')
            return false
          }

          // 변환 적용
          const matrix = new THREE.Matrix4()
          matrix.compose(
            new THREE.Vector3(...selectedObject.position),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(...selectedObject.rotation)),
            new THREE.Vector3(...selectedObject.scale)
          )
          sourceGeometry.applyMatrix4(matrix)

          if (patternType === 'linear') {
            resultGeometry = createLinearPattern(
              sourceGeometry,
              patternCount,
              patternSpacing
            )
          } else {
            resultGeometry = createCircularPattern(
              sourceGeometry,
              patternCount,
              patternSpacing
            )
          }
          operationName = `Pattern_${selectedObject.name}`
          break

        default:
          console.error(`Unknown modeling operation: ${type}`)
          return false
      }

      if (!resultGeometry) {
        console.error('Modeling operation failed to create geometry')
        return false
      }

      // 결과 객체 생성
      const resultId = addObject('custom', {
        name: operationName,
        position: type === 'pattern' ? [0, 0, 0] : selectedObject.position,
        rotation: type === 'pattern' ? [0, 0, 0] : selectedObject.rotation,
        scale: [1, 1, 1],
        color: selectedObject.color,
        customGeometry: resultGeometry,
        customMaterial: new THREE.MeshPhongMaterial({
          color: selectedObject.color,
          transparent: true,
          opacity: 0.9
        })
      })

      // 원본 객체 삭제 (pattern 제외)
      if (type !== 'pattern') {
        deleteObject(selectedObject.id)
      }

      return true
    } catch (error) {
      console.error('Modeling operation error:', error)
      return false
    }
  }, [
    selectedObjectId,
    getObjectsArray,
    addObject,
    deleteObject,
    filletRadius,
    chamferDistance,
    shellThickness,
    patternType,
    patternCount,
    patternSpacing
  ])

  return {
    performModelingOperation,
    canPerformOperation: !!selectedObjectId
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