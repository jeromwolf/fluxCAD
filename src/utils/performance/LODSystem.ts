import * as THREE from 'three'
import { SceneObject } from '@/types/scene'

// LOD 레벨 정의
export enum LODLevel {
  HIGH = 0,    // 가까운 거리 - 원본 해상도
  MEDIUM = 1,  // 중간 거리 - 50% 해상도
  LOW = 2,     // 먼 거리 - 25% 해상도
  CULLED = 3   // 화면 밖 - 렌더링 안함
}

// LOD 설정
export interface LODConfig {
  highDistance: number    // 고해상도 거리
  mediumDistance: number  // 중해상도 거리
  lowDistance: number     // 저해상도 거리
  cullDistance: number    // 컬링 거리
}

// 기본 LOD 설정
export const defaultLODConfig: LODConfig = {
  highDistance: 20,
  mediumDistance: 50,
  lowDistance: 100,
  cullDistance: 200
}

// 지오메트리 단순화 유틸리티
export class GeometrySimplifier {
  // 버텍스 수를 줄여서 지오메트리 단순화
  static simplifyGeometry(
    geometry: THREE.BufferGeometry, 
    ratio: number
  ): THREE.BufferGeometry {
    const simplified = geometry.clone()
    
    if (ratio >= 1.0) return simplified
    
    const position = simplified.getAttribute('position')
    const normal = simplified.getAttribute('normal')
    const uv = simplified.getAttribute('uv')
    const index = simplified.getIndex()
    
    if (!position) return simplified
    
    // 간단한 버텍스 데시메이션 (실제로는 더 정교한 알고리즘 필요)
    const vertexCount = position.count
    const targetCount = Math.max(3, Math.floor(vertexCount * ratio))
    
    if (targetCount >= vertexCount) return simplified
    
    // 균등하게 버텍스 샘플링
    const step = vertexCount / targetCount
    const newPositions: number[] = []
    const newNormals: number[] = []
    const newUVs: number[] = []
    
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.floor(i * step)
      
      // Position
      newPositions.push(
        position.getX(idx),
        position.getY(idx),
        position.getZ(idx)
      )
      
      // Normal
      if (normal) {
        newNormals.push(
          normal.getX(idx),
          normal.getY(idx),
          normal.getZ(idx)
        )
      }
      
      // UV
      if (uv) {
        newUVs.push(
          uv.getX(idx),
          uv.getY(idx)
        )
      }
    }
    
    // 새 버퍼 어트리뷰트 설정
    simplified.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3))
    
    if (newNormals.length > 0) {
      simplified.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3))
    }
    
    if (newUVs.length > 0) {
      simplified.setAttribute('uv', new THREE.Float32BufferAttribute(newUVs, 2))
    }
    
    // 인덱스 제거 (단순화된 지오메트리)
    simplified.setIndex(null)
    
    return simplified
  }
  
  // 바운딩 박스 기반 임포스터 생성
  static createImpostor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material
  ): THREE.Mesh {
    const bbox = geometry.boundingBox || new THREE.Box3().setFromBufferAttribute(
      geometry.getAttribute('position')
    )
    
    const size = bbox.getSize(new THREE.Vector3())
    const center = bbox.getCenter(new THREE.Vector3())
    
    // 가장 큰 면을 기준으로 플레인 생성
    const maxDimension = Math.max(size.x, size.y, size.z)
    const planeGeometry = new THREE.PlaneGeometry(maxDimension, maxDimension)
    
    // 임포스터 재질 (빌보드 효과)
    const impostorMaterial = new THREE.MeshBasicMaterial({
      color: material instanceof THREE.MeshStandardMaterial ? material.color : new THREE.Color(0x888888),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    
    const impostor = new THREE.Mesh(planeGeometry, impostorMaterial)
    impostor.position.copy(center)
    
    return impostor
  }
}

// LOD 객체 관리자
export class LODObject {
  public readonly id: string
  public readonly originalGeometry: THREE.BufferGeometry
  public readonly material: THREE.Material
  
  private lodMeshes: Map<LODLevel, THREE.Mesh> = new Map()
  private currentLOD: LODLevel = LODLevel.HIGH
  private isVisible: boolean = true
  
  constructor(
    id: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material
  ) {
    this.id = id
    this.originalGeometry = geometry.clone()
    this.material = material
    
    this.generateLODMeshes()
  }
  
  private generateLODMeshes(): void {
    // 고해상도 (원본)
    const highMesh = new THREE.Mesh(this.originalGeometry, this.material)
    highMesh.name = `${this.id}_LOD_HIGH`
    this.lodMeshes.set(LODLevel.HIGH, highMesh)
    
    // 중해상도 (50% 단순화)
    const mediumGeometry = GeometrySimplifier.simplifyGeometry(this.originalGeometry, 0.5)
    const mediumMesh = new THREE.Mesh(mediumGeometry, this.material)
    mediumMesh.name = `${this.id}_LOD_MEDIUM`
    this.lodMeshes.set(LODLevel.MEDIUM, mediumMesh)
    
    // 저해상도 (25% 단순화)
    const lowGeometry = GeometrySimplifier.simplifyGeometry(this.originalGeometry, 0.25)
    const lowMesh = new THREE.Mesh(lowGeometry, this.material)
    lowMesh.name = `${this.id}_LOD_LOW`
    this.lodMeshes.set(LODLevel.LOW, lowMesh)
  }
  
  // 거리에 따른 LOD 레벨 결정
  public updateLOD(distance: number, config: LODConfig): boolean {
    let newLOD: LODLevel
    
    if (distance <= config.highDistance) {
      newLOD = LODLevel.HIGH
    } else if (distance <= config.mediumDistance) {
      newLOD = LODLevel.MEDIUM
    } else if (distance <= config.lowDistance) {
      newLOD = LODLevel.LOW
    } else {
      newLOD = LODLevel.CULLED
    }
    
    const hasChanged = newLOD !== this.currentLOD
    this.currentLOD = newLOD
    
    return hasChanged
  }
  
  // 현재 LOD 레벨의 메시 반환
  public getCurrentMesh(): THREE.Mesh | null {
    if (this.currentLOD === LODLevel.CULLED) {
      return null
    }
    
    return this.lodMeshes.get(this.currentLOD) || null
  }
  
  // 현재 LOD 레벨
  public getCurrentLODLevel(): LODLevel {
    return this.currentLOD
  }
  
  // 가시성 설정
  public setVisible(visible: boolean): void {
    this.isVisible = visible
    this.lodMeshes.forEach(mesh => {
      mesh.visible = visible && this.currentLOD !== LODLevel.CULLED
    })
  }
  
  // 위치 업데이트
  public updateTransform(
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3
  ): void {
    this.lodMeshes.forEach(mesh => {
      mesh.position.copy(position)
      mesh.rotation.copy(rotation)
      mesh.scale.copy(scale)
    })
  }
  
  // 메모리 정리
  public dispose(): void {
    this.lodMeshes.forEach(mesh => {
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose())
      } else {
        mesh.material.dispose()
      }
    })
    this.lodMeshes.clear()
  }
}

