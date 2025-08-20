import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Stats, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { cameraPresets } from '@/utils/camera'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'
import SceneRenderer from './SceneRenderer'
import TransformControls from './TransformControls'
import SketchRenderer from './SketchRenderer'
import { useAppStore } from '@/store/appStore'
import { useSceneStore } from '@/store/sceneStore'

export default function Viewport3D() {
  const controlsRef = useRef<OrbitControlsType>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const useCAD = useAppStore((state) => state.useCAD)
  const setUseCAD = useAppStore((state) => state.setUseCAD)
  const selectObject = useSceneStore((state) => state.selectObject)
  const viewportSettings = useAppStore((state) => state.viewportSettings)
  const snapSettings = useAppStore((state) => state.snapSettings)

  const setCameraView = (preset: keyof typeof cameraPresets) => {
    if (!controlsRef.current || !cameraRef.current) return
    
    const { position, target } = cameraPresets[preset]
    cameraRef.current.position.copy(position)
    controlsRef.current.target.copy(target)
    controlsRef.current.update()
  }

  const handleCanvasClick = () => {
    selectObject(null)
  }
  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        shadows
        onPointerMissed={handleCanvasClick}
      >
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[10, 10, 10]}
          fov={50}
        />
        <color attach="background" args={['#f5f5f5']} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        <Suspense fallback={null}>
          {/* 씬 렌더러 - 모든 객체 렌더링 */}
          <SceneRenderer />
          
          {/* 스케치 렌더링 */}
          <SketchRenderer />
          
          {/* Transform 컨트롤 */}
          <TransformControls />
          
          {/* 그리드 */}
          {viewportSettings.showGrid && (
            <Grid
              infiniteGrid
              cellSize={snapSettings.enabled ? snapSettings.snapSize : 1}
              cellThickness={snapSettings.enabled ? 1 : 0.5}
              cellColor={snapSettings.enabled ? "#b0b0ff" : "#d4d4d8"}
              sectionSize={snapSettings.enabled ? snapSettings.snapSize * 5 : 5}
              sectionThickness={snapSettings.enabled ? 2 : 1}
              sectionColor={snapSettings.enabled ? "#7070ff" : "#71717a"}
              fadeDistance={30}
              fadeStrength={1}
            />
          )}
          
          {/* 카메라 컨트롤 */}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2}
          />
          
          {/* 축 표시 기즈모 */}
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="black" />
          </GizmoHelper>
        </Suspense>
        
        {/* 개발 중에만 성능 통계 표시 */}
        {import.meta.env.DEV && viewportSettings.showStats && <Stats />}
      </Canvas>
      
      {/* CAD/Three.js 토글 */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setUseCAD(!useCAD)}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            useCAD 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {useCAD ? 'CAD 모드 (준비중)' : 'Three.js 모드'}
        </button>
      </div>
      
      {/* 뷰포트 컨트롤 오버레이 */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button 
          onClick={() => setCameraView('home')}
          className="bg-white border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50"
        >
          홈
        </button>
        <button 
          onClick={() => setCameraView('front')}
          className="bg-white border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50"
        >
          정면
        </button>
        <button 
          onClick={() => setCameraView('right')}
          className="bg-white border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50"
        >
          측면
        </button>
        <button 
          onClick={() => setCameraView('top')}
          className="bg-white border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50"
        >
          평면
        </button>
      </div>
    </div>
  )
}