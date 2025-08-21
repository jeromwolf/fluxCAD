import React, { useState } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useSketchStore } from '@/store/sketchStore'
import { useProjectStore } from '@/store/projectStore'
import { fileIOManager, FileType, initializeFileIO } from '@/lib/fileIO'

// 파일 I/O 시스템 초기화
initializeFileIO()

interface FileMenuProps {
  className?: string
}

export default function FileMenu({ className }: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)
  const addObject = useSceneStore((state) => state.addObject)
  const clearScene = useSceneStore((state) => state.clearScene)
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  
  const collectProjectData = useProjectStore((state) => state.collectProjectData)
  const loadProjectData = useProjectStore((state) => state.loadProjectData)
  const newProject = useProjectStore((state) => state.newProject)
  const projectName = useProjectStore((state) => state.projectName)
  const setProjectInfo = useProjectStore((state) => state.setProjectInfo)
  
  // 내보내기 처리
  const handleExport = async (format: FileType, selectedOnly: boolean = false) => {
    setIsExporting(true)
    try {
      const objects = getObjectsArray()
      const objectsToExport = selectedOnly && selectedObjectId
        ? objects.filter(obj => obj.id === selectedObjectId)
        : objects
      
      if (objectsToExport.length === 0) {
        alert('내보낼 객체가 없습니다.')
        return
      }
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const filename = `fluxcad-export-${timestamp}.${format}`
      
      const result = await fileIOManager.exportFile(
        objectsToExport,
        format,
        filename,
        { binary: format === FileType.STL }
      )
      
      if (!result.success) {
        alert(`내보내기 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }
  
  // 가져오기 처리
  const handleImport = async () => {
    setIsImporting(true)
    try {
      const file = await fileIOManager.selectFile()
      if (!file) return
      
      const result = await fileIOManager.importFile(file)
      
      if (result.success && result.objects) {
        // 기존 객체들의 바운딩 박스를 계산하여 최대 X 좌표 찾기
        const existingObjects = getObjectsArray()
        let maxX = 0
        
        existingObjects.forEach(obj => {
          if (obj.position) {
            // 객체의 대략적인 크기를 고려 (기본값 10)
            const objSize = obj.dimensions ? Math.max(...Object.values(obj.dimensions)) : 10
            const rightEdge = obj.position[0] + objSize
            maxX = Math.max(maxX, rightEdge)
          }
        })
        
        // 새 객체들을 기존 객체들의 오른쪽에 배치
        const spacing = 20 // 객체 간 간격
        const baseOffset = maxX + spacing
        
        result.objects.forEach((obj, index) => {
          // 위치 조정 - 기존 객체와 충분히 떨어뜨림
          if (!obj.position) {
            obj.position = [0, 0, 0]
          }
          
          // X축으로 이동 (기존 객체들의 오른쪽)
          obj.position[0] += baseOffset
          
          // 같은 파일 내 여러 객체는 Z축으로 분리
          if (result.objects.length > 1) {
            obj.position[2] += index * 15
          }
          
          addObject(obj.type, obj)
        })
        
        const fileType = fileIOManager.guessFileType(file.name) || 'unknown'
        alert(`${result.objects.length}개의 객체를 ${fileType.toUpperCase()} 파일에서 가져왔습니다.\n\n팁: 마우스 휠로 확대/축소, 왼쪽 드래그로 회전`)
        
        // 경고 메시지가 있으면 표시
        if (result.warnings && result.warnings.length > 0) {
          console.warn('Import warnings:', result.warnings)
        }
        
        // 카메라를 조정하여 모든 객체 보기 (선택사항)
        // TODO: 모든 객체를 볼 수 있도록 카메라 위치 자동 조정
      } else {
        alert(`가져오기 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('가져오기 중 오류가 발생했습니다.')
    } finally {
      setIsImporting(false)
    }
  }
  
  // 새 프로젝트
  const handleNewProject = () => {
    if (getObjectsArray().length > 0) {
      if (confirm('현재 프로젝트의 모든 변경사항이 손실됩니다. 계속하시겠습니까?')) {
        newProject()
      }
    } else {
      newProject()
    }
  }
  
  // 프로젝트 저장
  const handleSaveProject = async () => {
    setIsExporting(true)
    try {
      const projectData = collectProjectData()
      const filename = `${projectName.replace(/\s+/g, '_')}.fluxcad`
      
      const result = await fileIOManager.saveProject(projectData, filename)
      
      if (!result.success) {
        alert(`프로젝트 저장 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('Save project error:', error)
      alert('프로젝트 저장 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }
  
  // 프로젝트 불러오기
  const handleLoadProject = async () => {
    setIsImporting(true)
    try {
      const file = await fileIOManager.selectFile('.fluxcad,.flux')
      if (!file) return
      
      if (getObjectsArray().length > 0) {
        if (!confirm('현재 프로젝트의 모든 변경사항이 손실됩니다. 계속하시겠습니까?')) {
          return
        }
      }
      
      const result = await fileIOManager.loadProject(file)
      
      if (result.success && result.projectData) {
        loadProjectData(result.projectData)
        alert(`프로젝트 "${result.projectData.metadata.name}"을(를) 불러왔습니다.`)
      } else {
        alert(`프로젝트 불러오기 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('Load project error:', error)
      alert('프로젝트 불러오기 중 오류가 발생했습니다.')
    } finally {
      setIsImporting(false)
    }
  }
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
      >
        파일
      </button>
      
      {isOpen && (
        <>
          {/* 드롭다운 배경 클릭 시 닫기 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 드롭다운 메뉴 */}
          <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {/* 새 프로젝트 */}
              <button
                onClick={() => {
                  handleNewProject()
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <span className="flex items-center justify-between">
                  새 프로젝트
                  <span className="text-gray-400 text-xs">Ctrl+N</span>
                </span>
              </button>
              
              {/* 모든 객체 삭제 */}
              <button
                onClick={() => {
                  if (getObjectsArray().length > 0) {
                    if (confirm('모든 객체를 삭제하시겠습니까?')) {
                      clearScene()
                    }
                  }
                  setIsOpen(false)
                }}
                disabled={getObjectsArray().length === 0}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
              >
                모든 객체 삭제
              </button>
              
              <div className="border-t border-gray-100"></div>
              
              {/* 가져오기 */}
              <button
                onClick={() => {
                  handleImport()
                  setIsOpen(false)
                }}
                disabled={isImporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
              >
                <span className="flex items-center justify-between">
                  가져오기...
                  {isImporting && <span className="text-xs">처리 중...</span>}
                </span>
              </button>
              
              <div className="border-t border-gray-100"></div>
              
              {/* 내보내기 섹션 */}
              <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                내보내기
              </div>
              
              {/* STL 내보내기 */}
              <button
                onClick={() => {
                  handleExport(FileType.STL)
                  setIsOpen(false)
                }}
                disabled={isExporting || getObjectsArray().length === 0}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
              >
                <span className="flex items-center justify-between">
                  STL (3D 프린팅)
                  {isExporting && <span className="text-xs">처리 중...</span>}
                </span>
              </button>
              
              {/* 선택된 객체만 내보내기 */}
              {selectedObjectId && (
                <button
                  onClick={() => {
                    handleExport(FileType.STL, true)
                    setIsOpen(false)
                  }}
                  disabled={isExporting}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                >
                  <span className="flex items-center justify-between">
                    선택된 객체만 STL로
                    {isExporting && <span className="text-xs">처리 중...</span>}
                  </span>
                </button>
              )}
              
              {/* OBJ 내보내기 */}
              <button
                onClick={() => {
                  handleExport(FileType.OBJ)
                  setIsOpen(false)
                }}
                disabled={isExporting || getObjectsArray().length === 0}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
              >
                <span className="flex items-center justify-between">
                  OBJ (범용 3D)
                  {isExporting && <span className="text-xs">처리 중...</span>}
                </span>
              </button>
              
              {/* 선택된 객체만 OBJ로 내보내기 */}
              {selectedObjectId && (
                <button
                  onClick={() => {
                    handleExport(FileType.OBJ, true)
                    setIsOpen(false)
                  }}
                  disabled={isExporting}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                >
                  <span className="flex items-center justify-between">
                    선택된 객체만 OBJ로
                    {isExporting && <span className="text-xs">처리 중...</span>}
                  </span>
                </button>
              )}
              
              {/* glTF 내보내기 */}
              <button
                onClick={() => {
                  handleExport(FileType.GLTF)
                  setIsOpen(false)
                }}
                disabled={isExporting || getObjectsArray().length === 0}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
              >
                <span className="flex items-center justify-between">
                  glTF (웹 표준 3D)
                  {isExporting && <span className="text-xs">처리 중...</span>}
                </span>
              </button>
              
              {/* 선택된 객체만 glTF로 내보내기 */}
              {selectedObjectId && (
                <button
                  onClick={() => {
                    handleExport(FileType.GLTF, true)
                    setIsOpen(false)
                  }}
                  disabled={isExporting}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                >
                  <span className="flex items-center justify-between">
                    선택된 객체만 glTF로
                    {isExporting && <span className="text-xs">처리 중...</span>}
                  </span>
                </button>
              )}
              
              {/* 일괄 내보내기 */}
              <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                일괄 내보내기
              </div>
              
              <button
                onClick={async () => {
                  setIsExporting(true)
                  try {
                    const objects = getObjectsArray()
                    if (objects.length === 0) {
                      alert('내보낼 객체가 없습니다.')
                      return
                    }
                    
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
                    const formats = [FileType.STL, FileType.OBJ, FileType.GLTF]
                    
                    for (const format of formats) {
                      const filename = `fluxcad-export-${timestamp}.${format}`
                      const result = await fileIOManager.exportFile(objects, format, filename)
                      if (!result.success) {
                        console.error(`Failed to export ${format}:`, result.error)
                      }
                    }
                    
                    alert('모든 표준 포맷으로 내보내기 완료!\n(STL, OBJ, glTF)')
                  } catch (error) {
                    console.error('Batch export error:', error)
                    alert('일괄 내보내기 중 오류가 발생했습니다.')
                  } finally {
                    setIsExporting(false)
                  }
                  setIsOpen(false)
                }}
                disabled={isExporting || getObjectsArray().length === 0}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 font-medium"
              >
                <span className="flex items-center justify-between">
                  모든 표준 포맷으로 내보내기
                  {isExporting && <span className="text-xs">처리 중...</span>}
                </span>
              </button>
              
              <div className="px-4 py-2 text-xs text-gray-500">
                📁 가져오기: STL, OBJ, STEP, glTF<br/>
                💾 내보내기: STL, OBJ, glTF, FluxCAD<br/>
                🔄 다른 CAD 소프트웨어 호환
              </div>
              
              <div className="border-t border-gray-100"></div>
              
              {/* 프로젝트 저장/불러오기 */}
              <button
                onClick={() => {
                  handleSaveProject()
                  setIsOpen(false)
                }}
                disabled={isExporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
              >
                <span className="flex items-center justify-between">
                  프로젝트 저장
                  <span className="text-gray-400 text-xs">Ctrl+S</span>
                </span>
              </button>
              
              <button
                onClick={() => {
                  handleLoadProject()
                  setIsOpen(false)
                }}
                disabled={isImporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
              >
                <span className="flex items-center justify-between">
                  프로젝트 열기
                  <span className="text-gray-400 text-xs">Ctrl+O</span>
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}