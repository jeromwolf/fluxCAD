import * as THREE from 'three'
import { SceneObject } from '@/types/scene'
import { LODManager, defaultLODConfig, LODConfig } from './LODSystem'
import { InstancedRenderer } from './InstancedRenderer'
import { SpatialIndex, FrustumCuller } from './SpatialIndex'
import { MemoryManager, MemoryInfo } from './MemoryManager'

// 성능 레벨 정의
export enum PerformanceLevel {
  ULTRA = 'ultra',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  POTATO = 'potato'  // 최저 사양
}

// 성능 설정
export interface PerformanceSettings {
  level: PerformanceLevel
  enableLOD: boolean
  enableInstancing: boolean
  enableFrustumCulling: boolean
  enableMemoryManagement: boolean
  adaptiveQuality: boolean
  maxObjects: number
  targetFPS: number
}

// 기본 성능 설정
export const defaultPerformanceSettings: PerformanceSettings = {
  level: PerformanceLevel.HIGH,
  enableLOD: true,
  enableInstancing: true,
  enableFrustumCulling: true,
  enableMemoryManagement: true,
  adaptiveQuality: true,
  maxObjects: 1000,
  targetFPS: 60
}

// 성능 레벨별 설정
export const performanceLevelConfigs: Record<PerformanceLevel, Partial<PerformanceSettings> & { lodConfig: LODConfig }> = {
  [PerformanceLevel.ULTRA]: {
    maxObjects: 5000,
    targetFPS: 60,
    lodConfig: {
      highDistance: 30,
      mediumDistance: 80,
      lowDistance: 150,
      cullDistance: 300
    }
  },
  [PerformanceLevel.HIGH]: {
    maxObjects: 2000,
    targetFPS: 60,
    lodConfig: defaultLODConfig
  },
  [PerformanceLevel.MEDIUM]: {
    maxObjects: 1000,
    targetFPS: 45,
    lodConfig: {
      highDistance: 15,
      mediumDistance: 40,
      lowDistance: 80,
      cullDistance: 150
    }
  },
  [PerformanceLevel.LOW]: {
    maxObjects: 500,
    targetFPS: 30,
    lodConfig: {
      highDistance: 10,
      mediumDistance: 25,
      lowDistance: 50,
      cullDistance: 100
    }
  },
  [PerformanceLevel.POTATO]: {
    maxObjects: 200,
    targetFPS: 20,
    enableInstancing: false,
    lodConfig: {
      highDistance: 5,
      mediumDistance: 15,
      lowDistance: 30,
      cullDistance: 60
    }
  }
}

// 성능 통계
export interface PerformanceStats {
  // 전체적인 성능
  fps: number
  frameTime: number
  performanceLevel: string
  
  // 렌더링 통계
  totalObjects: number
  visibleObjects: number
  culledObjects: number
  renderedTriangles: number
  drawCalls: number
  
  // LOD 통계
  lodStats: {
    high: number
    medium: number
    low: number
    culled: number
  }
  
  // 인스턴싱 통계
  instancingStats: {
    totalInstances: number
    instanceGroups: number
    efficiency: string
  }
  
  // 메모리 통계
  memoryUsage: MemoryInfo
  
  // 공간 인덱스 통계
  spatialStats: {
    queryTime: number
    octreeNodes: number
  }
}

// 퍼포먼스 매니저
export class PerformanceManager {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer
  
  // 성능 시스템들
  private lodManager: LODManager
  private instancedRenderer: InstancedRenderer
  private spatialIndex: SpatialIndex
  private memoryManager: MemoryManager
  
  // 설정 및 상태
  private settings: PerformanceSettings
  private objects: Map<string, SceneObject> = new Map()
  private isEnabled: boolean = true
  
  // 적응형 품질 조정
  private lastPerformanceCheck: number = 0
  private performanceCheckInterval: number = 2000 // 2초마다
  private consecutiveLowFrames: number = 0
  private qualityAdjustmentCooldown: number = 0
  
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    settings: Partial<PerformanceSettings> = {}
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.settings = { ...defaultPerformanceSettings, ...settings }
    
    // 성능 시스템 초기화
    this.initializePerformanceSystems()
    
    // 성능 레벨에 따른 초기 설정 적용
    this.applyPerformanceLevel(this.settings.level)
    
