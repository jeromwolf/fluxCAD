import { useEffect, useState } from 'react'
import * as THREE from 'three'
// import { CADGeometry } from '@/lib/opencascade/geometry'
// import { getOpenCascade } from '@/lib/opencascade'

export type GeometryType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus'

interface GeometryParams {
  box: { width: number; height: number; depth: number }
  sphere: { radius: number }
  cylinder: { radius: number; height: number }
  cone: { radius1: number; radius2: number; height: number }
  torus: { majorRadius: number; minorRadius: number }
}

export function useCADGeometry<T extends GeometryType>(
  type: T,
  params: GeometryParams[T]
) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const createGeometry = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 임시로 Three.js 기본 geometry 사용
        let newGeometry: THREE.BufferGeometry

        switch (type) {
          case 'box':
            const boxParams = params as GeometryParams['box']
            newGeometry = new THREE.BoxGeometry(
              boxParams.width,
              boxParams.height,
              boxParams.depth
            )
            break
          case 'sphere':
            const sphereParams = params as GeometryParams['sphere']
            newGeometry = new THREE.SphereGeometry(sphereParams.radius, 32, 32)
            break
          case 'cylinder':
            const cylinderParams = params as GeometryParams['cylinder']
            newGeometry = new THREE.CylinderGeometry(
              cylinderParams.radius,
              cylinderParams.radius,
              cylinderParams.height,
              32
            )
            break
          case 'cone':
            const coneParams = params as GeometryParams['cone']
            newGeometry = new THREE.ConeGeometry(
              coneParams.radius1,
              coneParams.height,
              32
            )
            break
          case 'torus':
            const torusParams = params as GeometryParams['torus']
            newGeometry = new THREE.TorusGeometry(
              torusParams.majorRadius,
              torusParams.minorRadius,
              16,
              32
            )
            break
          default:
            throw new Error(`Unknown geometry type: ${type}`)
        }

        setGeometry(newGeometry)
      } catch (err) {
        console.error('Failed to create geometry:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    createGeometry()
  }, [type, params])

  return { geometry, isLoading, error }
}