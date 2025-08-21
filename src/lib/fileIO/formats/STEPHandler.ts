import * as THREE from 'three'
import { BaseFormatHandler } from '../core/BaseFormatHandler'
import { FileType, ImportResult, ExportResult, ImportOptions, ExportOptions } from '../types'
import { SceneObject } from '@/types/scene'
import { v4 as uuidv4 } from 'uuid'

// occt-import-js의 타입 정의
interface OcctImportJS {
  Init: () => Promise<void>
  ReadStepFile: (fileContent: Uint8Array, params: any) => any
  ReadIgesFile: (fileContent: Uint8Array, params: any) => any
  ReadBrepFile: (fileContent: Uint8Array, params: any) => any
}

// 메시 데이터 타입
interface OcctMesh {
  attributes: {
    position: { array: number[] }
    normal?: { array: number[] }
  }
  index?: { array: number[] }
  color?: number[]
}

// OCCT 결과 타입
interface OcctResult {
  success: boolean
  meshes?: OcctMesh[]
  shapes?: any[]
  error?: string
}

// 전역 OCCT 인스턴스 (lazy loading)
let occtInstance: OcctImportJS | null = null

export class STEPHandler extends BaseFormatHandler {
  type = FileType.STEP
  extensions = ['step', 'stp', 'STEP', 'STP']
  mimeTypes = ['application/step', 'application/x-step', 'model/step', 'text/plain']
  canImport = true
  canExport = false // STEP 내보내기는 더 복잡하므로 현재는 지원하지 않음
  
  // OCCT 초기화
  private async initializeOcct(): Promise<OcctImportJS> {
    if (occtInstance) {
      return occtInstance
    }
    
    try {
      console.log('Loading occt-import-js...')
      
      // occt-import-js는 함수로 import됨
      const initOcct = (await import('occt-import-js')).default
      
      if (typeof initOcct !== 'function') {
        throw new Error('Invalid occt-import-js module')
      }
      
      // 초기화 - WASM 파일 로드
      occtInstance = await initOcct({
        // locateFile을 지정하지 않으면 자동으로 찾음
      })
      
      console.log('occt-import-js loaded successfully')
      return occtInstance
    } catch (error) {
      console.error('Failed to load occt-import-js:', error)
      throw new Error('Failed to initialize STEP parser. Please try again.')
    }
  }
  
  // STEP 파일 가져오기
  protected async doImport(file: File | Blob, options?: ImportOptions): Promise<ImportResult> {
    try {
      // OCCT 초기화
      const occt = await this.initializeOcct()
      
      // 파일을 ArrayBuffer로 읽기
      const arrayBuffer = await this.readFileAsArrayBuffer(file)
      const fileContent = new Uint8Array(arrayBuffer)
      
      // STEP 파일 파싱
      console.log('Parsing STEP file...')
      const result = await this.parseSTEPFile(occt, fileContent)
      
      if (!result.success || !result.meshes || result.meshes.length === 0) {
        return {
          success: false,
          error: result.error || 'No geometry found in STEP file'
        }
      }
      
      console.log(`Found ${result.meshes.length} meshes in STEP file`)
      
      // 메시를 SceneObject로 변환
      const objects: SceneObject[] = []
      
      for (let i = 0; i < result.meshes.length; i++) {
        const mesh = result.meshes[i]
        const geometry = this.createGeometryFromOcctMesh(mesh)
        
        if (!geometry) continue
        
        // 지오메트리 중심 맞추기
        if (options?.center !== false) {
          geometry.center()
        }
        
        // 스케일 적용
        if (options?.scale && options?.scale !== 1) {
          geometry.scale(options.scale, options.scale, options.scale)
        }
        
        // 재질 생성
        const color = mesh.color ? 
          `#${Math.floor(mesh.color[0] * 255).toString(16).padStart(2, '0')}${Math.floor(mesh.color[1] * 255).toString(16).padStart(2, '0')}${Math.floor(mesh.color[2] * 255).toString(16).padStart(2, '0')}` 
          : '#888888'
        
        const material = new THREE.MeshPhongMaterial({
          color: color,
          side: THREE.DoubleSide,
          flatShading: false
        })
        
        // SceneObject 생성
        const object: SceneObject = {
          id: uuidv4(),
          type: 'custom',
          name: `${(file as File).name?.replace(/\.(step|stp)$/i, '') || 'STEP'}_part_${i + 1}`,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: color,
          visible: true,
          customGeometry: geometry,
          customMaterial: material
        }
        
        objects.push(object)
      }
      
      const warnings: string[] = []
      if (result.meshes.length > 1) {
        warnings.push(`STEP file contains ${result.meshes.length} parts`)
      }
      
      return {
        success: true,
        objects,
        warnings
      }
    } catch (error) {
      console.error('STEP import error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during STEP import'
      }
    }
  }
  
