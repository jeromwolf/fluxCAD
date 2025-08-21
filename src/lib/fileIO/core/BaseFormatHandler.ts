import { 
  FileFormatHandler, 
  FileType, 
  ImportOptions, 
  ExportOptions, 
  ImportResult, 
  ExportResult,
  ProjectData,
  ProjectImportResult
} from '../types'
import { SceneObject } from '@/types/scene'

// 추상 기본 클래스 - 모든 파일 포맷 핸들러가 상속
export abstract class BaseFormatHandler implements FileFormatHandler {
  abstract type: FileType
  abstract extensions: string[]
  abstract mimeTypes: string[]
  abstract canImport: boolean
  abstract canExport: boolean
  
  // 파일 검증 - 기본 구현
  async validate(file: File | Blob): Promise<boolean> {
    // 파일 크기 검증 (최대 100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      console.error(`File too large: ${file.size} bytes (max: ${maxSize} bytes)`)
      return false
    }
    
    // MIME 타입 검증
    if (file.type && this.mimeTypes.length > 0) {
      const isValidMime = this.mimeTypes.includes(file.type) || 
                         this.mimeTypes.includes('*/*')
      if (!isValidMime) {
        console.error(`Invalid MIME type: ${file.type}`)
        return false
      }
    }
    
    // 파일 확장자 검증 (File 객체인 경우)
    if ('name' in file) {
      const ext = this.getFileExtension(file.name)
      if (ext && !this.extensions.includes(ext)) {
        console.error(`Invalid file extension: ${ext}`)
        return false
      }
    }
    
    return true
  }
  
  // 가져오기 - 하위 클래스에서 구현
  async import(file: File | Blob, options?: ImportOptions): Promise<ImportResult> {
    if (!this.canImport) {
      return {
        success: false,
        error: `Import not supported for ${this.type} format`
      }
    }
    
    const isValid = await this.validate(file)
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid file format'
      }
    }
    
    try {
      return await this.doImport(file, options)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown import error'
      }
    }
  }
  
  // 내보내기 - 하위 클래스에서 구현
  async export(objects: SceneObject[], options?: ExportOptions): Promise<ExportResult> {
    if (!this.canExport) {
      return {
        success: false,
        error: `Export not supported for ${this.type} format`
      }
    }
    
    if (objects.length === 0) {
      return {
        success: false,
        error: 'No objects to export'
      }
    }
    
    try {
      return await this.doExport(objects, options)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      }
    }
  }
  
  // 프로젝트 내보내기 (선택적)
  async exportProject(data: ProjectData, options?: ExportOptions): Promise<ExportResult> {
    return {
      success: false,
      error: 'Project export not supported for this format'
    }
  }
  
  // 프로젝트 가져오기 (선택적)
  async importProject(file: File | Blob, options?: ImportOptions): Promise<ProjectImportResult> {
    return {
      success: false,
      error: 'Project import not supported for this format'
    }
  }
  
  // 하위 클래스에서 구현해야 할 메서드
  protected abstract doImport(file: File | Blob, options?: ImportOptions): Promise<ImportResult>
  protected abstract doExport(objects: SceneObject[], options?: ExportOptions): Promise<ExportResult>
  
  // 유틸리티 메서드
  protected getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
  }
  
  protected async readFileAsText(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }
  
  protected async readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
      reader.onerror = (e) => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }
  
  protected downloadFile(data: Blob | string, filename: string): void {
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: 'text/plain' })
      : data
      
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    
    // 메모리 정리
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}