    console.log(`PerformanceManager initialized with ${this.settings.level} level`)
  }
  
  private initializePerformanceSystems(): void {
    // 세계 범위 계산 (기본값)
    const worldBounds = new THREE.Box3(
      new THREE.Vector3(-500, -500, -500),
      new THREE.Vector3(500, 500, 500)
    )
    
    // 시스템들 초기화
    this.lodManager = new LODManager(this.scene, this.camera)
    this.instancedRenderer = new InstancedRenderer(this.scene)
    this.spatialIndex = new SpatialIndex(worldBounds, this.camera)
    this.memoryManager = new MemoryManager(this.renderer)
    
    // 메모리 압박 시 자동 품질 조정
    this.memoryManager.onMemoryPressure(() => {
      this.handleMemoryPressure()
    })
  }
  
  // 객체 추가
  addObject(object: SceneObject): void {
    this.objects.set(object.id, object)
    
    if (!this.isEnabled) return
    
    // 각 시스템에 객체 추가
    if (this.settings.enableLOD && object.customGeometry) {
      this.lodManager.addObject(
        object.id,
        object.customGeometry,
        object.customMaterial || new THREE.MeshStandardMaterial(),
        new THREE.Vector3(...object.position),
        new THREE.Euler(...object.rotation),
        new THREE.Vector3(...object.scale)
      )
    }
    
    if (this.settings.enableInstancing) {
      this.instancedRenderer.addObject(object)
    }
    
    this.spatialIndex.addObject(object)
  }
  
  // 객체 제거
  removeObject(objectId: string): void {
    this.objects.delete(objectId)
    
    if (!this.isEnabled) return
    
    this.lodManager.removeObject(objectId)
    this.instancedRenderer.removeObject(objectId)
    this.spatialIndex.removeObject(objectId)
  }
  
  // 객체 업데이트
  updateObject(objectId: string, updates: Partial<SceneObject>): void {
    const object = this.objects.get(objectId)
    if (!object) return
    
    Object.assign(object, updates)
    
    if (!this.isEnabled) return
    
    this.instancedRenderer.updateObject(objectId, updates)
    
    // 공간 인덱스는 위치 변경 시 재삽입 필요
    if (updates.position) {
      this.spatialIndex.removeObject(objectId)
      this.spatialIndex.addObject(object)
    }
  }
  
  // 메인 업데이트 (매 프레임 호출)
  update(): void {
    if (!this.isEnabled) return
    
    // 성능 시스템들 업데이트
    if (this.settings.enableLOD) {
      this.lodManager.update()
    }
    
    if (this.settings.enableInstancing) {
      this.instancedRenderer.update()
    }
    
    if (this.settings.enableMemoryManagement) {
      this.memoryManager.update()
    }
    
    // 적응형 품질 조정
    if (this.settings.adaptiveQuality) {
      this.updateAdaptiveQuality()
    }
  }
  
  // 가시적 객체들 가져오기 (프러스텀 컬링)
  getVisibleObjects(): SceneObject[] {
    if (!this.settings.enableFrustumCulling) {
      return Array.from(this.objects.values())
    }
    
    return this.spatialIndex.getVisibleObjects()
  }
  
  // 성능 레벨 적용
  applyPerformanceLevel(level: PerformanceLevel): void {
    console.log(`Applying performance level: ${level}`)
    
    const config = performanceLevelConfigs[level]
    
    // 설정 업데이트
    this.settings = {
      ...this.settings,
      ...config,
      level
    }
    
    // LOD 설정 업데이트
    this.lodManager.updateConfig(config.lodConfig)
    
    // 객체 수 제한 적용
    this.enforceObjectLimit()
    
    console.log(`Performance level ${level} applied successfully`)
  }
  
  // 적응형 품질 조정
  private updateAdaptiveQuality(): void {
    const now = Date.now()
    
    if (now - this.lastPerformanceCheck < this.performanceCheckInterval) {
      return
    }
    
    if (this.qualityAdjustmentCooldown > 0) {
      this.qualityAdjustmentCooldown -= this.performanceCheckInterval
      this.lastPerformanceCheck = now
      return
    }
    
    const memInfo = this.memoryManager.getMemoryInfo()
    const currentFPS = memInfo.fps
    const targetFPS = this.settings.targetFPS
    
    // 성능이 목표 FPS의 80% 이하인 경우
    if (currentFPS < targetFPS * 0.8) {
      this.consecutiveLowFrames++
      
      // 연속 3회 저성능 시 품질 낮춤
      if (this.consecutiveLowFrames >= 3) {
        this.downgradeQuality()
      }
    } else if (currentFPS > targetFPS * 0.95) {
      // 성능이 좋으면 품질 향상 시도
      this.consecutiveLowFrames = 0
      
      if (this.settings.level !== PerformanceLevel.ULTRA) {
        this.upgradeQuality()
      }
    } else {
      this.consecutiveLowFrames = 0
    }
    
    this.lastPerformanceCheck = now
  }
  
  // 품질 낮춤
  private downgradeQuality(): void {
    const levels = Object.values(PerformanceLevel)
    const currentIndex = levels.indexOf(this.settings.level)
    
    if (currentIndex < levels.length - 1) {
      const newLevel = levels[currentIndex + 1]
      console.log(`Auto-downgrading quality from ${this.settings.level} to ${newLevel}`)
      this.applyPerformanceLevel(newLevel)
      this.qualityAdjustmentCooldown = 10000 // 10초 쿨다운
    }
    
    this.consecutiveLowFrames = 0
  }
  
  // 품질 향상
  private upgradeQuality(): void {
    const levels = Object.values(PerformanceLevel)
    const currentIndex = levels.indexOf(this.settings.level)
    
    if (currentIndex > 0) {
      const newLevel = levels[currentIndex - 1]
      console.log(`Auto-upgrading quality from ${this.settings.level} to ${newLevel}`)
      this.applyPerformanceLevel(newLevel)
      this.qualityAdjustmentCooldown = 15000 // 15초 쿨다운
    }
  }
  
  // 메모리 압박 처리
  private handleMemoryPressure(): void {
    console.log('Handling memory pressure...')
    
    // 최저 품질로 강제 변경
    if (this.settings.level !== PerformanceLevel.POTATO) {
      this.applyPerformanceLevel(PerformanceLevel.POTATO)
    }
    
    // 객체 수 강제 감소
    this.enforceObjectLimit(this.settings.maxObjects * 0.5)
  }
  
  // 객체 수 제한 적용
  private enforceObjectLimit(customLimit?: number): void {
    const limit = customLimit || this.settings.maxObjects
    const objectArray = Array.from(this.objects.values())
    
    if (objectArray.length <= limit) return
    
    console.log(`Enforcing object limit: ${objectArray.length} -> ${limit}`)
    
    // 카메라에서 먼 객체부터 제거
    const cameraPos = this.camera.position
    const sortedObjects = objectArray
      .map(obj => ({
        object: obj,
        distance: cameraPos.distanceTo(new THREE.Vector3(...obj.position))
      }))
      .sort((a, b) => b.distance - a.distance)
    
    // 초과된 객체들 제거
    for (let i = limit; i < sortedObjects.length; i++) {
      this.removeObject(sortedObjects[i].object.id)
    }
  }
  
  // 성능 통계 수집
  getPerformanceStats(): PerformanceStats {
    const memInfo = this.memoryManager.getMemoryInfo()
    const lodStats = this.lodManager.stats
    const instancingEfficiency = this.instancedRenderer.getInstancingEfficiency()
    
    return {
      fps: memInfo.fps,
      frameTime: memInfo.frameTime,
      performanceLevel: this.settings.level,
      
      totalObjects: this.objects.size,
      visibleObjects: lodStats.totalObjects - lodStats.culled,
      culledObjects: lodStats.culled,
      renderedTriangles: memInfo.triangles,
      drawCalls: memInfo.drawCalls,
      
      lodStats: {
        high: lodStats.highLOD,
        medium: lodStats.mediumLOD,
        low: lodStats.lowLOD,
        culled: lodStats.culled
      },
      
      instancingStats: {
        totalInstances: instancingEfficiency.groupCount,
        instanceGroups: instancingEfficiency.groupCount,
        efficiency: instancingEfficiency.efficiency
      },
      
      memoryUsage: memInfo,
      
      spatialStats: {
        queryTime: this.spatialIndex.stats.queryTime,
        octreeNodes: this.spatialIndex.stats.octreeNodes
      }
    }
  }
  
  // 성능 시스템 활성화/비활성화
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`PerformanceManager ${enabled ? 'enabled' : 'disabled'}`)
  }
  
  // 설정 업데이트
  updateSettings(newSettings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    
    if (newSettings.level) {
      this.applyPerformanceLevel(newSettings.level)
    }
  }
  
  // 강제 최적화 실행
  forceOptimization(): void {
    console.log('Force optimization triggered')
    
    // 메모리 정리
    this.memoryManager.forceCleanup()
    
    // 공간 인덱스 리빌드
    this.spatialIndex.rebuild(Array.from(this.objects.values()))
    
    // 품질 레벨 재평가
    this.downgradeQuality()
  }
  
  // 디버그 정보
  getDebugInfo(): string[] {
    return [
      `Performance: ${this.settings.level} level (${this.isEnabled ? 'ON' : 'OFF'})`,
      this.lodManager.getDebugInfo(),
      this.instancedRenderer.getDebugInfo(),
      this.spatialIndex.getDebugInfo(),
      this.memoryManager.getDebugInfo()
    ]
  }
  
  // 정리
  dispose(): void {
    this.lodManager.dispose()
    this.instancedRenderer.dispose()
    this.memoryManager.forceCleanup()
    this.objects.clear()
    
    console.log('PerformanceManager disposed')
  }
}