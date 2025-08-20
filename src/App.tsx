import React from 'react'
import Viewport3D from './components/Viewport3D'
import OpenCascadeLoader from './components/OpenCascadeLoader'
import { useSceneStore } from './store/sceneStore'
import { useAppStore } from './store/appStore'
import { useHistoryStore } from './store/historyStore'
import { useSketchStore } from './store/sketchStore'
import { PrimitiveType } from './types/scene'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  const addObject = useSceneStore((state) => state.addObject)
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const selectObject = useSceneStore((state) => state.selectObject)
  const deleteObject = useSceneStore((state) => state.deleteObject)
  const clearScene = useSceneStore((state) => state.clearScene)
  const copyObject = useSceneStore((state) => state.copyObject)
  const pasteObject = useSceneStore((state) => state.pasteObject)
  const duplicateObject = useSceneStore((state) => state.duplicateObject)
  const clipboard = useSceneStore((state) => state.clipboard)
  const undo = useSceneStore((state) => state.undo)
  const redo = useSceneStore((state) => state.redo)
  
  const toolMode = useAppStore((state) => state.toolMode)
  const setToolMode = useAppStore((state) => state.setToolMode)
  const transformMode = useAppStore((state) => state.transformMode)
  const setTransformMode = useAppStore((state) => state.setTransformMode)
  const snapSettings = useAppStore((state) => state.snapSettings)
  const updateSnapSettings = useAppStore((state) => state.updateSnapSettings)
  
  const historyPastLength = useHistoryStore((state) => state.past.length)
  const historyFutureLength = useHistoryStore((state) => state.future.length)
  
  const getSketchesArray = useSketchStore((state) => state.getSketchesArray)
  const activeSketchId = useSketchStore((state) => state.activeSketchId)
  const createSketch = useSketchStore((state) => state.createSketch)
  const activateSketch = useSketchStore((state) => state.activateSketch)
  const sketchMode = useSketchStore((state) => state.sketchMode)
  const setSketchMode = useSketchStore((state) => state.setSketchMode)
  const addDimension = useSketchStore((state) => state.addDimension)
  const addConstraint = useSketchStore((state) => state.addConstraint)
  
  const objects = getObjectsArray()
  const selectedObject = objects.find(obj => obj.id === selectedObjectId)
  const sketches = getSketchesArray()

  // 키보드 단축키 활성화
  useKeyboardShortcuts()

  const handleCreateObject = (type: PrimitiveType) => {
    addObject(type)
  }
  return (
    <OpenCascadeLoader>
      <div className="h-full bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">fluxCAD</h1>
            </div>
            <nav className="flex space-x-4">
              <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                파일
              </button>
              <div className="relative group">
                <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  편집
                </button>
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 invisible group-hover:visible">
                  <div className="py-1">
                    <button
                      onClick={undo}
                      disabled={historyPastLength === 0}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                    >
                      실행 취소 <span className="float-right text-gray-400">Ctrl+Z</span>
                    </button>
                    <button
                      onClick={redo}
                      disabled={historyFutureLength === 0}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                    >
                      다시 실행 <span className="float-right text-gray-400">Ctrl+Y</span>
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => selectedObject && copyObject(selectedObject.id)}
                      disabled={!selectedObject}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                    >
                      복사 <span className="float-right text-gray-400">Ctrl+C</span>
                    </button>
                    <button
                      onClick={pasteObject}
                      disabled={!clipboard}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                    >
                      붙여넣기 <span className="float-right text-gray-400">Ctrl+V</span>
                    </button>
                    <button
                      onClick={() => selectedObject && duplicateObject(selectedObject.id)}
                      disabled={!selectedObject}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400"
                    >
                      복제 <span className="float-right text-gray-400">Ctrl+D</span>
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => selectedObject && deleteObject(selectedObject.id)}
                      disabled={!selectedObject}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:text-gray-400"
                    >
                      삭제 <span className="float-right text-gray-400">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
              <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                보기
              </button>
              <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                도구
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="h-[calc(100%-4rem)] flex">
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          {/* 스냅 설정 */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">스냅 설정</h2>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">스냅 활성화</span>
                <input
                  type="checkbox"
                  checked={snapSettings.enabled}
                  onChange={(e) => updateSnapSettings({ enabled: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </label>
              {snapSettings.enabled && (
                <>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">그리드 스냅</span>
                    <input
                      type="checkbox"
                      checked={snapSettings.gridSnap}
                      onChange={(e) => updateSnapSettings({ gridSnap: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">스냅 크기</span>
                    <select
                      value={snapSettings.snapSize}
                      onChange={(e) => updateSnapSettings({ snapSize: parseFloat(e.target.value) })}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="0.1">0.1</option>
                      <option value="0.25">0.25</option>
                      <option value="0.5">0.5</option>
                      <option value="1">1.0</option>
                      <option value="2">2.0</option>
                    </select>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">빠른 액션</h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={undo}
                disabled={historyPastLength === 0}
                className="flex-1 px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-gray-100 flex items-center justify-center gap-1"
                title="실행 취소 (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                실행 취소
              </button>
              <button
                onClick={redo}
                disabled={historyFutureLength === 0}
                className="flex-1 px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-gray-100 flex items-center justify-center gap-1"
                title="다시 실행 (Ctrl+Y)"
              >
                다시 실행
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* 도구 모드 선택 */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">도구 모드</h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setToolMode('select')}
                className={`flex-1 px-3 py-2 text-sm rounded-md ${
                  toolMode === 'select'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                선택
              </button>
              <button
                onClick={() => setToolMode('transform')}
                className={`flex-1 px-3 py-2 text-sm rounded-md ${
                  toolMode === 'transform'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={!selectedObject}
              >
                변형
              </button>
            </div>
            
            {/* Transform 도구 */}
            {toolMode === 'transform' && selectedObject && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                <div className="text-xs font-medium text-gray-500 mb-2">변형 도구</div>
                <button
                  onClick={() => setTransformMode('translate')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 ${
                    transformMode === 'translate'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  이동 (Move)
                </button>
                <button
                  onClick={() => setTransformMode('rotate')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 ${
                    transformMode === 'rotate'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  회전 (Rotate)
                </button>
                <button
                  onClick={() => setTransformMode('scale')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 ${
                    transformMode === 'scale'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  크기 (Scale)
                </button>
              </div>
            )}
          </div>
          
          {/* 스케치 도구 */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">스케치</h2>
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">새 스케치 평면</div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => {
                    const id = createSketch('XY')
                    activateSketch(id)
                  }}
                  className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  XY
                </button>
                <button
                  onClick={() => {
                    const id = createSketch('XZ')
                    activateSketch(id)
                  }}
                  className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  XZ
                </button>
                <button
                  onClick={() => {
                    const id = createSketch('YZ')
                    activateSketch(id)
                  }}
                  className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  YZ
                </button>
              </div>
              
              {/* 활성 스케치가 있을 때 스케치 도구 표시 */}
              {activeSketchId && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <div className="text-xs font-medium text-blue-700 mb-2">스케치 도구</div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setSketchMode('line')}
                      className={`px-2 py-1.5 text-xs rounded ${
                        sketchMode === 'line' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      선
                    </button>
                    <button
                      onClick={() => setSketchMode('circle')}
                      className={`px-2 py-1.5 text-xs rounded ${
                        sketchMode === 'circle' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      원
                    </button>
                    <button
                      onClick={() => setSketchMode('rectangle')}
                      className={`px-2 py-1.5 text-xs rounded ${
                        sketchMode === 'rectangle' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      사각형
                    </button>
                    <button
                      onClick={() => setSketchMode('dimension')}
                      className={`px-2 py-1.5 text-xs rounded ${
                        sketchMode === 'dimension' ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      치수
                    </button>
                    <button
                      onClick={() => setSketchMode('constraint')}
                      className={`px-2 py-1.5 text-xs rounded ${
                        sketchMode === 'constraint' ? 'bg-purple-600 text-white' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      구속조건
                    </button>
                    <button
                      onClick={() => activateSketch(null)}
                      className="px-2 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded col-span-2"
                    >
                      종료
                    </button>
                  </div>
                  
                  {/* 치수 도구 상세 */}
                  {sketchMode === 'dimension' && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <div className="text-xs font-medium text-green-700 mb-1">치수 타입</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button 
                          onClick={() => {
                            // 테스트용 거리 치수 여러 개 추가
                            if (activeSketchId) {
                              // 첫 번째 치수
                              addDimension(activeSketchId, {
                                type: 'distance',
                                entities: [],
                                value: 10.0,
                                label: '10.00',
                                position: [3, 3],
                                isReference: false
                              })
                              // 두 번째 치수
                              addDimension(activeSketchId, {
                                type: 'distance',
                                entities: [],
                                value: 5.5,
                                label: '5.50',
                                position: [-3, 4],
                                isReference: false
                              })
                              // 참조 치수
                              addDimension(activeSketchId, {
                                type: 'distance',
                                entities: [],
                                value: 15.25,
                                label: '15.25',
                                position: [0, -3],
                                isReference: true
                              })
                            }
                          }}
                          className="px-2 py-1 text-xs bg-white hover:bg-gray-100 rounded"
                        >
                          거리
                        </button>
                        <button className="px-2 py-1 text-xs bg-white hover:bg-gray-100 rounded">
                          각도
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 구속조건 도구 상세 */}
                  {sketchMode === 'constraint' && (
                    <div className="mt-2 p-2 bg-purple-50 rounded">
                      <div className="text-xs font-medium text-purple-700 mb-1">구속조건 타입</div>
                      <div className="grid grid-cols-2 gap-1">
                        <button 
                          onClick={() => {
                            // 테스트용 일치 구속조건 추가
                            if (activeSketchId) {
                              addConstraint(activeSketchId, {
                                type: 'coincident',
                                entities: [], // 실제로는 선택된 엔티티들
                                value: undefined
                              })
                            }
                          }}
                          className="px-1 py-1 text-xs bg-white hover:bg-gray-100 rounded"
                        >
                          일치
                        </button>
                        <button 
                          onClick={() => {
                            if (activeSketchId) {
                              addConstraint(activeSketchId, {
                                type: 'parallel',
                                entities: [],
                                value: undefined
                              })
                            }
                          }}
                          className="px-1 py-1 text-xs bg-white hover:bg-gray-100 rounded"
                        >
                          평행
                        </button>
                        <button 
                          onClick={() => {
                            if (activeSketchId) {
                              addConstraint(activeSketchId, {
                                type: 'perpendicular',
                                entities: [],
                                value: undefined
                              })
                            }
                          }}
                          className="px-1 py-1 text-xs bg-white hover:bg-gray-100 rounded"
                        >
                          수직
                        </button>
                        <button 
                          onClick={() => {
                            if (activeSketchId) {
                              addConstraint(activeSketchId, {
                                type: 'horizontal',
                                entities: [],
                                value: undefined
                              })
                            }
                          }}
                          className="px-1 py-1 text-xs bg-white hover:bg-gray-100 rounded"
                        >
                          수평
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 스케치 목록 */}
              {sketches.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">스케치 목록 ({sketches.length}개)</div>
                  <div className="space-y-1">
                    {sketches.map((sketch) => {
                      return (
                        <div
                          key={sketch.id}
                          onClick={() => {
                            activateSketch(sketch.id)
                          }}
                          className={`px-2 py-1 text-xs rounded cursor-pointer flex justify-between items-center ${
                            sketch.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span>{sketch.name}</span>
                            <span className="text-gray-500 text-xs">
                              {sketch.plane.type} | {sketch.entities.length}개 엔티티 | {sketch.dimensions.length}개 치수 | {sketch.constraints.length}개 구속조건
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 스케치 → 3D 변환 도구 */}
          {activeSketchId && sketches.find(s => s.id === activeSketchId)?.entities.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-600 mb-2">스케치 → 3D 변환</h2>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    const activeSketch = sketches.find(s => s.id === activeSketchId)
                    if (activeSketch && activeSketch.entities.length > 0) {
                      // Extrude 실행
                      import('@/utils/sketchTo3D').then(({ extrudeSketch }) => {
                        const mesh = extrudeSketch(
                          activeSketch.entities,
                          5.0, // 높이 5
                          activeSketch.plane.normal,
                          activeSketch.plane.origin,
                          activeSketch.plane.up
                        )
                        if (mesh) {
                          // 3D 객체로 추가
                          addObject('extruded', {
                            position: [0, 0, 0],
                            rotation: [0, 0, 0],
                            scale: [1, 1, 1],
                            customGeometry: mesh.geometry,
                            customMaterial: mesh.material,
                            color: '#2563eb'
                          })
                          // 스케치 비활성화
                          activateSketch(null)
                        }
                      })
                    }
                  }}
                  className="px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md"
                >
                  Extrude (돌출)
                </button>
                <button 
                  onClick={() => {
                    const activeSketch = sketches.find(s => s.id === activeSketchId)
                    if (activeSketch && activeSketch.entities.length > 0) {
                      // Revolve 실행
                      import('@/utils/sketchTo3D').then(({ revolveSketch }) => {
                        const mesh = revolveSketch(
                          activeSketch.entities,
                          Math.PI * 2, // 360도 회전
                          32, // 세그먼트 수
                          'Y', // Y축 중심 회전
                          activeSketch.plane.normal,
                          activeSketch.plane.origin,
                          activeSketch.plane.up
                        )
                        if (mesh) {
                          // 3D 객체로 추가
                          addObject('revolved', {
                            position: [0, 0, 0],
                            rotation: [0, 0, 0],
                            scale: [1, 1, 1],
                            customGeometry: mesh.geometry,
                            customMaterial: mesh.material,
                            color: '#22c55e'
                          })
                          // 스케치 비활성화
                          activateSketch(null)
                        }
                      })
                    }
                  }}
                  className="px-3 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-md"
                >
                  Revolve (회전)
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                활성 스케치: {sketches.find(s => s.id === activeSketchId)?.entities.length}개 엔티티
              </div>
            </div>
          )}

          {/* 생성 도구 */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">3D 프리미티브</h2>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleCreateObject('box')}
                className="p-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 flex flex-col items-center"
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Box
              </button>
              <button 
                onClick={() => handleCreateObject('sphere')}
                className="p-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 flex flex-col items-center"
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" strokeWidth={2} />
                </svg>
                Sphere
              </button>
              <button 
                onClick={() => handleCreateObject('cylinder')}
                className="p-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 flex flex-col items-center"
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m0 0c-1.657 0-3-1.343-3-3V9c0-1.657 1.343-3 3-3s3 1.343 3 3v6c0 1.657-1.343 3-3 3z" />
                </svg>
                Cylinder
              </button>
              <button 
                onClick={() => handleCreateObject('cone')}
                className="p-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 flex flex-col items-center"
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 20h20L12 2z" />
                </svg>
                Cone
              </button>
            </div>
          </div>

          {/* 편집 도구 */}
          {selectedObject && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-600 mb-2">편집 도구</h2>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => copyObject(selectedObject.id)}
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200"
                >
                  복사
                </button>
                <button 
                  onClick={pasteObject}
                  disabled={!clipboard}
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 disabled:opacity-50"
                >
                  붙여넣기
                </button>
                <button 
                  onClick={() => duplicateObject(selectedObject.id)}
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200"
                >
                  복제
                </button>
                <button 
                  onClick={() => deleteObject(selectedObject.id)}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                >
                  삭제
                </button>
              </div>
            </div>
          )}

          {/* 씬 컨트롤 */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">씬 컨트롤</h2>
            <div className="space-y-2">
              <button 
                onClick={clearScene}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                씬 초기화
              </button>
              <div className="text-sm text-gray-500">
                객체 수: {objects.length}
              </div>
            </div>
          </div>

          {/* 객체 목록 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">객체 목록</h2>
            <div className="space-y-1">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => selectObject(obj.id)}
                  className={`px-3 py-2 text-sm rounded-md cursor-pointer flex justify-between items-center ${
                    selectedObject?.id === obj.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{obj.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteObject(obj.id)
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-100 relative">
          <Viewport3D />
          
          {/* 스냅 상태 표시 */}
          {snapSettings.enabled && (
            <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              스냅: {snapSettings.snapSize}
            </div>
          )}
          
          {/* 선택된 객체 정보 표시 */}
          {selectedObject && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-[200px]">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{selectedObject.name}</h3>
              <div className="space-y-1 text-xs text-gray-600">
                <div>X: {selectedObject.position[0].toFixed(2)}</div>
                <div>Y: {selectedObject.position[1].toFixed(2)}</div>
                <div>Z: {selectedObject.position[2].toFixed(2)}</div>
                {transformMode === 'rotate' && (
                  <>
                    <div className="mt-2 pt-2 border-t">
                      <div>RX: {(selectedObject.rotation[0] * 180 / Math.PI).toFixed(0)}°</div>
                      <div>RY: {(selectedObject.rotation[1] * 180 / Math.PI).toFixed(0)}°</div>
                      <div>RZ: {(selectedObject.rotation[2] * 180 / Math.PI).toFixed(0)}°</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </OpenCascadeLoader>
  )
}

export default App