import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Stats, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { cameraPresets } from '@/utils/camera'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'
import SceneRenderer from './SceneRenderer'
import TransformControls from './TransformControls'
import SketchRenderer from './SketchRenderer'
import MeasurementTools from './MeasurementTools'
import LightingSystem from './LightingSystem'
import PostProcessing, { analyzeSceneForPostProcessing, postProcessingPresets, getOptimalQuality, qualityPresets } from './PostProcessing'
import { useAppStore } from '@/store/appStore'
import { useSceneStore } from '@/store/sceneStore'

export default function Viewport3D() {
  const controlsRef = useRef<OrbitControlsType>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const [renderingQuality, setRenderingQuality] = useState(getOptimalQuality())
  const [autoPostProcessing, setAutoPostProcessing] = useState(true)
  const [showRenderingControls, setShowRenderingControls] = useState(false)
  
  const useCAD = useAppStore((state) => state.useCAD)
  const setUseCAD = useAppStore((state) => state.setUseCAD)
  const selectObject = useSceneStore((state) => state.selectObject)
  const viewportSettings = useAppStore((state) => state.viewportSettings)
  const snapSettings = useAppStore((state) => state.snapSettings)
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)
  
  const objects = getObjectsArray()
  const autoPreset = analyzeSceneForPostProcessing(objects)
  const qualitySettings = qualityPresets[renderingQuality]

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
        gl={{ 
          preserveDrawingBuffer: true, 
          antialias: qualitySettings.multisampling > 0,
          powerPreference: renderingQuality === 'ultra' ? 'high-performance' : 'default',
          alpha: false
        }}
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
        
        {/* 고급 조명 시스템 */}
        <LightingSystem
          enableShadows={true}
          enableEnvironment={true}
          preset="studio"
        />
        
        <Suspense fallback={null}>
          {/* 씬 렌더러 - 모든 객체 렌더링 */}
          <SceneRenderer />
          
          {/* 스케치 렌더링 */}
          <SketchRenderer />
          
          {/* Transform 컨트롤 */}
          <TransformControls />
          
          {/* 측정 도구 */}
          <MeasurementTools />
          
          {/* 후처리 효과 */}
          <PostProcessing
            {...(autoPostProcessing ? postProcessingPresets[autoPreset] : {
              enableBloom: true,
              enableSSAO: true,
              enableToneMapping: true,
              bloomIntensity: 0.4,
              bloomThreshold: 0.85,
              ssaoIntensity: 0.5,
              ssaoRadius: 0.1
            })}
          />
          
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
            minDistance={0.1}
            maxDistance={1000}
            maxPolarAngle={Math.PI / 2}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN
            }}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN
            }}
            enableZoom={true}
            zoomSpeed={1.2}
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
      
      {/* 렌더링 품질 및 효과 제어 */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={() => setShowRenderingControls(!showRenderingControls)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-sm hover:bg-gray-50 mb-2 block w-full"
        >
          🎨 렌더링 설정
        </button>
        
        {showRenderingControls && (
          <div className="bg-white border border-gray-300 rounded p-4 shadow-lg space-y-3 min-w-[200px]">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">품질</label>
              <select
                value={renderingQuality}
                onChange={(e) => setRenderingQuality(e.target.value as keyof typeof qualityPresets)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="low">낮음 (빠름)</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="ultra">최고 (느림)</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={autoPostProcessing}
                  onChange={(e) => setAutoPostProcessing(e.target.checked)}
                  className="mr-2 rounded"
                />
                자동 후처리 효과
              </label>
              {autoPostProcessing && (
                <div className="text-xs text-gray-500 mt-1">
                  현재: {postProcessingPresets[autoPreset].description}
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 pt-2 border-t">
              객체 {objects.length}개 • {renderingQuality} 품질
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 렌더링 성능 모니터링 컴포넌트
export function RenderingPerformanceMonitor() {
  const [fps, setFps] = useState(60)
  const [frameTime, setFrameTime] = useState(16.67)
  
  useEffect(() => {
    let lastTime = performance.now()
    let frameCount = 0
    let lastFpsUpdate = performance.now()
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      setFrameTime(deltaTime)
      
      frameCount++
      if (currentTime - lastFpsUpdate >= 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastFpsUpdate)))
        frameCount = 0
        lastFpsUpdate = currentTime
      }
      
      lastTime = currentTime
      requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
    
    return () => {
      // cleanup은 자동으로 됨
    }
  }, [])
  
  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-mono">
      {fps} FPS • {frameTime.toFixed(1)}ms
    </div>
  )
}