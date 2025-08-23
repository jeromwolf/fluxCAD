import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Environment, ContactShadows, Sky } from '@react-three/drei'

// HDR 환경 맵 미리 설정된 프리셋
const environmentPresets = {
  studio: {
    name: '스튜디오',
    hdriUrl: null, // 기본 환경
    intensity: 1.0,
    background: true,
    description: '부드러운 스튜디오 조명'
  },
  warehouse: {
    name: '창고',
    hdriUrl: 'https://dl.polyhaven.com/file/ph-assets/HDRIs/hdr/1k/warehouse.hdr',
    intensity: 0.8,
    background: false,
    description: '산업적인 창고 분위기'
  },
  sunset: {
    name: '석양',
    hdriUrl: 'https://dl.polyhaven.com/file/ph-assets/HDRIs/hdr/1k/sunset_fairway.hdr',
    intensity: 1.2,
    background: true,
    description: '따뜻한 석양 조명'
  },
  forest: {
    name: '숲',
    hdriUrl: 'https://dl.polyhaven.com/file/ph-assets/HDRIs/hdr/1k/forest_slope.hdr',
    intensity: 0.6,
    background: false,
    description: '자연스러운 숲 조명'
  },
  city: {
    name: '도시',
    hdriUrl: 'https://dl.polyhaven.com/file/ph-assets/HDRIs/hdr/1k/venice_sunset.hdr',
    intensity: 0.9,
    background: true,
    description: '도시 석양 풍경'
  }
}

interface LightingSystemProps {
  enableShadows?: boolean
  enableEnvironment?: boolean
  preset?: keyof typeof environmentPresets
}

export default function LightingSystem({
  enableShadows = true,
  enableEnvironment = true,
  preset = 'studio'
}: LightingSystemProps) {
  const { scene, gl } = useThree()
  const [currentPreset, setCurrentPreset] = useState(preset)
  
  // 그림자 설정
  useEffect(() => {
    if (enableShadows) {
      gl.shadowMap.enabled = true
      gl.shadowMap.type = THREE.PCFSoftShadowMap
      gl.shadowMap.autoUpdate = true
    }
  }, [gl, enableShadows])

  // 톤 매핑 설정
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.0
  }, [gl])

  return (
    <group>
      {/* 환경 조명 */}
      {enableEnvironment && (
        <Environment
          preset={currentPreset === 'studio' ? 'studio' : undefined}
          files={environmentPresets[currentPreset].hdriUrl || undefined}
          background={environmentPresets[currentPreset].background}
          environmentIntensity={environmentPresets[currentPreset].intensity}
        />
      )}
      
      {/* 스카이박스 (환경맵이 배경으로 사용되지 않을 때) */}
      {!environmentPresets[currentPreset].background && (
        <Sky
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0}
          azimuth={0.25}
        />
      )}
      
      {/* 주요 조명 설정 */}
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* 키 라이트 (주 조명) */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.0}
        color="#ffffff"
        castShadow={enableShadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* 필 라이트 (보조 조명) */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.3}
        color="#b8cdf0"
      />
      
      {/* 림 라이트 (윤곽 조명) */}
      <directionalLight
        position={[0, -5, -10]}
        intensity={0.2}
        color="#ff9500"
      />
      
      {/* 접촉 그림자 */}
      {enableShadows && (
        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.4}
          scale={20}
          blur={1.5}
          far={4.5}
        />
      )}
    </group>
  )
}

// 조명 제어 패널 컴포넌트 (Leva 없이 간소화)
export function LightingControls() {
  const { gl } = useThree()
  const [currentPreset] = useState<keyof typeof environmentPresets>('studio')
  
  // 기본값 사용
  const environmentIntensity = 1.0
  const exposure = 1.0
  const enableShadows = true
  
  // 노출값 적용
  useEffect(() => {
    gl.toneMappingExposure = exposure
  }, [gl, exposure])
  
  return (
    <LightingSystem
      enableShadows={enableShadows}
      enableEnvironment={true}
      preset={currentPreset}
    />
  )
}

// 재질별 추천 조명 설정
export const materialLightingPresets = {
  metallic: {
    environmentIntensity: 1.5,
    keyLightIntensity: 0.8,
    fillLightIntensity: 0.2,
    exposure: 1.2,
    description: '금속 재질용 고대비 조명'
  },
  plastic: {
    environmentIntensity: 0.8,
    keyLightIntensity: 1.2,
    fillLightIntensity: 0.4,
    exposure: 1.0,
    description: '플라스틱용 균등한 조명'
  },
  glass: {
    environmentIntensity: 2.0,
    keyLightIntensity: 0.5,
    fillLightIntensity: 0.1,
    exposure: 1.3,
    description: '투명체용 환경 반사 강조'
  },
  wood: {
    environmentIntensity: 0.6,
    keyLightIntensity: 1.0,
    fillLightIntensity: 0.5,
    exposure: 0.9,
    description: '목재용 따뜻한 조명'
  },
  ceramic: {
    environmentIntensity: 1.0,
    keyLightIntensity: 1.1,
    fillLightIntensity: 0.3,
    exposure: 1.1,
    description: '도자기용 부드러운 조명'
  }
}

// 자동 조명 최적화 함수
export function optimizeLightingForMaterial(materialType: keyof typeof materialLightingPresets) {
  const preset = materialLightingPresets[materialType]
  
  return {
    ...preset,
    environmentPreset: materialType === 'glass' ? 'studio' : 
                     materialType === 'wood' ? 'sunset' :
                     materialType === 'metallic' ? 'warehouse' : 'studio'
  }
}