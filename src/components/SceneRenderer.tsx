import React from 'react'
import { useSceneStore } from '@/store/sceneStore'
import SceneObject from './SceneObject'

export default function SceneRenderer() {
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const selectObject = useSceneStore((state) => state.selectObject)
  
  const objects = getObjectsArray()

  const handleObjectClick = (id: string, event: any) => {
    event.stopPropagation()
    selectObject(id)
  }

  return (
    <>
      {objects.map((object) => {
        if (!object.visible) return null

        return (
          <SceneObject
            key={object.id}
            object={object}
            isSelected={object.id === selectedObjectId}
            onClick={(e) => handleObjectClick(object.id, e)}
          />
        )
      })}
    </>
  )
}