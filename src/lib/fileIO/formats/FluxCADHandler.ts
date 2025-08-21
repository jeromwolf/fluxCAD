import * as THREE from 'three'
import { BaseFormatHandler } from '../core/BaseFormatHandler'
import { 
  FileType, 
  ImportResult, 
  ExportResult, 
  ImportOptions, 
  ExportOptions,
  ProjectData,
  ProjectImportResult
} from '../types'
import { SceneObject } from '@/types/scene'
import { Sketch } from '@/types/sketch'

export class FluxCADHandler extends BaseFormatHandler {
  type = FileType.FLUXCAD
  extensions = ['fluxcad', 'flux']
  mimeTypes = ['application/json', 'application/x-fluxcad']
  canImport = true
  canExport = true
  
  // 프로젝트 버전 관리
  private static readonly CURRENT_VERSION = '1.0.0'
  private static readonly COMPATIBLE_VERSIONS = ['1.0.0']
  
  // 일반 가져오기/내보내기는 지원하지 않음
  protected async doImport(file: File | Blob, options?: ImportOptions): Promise<ImportResult> {
    // 프로젝트 가져오기로 리다이렉트
    const result = await this.importProject(file, options)
    return {
      success: result.success,
      objects: result.objects,
      sketches: result.sketches,
      error: result.error,
      warnings: result.warnings
    }
  }
  
  protected async doExport(objects: SceneObject[], options?: ExportOptions): Promise<ExportResult> {
    return {
      success: false,
      error: 'Use exportProject method for FluxCAD files'
    }
  }
  
  // 프로젝트 내보내기
  async exportProject(data: ProjectData, options?: ExportOptions): Promise<ExportResult> {
    try {
      // 버전 설정
      const projectData: ProjectData = {
        ...data,
        version: FluxCADHandler.CURRENT_VERSION,
        metadata: {
          ...data.metadata,
          modified: new Date()
        }
      }
      
      // 지오메트리와 재질 직렬화
      const serializedData = this.serializeProjectData(projectData)
      
      // JSON으로 변환
      const jsonString = JSON.stringify(serializedData, null, 2)
      
      // 압축 옵션이 있으면 압축 (향후 구현)
      const finalData = options?.binary 
        ? await this.compressData(jsonString)
        : jsonString
      
      return {
        success: true,
        data: new Blob([finalData], { type: 'application/json' })
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export project'
      }
    }
  }
  
  // 프로젝트 가져오기
  async importProject(file: File | Blob, options?: ImportOptions): Promise<ProjectImportResult> {
    try {
      // 파일 읽기
      const text = await this.readFileAsText(file)
      let data: any
      
      try {
        data = JSON.parse(text)
      } catch {
        // 압축된 파일일 수 있음
        const decompressed = await this.decompressData(text)
        data = JSON.parse(decompressed)
      }
      
      // 버전 확인
      if (!this.isVersionCompatible(data.version)) {
        return {
          success: false,
          error: `Incompatible project version: ${data.version}. Current version: ${FluxCADHandler.CURRENT_VERSION}`
        }
      }
      
      // 프로젝트 데이터 역직렬화
      const projectData = this.deserializeProjectData(data)
      
      return {
        success: true,
        objects: projectData.scene.objects,
        sketches: projectData.sketches,
        projectData,
        warnings: this.validateProjectData(projectData)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import project'
      }
    }
  }
  
  // 프로젝트 데이터 직렬화
  private serializeProjectData(data: ProjectData): any {
    return {
      version: data.version,
      metadata: {
        ...data.metadata,
        created: data.metadata.created.toISOString(),
        modified: data.metadata.modified.toISOString()
      },
      scene: {
        objects: data.scene.objects.map(obj => this.serializeObject(obj)),
        selectedObjectId: data.scene.selectedObjectId
      },
      sketches: data.sketches.map(sketch => this.serializeSketch(sketch)),
      viewport: data.viewport,
      extensions: data.extensions
    }
  }
  
  // 객체 직렬화
  private serializeObject(obj: SceneObject): any {
    const serialized: any = {
      id: obj.id,
      type: obj.type,
      name: obj.name,
      position: obj.position,
      rotation: obj.rotation,
      scale: obj.scale,
      color: obj.color,
      visible: obj.visible
    }
    
    // 커스텀 지오메트리 직렬화
    if (obj.customGeometry) {
      serialized.customGeometry = this.serializeGeometry(obj.customGeometry)
    }
    
    // 커스텀 재질 직렬화
    if (obj.customMaterial) {
      serialized.customMaterial = this.serializeMaterial(obj.customMaterial)
    }
    
    return serialized
  }
  
  // 지오메트리 직렬화
  private serializeGeometry(geometry: any): any {
    const positions = geometry.attributes.position
    const normals = geometry.attributes.normal
    const uvs = geometry.attributes.uv
    
    const serialized: any = {
      type: 'BufferGeometry',
      attributes: {
        position: {
          array: Array.from(positions.array),
          itemSize: positions.itemSize
        }
      }
    }
    
    if (normals) {
      serialized.attributes.normal = {
        array: Array.from(normals.array),
        itemSize: normals.itemSize
      }
    }
    
    if (uvs) {
      serialized.attributes.uv = {
        array: Array.from(uvs.array),
        itemSize: uvs.itemSize
      }
    }
    
    if (geometry.index) {
      serialized.index = {
        array: Array.from(geometry.index.array)
      }
    }
    
    return serialized
  }
  
