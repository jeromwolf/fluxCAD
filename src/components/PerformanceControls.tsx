import React, { useState, useEffect } from 'react'
import { PerformanceManager, PerformanceLevel, PerformanceStats, PerformanceSettings } from '@/utils/performance/PerformanceManager'

interface PerformanceControlsProps {
  performanceManager: PerformanceManager
  onClose: () => void
}

export default function PerformanceControls({ performanceManager, onClose }: PerformanceControlsProps) {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [settings, setSettings] = useState<PerformanceSettings | null>(null)
  const [autoOptimize, setAutoOptimize] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // 실시간 통계 업데이트
  useEffect(() => {
    const updateStats = () => {
      const currentStats = performanceManager.getPerformanceStats()
      setStats(currentStats)
    }
    
    // 초기 로드
    updateStats()
    
    // 1초마다 업데이트
    const interval = setInterval(updateStats, 1000)
    
    return () => clearInterval(interval)
  }, [performanceManager])
  
  // 성능 레벨 변경
  const handlePerformanceLevelChange = (level: PerformanceLevel) => {
    performanceManager.applyPerformanceLevel(level)
    setAutoOptimize(false) // 수동 설정 시 자동 최적화 비활성화
  }
  
  // 자동 최적화 토글
  const handleAutoOptimizeToggle = (enabled: boolean) => {
    setAutoOptimize(enabled)
    performanceManager.updateSettings({ adaptiveQuality: enabled })
  }
  
  // 강제 최적화 실행
  const handleForceOptimize = () => {
    performanceManager.forceOptimization()
  }
  
  // 성능 상태에 따른 색상 결정
  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return 'text-green-600'
    if (fps >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  // 메모리 사용률 계산
  const getMemoryUsagePercent = () => {
    if (!stats) return 0
    const { usedJSHeapSize, jsHeapSizeLimit } = stats.memoryUsage
    if (jsHeapSizeLimit === 0) return 0
    return Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100)
  }
  
  // 바이트를 읽기 쉬운 형태로 변환
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
  
  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold">성능 제어판</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 실시간 성능 통계 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4">실시간 성능</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* FPS */}
                  <div className="bg-white rounded p-3">
                    <div className="text-xs text-gray-500">FPS</div>
                    <div className={`text-2xl font-bold ${getPerformanceColor(stats.fps)}`}>
                      {Math.round(stats.fps)}
                    </div>
                  </div>
                  
                  {/* 프레임 타임 */}
                  <div className="bg-white rounded p-3">
                    <div className="text-xs text-gray-500">프레임 타임</div>
                    <div className="text-2xl font-bold">
                      {stats.frameTime.toFixed(1)}ms
                    </div>
                  </div>
                  
                  {/* 객체 수 */}
                  <div className="bg-white rounded p-3">
                    <div className="text-xs text-gray-500">객체</div>
                    <div className="text-lg font-bold">
                      {stats.visibleObjects}/{stats.totalObjects}
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.culledObjects} 컬링됨
                    </div>
                  </div>
                  
                  {/* 삼각형 */}
                  <div className="bg-white rounded p-3">
                    <div className="text-xs text-gray-500">삼각형</div>
                    <div className="text-lg font-bold">
                      {(stats.renderedTriangles / 1000).toFixed(1)}K
                    </div>
                  </div>
                </div>
                
                {/* 메모리 사용률 */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>메모리 사용률</span>
                    <span>{getMemoryUsagePercent()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getMemoryUsagePercent() > 80 ? 'bg-red-500' :
                        getMemoryUsagePercent() > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, getMemoryUsagePercent())}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatBytes(stats.memoryUsage.usedJSHeapSize)} / {formatBytes(stats.memoryUsage.jsHeapSizeLimit)}
                  </div>
                </div>
              </div>
              
              {/* 성능 설정 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4">성능 설정</h4>
                
                {/* 성능 레벨 선택 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    성능 레벨
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(PerformanceLevel).map((level) => (
                      <button
                        key={level}
                        onClick={() => handlePerformanceLevelChange(level)}
                        className={`px-3 py-2 text-sm rounded-md transition-colors ${
                          stats.performanceLevel === level
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {level.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    현재: {stats.performanceLevel.toUpperCase()}
                  </div>
                </div>
                
                {/* 자동 최적화 */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoOptimize}
                      onChange={(e) => handleAutoOptimizeToggle(e.target.checked)}
                      className="rounded text-blue-600 mr-2"
                    />
                    <span className="text-sm text-gray-700">자동 성능 최적화</span>
                  </label>
                  <div className="text-xs text-gray-500 mt-1">
                    FPS에 따라 자동으로 품질 조정
                  </div>
                </div>
                
                {/* 강제 최적화 버튼 */}
                <button
                  onClick={handleForceOptimize}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  강제 최적화 실행
                </button>
              </div>
              
              {/* LOD 통계 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4">LOD (Level of Detail) 통계</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">고해상도</span>
                    <span className="text-sm font-medium">{stats.lodStats.high}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">중해상도</span>
                    <span className="text-sm font-medium">{stats.lodStats.medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">저해상도</span>
                    <span className="text-sm font-medium">{stats.lodStats.low}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">컬링됨</span>
                    <span className="text-sm font-medium">{stats.lodStats.culled}</span>
                  </div>
                </div>
                
                {/* LOD 효율성 표시 */}
                <div className="mt-4 p-3 bg-white rounded">
                  <div className="text-xs text-gray-500">LOD 효율성</div>
                  <div className="text-lg font-bold">
                    {stats.lodStats.culled > 0 ? '우수' : 
                     stats.lodStats.low > stats.lodStats.high ? '좋음' : '보통'}
                  </div>
                </div>
              </div>
              
              {/* 인스턴싱 통계 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold mb-4">인스턴싱 통계</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">인스턴스 그룹</span>
                    <span className="text-sm font-medium">{stats.instancingStats.instanceGroups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">총 인스턴스</span>
                    <span className="text-sm font-medium">{stats.instancingStats.totalInstances}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">드로우 콜</span>
                    <span className="text-sm font-medium">{stats.drawCalls}</span>
                  </div>
                </div>
                
                {/* 인스턴싱 효율성 */}
                <div className="mt-4 p-3 bg-white rounded">
                  <div className="text-xs text-gray-500">인스턴싱 효율성</div>
                  <div className="text-lg font-bold">
                    {stats.instancingStats.efficiency}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 고급 설정 (접이식) */}
            <div className="mt-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="font-medium">고급 설정</span>
                <svg 
                  className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showAdvanced && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* WebGL 정보 */}
                    <div>
                      <h5 className="text-sm font-semibold mb-2">WebGL 리소스</h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>지오메트리:</span>
                          <span>{stats.memoryUsage.geometries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>텍스처:</span>
                          <span>{stats.memoryUsage.textures}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>재질:</span>
                          <span>{stats.memoryUsage.materials}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 공간 인덱스 */}
                    <div>
                      <h5 className="text-sm font-semibold mb-2">공간 인덱스</h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>옥트리 노드:</span>
                          <span>{stats.spatialStats.octreeNodes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>쿼리 시간:</span>
                          <span>{stats.spatialStats.queryTime.toFixed(2)}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 푸터 */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                💡 성능 문제 시 자동 최적화를 활성화하세요
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}