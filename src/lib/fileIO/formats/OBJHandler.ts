import * as THREE from 'three'
import { BaseFormatHandler } from '../core/BaseFormatHandler'
import { FileType, ImportResult, ExportResult, ImportOptions, ExportOptions } from '../types'
import { SceneObject } from '@/types/scene'
import { v4 as uuidv4 } from 'uuid'

export class OBJHandler extends BaseFormatHandler {
  type = FileType.OBJ
  extensions = ['obj']
  mimeTypes = ['model/obj', 'text/plain', 'application/x-wavefront-obj']
  canImport = true
  canExport = true
  
  // OBJ 파일 가져오기
  protected async doImport(file: File | Blob, options?: ImportOptions): Promise<ImportResult> {
    try {
      const text = await this.readFileAsText(file)
      const result = this.parseOBJ(text)
      
      if (!result.geometry) {
        return {
          success: false,
          error: 'Failed to parse OBJ file'
        }
      }
      
      // 지오메트리 중심 맞추기
      if (options?.center !== false) {
        result.geometry.center()
      }
      
      // 스케일 적용
      if (options?.scale && options.scale !== 1) {
        result.geometry.scale(options.scale, options.scale, options.scale)
      }
      
      // 재질 설정
      const material = options?.material || this.createDefaultMaterial(result.materials)
      
      // SceneObject 생성
      const object: SceneObject = {
        id: uuidv4(),
        type: 'custom',
        name: (file as File).name?.replace(/\.obj$/i, '') || 'Imported OBJ',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#888888',
        visible: true,
        customGeometry: result.geometry,
        customMaterial: material
      }
      
      const warnings: string[] = []
      if (!result.hasNormals) warnings.push('No normals found, computed automatically')
      if (!result.hasUVs) warnings.push('No texture coordinates found')
      if (result.materials.length > 1) warnings.push(`Multiple materials found (${result.materials.length}), using first one`)
      
      return {
        success: true,
        objects: [object],
        warnings
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during OBJ import'
      }
    }
  }
  
  // OBJ 파일로 내보내기
  protected async doExport(objects: SceneObject[], options?: ExportOptions): Promise<ExportResult> {
    try {
      const objData = this.createOBJ(objects, options)
      
      return {
        success: true,
        data: new Blob([objData.obj], { type: 'model/obj' })
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during OBJ export'
      }
    }
  }
  
  // OBJ 파싱
  private parseOBJ(text: string): {
    geometry: THREE.BufferGeometry
    materials: string[]
    hasNormals: boolean
    hasUVs: boolean
  } {
    const lines = text.split('\n')
    
    const vertices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const faces: Array<{
      vertices: number[]
      normals?: number[]
      uvs?: number[]
    }> = []
    
    const materials = new Set<string>()
    let currentMaterial = 'default'
    
    // OBJ 파일 파싱
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      const parts = trimmed.split(/\s+/)
      const command = parts[0]
      
      switch (command) {
        case 'v': // 정점
          vertices.push(
            parseFloat(parts[1]),
            parseFloat(parts[2]),
            parseFloat(parts[3])
          )
          break
          
        case 'vn': // 노말
          normals.push(
            parseFloat(parts[1]),
            parseFloat(parts[2]),
            parseFloat(parts[3])
          )
          break
          
        case 'vt': // 텍스처 좌표
          uvs.push(
            parseFloat(parts[1]),
            parseFloat(parts[2])
          )
          break
          
        case 'f': // 면
          const face = {
            vertices: [] as number[],
            normals: [] as number[],
            uvs: [] as number[]
          }
          
          // 각 정점 파싱 (v/vt/vn 형식)
          for (let i = 1; i < parts.length; i++) {
            const indices = parts[i].split('/')
            face.vertices.push(parseInt(indices[0]) - 1) // OBJ는 1-based index
            
            if (indices[1] !== '') {
              face.uvs.push(parseInt(indices[1]) - 1)
            }
            
            if (indices[2] !== undefined) {
              face.normals.push(parseInt(indices[2]) - 1)
            }
          }
          
          // 삼각형으로 분할 (4개 이상의 정점인 경우)
          for (let i = 1; i < face.vertices.length - 1; i++) {
            faces.push({
              vertices: [face.vertices[0], face.vertices[i], face.vertices[i + 1]],
              normals: face.normals.length > 0 ? [face.normals[0], face.normals[i], face.normals[i + 1]] : undefined,
              uvs: face.uvs.length > 0 ? [face.uvs[0], face.uvs[i], face.uvs[i + 1]] : undefined
            })
          }
          break
          
        case 'usemtl': // 재질 사용
          currentMaterial = parts[1]
          materials.add(currentMaterial)
          break
          
        case 'mtllib': // 재질 라이브러리 (현재는 무시)
          break
      }
    }
    
    // BufferGeometry 생성
    const geometry = new THREE.BufferGeometry()
    
    // 면 데이터를 정점 배열로 변환
    const finalVertices: number[] = []
    const finalNormals: number[] = []
    const finalUVs: number[] = []
    
