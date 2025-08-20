import React from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useBooleanStore } from '@/store/booleanStore'
import SceneObject from './SceneObject'

export default function SceneRenderer() {
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const selectObject = useSceneStore((state) => state.selectObject)
  
  const selectedObjectIds = useBooleanStore((state) => state.selectedObjectIds)
  const addSelectedObject = useBooleanStore((state) => state.addSelectedObject)
  const removeSelectedObject = useBooleanStore((state) => state.removeSelectedObject)
  const setSelectedObjects = useBooleanStore((state) => state.setSelectedObjects)
  
  const objects = getObjectsArray()

  const handleObjectClick = (id: string, event: any) => {
    event.stopPropagation()
    
    // Ctrl/Cmd 키를 누르고 있으면 다중 선택
    if (event.ctrlKey || event.metaKey) {
      if (selectedObjectIds.includes(id)) {
        removeSelectedObject(id)
      } else {
        addSelectedObject(id)
      }
    } else {
      // 일반 클릭은 단일 선택
      selectObject(id)
      setSelectedObjects([id])
    }
  }

  return (
    <>
      {objects.map((object) => {
        if (!object.visible) return null

        const isSelected = object.id === selectedObjectId || selectedObjectIds.includes(object.id)

        return (
          <SceneObject
            key={object.id}
            object={object}
            isSelected={isSelected}
            onClick={(e) => handleObjectClick(object.id, e)}
          />
        )
      })}
    </>
  )
}