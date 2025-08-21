import * as THREE from 'three'
import { BaseFormatHandler } from '../core/BaseFormatHandler'
import { FileType, ImportResult, ExportResult, ImportOptions, ExportOptions } from '../types'
import { SceneObject } from '@/types/scene'
import { v4 as uuidv4 } from 'uuid'

export class STLHandler extends BaseFormatHandler {
  type = FileType.STL
  extensions = ['stl']
  mimeTypes = ['model/stl', 'model/x.stl-ascii', 'model/x.stl-binary', 'application/vnd.ms-pki.stl']
  canImport = true
  canExport = true
  
  // STL 파일 가져오기
  protected async doImport(file: File | Blob, options?: ImportOptions): Promise<ImportResult> {
    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(file)
      const geometry = this.parseSTL(arrayBuffer)
      
      if (!geometry) {
        return {
          success: false,
          error: 'Failed to parse STL file'
        }
      }
      
      // 지오메트리 중심 맞추기
      if (options?.center !== false) {
        geometry.center()
      }
      
      // 스케일 적용
      if (options?.scale && options.scale !== 1) {
        geometry.scale(options.scale, options.scale, options.scale)
      }
      
      // SceneObject 생성
      const object: SceneObject = {
        id: uuidv4(),
        type: 'custom',
        name: (file as File).name?.replace(/\.stl$/i, '') || 'Imported STL',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#888888',
        visible: true,
        customGeometry: geometry,
        customMaterial: options?.material || new THREE.MeshPhongMaterial({
          color: 0x888888,
          side: THREE.DoubleSide
        })
      }
      
      return {
        success: true,
        objects: [object],
        warnings: geometry.attributes.normal ? [] : ['No normals found in STL file, computed automatically']
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during STL import'
      }
    }
  }
  
  // STL 파일로 내보내기
  protected async doExport(objects: SceneObject[], options?: ExportOptions): Promise<ExportResult> {
    try {
      const geometries: THREE.BufferGeometry[] = []
      
      // 모든 객체의 지오메트리 수집
      for (const obj of objects) {
        const geometry = this.getObjectGeometry(obj)
        if (geometry) {
          // 변환 적용
          const matrix = new THREE.Matrix4()
          matrix.compose(
            new THREE.Vector3(...obj.position),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(...obj.rotation)),
            new THREE.Vector3(...obj.scale)
          )
          geometry.applyMatrix4(matrix)
          geometries.push(geometry)
        }
      }
      
      if (geometries.length === 0) {
        return {
          success: false,
          error: 'No valid geometry found to export'
        }
      }
      
      // 지오메트리 병합
      const mergedGeometry = this.mergeGeometries(geometries)
      
      // 스케일 적용
      if (options?.scale && options.scale !== 1) {
        mergedGeometry.scale(options.scale, options.scale, options.scale)
      }
      
      // STL 데이터 생성
      let stlData: Blob | string
      if (options?.binary !== false) {
        stlData = this.createBinarySTL(mergedGeometry)
      } else {
        stlData = this.createASCIISTL(mergedGeometry, options?.precision || 6)
      }
      
      // 메모리 정리
      mergedGeometry.dispose()
      geometries.forEach(g => g.dispose())
      
      return {
        success: true,
        data: stlData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during STL export'
      }
    }
  }
  
  // STL 파싱
  private parseSTL(buffer: ArrayBuffer): THREE.BufferGeometry | null {
    const isBinary = this.isBinarySTL(buffer)
    return isBinary ? this.parseBinarySTL(buffer) : this.parseASCIISTL(buffer)
  }
  
  // 바이너리 STL 여부 확인
  private isBinarySTL(buffer: ArrayBuffer): boolean {
    if (buffer.byteLength < 84) return false
    
    const view = new DataView(buffer)
    const fileSize = view.getUint32(80, true)
    const expectedSize = 84 + (fileSize * 50)
    
    return buffer.byteLength === expectedSize
  }
  
  // 바이너리 STL 파싱
  private parseBinarySTL(buffer: ArrayBuffer): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const view = new DataView(buffer)
    
    // 헤더 건너뛰기 (80 bytes)
    const triangleCount = view.getUint32(80, true)
    
    const vertices = new Float32Array(triangleCount * 9)
    const normals = new Float32Array(triangleCount * 9)
    
    let offset = 84
    for (let i = 0; i < triangleCount; i++) {
      // Normal
      const nx = view.getFloat32(offset, true)
      const ny = view.getFloat32(offset + 4, true)
      const nz = view.getFloat32(offset + 8, true)
      
      // Vertices
      const v1x = view.getFloat32(offset + 12, true)
      const v1y = view.getFloat32(offset + 16, true)
      const v1z = view.getFloat32(offset + 20, true)
      
      const v2x = view.getFloat32(offset + 24, true)
      const v2y = view.getFloat32(offset + 28, true)
      const v2z = view.getFloat32(offset + 32, true)
      
      const v3x = view.getFloat32(offset + 36, true)
      const v3y = view.getFloat32(offset + 40, true)
      const v3z = view.getFloat32(offset + 44, true)
      
      // 정점 저장
      const idx = i * 9
      vertices[idx] = v1x
      vertices[idx + 1] = v1y
      vertices[idx + 2] = v1z
      vertices[idx + 3] = v2x
      vertices[idx + 4] = v2y
      vertices[idx + 5] = v2z
      vertices[idx + 6] = v3x
      vertices[idx + 7] = v3y
      vertices[idx + 8] = v3z
      
      // 노말 저장 (각 정점에 동일한 노말)
      for (let j = 0; j < 3; j++) {
        normals[idx + j * 3] = nx
        normals[idx + j * 3 + 1] = ny
        normals[idx + j * 3 + 2] = nz
      }
      
      offset += 50 // 12 (normal) + 36 (vertices) + 2 (attribute)
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    
    return geometry
  }
  
  // ASCII STL 파싱
  private parseASCIISTL(buffer: ArrayBuffer): THREE.BufferGeometry {
    const text = new TextDecoder().decode(buffer)
    const lines = text.split('\n')
    
    const vertices: number[] = []
    const normals: number[] = []
    
    let normal: number[] = []
    let vertexCount = 0
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('facet normal')) {
        const parts = trimmed.split(/\s+/)
        normal = [
          parseFloat(parts[2]),
          parseFloat(parts[3]),
          parseFloat(parts[4])
        ]
      } else if (trimmed.startsWith('vertex')) {
        const parts = trimmed.split(/\s+/)
        vertices.push(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        )
        normals.push(...normal)
        vertexCount++
      }
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    
    return geometry
  }
  
  // 바이너리 STL 생성
  private createBinarySTL(geometry: THREE.BufferGeometry): Blob {
    const positions = geometry.attributes.position
    const triangleCount = positions.count / 3
    
    const arrayBuffer = new ArrayBuffer(84 + triangleCount * 50)
    const view = new DataView(arrayBuffer)
    
    // 헤더 (80 bytes) - "Binary STL created by fluxCAD"
    const header = 'Binary STL created by fluxCAD'
    for (let i = 0; i < header.length; i++) {
      view.setUint8(i, header.charCodeAt(i))
    }
    
    // 삼각형 개수
    view.setUint32(80, triangleCount, true)
    
    // 노말 계산
    geometry.computeVertexNormals()
    const normals = geometry.attributes.normal
    
    let offset = 84
    for (let i = 0; i < triangleCount; i++) {
      const idx = i * 3
      
      // 면 노말 계산
      const v1 = new THREE.Vector3(
        positions.getX(idx),
        positions.getY(idx),
        positions.getZ(idx)
      )
      const v2 = new THREE.Vector3(
        positions.getX(idx + 1),
        positions.getY(idx + 1),
        positions.getZ(idx + 1)
      )
      const v3 = new THREE.Vector3(
        positions.getX(idx + 2),
        positions.getY(idx + 2),
        positions.getZ(idx + 2)
      )
      
      const edge1 = v2.clone().sub(v1)
      const edge2 = v3.clone().sub(v1)
      const faceNormal = edge1.cross(edge2).normalize()
      
      // 노말 쓰기
      view.setFloat32(offset, faceNormal.x, true)
      view.setFloat32(offset + 4, faceNormal.y, true)
      view.setFloat32(offset + 8, faceNormal.z, true)
      
      // 정점 쓰기
      view.setFloat32(offset + 12, v1.x, true)
      view.setFloat32(offset + 16, v1.y, true)
      view.setFloat32(offset + 20, v1.z, true)
      
      view.setFloat32(offset + 24, v2.x, true)
      view.setFloat32(offset + 28, v2.y, true)
      view.setFloat32(offset + 32, v2.z, true)
      
      view.setFloat32(offset + 36, v3.x, true)
      view.setFloat32(offset + 40, v3.y, true)
      view.setFloat32(offset + 44, v3.z, true)
      
      // Attribute byte count (항상 0)
      view.setUint16(offset + 48, 0, true)
      
      offset += 50
    }
    
    return new Blob([arrayBuffer], { type: 'model/stl' })
  }
  
  // ASCII STL 생성
  private createASCIISTL(geometry: THREE.BufferGeometry, precision: number = 6): string {
    const positions = geometry.attributes.position
    const triangleCount = positions.count / 3
    
    geometry.computeVertexNormals()
    
    let stl = 'solid fluxCAD\n'
    
    for (let i = 0; i < triangleCount; i++) {
      const idx = i * 3
      
      // 정점 가져오기
      const v1 = new THREE.Vector3(
        positions.getX(idx),
        positions.getY(idx),
        positions.getZ(idx)
      )
      const v2 = new THREE.Vector3(
        positions.getX(idx + 1),
        positions.getY(idx + 1),
        positions.getZ(idx + 1)
      )
      const v3 = new THREE.Vector3(
        positions.getX(idx + 2),
        positions.getY(idx + 2),
        positions.getZ(idx + 2)
      )
      
      // 면 노말 계산
      const edge1 = v2.clone().sub(v1)
      const edge2 = v3.clone().sub(v1)
      const normal = edge1.cross(edge2).normalize()
      
      stl += `  facet normal ${normal.x.toFixed(precision)} ${normal.y.toFixed(precision)} ${normal.z.toFixed(precision)}\n`
      stl += '    outer loop\n'
      stl += `      vertex ${v1.x.toFixed(precision)} ${v1.y.toFixed(precision)} ${v1.z.toFixed(precision)}\n`
      stl += `      vertex ${v2.x.toFixed(precision)} ${v2.y.toFixed(precision)} ${v2.z.toFixed(precision)}\n`
      stl += `      vertex ${v3.x.toFixed(precision)} ${v3.y.toFixed(precision)} ${v3.z.toFixed(precision)}\n`
      stl += '    endloop\n'
      stl += '  endfacet\n'
    }
    
    stl += 'endsolid fluxCAD\n'
    
    return stl
  }
  
  // 객체에서 지오메트리 가져오기
  private getObjectGeometry(obj: SceneObject): THREE.BufferGeometry | null {
    if (obj.customGeometry) {
      return obj.customGeometry.clone()
    }
    
    // 기본 프리미티브 생성
    switch (obj.type) {
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
  
  // 지오메트리 병합
  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (geometries.length === 1) {
      return geometries[0]
    }
    
    // 모든 지오메트리의 정점 수 계산
    let totalVertices = 0
    geometries.forEach(g => {
      totalVertices += g.attributes.position.count
    })
    
    // 병합된 배열 생성
    const positions = new Float32Array(totalVertices * 3)
    const normals = new Float32Array(totalVertices * 3)
    
    let offset = 0
    geometries.forEach(geometry => {
      geometry.computeVertexNormals()
      
      const pos = geometry.attributes.position
      const norm = geometry.attributes.normal
      
      positions.set(pos.array, offset * 3)
      if (norm) {
        normals.set(norm.array, offset * 3)
      }
      
      offset += pos.count
    })
    
    const mergedGeometry = new THREE.BufferGeometry()
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    
    return mergedGeometry
  }
}