    for (const face of faces) {
      // 각 삼각형의 정점
      for (let i = 0; i < 3; i++) {
        const vIdx = face.vertices[i] * 3
        finalVertices.push(vertices[vIdx], vertices[vIdx + 1], vertices[vIdx + 2])
        
        // 노말
        if (face.normals && face.normals[i] >= 0) {
          const nIdx = face.normals[i] * 3
          finalNormals.push(normals[nIdx], normals[nIdx + 1], normals[nIdx + 2])
        }
        
        // UV
        if (face.uvs && face.uvs[i] >= 0) {
          const uvIdx = face.uvs[i] * 2
          finalUVs.push(uvs[uvIdx], uvs[uvIdx + 1])
        }
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(finalVertices, 3))
    
    const hasNormals = finalNormals.length > 0
    if (hasNormals) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(finalNormals, 3))
    } else {
      geometry.computeVertexNormals()
    }
    
    const hasUVs = finalUVs.length > 0
    if (hasUVs) {
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(finalUVs, 2))
    }
    
    return {
      geometry,
      materials: Array.from(materials),
      hasNormals,
      hasUVs
    }
  }
  
  // OBJ 생성
  private createOBJ(objects: SceneObject[], options?: ExportOptions): {
    obj: string
    mtl?: string
  } {
    let obj = '# OBJ file created by fluxCAD\n'
    obj += `# ${new Date().toISOString()}\n`
    obj += `# ${objects.length} objects\n\n`
    
    let vertexOffset = 0
    let normalOffset = 0
    let uvOffset = 0
    
    const precision = options?.precision || 6
    
    // 각 객체 처리
    objects.forEach((object, objIndex) => {
      obj += `# Object ${objIndex + 1}: ${object.name}\n`
      obj += `o ${object.name.replace(/\s+/g, '_')}\n`
      
      // 지오메트리 가져오기
      const geometry = this.getObjectGeometry(object)
      if (!geometry) return
      
      // 변환 행렬 적용
      const matrix = new THREE.Matrix4()
      matrix.compose(
        new THREE.Vector3(...object.position),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(...object.rotation)),
        new THREE.Vector3(...object.scale)
      )
      geometry.applyMatrix4(matrix)
      
      // 스케일 적용
      if (options?.scale && options.scale !== 1) {
        geometry.scale(options.scale, options.scale, options.scale)
      }
      
      // 노말 계산
      if (options?.includeNormals !== false) {
        geometry.computeVertexNormals()
      }
      
      const positions = geometry.attributes.position
      const normals = geometry.attributes.normal
      const uvs = geometry.attributes.uv
      
      // 정점 출력
      obj += '# Vertices\n'
      for (let i = 0; i < positions.count; i++) {
        obj += `v ${positions.getX(i).toFixed(precision)} ${positions.getY(i).toFixed(precision)} ${positions.getZ(i).toFixed(precision)}\n`
      }
      
      // UV 출력
      if (uvs && options?.includeTextures !== false) {
        obj += '# Texture coordinates\n'
        for (let i = 0; i < uvs.count; i++) {
          obj += `vt ${uvs.getX(i).toFixed(precision)} ${uvs.getY(i).toFixed(precision)}\n`
        }
      }
      
      // 노말 출력
      if (normals && options?.includeNormals !== false) {
        obj += '# Normals\n'
        for (let i = 0; i < normals.count; i++) {
          obj += `vn ${normals.getX(i).toFixed(precision)} ${normals.getY(i).toFixed(precision)} ${normals.getZ(i).toFixed(precision)}\n`
        }
      }
      
      // 면 출력
      obj += '# Faces\n'
      if (options?.includeColors !== false && object.color) {
        obj += `usemtl material_${objIndex}\n`
      }
      
      const hasNormals = normals && options?.includeNormals !== false
      const hasUVs = uvs && options?.includeTextures !== false
      
      // 인덱스가 있는 경우
      if (geometry.index) {
        const indices = geometry.index
        for (let i = 0; i < indices.count; i += 3) {
          obj += 'f'
          for (let j = 0; j < 3; j++) {
            const idx = indices.getX(i + j)
            const v = idx + vertexOffset + 1 // OBJ는 1-based
            const vt = hasUVs ? idx + uvOffset + 1 : ''
            const vn = hasNormals ? idx + normalOffset + 1 : ''
            
            if (hasUVs || hasNormals) {
              obj += ` ${v}/${vt}/${vn}`
            } else {
              obj += ` ${v}`
            }
          }
          obj += '\n'
        }
      } else {
        // 인덱스가 없는 경우 (모든 정점이 순서대로)
        for (let i = 0; i < positions.count; i += 3) {
          obj += 'f'
          for (let j = 0; j < 3; j++) {
            const idx = i + j
            const v = idx + vertexOffset + 1
            const vt = hasUVs ? idx + uvOffset + 1 : ''
            const vn = hasNormals ? idx + normalOffset + 1 : ''
            
            if (hasUVs || hasNormals) {
              obj += ` ${v}/${vt}/${vn}`
            } else {
              obj += ` ${v}`
            }
          }
          obj += '\n'
        }
      }
      
      // 오프셋 업데이트
      vertexOffset += positions.count
      if (hasNormals) normalOffset += normals!.count
      if (hasUVs) uvOffset += uvs!.count
      
      obj += '\n'
      
      // 메모리 정리
      geometry.dispose()
    })
    
    return { obj }
  }
  
  // 기본 재질 생성
  private createDefaultMaterial(materialNames: string[]): THREE.Material {
    return new THREE.MeshPhongMaterial({
      color: 0x888888,
      side: THREE.DoubleSide,
      flatShading: false
    })
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
}