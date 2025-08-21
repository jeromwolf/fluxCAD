import React from 'react'
import { useModelingStore } from '@/store/modelingStore'
import { useSceneStore } from '@/store/sceneStore'
import { ModelingOperationType } from '@/types/modeling'

interface ModelingToolsProps {
  onPerformOperation: (type: ModelingOperationType) => void
}

export default function ModelingTools({ onPerformOperation }: ModelingToolsProps) {
  const modelingMode = useModelingStore((state) => state.modelingMode)
  const setModelingMode = useModelingStore((state) => state.setModelingMode)
  const filletRadius = useModelingStore((state) => state.filletRadius)
  const setFilletRadius = useModelingStore((state) => state.setFilletRadius)
  const chamferDistance = useModelingStore((state) => state.chamferDistance)
  const setChamferDistance = useModelingStore((state) => state.setChamferDistance)
  const shellThickness = useModelingStore((state) => state.shellThickness)
  const setShellThickness = useModelingStore((state) => state.setShellThickness)
  
  const patternType = useModelingStore((state) => state.patternType)
  const patternCount = useModelingStore((state) => state.patternCount)
  const patternSpacing = useModelingStore((state) => state.patternSpacing)
  const setPatternSettings = useModelingStore((state) => state.setPatternSettings)
  
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const objects = useSceneStore((state) => Array.from(state.objects.values()))
  const selectedObject = selectedObjectId ? objects.find(obj => obj.id === selectedObjectId) : null

  const tools: Array<{
    type: ModelingOperationType
    label: string
    icon: string
    color: string
    description: string
  }> = [
    {
      type: 'fillet',
      label: 'Fillet',
      icon: '⌒',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: '모서리를 둥글게'
    },
    {
      type: 'chamfer',
      label: 'Chamfer',
      icon: '⧸',
      color: 'bg-green-600 hover:bg-green-700',
      description: '모서리를 깎기'
    },
    {
      type: 'shell',
      label: 'Shell',
      icon: '▢',
      color: 'bg-purple-600 hover:bg-purple-700',
      description: '속 비우기'
    },
    {
      type: 'pattern',
      label: 'Pattern',
      icon: '⋮⋮',
      color: 'bg-orange-600 hover:bg-orange-700',
      description: '배열 복사'
    }
  ]

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-600 mb-2">고급 모델링 도구</h2>
      
      {/* 도구 버튼들 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => {
              setModelingMode(tool.type === modelingMode ? null : tool.type)
            }}
            disabled={!selectedObject}
            className={`px-3 py-2 text-sm text-white rounded-md flex items-center justify-between transition-colors ${
              selectedObject 
                ? tool.color 
                : 'bg-gray-300 cursor-not-allowed'
            } ${modelingMode === tool.type ? 'ring-2 ring-offset-2 ring-gray-600' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{tool.icon}</span>
              <span>{tool.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 도구별 설정 */}
      {modelingMode === 'fillet' && (
        <div className="p-3 bg-blue-50 rounded-md">
          <div className="text-xs font-medium text-blue-700 mb-2">Fillet 설정</div>
          <label className="block">
            <span className="text-xs text-gray-700">반경</span>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={filletRadius}
              onChange={(e) => setFilletRadius(parseFloat(e.target.value))}
              className="w-full mt-1"
            />
            <span className="text-xs text-gray-500">{filletRadius.toFixed(1)}</span>
          </label>
          <button
            onClick={() => onPerformOperation('fillet')}
            className="w-full mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            적용
          </button>
        </div>
      )}

      {modelingMode === 'chamfer' && (
        <div className="p-3 bg-green-50 rounded-md">
          <div className="text-xs font-medium text-green-700 mb-2">Chamfer 설정</div>
          <label className="block">
            <span className="text-xs text-gray-700">거리</span>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={chamferDistance}
              onChange={(e) => setChamferDistance(parseFloat(e.target.value))}
              className="w-full mt-1"
            />
            <span className="text-xs text-gray-500">{chamferDistance.toFixed(1)}</span>
          </label>
          <button
            onClick={() => onPerformOperation('chamfer')}
            className="w-full mt-2 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            적용
          </button>
        </div>
      )}

      {modelingMode === 'shell' && (
        <div className="p-3 bg-purple-50 rounded-md">
          <div className="text-xs font-medium text-purple-700 mb-2">Shell 설정</div>
          <label className="block">
            <span className="text-xs text-gray-700">두께</span>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={shellThickness}
              onChange={(e) => setShellThickness(parseFloat(e.target.value))}
              className="w-full mt-1"
            />
            <span className="text-xs text-gray-500">{shellThickness.toFixed(1)}</span>
          </label>
          <button
            onClick={() => onPerformOperation('shell')}
            className="w-full mt-2 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            적용
          </button>
        </div>
      )}

      {modelingMode === 'pattern' && (
        <div className="p-3 bg-orange-50 rounded-md">
          <div className="text-xs font-medium text-orange-700 mb-2">Pattern 설정</div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setPatternSettings({ type: 'linear' })}
              className={`flex-1 px-2 py-1 text-xs rounded ${
                patternType === 'linear' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-700'
              }`}
            >
              선형
            </button>
            <button
              onClick={() => setPatternSettings({ type: 'circular' })}
              className={`flex-1 px-2 py-1 text-xs rounded ${
                patternType === 'circular' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-700'
              }`}
            >
              원형
            </button>
          </div>
          <label className="block mb-2">
            <span className="text-xs text-gray-700">개수</span>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={patternCount}
              onChange={(e) => setPatternSettings({ count: parseInt(e.target.value) })}
              className="w-full mt-1"
            />
            <span className="text-xs text-gray-500">{patternCount}</span>
          </label>
          <label className="block mb-2">
            <span className="text-xs text-gray-700">
              {patternType === 'linear' ? '간격' : '반경'}
            </span>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={patternSpacing}
              onChange={(e) => setPatternSettings({ spacing: parseFloat(e.target.value) })}
              className="w-full mt-1"
            />
            <span className="text-xs text-gray-500">{patternSpacing.toFixed(1)}</span>
          </label>
          <button
            onClick={() => onPerformOperation('pattern')}
            className="w-full px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            적용
          </button>
        </div>
      )}

      {/* 선택된 객체 정보 */}
      {selectedObject && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
          <div className="text-gray-700">
            선택됨: <span className="font-medium">{selectedObject.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}