  // STEP 파일 파싱
  private async parseSTEPFile(occt: OcctImportJS, fileContent: Uint8Array): Promise<OcctResult> {
    try {
      // 파싱 파라미터
      const params = {
        linearDeflection: 0.1,     // 선형 편차 (정밀도)
        angularDeflection: 0.5,    // 각도 편차
        computeNormals: true,      // 노말 계산
        debugInfo: false
      }
      
      // STEP 파일 읽기
      const result = occt.ReadStepFile(fileContent, params)
      
      // 결과 확인
      if (!result || typeof result !== 'object') {
        return {
          success: false,
          error: 'Invalid result from STEP parser'
        }
      }
      
      // 성공 여부 확인
      if (result.success === false) {
        return {
          success: false,
          error: result.error || 'Failed to parse STEP file'
        }
      }
      
      // 메시 데이터 추출
      const meshes = this.extractMeshes(result)
      
      return {
        success: true,
        meshes,
        shapes: result.shapes
      }
    } catch (error) {
      console.error('STEP parsing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'STEP parsing failed'
      }
    }
  }
  
  // 메시 데이터 추출
  private extractMeshes(result: any): OcctMesh[] {
    const meshes: OcctMesh[] = []
    
    // 다양한 결과 형식 처리
    if (result.meshes && Array.isArray(result.meshes)) {
      // 직접 메시 배열
      meshes.push(...result.meshes)
    } else if (result.faces && Array.isArray(result.faces)) {
      // 면 기반 데이터
      for (const face of result.faces) {
        if (face.mesh) {
          meshes.push(face.mesh)
        }
      }
    } else if (result.shapes && Array.isArray(result.shapes)) {
      // 형상 기반 데이터
      for (const shape of result.shapes) {
        if (shape.mesh) {
          meshes.push(shape.mesh)
        } else if (shape.faces) {
          for (const face of shape.faces) {
            if (face.mesh) {
              meshes.push(face.mesh)
            }
          }
        }
      }
    } else if (result.mesh) {
      // 단일 메시
      meshes.push(result.mesh)
    }
    
    return meshes
  }
  
  // OCCT 메시를 Three.js BufferGeometry로 변환
  private createGeometryFromOcctMesh(mesh: OcctMesh): THREE.BufferGeometry | null {
    if (!mesh.attributes || !mesh.attributes.position) {
      console.warn('Invalid mesh data: missing position attribute')
      return null
    }
    
    const geometry = new THREE.BufferGeometry()
    
    // 위치 속성
    const positions = new Float32Array(mesh.attributes.position.array)
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    // 노말 속성
    if (mesh.attributes.normal) {
      const normals = new Float32Array(mesh.attributes.normal.array)
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    } else {
      // 노말이 없으면 계산
      geometry.computeVertexNormals()
    }
    
    // 인덱스
    if (mesh.index && mesh.index.array && mesh.index.array.length > 0) {
      // 인덱스 타입에 따라 처리
      const maxIndex = Math.max(...mesh.index.array)
      if (maxIndex > 65535) {
        // 32비트 인덱스
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.index.array), 1))
      } else {
        // 16비트 인덱스
        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(mesh.index.array), 1))
      }
    }
    
    // 경계 계산
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    
    return geometry
  }
  
  // STEP 내보내기 (현재 미지원)
  protected async doExport(objects: SceneObject[], options?: ExportOptions): Promise<ExportResult> {
    return {
      success: false,
      error: 'STEP export is not yet supported. Please use STL or OBJ format for export.'
    }
  }
}