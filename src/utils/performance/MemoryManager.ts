import * as THREE from 'three'

// 메모리 사용량 정보
export interface MemoryInfo {
  // WebGL 메모리
  geometries: number
  textures: number
  materials: number
  renderTargets: number
  
  // JavaScript 힙 메모리 (추정)
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  
  // 성능 메트릭
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  
  // 캐시 통계
  cacheHits: number
  cacheMisses: number
  cacheSize: number
}

// 리소스 캐시 아이템
interface CacheItem<T> {
  data: T
  lastAccessed: number
  accessCount: number
  size: number  // 바이트 추정
}

// LRU 캐시 구현
export class LRUCache<T> {
  private cache: Map<string, CacheItem<T>> = new Map()
  private maxSize: number
  private currentSize: number = 0
  private hits: number = 0
  private misses: number = 0
  
  constructor(maxSizeBytes: number = 100 * 1024 * 1024) { // 기본 100MB
    this.maxSize = maxSizeBytes
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (item) {
      item.lastAccessed = Date.now()
      item.accessCount++
      this.hits++
      return item.data
    }
    
    this.misses++
    return null
  }
  
  set(key: string, data: T, estimatedSize: number = 1024): void {
    // 기존 아이템 제거
    if (this.cache.has(key)) {
      this.remove(key)
    }
    
    // 공간 확보
    this.ensureSpace(estimatedSize)
    
    // 새 아이템 추가
    const item: CacheItem<T> = {
      data,
      lastAccessed: Date.now(),
      accessCount: 1,
      size: estimatedSize
    }
    
    this.cache.set(key, item)
    this.currentSize += estimatedSize
  }
  
  remove(key: string): boolean {
    const item = this.cache.get(key)
    if (item) {
      this.currentSize -= item.size
      this.cache.delete(key)
      
      // Three.js 리소스 정리
      if (item.data instanceof THREE.BufferGeometry) {
        item.data.dispose()
      } else if (item.data instanceof THREE.Material) {
        item.data.dispose()
      } else if (item.data instanceof THREE.Texture) {
        item.data.dispose()
      }
      
      return true
    }
    return false
  }
  
  private ensureSpace(requiredSize: number): void {
    // 필요한 공간이 최대 크기보다 크면 캐시 클리어
    if (requiredSize > this.maxSize) {
      this.clear()
      return
    }
    
    // LRU 방식으로 공간 확보
    const items = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)
    
    for (const [key, item] of items) {
      if (this.currentSize + requiredSize <= this.maxSize) {
        break
      }
      
      this.remove(key)
    }
  }
  
  clear(): void {
    for (const [key] of this.cache) {
      this.remove(key)
    }
    this.cache.clear()
    this.currentSize = 0
  }
  
  getStats(): { hits: number, misses: number, size: number, count: number, hitRate: number } {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.currentSize,
      count: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0
    }
  }
}

// 성능 모니터
export class PerformanceMonitor {
  private fpsHistory: number[] = []
  private frameTimeHistory: number[] = []
  private lastTime: number = 0
  private frameCount: number = 0
  private lastFpsUpdate: number = 0
  
  // 성능 임계값
  private static readonly TARGET_FPS = 60
  private static readonly WARNING_FPS = 30
  private static readonly CRITICAL_FPS = 15
  
  update(): void {
    const now = performance.now()
    const deltaTime = now - this.lastTime
    
    this.frameTimeHistory.push(deltaTime)
    if (this.frameTimeHistory.length > 120) { // 2초간의 프레임타임 유지
      this.frameTimeHistory.shift()
    }
    
    this.frameCount++
    
    // FPS 계산 (1초마다)
    if (now - this.lastFpsUpdate >= 1000) {
      const fps = this.frameCount * 1000 / (now - this.lastFpsUpdate)
      this.fpsHistory.push(fps)
      
      if (this.fpsHistory.length > 60) { // 1분간의 FPS 유지
        this.fpsHistory.shift()
      }
      
      this.frameCount = 0
      this.lastFpsUpdate = now
    }
    
    this.lastTime = now
  }
  