// LOD 매니저
export class LODManager {
  private lodObjects: Map<string, LODObject> = new Map()
  private scene: THREE.Scene
  private camera: THREE.Camera
  private config: LODConfig
  
  // 성능 통계
  public stats = {
    totalObjects: 0,
    highLOD: 0,
    mediumLOD: 0,
    lowLOD: 0,
    culled: 0,
    trianglesRendered: 0
  }
  
  constructor(scene: THREE.Scene, camera: THREE.Camera, config?: LODConfig) {
    this.scene = scene
    this.camera = camera
    this.config = config || defaultLODConfig
  }
  
  // LOD 객체 추가
  public addObject(
    id: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position?: THREE.Vector3,
    rotation?: THREE.Euler,
    scale?: THREE.Vector3
  ): void {
    const lodObject = new LODObject(id, geometry, material)
    
    if (position || rotation || scale) {
      lodObject.updateTransform(
        position || new THREE.Vector3(),
        rotation || new THREE.Euler(),
        scale || new THREE.Vector3(1, 1, 1)
      )
    }
    
    this.lodObjects.set(id, lodObject)
  }
  
  // LOD 객체 제거
  public removeObject(id: string): void {
    const lodObject = this.lodObjects.get(id)
    if (lodObject) {
      // 씬에서 메시 제거
      const currentMesh = lodObject.getCurrentMesh()
      if (currentMesh && currentMesh.parent === this.scene) {
        this.scene.remove(currentMesh)
      }
      
      lodObject.dispose()
      this.lodObjects.delete(id)
    }
  }
  
  // 전체 LOD 업데이트 (매 프레임 호출)
  public update(): void {
    this.resetStats()
    
    const cameraPosition = this.camera.position
    
    this.lodObjects.forEach((lodObject, id) => {
      const currentMesh = lodObject.getCurrentMesh()
      if (!currentMesh) return
      
      // 카메라와의 거리 계산
      const distance = cameraPosition.distanceTo(currentMesh.position)
      
      // LOD 업데이트
      const hasChanged = lodObject.updateLOD(distance, this.config)
      
      if (hasChanged) {
        // 이전 메시 제거
        if (currentMesh.parent === this.scene) {
          this.scene.remove(currentMesh)
        }
        
        // 새 LOD 메시 추가
        const newMesh = lodObject.getCurrentMesh()
        if (newMesh) {
          this.scene.add(newMesh)
        }
      }
      
      // 통계 업데이트
      this.updateStats(lodObject)
    })
  }
  
  private resetStats(): void {
    this.stats.totalObjects = this.lodObjects.size
    this.stats.highLOD = 0
    this.stats.mediumLOD = 0
    this.stats.lowLOD = 0
    this.stats.culled = 0
    this.stats.trianglesRendered = 0
  }
  
  private updateStats(lodObject: LODObject): void {
    const level = lodObject.getCurrentLODLevel()
    
    switch (level) {
      case LODLevel.HIGH:
        this.stats.highLOD++
        break
      case LODLevel.MEDIUM:
        this.stats.mediumLOD++
        break
      case LODLevel.LOW:
        this.stats.lowLOD++
        break
      case LODLevel.CULLED:
        this.stats.culled++
        break
    }
    
    // 삼각형 수 계산 (근사치)
    const mesh = lodObject.getCurrentMesh()
    if (mesh && mesh.geometry) {
      const positions = mesh.geometry.getAttribute('position')
      if (positions) {
        this.stats.trianglesRendered += positions.count / 3
      }
    }
  }
  
  // 설정 업데이트
  public updateConfig(config: Partial<LODConfig>): void {
    this.config = { ...this.config, ...config }
  }
  
  // 모든 객체 정리
  public dispose(): void {
    this.lodObjects.forEach(lodObject => {
      lodObject.dispose()
    })
    this.lodObjects.clear()
  }
  
  // 디버그 정보
  public getDebugInfo(): string {
    return `LOD Stats: ${this.stats.totalObjects} objects | ` +
           `H:${this.stats.highLOD} M:${this.stats.mediumLOD} L:${this.stats.lowLOD} ` +
           `C:${this.stats.culled} | ${Math.floor(this.stats.trianglesRendered)} triangles`
  }
}