  // 재질 직렬화
  private serializeMaterial(material: any): any {
    return {
      type: material.type || 'MeshPhongMaterial',
      color: material.color?.getHexString ? `#${material.color.getHexString()}` : '#888888',
      transparent: material.transparent || false,
      opacity: material.opacity || 1,
      side: material.side || 2, // THREE.DoubleSide
      flatShading: material.flatShading || false
    }
  }
  
  // 스케치 직렬화
  private serializeSketch(sketch: Sketch): any {
    // 스케치는 이미 직렬화 가능한 형태
    return sketch
  }
  
  // 프로젝트 데이터 역직렬화
  private deserializeProjectData(data: any): ProjectData {
    return {
      version: data.version,
      metadata: {
        ...data.metadata,
        created: new Date(data.metadata.created),
        modified: new Date(data.metadata.modified)
      },
      scene: {
        objects: data.scene.objects.map((obj: any) => this.deserializeObject(obj)),
        selectedObjectId: data.scene.selectedObjectId
      },
      sketches: data.sketches.map((sketch: any) => this.deserializeSketch(sketch)),
      viewport: data.viewport,
      extensions: data.extensions
    }
  }
  
  // 객체 역직렬화
  private deserializeObject(data: any): SceneObject {
    const obj: SceneObject = {
      id: data.id,
      type: data.type,
      name: data.name,
      position: data.position,
      rotation: data.rotation,
      scale: data.scale,
      color: data.color,
      visible: data.visible
    }
    
    // 커스텀 지오메트리 역직렬화
    if (data.customGeometry) {
      obj.customGeometry = this.deserializeGeometry(data.customGeometry)
    }
    
    // 커스텀 재질 역직렬화
    if (data.customMaterial) {
      obj.customMaterial = this.deserializeMaterial(data.customMaterial)
    }
    
    return obj
  }
  
  // 지오메트리 역직렬화
  private deserializeGeometry(data: any): any {
    
    const geometry = new THREE.BufferGeometry()
    
    // 속성 복원
    if (data.attributes.position) {
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
          new Float32Array(data.attributes.position.array),
          data.attributes.position.itemSize
        )
      )
    }
    
    if (data.attributes.normal) {
      geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(
          new Float32Array(data.attributes.normal.array),
          data.attributes.normal.itemSize
        )
      )
    }
    
    if (data.attributes.uv) {
      geometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(
          new Float32Array(data.attributes.uv.array),
          data.attributes.uv.itemSize
        )
      )
    }
    
    if (data.index) {
      geometry.setIndex(
        new THREE.BufferAttribute(
          new Uint32Array(data.index.array),
          1
        )
      )
    }
    
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    
    return geometry
  }
  
  // 재질 역직렬화
  private deserializeMaterial(data: any): any {
    
    // 재질 타입에 따라 생성
    let material
    switch (data.type) {
      case 'MeshBasicMaterial':
        material = new THREE.MeshBasicMaterial()
        break
      case 'MeshLambertMaterial':
        material = new THREE.MeshLambertMaterial()
        break
      case 'MeshPhongMaterial':
      default:
        material = new THREE.MeshPhongMaterial()
        break
    }
    
    // 속성 설정
    if (data.color) {
      material.color = new THREE.Color(data.color)
    }
    material.transparent = data.transparent || false
    material.opacity = data.opacity || 1
    material.side = data.side || THREE.DoubleSide
    material.flatShading = data.flatShading || false
    
    return material
  }
  
  // 스케치 역직렬화
  private deserializeSketch(data: any): Sketch {
    // 스케치는 이미 올바른 형태
    return data as Sketch
  }
  
  // 버전 호환성 확인
  private isVersionCompatible(version: string): boolean {
    return FluxCADHandler.COMPATIBLE_VERSIONS.includes(version)
  }
  
  // 프로젝트 데이터 검증
  private validateProjectData(data: ProjectData): string[] {
    const warnings: string[] = []
    
    // 객체 검증
    if (!data.scene.objects || data.scene.objects.length === 0) {
      warnings.push('No objects found in project')
    }
    
    // 메타데이터 검증
    if (!data.metadata.name) {
      warnings.push('Project name is missing')
    }
    
    // 버전 검증
    if (data.version !== FluxCADHandler.CURRENT_VERSION) {
      warnings.push(`Project was created with version ${data.version}, current version is ${FluxCADHandler.CURRENT_VERSION}`)
    }
    
    return warnings
  }
  
  // 데이터 압축 (향후 구현)
  private async compressData(data: string): Promise<string> {
    // 현재는 압축하지 않음
    return data
  }
  
  // 데이터 압축 해제 (향후 구현)
  private async decompressData(data: string): Promise<string> {
    // 현재는 압축하지 않음
    return data
  }
}