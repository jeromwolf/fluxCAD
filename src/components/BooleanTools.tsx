import React from 'react'
import { useBooleanStore } from '@/store/booleanStore'
import { useSceneStore } from '@/store/sceneStore'
import { BooleanOperationType } from '@/types/boolean'

interface BooleanToolsProps {
  onPerformOperation: (type: BooleanOperationType) => void
}

export default function BooleanTools({ onPerformOperation }: BooleanToolsProps) {
  const selectedObjectIds = useBooleanStore((state) => state.selectedObjectIds)
  const operationMode = useBooleanStore((state) => state.operationMode)
  const setOperationMode = useBooleanStore((state) => state.setOperationMode)
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)

  const objects = React.useMemo(() => getObjectsArray(), [getObjectsArray])
  const selectedObjects = React.useMemo(
    () => objects.filter(obj => selectedObjectIds.includes(obj.id)),
    [objects, selectedObjectIds]
  )
  const canPerformOperation = selectedObjectIds.length >= 2

  const operations: Array<{
    type: BooleanOperationType
    label: string
    icon: string
    color: string
    description: string
  }> = [
    {
      type: 'union',
      label: 'Union (합집합)',
      icon: '∪',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: '두 객체를 합칩니다'
    },
    {
      type: 'subtract',
      label: 'Subtract (차집합)',
      icon: '−',
      color: 'bg-red-600 hover:bg-red-700',
      description: '첫 번째에서 두 번째를 뺍니다'
    },
    {
      type: 'intersect',
      label: 'Intersect (교집합)',
      icon: '∩',
      color: 'bg-purple-600 hover:bg-purple-700',
      description: '겹치는 부분만 남깁니다'
    }
  ]

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-600 mb-2">Boolean 연산</h2>
      
      {/* 선택된 객체 정보 */}
      <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
        <div className="font-medium text-gray-700 mb-1">선택된 객체</div>
        {selectedObjects.length === 0 ? (
          <div className="text-gray-500">객체를 2개 이상 선택하세요</div>
        ) : (
          <div className="space-y-1">
            {selectedObjects.map((obj, index) => (
              <div key={obj.id} className="flex items-center gap-2">
                <span className="text-gray-500">{index + 1}.</span>
                <span className="text-gray-700">{obj.name}</span>
                <span className="text-gray-400">({obj.type})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boolean 연산 버튼들 */}
      <div className="space-y-2">
        {operations.map((op) => (
          <button
            key={op.type}
            onClick={() => {
              setOperationMode(op.type)
              onPerformOperation(op.type)
            }}
            disabled={!canPerformOperation}
            className={`w-full px-3 py-2 text-sm text-white rounded-md flex items-center justify-between transition-colors ${
              canPerformOperation 
                ? op.color 
                : 'bg-gray-300 cursor-not-allowed'
            } ${operationMode === op.type ? 'ring-2 ring-offset-2 ring-gray-600' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{op.icon}</span>
              <span>{op.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 도움말 */}
      <div className="mt-3 text-xs text-gray-500">
        <div className="font-medium mb-1">사용 방법:</div>
        <ol className="list-decimal list-inside space-y-1">
          <li>Ctrl/Cmd를 누르고 객체를 클릭하여 여러 개 선택</li>
          <li>원하는 Boolean 연산 선택</li>
          <li>첫 번째 객체가 기준이 됩니다</li>
        </ol>
      </div>
    </div>
  )
}