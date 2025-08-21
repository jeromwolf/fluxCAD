import React, { useState } from 'react'
import * as THREE from 'three'
import { useSceneStore } from '@/store/sceneStore'
import { Html } from '@react-three/drei'
import { materialLightingPresets } from './LightingSystem'

// 미리 정의된 재질 라이브러리
export const materialPresets = {
  // 금속 재질
  metals: {
    aluminum: {
      name: '알루미늄',
      color: '#C0C0C0',
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
    },
    steel: {
      name: '강철',
      color: '#8C9297',
      metalness: 1.0,
      roughness: 0.2,
      envMapIntensity: 1.0,
    },
    brass: {
      name: '황동',
      color: '#B5A642',
      metalness: 1.0,
      roughness: 0.3,
      envMapIntensity: 1.0,
    },
    copper: {
      name: '구리',
      color: '#B87333',
      metalness: 1.0,
      roughness: 0.1,
      envMapIntensity: 1.0,
    },
    gold: {
      name: '금',
      color: '#FFD700',
      metalness: 1.0,
      roughness: 0.05,
      envMapIntensity: 1.0,
    },
    chrome: {
      name: '크롬',
      color: '#E5E5E5',
      metalness: 1.0,
      roughness: 0.05,
      envMapIntensity: 2.0,
    }
  },
  
  // 플라스틱 재질
  plastics: {
    glossyPlastic: {
      name: '광택 플라스틱',
      color: '#2194CE',
      metalness: 0.0,
      roughness: 0.1,
      envMapIntensity: 0.5,
    },
    mattePlastic: {
      name: '무광 플라스틱',
      color: '#4A4A4A',
      metalness: 0.0,
      roughness: 0.8,
      envMapIntensity: 0.2,
    },
    redPlastic: {
      name: '빨간 플라스틱',
      color: '#E53E3E',
      metalness: 0.0,
      roughness: 0.3,
      envMapIntensity: 0.3,
    },
    transparent: {
      name: '투명 플라스틱',
      color: '#87CEEB',
      metalness: 0.0,
      roughness: 0.0,
      transparency: true,
      opacity: 0.3,
      envMapIntensity: 1.0,
    }
  },

  // 유리/도자기
  ceramics: {
    glass: {
      name: '유리',
      color: '#E0F8FF',
      metalness: 0.0,
      roughness: 0.0,
      transparency: true,
      opacity: 0.1,
      ior: 1.5,
      envMapIntensity: 2.0,
    },
    porcelain: {
      name: '도자기',
      color: '#FFFAFA',
      metalness: 0.0,
      roughness: 0.1,
      envMapIntensity: 0.8,
    },
    ceramic: {
      name: '세라믹',
      color: '#F5F5DC',
      metalness: 0.0,
      roughness: 0.4,
      envMapIntensity: 0.3,
    }
  },

  // 직물/가죽
  fabrics: {
    leather: {
      name: '가죽',
      color: '#8B4513',
      metalness: 0.0,
      roughness: 0.9,
      envMapIntensity: 0.1,
    },
    fabric: {
      name: '직물',
      color: '#708090',
      metalness: 0.0,
      roughness: 1.0,
      envMapIntensity: 0.0,
    },
    rubber: {
      name: '고무',
      color: '#2F2F2F',
      metalness: 0.0,
      roughness: 0.95,
      envMapIntensity: 0.1,
    }
  },

  // 목재
  woods: {
    oak: {
      name: '참나무',
      color: '#DEB887',
      metalness: 0.0,
      roughness: 0.8,
      envMapIntensity: 0.2,
    },
    walnut: {
      name: '호두나무',
      color: '#8B4513',
      metalness: 0.0,
      roughness: 0.7,
      envMapIntensity: 0.3,
    },
    pine: {
      name: '소나무',
      color: '#F4A460',
      metalness: 0.0,
      roughness: 0.9,
      envMapIntensity: 0.1,
    }
  }
}

