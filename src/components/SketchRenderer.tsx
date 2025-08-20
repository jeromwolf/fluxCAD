import React from 'react'
import { useSketchStore } from '@/store/sketchStore'
import SketchPlane from './SketchPlane'

export default function SketchRenderer() {
  const sketches = useSketchStore((state) => state.sketches)
  const activateSketch = useSketchStore((state) => state.activateSketch)
  
  const sketchArray = Array.from(sketches.values())
  
  if (sketchArray.length === 0) {
    return null
  }
  
  return (
    <>
      {sketchArray.map((sketch) => (
        <SketchPlane
          key={sketch.id}
          sketch={sketch}
          onClick={() => activateSketch(sketch.id)}
        />
      ))}
    </>
  )
}