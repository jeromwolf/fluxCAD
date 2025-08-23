// 성능 최적화 시스템 통합 내보내기

// 메인 성능 매니저
export { 
  PerformanceManager, 
  PerformanceLevel, 
  type PerformanceSettings, 
  type PerformanceStats,
  defaultPerformanceSettings,
  performanceLevelConfigs
} from './PerformanceManager'

// LOD (Level of Detail) 시스템
export {
  LODManager,
  LODObject,
  LODLevel,
  GeometrySimplifier,
  type LODConfig,
  defaultLODConfig
} from './LODSystem'

// 인스턴싱 렌더러
export {
  InstancedRenderer,
  InstanceGroup,
  type InstanceData
} from './InstancedRenderer'

// 공간 인덱스 및 프러스텀 컬링
export {
  SpatialIndex,
  FrustumCuller,
  OctreeNode
} from './SpatialIndex'

// Frustum Culling 시스템
export {
  FrustumCullingSystem,
  type CullableObject
} from './FrustumCulling'

// 메모리 관리
export {
  MemoryManager,
  LRUCache,
  PerformanceMonitor,
  type MemoryInfo
} from './MemoryManager'

// 성능 레벨 임포트
import { PerformanceLevel } from './PerformanceManager'
import * as THREE from 'three'

// 성능 유틸리티 함수들
export const PerformanceUtils = {
  // GPU 성능 추정
  estimateGPUPerformance(): PerformanceLevel {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    
    if (!gl) return PerformanceLevel.LOW
    
    // GPU 정보 가져오기
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ''
    
    // 간단한 성능 분류
    if (renderer.includes('RTX') || renderer.includes('RX 6') || renderer.includes('RX 7')) {
      return PerformanceLevel.ULTRA
    } else if (renderer.includes('GTX 16') || renderer.includes('GTX 20') || renderer.includes('RX 5')) {
      return PerformanceLevel.HIGH
    } else if (renderer.includes('GTX 10') || renderer.includes('RX 4')) {
      return PerformanceLevel.MEDIUM
    } else if (renderer.includes('Intel') && renderer.includes('Iris')) {
      return PerformanceLevel.MEDIUM
    } else {
      return PerformanceLevel.LOW
    }
  },
  
  // 메모리 용량 추정
  estimateAvailableMemory(): number {
    // JavaScript 힙 메모리 정보 (Chrome/Edge)
    const memory = (performance as any).memory
    if (memory) {
      return memory.jsHeapSizeLimit
    }
    
    // 대략적인 추정 (다른 브라우저)
    return 2 * 1024 * 1024 * 1024 // 2GB 가정
  },
  
  // 최적 성능 레벨 추천
  recommendPerformanceLevel(): PerformanceLevel {
    const gpuLevel = PerformanceUtils.estimateGPUPerformance()
    const availableMemory = PerformanceUtils.estimateAvailableMemory()
    
    // 메모리가 1GB 미만이면 한 단계 낮춤
    if (availableMemory < 1024 * 1024 * 1024) {
      const levels = Object.values(PerformanceLevel)
      const currentIndex = levels.indexOf(gpuLevel)
      return levels[Math.min(currentIndex + 1, levels.length - 1)]
    }
    
    return gpuLevel
  },
  
  // 객체 복잡도 계산
  calculateObjectComplexity(geometry: THREE.BufferGeometry): number {
    const position = geometry.getAttribute('position')
    if (!position) return 0
    
    const vertexCount = position.count
    const faceCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3
    
    // 복잡도 점수 (0-100)
    return Math.min(100, Math.log10(faceCount) * 20)
  },
  
  // 화면 밀도 감지
  getScreenDensity(): number {
    return window.devicePixelRatio || 1
  },
  
  // 모바일 기기 감지
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },
  
  // 배터리 상태 기반 성능 조정 (실험적)
  async getBatteryPerformanceHint(): Promise<'high' | 'medium' | 'low'> {
    try {
      const battery = await (navigator as any).getBattery?.()
      if (battery) {
        if (battery.charging) return 'high'
        if (battery.level > 0.5) return 'medium'
        return 'low'
      }
    } catch (e) {
      // 배터리 API 지원 안함
    }
    
    return 'medium'
  }
}

// 성능 최적화 가이드라인
export const PerformanceGuidelines = {
  // 객체 수 제한 가이드라인
  MAX_OBJECTS: {
    [PerformanceLevel.ULTRA]: 5000,
    [PerformanceLevel.HIGH]: 2000,
    [PerformanceLevel.MEDIUM]: 1000,
    [PerformanceLevel.LOW]: 500,
    [PerformanceLevel.POTATO]: 200
  },
  
  // 삼각형 수 제한 가이드라인
  MAX_TRIANGLES: {
    [PerformanceLevel.ULTRA]: 10_000_000,
    [PerformanceLevel.HIGH]: 5_000_000,
    [PerformanceLevel.MEDIUM]: 2_000_000,
    [PerformanceLevel.LOW]: 1_000_000,
    [PerformanceLevel.POTATO]: 500_000
  },
  
  // 텍스처 해상도 제한
  MAX_TEXTURE_SIZE: {
    [PerformanceLevel.ULTRA]: 4096,
    [PerformanceLevel.HIGH]: 2048,
    [PerformanceLevel.MEDIUM]: 1024,
    [PerformanceLevel.LOW]: 512,
    [PerformanceLevel.POTATO]: 256
  },
  
  // 권장 FPS 타겟
  TARGET_FPS: {
    [PerformanceLevel.ULTRA]: 60,
    [PerformanceLevel.HIGH]: 60,
    [PerformanceLevel.MEDIUM]: 45,
    [PerformanceLevel.LOW]: 30,
    [PerformanceLevel.POTATO]: 20
  }
}

// 성능 최적화 팁
export const PerformanceTips = [
  {
    level: PerformanceLevel.ULTRA,
    tips: [
      '모든 고급 기능 활성화',
      '최고 품질 후처리 효과 사용',
      'HDR 환경맵과 고해상도 텍스처 사용'
    ]
  },
  {
    level: PerformanceLevel.HIGH,
    tips: [
      'LOD와 인스턴싱 최적화 활용',
      '적당한 품질의 후처리 효과',
      '효율적인 재질 관리'
    ]
  },
  {
    level: PerformanceLevel.MEDIUM,
    tips: [
      '객체 수 제한으로 성능 확보',
      '필수 후처리 효과만 사용',
      '텍스처 해상도 조정'
    ]
  },
  {
    level: PerformanceLevel.LOW,
    tips: [
      '적극적인 LOD와 컬링 사용',
      '단순한 재질과 조명',
      '불필요한 기능 비활성화'
    ]
  },
  {
    level: PerformanceLevel.POTATO,
    tips: [
      '최소한의 객체만 렌더링',
      '모든 고급 기능 비활성화',
      '기본 재질과 조명만 사용'
    ]
  }
]