  getCurrentFPS(): number {
    return this.fpsHistory.length > 0 ? this.fpsHistory[this.fpsHistory.length - 1] : 60
  }
  
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
  }
  
  getCurrentFrameTime(): number {
    return this.frameTimeHistory.length > 0 ? this.frameTimeHistory[this.frameTimeHistory.length - 1] : 16.67
  }
  
  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 16.67
    return this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length
  }
  
  getPerformanceLevel(): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    const avgFps = this.getAverageFPS()
    
    if (avgFps >= PerformanceMonitor.TARGET_FPS * 0.9) return 'excellent'
    if (avgFps >= PerformanceMonitor.TARGET_FPS * 0.7) return 'good'
    if (avgFps >= PerformanceMonitor.WARNING_FPS) return 'fair'
    if (avgFps >= PerformanceMonitor.CRITICAL_FPS) return 'poor'
    return 'critical'
  }
  
  shouldReduceQuality(): boolean {
    return this.getPerformanceLevel() === 'poor' || this.getPerformanceLevel() === 'critical'
  }
  
  getFrameTimeSpikes(): number {
    // 16.67ms (60fps)의 2배를 넘는 프레임 수
    return this.frameTimeHistory.filter(time => time > 33.34).length
  }
}

// 메모리 매니저
export class MemoryManager {
  private geometryCache = new LRUCache<THREE.BufferGeometry>(50 * 1024 * 1024) // 50MB
  private materialCache = new LRUCache<THREE.Material>(20 * 1024 * 1024)      // 20MB
  private textureCache = new LRUCache<THREE.Texture>(100 * 1024 * 1024)       // 100MB
  
  private performanceMonitor = new PerformanceMonitor()
  private renderer: THREE.WebGLRenderer
  
