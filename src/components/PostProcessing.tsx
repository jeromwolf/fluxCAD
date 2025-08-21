import React, { useMemo } from 'react'
import { Bloom, EffectComposer, SSAO, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

interface PostProcessingProps {
  enableBloom?: boolean
  enableSSAO?: boolean
  enableToneMapping?: boolean
  bloomIntensity?: number
  bloomThreshold?: number
  ssaoIntensity?: number
  ssaoRadius?: number
}

export default function PostProcessing({
  enableBloom = true,
  enableSSAO = true,
  enableToneMapping = true,
  bloomIntensity = 0.4,
  bloomThreshold = 0.85,
  ssaoIntensity = 0.5,
  ssaoRadius = 0.1
}: PostProcessingProps) {
  // 포스트 프로세싱 효과들을 메모이제이션
  const effects = useMemo(() => {
    const effectsArray = []
    
    // SSAO (Screen Space Ambient Occlusion) - 주변광 차폐
    if (enableSSAO) {
      effectsArray.push(
        <SSAO
          key="ssao"
          blendFunction={BlendFunction.MULTIPLY}
          samples={16}
          rings={4}
          distanceThreshold={0.65}
          distanceFalloff={0.1}
          rangeThreshold={0.0015}
          rangeFalloff={0.01}
          luminanceInfluence={0.7}
          intensity={ssaoIntensity}
          radius={ssaoRadius}
          color={new THREE.Color(0x000000)}
        />
      )
    }
    
    // Bloom - 밝은 부분 글로우 효과
    if (enableBloom) {
      effectsArray.push(
        <Bloom
          key="bloom"
          blendFunction={BlendFunction.ADD}
          intensity={bloomIntensity}
          width={300}
          height={300}
          kernelSize={5}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={0.025}
          mipmapBlur={false}
        />
      )
    }
    
    // 톤 매핑
    if (enableToneMapping) {
      effectsArray.push(
        <ToneMapping
          key="toneMapping"
          blendFunction={BlendFunction.NORMAL}
          adaptive={true}
          mode={ToneMappingMode.ACES_FILMIC}
          resolution={256}
          middleGrey={0.6}
          maxLuminance={16.0}
          averageLuminance={1.0}
          adaptationRate={1.0}
        />
      )
    }
    
    return effectsArray
  }, [enableSSAO, enableBloom, enableToneMapping, bloomIntensity, bloomThreshold, ssaoIntensity, ssaoRadius])

  return (
    <EffectComposer
      multisampling={4}
      stencilBuffer={false}
      disableNormalPass={false}
    >
      {effects}
    </EffectComposer>
  )
}

// 재질별 최적화된 후처리 프리셋
export const postProcessingPresets = {
  metallic: {
    enableBloom: true,
    enableSSAO: true,
    enableToneMapping: true,
    bloomIntensity: 0.6,
    bloomThreshold: 0.8,
    ssaoIntensity: 0.7,
    ssaoRadius: 0.15,
    description: '금속 재질: 강한 반사와 깊이감'
  },
  plastic: {
    enableBloom: false,
    enableSSAO: true,
    enableToneMapping: true,
    bloomIntensity: 0.2,
    bloomThreshold: 0.9,
    ssaoIntensity: 0.4,
    ssaoRadius: 0.1,
    description: '플라스틱: 자연스러운 음영'
  },
  glass: {
    enableBloom: true,
    enableSSAO: false,
    enableToneMapping: true,
    bloomIntensity: 0.8,
    bloomThreshold: 0.7,
    ssaoIntensity: 0.2,
    ssaoRadius: 0.05,
    description: '유리: 투명도와 굴절 강조'
  },
  wood: {
    enableBloom: false,
    enableSSAO: true,
    enableToneMapping: true,
    bloomIntensity: 0.1,
    bloomThreshold: 0.95,
    ssaoIntensity: 0.6,
    ssaoRadius: 0.2,
    description: '목재: 따뜻하고 자연스러운 질감'
  },
  ceramic: {
    enableBloom: true,
    enableSSAO: true,
    enableToneMapping: true,
    bloomIntensity: 0.3,
    bloomThreshold: 0.85,
    ssaoIntensity: 0.5,
    ssaoRadius: 0.12,
    description: '도자기: 부드러운 표면과 은은한 글로우'
  },
  architecture: {
    enableBloom: false,
    enableSSAO: true,
    enableToneMapping: true,
    bloomIntensity: 0.1,
    bloomThreshold: 0.9,
    ssaoIntensity: 0.8,
    ssaoRadius: 0.25,
    description: '건축 모델: 선명한 그림자와 구조적 깊이감'
  },
  product: {
    enableBloom: true,
    enableSSAO: true,
    enableToneMapping: true,
    bloomIntensity: 0.4,
    bloomThreshold: 0.82,
    ssaoIntensity: 0.6,
    ssaoRadius: 0.15,
    description: '제품 렌더링: 고품질 상업적 외관'
  }
}

// 씬 분석 기반 자동 후처리 설정
export function analyzeSceneForPostProcessing(objects: any[]): keyof typeof postProcessingPresets {
  if (!objects || objects.length === 0) return 'product'
  
  // 재질 분석
  const materialCounts = {
    metallic: 0,
    plastic: 0,
    glass: 0,
    wood: 0,
    ceramic: 0
  }
  
  objects.forEach(obj => {
    if (obj.customMaterial) {
      const material = obj.customMaterial
      if (material.metalness > 0.7) {
        materialCounts.metallic++
      } else if (material.transparent) {
        materialCounts.glass++
      } else if (material.roughness > 0.8) {
        materialCounts.wood++
      } else {
        materialCounts.plastic++
      }
    }
  })
  
  // 가장 많은 재질 타입을 기준으로 프리셋 선택
  const dominantMaterial = Object.entries(materialCounts)
    .sort(([,a], [,b]) => b - a)[0][0] as keyof typeof postProcessingPresets
  
  // 객체 수에 따른 조정
  if (objects.length > 20) {
    return 'architecture' // 복잡한 씬
  } else if (objects.length < 5) {
    return 'product' // 단순한 제품 렌더링
  }
  
  return dominantMaterial
}

// 퀄리티 레벨별 후처리 설정
export const qualityPresets = {
  low: {
    multisampling: 0,
    ssaoSamples: 8,
    bloomWidth: 150,
    bloomHeight: 150,
    toneMappingResolution: 128
  },
  medium: {
    multisampling: 2,
    ssaoSamples: 16,
    bloomWidth: 300,
    bloomHeight: 300,
    toneMappingResolution: 256
  },
  high: {
    multisampling: 4,
    ssaoSamples: 32,
    bloomWidth: 512,
    bloomHeight: 512,
    toneMappingResolution: 512
  },
  ultra: {
    multisampling: 8,
    ssaoSamples: 64,
    bloomWidth: 1024,
    bloomHeight: 1024,
    toneMappingResolution: 1024
  }
}

// 성능 기반 자동 퀄리티 조정
export function getOptimalQuality(): keyof typeof qualityPresets {
  // WebGL 컨텍스트 성능 추정
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  
  if (!gl) return 'low'
  
  // GPU 정보 추정
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ''
  
  // 간단한 성능 분류
  if (renderer.includes('RTX') || renderer.includes('RX 6')) {
    return 'ultra'
  } else if (renderer.includes('GTX') || renderer.includes('RX 5')) {
    return 'high'
  } else if (renderer.includes('Intel') && renderer.includes('Iris')) {
    return 'medium'
  } else {
    return 'low'
  }
}