interface MaterialLibraryProps {
  selectedObjectId: string | null
  onClose: () => void
}

export default function MaterialLibrary({ selectedObjectId, onClose }: MaterialLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<string>('metals')
  const updateObject = useSceneStore((state) => state.updateObject)
  const getObjectsArray = useSceneStore((state) => state.getObjectsArray)
  
  const objects = getObjectsArray()
  const selectedObject = objects.find(obj => obj.id === selectedObjectId)

  if (!selectedObjectId || !selectedObject) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">재질 라이브러리</h3>
          <p className="text-gray-600 mb-4">객체를 먼저 선택해주세요.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    )
  }

  const applyMaterial = (material: any) => {
    // PBR 재질 생성
    const newMaterial = new THREE.MeshStandardMaterial({
      color: material.color,
      metalness: material.metalness || 0,
      roughness: material.roughness || 0.5,
      transparent: material.transparency || false,
      opacity: material.opacity || 1.0,
      envMapIntensity: material.envMapIntensity || 1.0,
    })

    // IOR 설정 (굴절률)
    if (material.ior) {
      newMaterial.refractionRatio = 1.0 / material.ior
    }
    
    // 재질별 특수 설정
    if (material.metalness > 0.5) {
      // 금속성 재질: 더 선명한 반사
      newMaterial.envMapIntensity = material.envMapIntensity * 1.5
    }
    
    if (material.transparency) {
      // 투명 재질: 굴절 및 투과 설정
      newMaterial.transmission = material.opacity < 0.5 ? 0.9 : 0
      newMaterial.thickness = 0.5
    }

    updateObject(selectedObjectId, {
      color: material.color,
      customMaterial: newMaterial,
      // 재질 타입 정보 저장 (조명 최적화용)
      materialType: activeCategory
    })
    
    // 재질 적용 완료 피드백
    console.log(`재질 '${material.name}' 적용 완료`)
  }

  const categories = [
    { key: 'metals', name: '금속', icon: '🔩' },
    { key: 'plastics', name: '플라스틱', icon: '🧴' },
    { key: 'ceramics', name: '유리/도자기', icon: '🏺' },
    { key: 'fabrics', name: '직물/가죽', icon: '🧵' },
    { key: 'woods', name: '목재', icon: '🌳' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold">재질 라이브러리</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                선택된 객체: {selectedObject.name}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* 카테고리 사이드바 */}
            <div className="w-48 bg-gray-50 p-4 overflow-y-auto">
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                      activeCategory === category.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 재질 그리드 */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(materialPresets[activeCategory as keyof typeof materialPresets]).map(([key, material]) => (
                  <div
                    key={key}
                    className="group cursor-pointer"
                    onClick={() => applyMaterial(material)}
                  >
                    <div className="aspect-square rounded-lg border-2 border-gray-200 group-hover:border-blue-500 transition-colors overflow-hidden">
                      <div 
                        className="w-full h-full rounded-md"
                        style={{
                          background: material.transparency
                            ? `linear-gradient(45deg, ${material.color}80, ${material.color}40)`
                            : material.color,
                          opacity: material.transparency ? 0.8 : 1,
                          boxShadow: material.metalness > 0.5
                            ? `inset 0 0 20px rgba(255,255,255,${material.metalness * 0.3})`
                            : 'none'
                        }}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-xs font-medium text-gray-900">{material.name}</div>
                      <div className="text-xs text-gray-500">
                        {material.metalness > 0.5 ? '금속성' : '비금속성'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                💡 클릭하여 재질 적용
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // 기본 재질로 초기화
                    const defaultMaterial = new THREE.MeshStandardMaterial({
                      color: '#888888',
                      metalness: 0,
                      roughness: 0.5
                    })
                    updateObject(selectedObjectId, {
                      color: '#888888',
                      customMaterial: defaultMaterial,
                      materialType: 'default'
                    })
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  초기화
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  완료
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}