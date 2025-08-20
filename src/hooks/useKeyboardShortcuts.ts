import { useEffect } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useAppStore } from '@/store/appStore'

export function useKeyboardShortcuts() {
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const copyObject = useSceneStore((state) => state.copyObject)
  const pasteObject = useSceneStore((state) => state.pasteObject)
  const duplicateObject = useSceneStore((state) => state.duplicateObject)
  const deleteObject = useSceneStore((state) => state.deleteObject)
  const undo = useSceneStore((state) => state.undo)
  const redo = useSceneStore((state) => state.redo)
  
  const snapSettings = useAppStore((state) => state.snapSettings)
  const updateSnapSettings = useAppStore((state) => state.updateSnapSettings)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl/Cmd + C: 복사
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedObjectId) {
        e.preventDefault()
        copyObject(selectedObjectId)
        console.log('객체 복사됨')
      }

      // Ctrl/Cmd + V: 붙여넣기
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteObject()
        console.log('객체 붙여넣기')
      }

      // Ctrl/Cmd + D: 복제
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedObjectId) {
        e.preventDefault()
        duplicateObject(selectedObjectId)
        console.log('객체 복제됨')
      }

      // Delete 또는 Backspace: 삭제
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId) {
        e.preventDefault()
        deleteObject(selectedObjectId)
        console.log('객체 삭제됨')
      }

      // Ctrl/Cmd + Z: 실행 취소
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        console.log('실행 취소')
      }

      // Ctrl/Cmd + Shift + Z 또는 Ctrl/Cmd + Y: 다시 실행
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault()
        redo()
        console.log('다시 실행')
      }

      // S 키: 스냅 토글
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        updateSnapSettings({ enabled: !snapSettings.enabled })
        console.log(`스냅 ${!snapSettings.enabled ? '활성화' : '비활성화'}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedObjectId, copyObject, pasteObject, duplicateObject, deleteObject, undo, redo, snapSettings.enabled, updateSnapSettings])
}