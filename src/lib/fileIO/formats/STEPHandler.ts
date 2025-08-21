import * as THREE from 'three'
import { BaseFormatHandler } from '../core/BaseFormatHandler'
import { FileType, ImportResult, ExportResult, ImportOptions, ExportOptions } from '../types'
import { SceneObject } from '@/types/scene'
import { v4 as uuidv4 } from 'uuid'

// 전역 변수로 OCCT 인스턴스 관리
declare global {
  interface Window {
    occtimportjs?: () => Promise<any>
    _occtInstance?: any
  }
}

// 메시 데이터 타입
interface OcctMesh {
  name?: string
  color?: number[]
  attributes: {
    position: { array: number[] }
    normal?: { array: number[] }
  }
  index?: { array: number[] }
}

export class STEPHandler extends BaseFormatHandler {
  type = FileType.STEP
  extensions = ['step', 'stp', 'STEP', 'STP']
  mimeTypes = ['application/step', 'application/x-step', 'model/step', 'text/plain']
  canImport = true
  canExport = false
  
  // OCCT 초기화 - 매우 단순한 접근
  private async initializeOcct(): Promise<any> {
    // 이미 초기화되어 있으면 반환
    if (window._occtInstance) {
      console.log('Using cached OCCT instance')
      return window._occtInstance
    }
    
    try {
      console.log('Initializing OCCT...')
      
      // occt-import-js가 이미 로드되어 있는지 확인
      if (!window.occtimportjs) {
        console.log('Loading occt-import-js script...')
        
        // 스크립트를 동적으로 로드
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = '/node_modules/occt-import-js/dist/occt-import-js.js'
          script.async = true
          
          script.onload = () => {
            console.log('Script loaded')
            resolve()
          }
          
          script.onerror = () => {
            reject(new Error('Failed to load occt-import-js script'))
          }
          
          document.head.appendChild(script)
        })
      }
      
      // occtimportjs 함수가 있는지 확인
      if (!window.occtimportjs) {
        throw new Error('occtimportjs function not found after script load')
      }
      
      console.log('Initializing OCCT module...')
      
      // OCCT 초기화 - WASM 경로 지정
      const occt = await window.occtimportjs({
        locateFile: (filename: string) => {
          if (filename.endsWith('.wasm')) {
            return '/occt-import-js.wasm'
          }
          return filename
        }
      })
      
      console.log('OCCT initialized:', occt)
      console.log('Available methods:', Object.keys(occt))
      
      // 필수 메서드 확인
      if (!occt.ReadStepFile) {
        throw new Error('ReadStepFile method not found')
      }
      
      // 전역 변수에 저장
      window._occtInstance = occt
      
      return occt
    } catch (error) {
      console.error('OCCT initialization error:', error)
      throw new Error(`Failed to initialize STEP parser: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // STEP 파일 가져오기
  protected async doImport(file: File | Blob, options?: ImportOptions): Promise<ImportResult> {
    try {
      console.log('Importing STEP file:', (file as File).name)
      
      // OCCT 초기화
      const occt = await this.initializeOcct()
      
      // 파일 읽기
      const arrayBuffer = await this.readFileAsArrayBuffer(file)
      const fileContent = new Uint8Array(arrayBuffer)
      
      console.log('File size:', fileContent.length, 'bytes')
      
      // STEP 파일 헤더 확인
      const header = new TextDecoder().decode(fileContent.slice(0, 20))
      if (!header.includes('ISO-10303-21')) {
        return {
          success: false,
          error: 'Not a valid STEP file'
        }
      }
      
      // 파싱 파라미터
      const params = {
        linearUnit: 'millimeter',
        linearDeflectionType: 'bounding_box_ratio',
        linearDeflection: 0.001,
        angularDeflection: 0.1
      }
      
      console.log('Parsing STEP file...')
      
      // STEP 파일 파싱
      const result = occt.ReadStepFile(fileContent, params)
      
      console.log('Parse result:', result)
      
      if (!result || !result.success) {
        return {
          success: false,
          error: result?.error || 'Failed to parse STEP file'
        }
      }
      
      if (!result.meshes || result.meshes.length === 0) {
        return {
          success: false,
          error: 'No geometry found in STEP file'
        }
      }
      
      console.log(`Found ${result.meshes.length} meshes`)
      
      // 메시를 SceneObject로 변환
      const objects: SceneObject[] = []
      const baseName = (file as File).name?.replace(/\.(step|stp)$/i, '') || 'STEP'
      
      for (let i = 0; i < result.meshes.length; i++) {
        const mesh = result.meshes[i] as OcctMesh
        
        // BufferGeometry 생성
        const geometry = new THREE.BufferGeometry()
        
        // 위치 데이터
        if (mesh.attributes?.position?.array) {
          const positions = new Float32Array(mesh.attributes.position.array)
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        } else {
          console.warn(`Mesh ${i} has no position data`)
          continue
        }
        
        // 노말 데이터
        if (mesh.attributes?.normal?.array) {
          const normals = new Float32Array(mesh.attributes.normal.array)
          geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
        } else {
          geometry.computeVertexNormals()
        }
        
        // 인덱스 데이터
        if (mesh.index?.array && mesh.index.array.length > 0) {
          const indices = new Uint32Array(mesh.index.array)
          geometry.setIndex(new THREE.BufferAttribute(indices, 1))
        }
        
        // 지오메트리 마무리
        geometry.computeBoundingBox()
        geometry.computeBoundingSphere()
        
        // 중심 맞추기
        if (options?.center !== false) {
          geometry.center()
        }
        
        // 스케일 적용
        if (options?.scale && options.scale !== 1) {
          geometry.scale(options.scale, options.scale, options.scale)
        }
        
        // 색상
        let color = '#888888'
        if (mesh.color && mesh.color.length >= 3) {
          const r = Math.floor(mesh.color[0] * 255).toString(16).padStart(2, '0')
          const g = Math.floor(mesh.color[1] * 255).toString(16).padStart(2, '0')
          const b = Math.floor(mesh.color[2] * 255).toString(16).padStart(2, '0')
          color = `#${r}${g}${b}`
        }
        
        // 재질
        const material = new THREE.MeshPhongMaterial({
          color: color,
          side: THREE.DoubleSide,
          flatShading: false
        })
        
        // SceneObject 생성
        const object: SceneObject = {
          id: uuidv4(),
          type: 'custom',
          name: `${baseName}_${mesh.name || `part_${i + 1}`}`,
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
        error: error instanceof Error ? error.message : 'Failed to import STEP file'
      }
    }
  }
  
  // STEP 내보내기 (미지원)
  protected async doExport(objects: SceneObject[], options?: ExportOptions): Promise<ExportResult> {
    return {
      success: false,
      error: 'STEP export is not yet supported. Please use STL or OBJ format for export.'
    }
  }
}