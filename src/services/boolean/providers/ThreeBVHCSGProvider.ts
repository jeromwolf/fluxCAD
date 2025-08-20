import * as THREE from 'three'
import { Evaluator, Operation } from 'three-bvh-csg'
import { BooleanOperationType, BooleanOperationProvider, BooleanOperationResult } from '@/types/boolean'

// Three-BVH-CSG를 사용한 실제 Boolean 연산 프로바이더
export class ThreeBVHCSGProvider implements BooleanOperationProvider {
  name = 'three-bvh-csg'
  private evaluator: Evaluator

  constructor() {
    this.evaluator = new Evaluator()
  }

  isAvailable(): boolean {
    return true
  }

  async performOperation(
    geometryA: THREE.BufferGeometry,
    geometryB: THREE.BufferGeometry,
    operation: BooleanOperationType
  ): Promise<BooleanOperationResult> {
    try {
      // 지오메트리를 Mesh로 변환
      const meshA = new THREE.Mesh(geometryA.clone())
      const meshB = new THREE.Mesh(geometryB.clone())

      // CSG 연산 타입 매핑
      let csgOperation: Operation
      switch (operation) {
        case 'union':
          csgOperation = Operation.UNION
          break
        case 'subtract':
          csgOperation = Operation.SUBTRACT
          break
        case 'intersect':
          csgOperation = Operation.INTERSECTION
          break
        default:
          throw new Error(`Unknown operation: ${operation}`)
      }

      // Boolean 연산 수행
      const resultMesh = this.evaluator.evaluate(meshA, meshB, csgOperation)
      
      if (!resultMesh || !resultMesh.geometry) {
        throw new Error('Boolean operation resulted in empty geometry')
      }

      // 결과 지오메트리 정리
      const resultGeometry = resultMesh.geometry
      resultGeometry.computeVertexNormals()
      resultGeometry.computeBoundingBox()
      resultGeometry.computeBoundingSphere()

      return {
        success: true,
        resultGeometry
      }
    } catch (error) {
      console.error('Three-BVH-CSG operation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed'
      }
    }
  }
}