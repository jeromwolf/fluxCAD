// 파일 입출력 시스템 진입점
export * from './types'
export * from './FileIOManager'
export * from './core/BaseFormatHandler'

// 포맷 핸들러들
import { STLHandler } from './formats/STLHandler'
import { OBJHandler } from './formats/OBJHandler'
import { FluxCADHandler } from './formats/FluxCADHandler'
import { STEPHandler } from './formats/STEPHandler'

import { fileIOManager } from './FileIOManager'

// 기본 핸들러 등록
export function initializeFileIO(): void {
  // STL 핸들러 등록
  fileIOManager.registerHandler(new STLHandler())
  
  // OBJ 핸들러 등록
  fileIOManager.registerHandler(new OBJHandler())
  
  // FluxCAD 프로젝트 파일 핸들러 등록
  fileIOManager.registerHandler(new FluxCADHandler())
  
  // STEP 핸들러 등록
  fileIOManager.registerHandler(new STEPHandler())
  
  console.log('File I/O system initialized')
}

// 편의 함수들
export async function exportSTL(objects: any[], filename: string, binary: boolean = true): Promise<void> {
  const result = await fileIOManager.exportFile(
    objects,
    'stl' as any,
    filename,
    { binary }
  )
  
  if (!result.success) {
    throw new Error(result.error || 'Export failed')
  }
}

export async function importSTL(file: File): Promise<any[]> {
  const result = await fileIOManager.importFile(file, 'stl' as any)
  
  if (!result.success) {
    throw new Error(result.error || 'Import failed')
  }
  
  return result.objects || []
}

export async function exportOBJ(objects: any[], filename: string, options?: any): Promise<void> {
  const result = await fileIOManager.exportFile(
    objects,
    'obj' as any,
    filename,
    options
  )
  
  if (!result.success) {
    throw new Error(result.error || 'Export failed')
  }
}

export async function importOBJ(file: File): Promise<any[]> {
  const result = await fileIOManager.importFile(file, 'obj' as any)
  
  if (!result.success) {
    throw new Error(result.error || 'Import failed')
  }
  
  return result.objects || []
}