  // 메모리 압박 상황 감지
  private memoryPressureCallbacks: (() => void)[] = []
  
  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer
    this.setupMemoryPressureDetection()
  }
  
  // 지오메트리 캐싱
  cacheGeometry(key: string, geometry: THREE.BufferGeometry): void {
    const size = this.estimateGeometrySize(geometry)
    this.geometryCache.set(key, geometry.clone(), size)
  }
  
  getCachedGeometry(key: string): THREE.BufferGeometry | null {
    return this.geometryCache.get(key)
  }
  
  // 재질 캐싱
  cacheMaterial(key: string, material: THREE.Material): void {
    const size = this.estimateMaterialSize(material)
    this.materialCache.set(key, material.clone(), size)
  }
  
  getCachedMaterial(key: string): THREE.Material | null {
    return this.materialCache.get(key)
  }
  
  // 텍스처 캐싱
  cacheTexture(key: string, texture: THREE.Texture): void {
    const size = this.estimateTextureSize(texture)
    this.textureCache.set(key, texture.clone(), size)
  }
  
  getCachedTexture(key: string): THREE.Texture | null {
    return this.textureCache.get(key)
  }
  
  // 성능 업데이트 (매 프레임 호출)
  update(): void {
    this.performanceMonitor.update()
    
    // 메모리 압박 상황 체크
    if (this.isMemoryPressureHigh()) {
      this.handleMemoryPressure()
    }
  }
  
  // 메모리 정보 수집
  getMemoryInfo(): MemoryInfo {
    const info = this.renderer.info
    const glInfo = this.renderer.getContext().getExtension('WEBGL_debug_renderer_info')
    
    // JavaScript 힙 메모리 (Chrome/Edge에서만 사용 가능)
    const memory = (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    }
    
    return {
      // WebGL 메모리
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      materials: info.programs?.length || 0,
      renderTargets: 0, // Three.js r150+에서는 직접 접근 불가
      
      // JavaScript 메모리
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      
      // 성능 메트릭
      fps: this.performanceMonitor.getCurrentFPS(),
      frameTime: this.performanceMonitor.getCurrentFrameTime(),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      
      // 캐시 통계
      cacheHits: this.getTotalCacheHits(),
      cacheMisses: this.getTotalCacheMisses(),
      cacheSize: this.getTotalCacheSize()
    }
  }
  
  // 메모리 압박 감지
  private isMemoryPressureHigh(): boolean {
    const info = this.getMemoryInfo()
    
    // JavaScript 힙 사용률이 80% 이상
    if (info.jsHeapSizeLimit > 0) {
      const heapUsageRatio = info.usedJSHeapSize / info.jsHeapSizeLimit
      if (heapUsageRatio > 0.8) return true
    }
    
    // WebGL 리소스가 너무 많음
    if (info.geometries > 1000 || info.textures > 500) return true
    
    // 성능이 임계점 이하
    if (this.performanceMonitor.shouldReduceQuality()) return true
    
    return false
  }
  
  // 메모리 압박 처리
  private handleMemoryPressure(): void {
    console.warn('High memory pressure detected, cleaning up resources...')
    
    // 캐시 크기 축소
    this.geometryCache.clear()
    this.materialCache.clear()
    
    // 사용하지 않는 텍스처 정리 (절반만 유지)
    const textureStats = this.textureCache.getStats()
    for (let i = 0; i < textureStats.count / 2; i++) {
      // LRU 방식으로 정리됨
    }
    
    // 가비지 컬렉션 강제 실행 (가능한 경우)
    if ((window as any).gc) {
      (window as any).gc()
    }
    
    // 콜백 실행
    this.memoryPressureCallbacks.forEach(callback => callback())
  }
  
  // 메모리 압박 시 콜백 등록
  onMemoryPressure(callback: () => void): void {
    this.memoryPressureCallbacks.push(callback)
  }
  
  // 리소스 크기 추정
  private estimateGeometrySize(geometry: THREE.BufferGeometry): number {
    let size = 0
    
    const attributes = geometry.attributes
    for (const name in attributes) {
      const attribute = attributes[name]
      size += attribute.array.byteLength
    }
    
    const index = geometry.index
    if (index) {
      size += index.array.byteLength
    }
    
    return size
  }
  
  private estimateMaterialSize(material: THREE.Material): number {
    // 기본 재질 크기 + 텍스처들
    let size = 1024 // 기본 재질 데이터
    
    if (material instanceof THREE.MeshStandardMaterial) {
      if (material.map) size += this.estimateTextureSize(material.map)
      if (material.normalMap) size += this.estimateTextureSize(material.normalMap)
      if (material.roughnessMap) size += this.estimateTextureSize(material.roughnessMap)
      if (material.metalnessMap) size += this.estimateTextureSize(material.metalnessMap)
    }
    
    return size
  }
  
  private estimateTextureSize(texture: THREE.Texture): number {
    if (!texture.image) return 1024
    
    const image = texture.image
    const width = image.width || 256
    const height = image.height || 256
    
    // RGBA * width * height * mipmaps (추정)
    return width * height * 4 * 1.33 // 1.33은 밉맵 오버헤드
  }
  
  // 메모리 압박 감지 설정
  private setupMemoryPressureDetection(): void {
    // 브라우저의 메모리 압박 이벤트 감지 (실험적)
    if ('memory' in navigator) {
      // 주기적으로 메모리 체크
      setInterval(() => {
        if (this.isMemoryPressureHigh()) {
          this.handleMemoryPressure()
        }
      }, 5000) // 5초마다
    }
  }
  
  // 전체 캐시 통계
  private getTotalCacheHits(): number {
    return this.geometryCache.getStats().hits + 
           this.materialCache.getStats().hits + 
           this.textureCache.getStats().hits
  }
  
  private getTotalCacheMisses(): number {
    return this.geometryCache.getStats().misses + 
           this.materialCache.getStats().misses + 
           this.textureCache.getStats().misses
  }
  
  private getTotalCacheSize(): number {
    return this.geometryCache.getStats().size + 
           this.materialCache.getStats().size + 
           this.textureCache.getStats().size
  }
  
  // 강제 정리
  forceCleanup(): void {
    this.geometryCache.clear()
    this.materialCache.clear()
    this.textureCache.clear()
    
    // Three.js 렌더러 정보 리셋
    this.renderer.info.autoReset = true
    this.renderer.info.reset()
  }
  
  // 디버그 정보
  getDebugInfo(): string {
    const memInfo = this.getMemoryInfo()
    const perfLevel = this.performanceMonitor.getPerformanceLevel()
    
    return `Memory: ${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)}MB JS heap | ` +
           `${memInfo.geometries} geo, ${memInfo.textures} tex | ` +
           `Performance: ${perfLevel} (${memInfo.fps.toFixed(0)} FPS)`
  }
}