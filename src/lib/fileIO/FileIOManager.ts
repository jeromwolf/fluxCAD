import { 
  FileFormatHandler, 
  FileType, 
  ImportOptions, 
  ExportOptions, 
  ImportResult, 
  ExportResult,
  FileInfo,
  FileIOEvent,
  ProjectData
} from './types'
import { SceneObject } from '@/types/scene'

// 싱글톤 파일 입출력 매니저
export class FileIOManager {
  private static instance: FileIOManager
  private handlers: Map<FileType, FileFormatHandler> = new Map()
  private eventListeners: Map<string, Set<(event: FileIOEvent) => void>> = new Map()
  
  private constructor() {}
  
  // 싱글톤 인스턴스 가져오기
  static getInstance(): FileIOManager {
    if (!FileIOManager.instance) {
      FileIOManager.instance = new FileIOManager()
    }
    return FileIOManager.instance
  }
  
  // 파일 포맷 핸들러 등록
  registerHandler(handler: FileFormatHandler): void {
    this.handlers.set(handler.type, handler)
    console.log(`Registered file handler for ${handler.type}`)
  }
  
  // 파일 포맷 핸들러 제거
  unregisterHandler(type: FileType): void {
    this.handlers.delete(type)
  }
  
  // 지원되는 파일 타입 가져오기
  getSupportedTypes(operation: 'import' | 'export'): FileType[] {
    const types: FileType[] = []
    this.handlers.forEach((handler, type) => {
      if (operation === 'import' && handler.canImport) {
        types.push(type)
      } else if (operation === 'export' && handler.canExport) {
        types.push(type)
      }
    })
    return types
  }
  
  // 파일 확장자로 파일 타입 추측
  guessFileType(filename: string): FileType | null {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (!ext) return null
    
    for (const [type, handler] of this.handlers) {
      if (handler.extensions.includes(ext)) {
        return type
      }
    }
    return null
  }
  
  // 파일 정보 가져오기
  getFileInfo(file: File): FileInfo {
    const type = this.guessFileType(file.name) || FileType.OBJ
    return {
      name: file.name,
      type,
      size: file.size,
      lastModified: new Date(file.lastModified)
    }
  }
  
  // 파일 가져오기
  async importFile(
    file: File, 
    type?: FileType, 
    options?: ImportOptions
  ): Promise<ImportResult> {
    // 파일 타입 결정
    const fileType = type || this.guessFileType(file.name)
    if (!fileType) {
      return {
        success: false,
        error: 'Unknown file type'
      }
    }
    
    // 핸들러 가져오기
    const handler = this.handlers.get(fileType)
    if (!handler || !handler.canImport) {
      return {
        success: false,
        error: `Import not supported for ${fileType} files`
      }
    }
    
    // 이벤트 발생
    this.emitEvent({
      type: 'import-start',
      fileType,
      fileName: file.name
    })
    
    // 가져오기 실행
    const result = await handler.import(file, options)
    
    // 완료 이벤트
    this.emitEvent({
      type: 'import-complete',
      fileType,
      fileName: file.name,
      result
    })
    
    return result
  }
  
  // 파일 내보내기
  async exportFile(
    objects: SceneObject[],
    type: FileType,
    filename: string,
    options?: ExportOptions
  ): Promise<ExportResult> {
    // 핸들러 가져오기
    const handler = this.handlers.get(type)
    if (!handler || !handler.canExport) {
      return {
        success: false,
        error: `Export not supported for ${type} files`
      }
    }
    
    // 이벤트 발생
    this.emitEvent({
      type: 'export-start',
      fileType: type,
      fileName: filename
    })
    
    // 내보내기 실행
    const result = await handler.export(objects, options)
    
    // 성공 시 다운로드
    if (result.success && result.data) {
      this.downloadFile(result.data, filename)
    }
    
    // 완료 이벤트
    this.emitEvent({
      type: 'export-complete',
      fileType: type,
      fileName: filename,
      result
    })
    
    return result
  }
  
  // 프로젝트 저장
  async saveProject(
    data: ProjectData,
    filename: string,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const handler = this.handlers.get(FileType.FLUXCAD)
    if (!handler || !handler.exportProject) {
      return {
        success: false,
        error: 'Project save not supported'
      }
    }
    
    const result = await handler.exportProject(data, options)
    
    if (result.success && result.data) {
      this.downloadFile(result.data, filename)
    }
    
    return result
  }
  
  // 프로젝트 불러오기
  async loadProject(
    file: File,
    options?: ImportOptions
  ): Promise<ImportResult & { projectData?: ProjectData }> {
    const handler = this.handlers.get(FileType.FLUXCAD)
    if (!handler || !handler.importProject) {
      return {
        success: false,
        error: 'Project load not supported'
      }
    }
    
    return await handler.importProject(file, options)
  }
  
  // 파일 선택 다이얼로그 열기
  async selectFile(accept?: string): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept || this.getAcceptString('import')
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        resolve(file || null)
      }
      
      input.click()
    })
  }
  
  // 여러 파일 선택
  async selectFiles(accept?: string): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = accept || this.getAcceptString('import')
      
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || [])
        resolve(files)
      }
      
      input.click()
    })
  }
  
  // 이벤트 리스너 등록
  addEventListener(event: string, listener: (event: FileIOEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }
  
  // 이벤트 리스너 제거
  removeEventListener(event: string, listener: (event: FileIOEvent) => void): void {
    this.eventListeners.get(event)?.delete(listener)
  }
  
  // Private 메서드들
  private getAcceptString(operation: 'import' | 'export'): string {
    const extensions: string[] = []
    this.handlers.forEach((handler) => {
      if ((operation === 'import' && handler.canImport) ||
          (operation === 'export' && handler.canExport)) {
        handler.extensions.forEach(ext => extensions.push(`.${ext}`))
      }
    })
    return extensions.join(',')
  }
  
  private downloadFile(data: Blob | string, filename: string): void {
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: 'text/plain' })
      : data
      
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
  
  private emitEvent(event: FileIOEvent): void {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => listener(event))
    }
  }
}

// 전역 인스턴스 export
export const fileIOManager = FileIOManager.getInstance()