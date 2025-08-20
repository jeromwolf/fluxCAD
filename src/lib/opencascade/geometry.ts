import * as THREE from 'three'
import { getOpenCascade } from './index'

export class CADGeometry {
  private oc: any

  constructor() {
    this.oc = getOpenCascade()
  }

  // OpenCascade shape를 Three.js BufferGeometry로 변환
  private shapeToGeometry(shape: any): THREE.BufferGeometry {
    const oc = this.oc
    const mesher = new oc.BRepMesh_IncrementalMesh(shape, 0.1, false, 0.5, true)
    mesher.Perform()
    
    const vertices: number[] = []
    const normals: number[] = []
    const indices: number[] = []
    
    const explorer = new oc.TopExp_Explorer(shape, oc.TopAbs_FACE, oc.TopAbs_SHAPE)
    
    while (explorer.More()) {
      const face = oc.TopoDS.Face(explorer.Current())
      const location = new oc.TopLoc_Location()
      const triangulation = oc.BRep_Tool.Triangulation(face, location)
      
      if (triangulation) {
        const nbTriangles = triangulation.NbTriangles()
        const nbNodes = triangulation.NbNodes()
        const baseIndex = vertices.length / 3
        
        // 버텍스 추출
        for (let i = 1; i <= nbNodes; i++) {
          const node = triangulation.Node(i)
          vertices.push(node.X(), node.Y(), node.Z())
          
          // 임시 노멀 (나중에 계산)
          normals.push(0, 1, 0)
        }
        
        // 인덱스 추출
        for (let i = 1; i <= nbTriangles; i++) {
          const triangle = triangulation.Triangle(i)
          indices.push(
            baseIndex + triangle.Value(1) - 1,
            baseIndex + triangle.Value(2) - 1,
            baseIndex + triangle.Value(3) - 1
          )
        }
      }
      
      explorer.Next()
    }
    
    // Three.js BufferGeometry 생성
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    
    return geometry
  }

  // Box 생성
  createBox(width: number, height: number, depth: number): THREE.BufferGeometry {
    const oc = this.oc
    const box = new oc.BRepPrimAPI_MakeBox(width, height, depth).Shape()
    const geometry = this.shapeToGeometry(box)
    box.delete()
    return geometry
  }

  // Sphere 생성
  createSphere(radius: number): THREE.BufferGeometry {
    const oc = this.oc
    const sphere = new oc.BRepPrimAPI_MakeSphere(radius).Shape()
    const geometry = this.shapeToGeometry(sphere)
    sphere.delete()
    return geometry
  }

  // Cylinder 생성
  createCylinder(radius: number, height: number): THREE.BufferGeometry {
    const oc = this.oc
    const cylinder = new oc.BRepPrimAPI_MakeCylinder(radius, height).Shape()
    const geometry = this.shapeToGeometry(cylinder)
    cylinder.delete()
    return geometry
  }

  // Cone 생성
  createCone(radius1: number, radius2: number, height: number): THREE.BufferGeometry {
    const oc = this.oc
    const cone = new oc.BRepPrimAPI_MakeCone(radius1, radius2, height).Shape()
    const geometry = this.shapeToGeometry(cone)
    cone.delete()
    return geometry
  }

  // Torus 생성
  createTorus(majorRadius: number, minorRadius: number): THREE.BufferGeometry {
    const oc = this.oc
    const torus = new oc.BRepPrimAPI_MakeTorus(majorRadius, minorRadius).Shape()
    const geometry = this.shapeToGeometry(torus)
    torus.delete()
    return geometry
  }
}