import * as THREE from 'three'
import { Evaluator, Brush, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg'
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
      // 지오메트리를 Brush로 변환
      const brushA = new Brush(geometryA.clone())
      const brushB = new Brush(geometryB.clone())

      // CSG 연산 타입 매핑
      let csgOperation: number
      switch (operation) {
        case 'union':
          csgOperation = ADDITION
          break
        case 'subtract':
          csgOperation = SUBTRACTION
          break
        case 'intersect':
          csgOperation = INTERSECTION
          break
        default:
          throw new Error(`Unknown operation: ${operation}`)
      }

      // Boolean 연산 수행
      const resultBrush = this.evaluator.evaluate(brushA, brushB, csgOperation) as any
      
      if (!resultBrush || !resultBrush.geometry) {
        throw new Error('Boolean operation resulted in empty geometry')
      }

      // 결과 지오메트리 정리
      const resultGeometry = resultBrush.geometry
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