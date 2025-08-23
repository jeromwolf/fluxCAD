import * as THREE from 'three'
import { SceneObject } from '@/types/scene'

// 인스턴스 데이터
export interface InstanceData {
  id: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  color?: THREE.Color
  visible: boolean
}

// 인스턴스 그룹 (같은 지오메트리를 가진 객체들)
export class InstanceGroup {
  public readonly geometryKey: string
  public readonly geometry: THREE.BufferGeometry
  public readonly material: THREE.Material
  private instances: Map<string, InstanceData> = new Map()
  private instancedMesh: THREE.InstancedMesh | null = null
  private scene: THREE.Scene
  private needsUpdate: boolean = true
  
  // 인스턴스별 매트릭스와 컬러
  private matrixArray: Float32Array = new Float32Array()
  private colorArray: Float32Array = new Float32Array()
  
  constructor(
    geometryKey: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    scene: THREE.Scene
  ) {
    this.geometryKey = geometryKey
    this.geometry = geometry
    this.material = material
    this.scene = scene
  }
  
  // 인스턴스 추가
  addInstance(data: InstanceData): void {
    this.instances.set(data.id, { ...data })
    this.needsUpdate = true
  }
  
  // 인스턴스 제거
  removeInstance(id: string): boolean {
    const removed = this.instances.delete(id)
    if (removed) {
      this.needsUpdate = true
    }
    return removed
  }
  
  // 인스턴스 업데이트
  updateInstance(id: string, updates: Partial<InstanceData>): boolean {
    const instance = this.instances.get(id)
    if (!instance) return false
    
    Object.assign(instance, updates)
    this.needsUpdate = true
    return true
  }
  
  // 인스턴스 수
  get instanceCount(): number {
    return this.instances.size
  }
  
  // 가시적 인스턴스 수
  get visibleInstanceCount(): number {
    return Array.from(this.instances.values()).filter(inst => inst.visible).length
  }
  
  // InstancedMesh 업데이트
  update(): void {
    if (!this.needsUpdate) return
    
    const visibleInstances = Array.from(this.instances.values()).filter(inst => inst.visible)
    const count = visibleInstances.length
    
    if (count === 0) {
      this.removeFromScene()
      return
    }
    
    // InstancedMesh 생성 또는 업데이트
    if (!this.instancedMesh || this.instancedMesh.count !== count) {
      this.removeFromScene()
      this.createInstancedMesh(count)
    }
    
    // 매트릭스와 컬러 배열 업데이트
    this.updateMatrices(visibleInstances)
    this.updateColors(visibleInstances)
    
    this.needsUpdate = false
  }
  
  private createInstancedMesh(count: number): void {
    this.instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      count
    )
    
    this.instancedMesh.name = `InstanceGroup_${this.geometryKey}`
    this.instancedMesh.castShadow = true
    this.instancedMesh.receiveShadow = true
    
    // 컬러 속성 추가 (인스턴스별 색상 지원)
    this.colorArray = new Float32Array(count * 3)
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
      this.colorArray,
      3
    )
    
    this.scene.add(this.instancedMesh)
  }
  
  private updateMatrices(instances: InstanceData[]): void {
    if (!this.instancedMesh) return
    
    const matrix = new THREE.Matrix4()
    
    instances.forEach((instance, index) => {
      matrix.compose(instance.position, new THREE.Quaternion().setFromEuler(instance.rotation), instance.scale)
      this.instancedMesh!.setMatrixAt(index, matrix)
    })
    
    this.instancedMesh.instanceMatrix.needsUpdate = true
  }
  
  private updateColors(instances: InstanceData[]): void {
    if (!this.instancedMesh || !this.instancedMesh.instanceColor) return
    
    instances.forEach((instance, index) => {
      const color = instance.color || new THREE.Color(0x888888)
      const baseIndex = index * 3
      
      this.colorArray[baseIndex] = color.r
      this.colorArray[baseIndex + 1] = color.g
      this.colorArray[baseIndex + 2] = color.b
    })
    
    this.instancedMesh.instanceColor.needsUpdate = true
  }
  
  private removeFromScene(): void {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh)
      this.instancedMesh.dispose()
      this.instancedMesh = null
    }
  }
  
  // 메모리 정리
  dispose(): void {
    this.removeFromScene()
    this.instances.clear()
  }
  
  // 레이캐스팅을 위한 개별 메시 반환 (디버깅용)
  getInstanceMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = []
    
    this.instances.forEach(instance => {
      if (!instance.visible) return
      
      const mesh = new THREE.Mesh(this.geometry, this.material)
      mesh.position.copy(instance.position)
      mesh.rotation.copy(instance.rotation)
      mesh.scale.copy(instance.scale)
      mesh.name = instance.id
      
      if (instance.color) {
        const material = mesh.material.clone()
        if (material instanceof THREE.MeshStandardMaterial) {
          material.color = instance.color
        }
        mesh.material = material
      }
      
      meshes.push(mesh)
    })
    
    return meshes
  }
}

// 인스턴스 렌더러 매니저
export class InstancedRenderer {
  private scene: THREE.Scene
  private groups: Map<string, InstanceGroup> = new Map()
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map()
  private materialCache: Map<string, THREE.Material> = new Map()
  
  // 성능 통계
  public stats = {
    totalInstances: 0,
    activeGroups: 0,
    drawCalls: 0,
    trianglesRendered: 0
  }
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
  }
  
  // 지오메트리 키 생성 (같은 형태의 지오메트리 식별)
  private getGeometryKey(geometry: THREE.BufferGeometry): string {
    // 지오메트리의 특성을 기반으로 유니크 키 생성
    const position = geometry.getAttribute('position')
    const vertexCount = position ? position.count : 0
    
    // 바운딩 박스 기반 해시
    geometry.computeBoundingBox()
    const bbox = geometry.boundingBox!
    const size = bbox.getSize(new THREE.Vector3())
    
    return `geo_${vertexCount}_${size.x.toFixed(2)}_${size.y.toFixed(2)}_${size.z.toFixed(2)}`
  }
  
  // 재질 키 생성
  private getMaterialKey(material: THREE.Material): string {
    if (material instanceof THREE.MeshStandardMaterial) {
      return `mat_std_${material.color.getHexString()}_${material.metalness}_${material.roughness}`
    } else if (material instanceof THREE.MeshBasicMaterial) {
      return `mat_basic_${material.color.getHexString()}`
    }
    return `mat_${material.type}_${material.uuid}`
  }
  
  // 객체를 인스턴스로 추가
  addObject(sceneObject: SceneObject): void {
    if (!sceneObject.customGeometry) return
    
    const geometryKey = this.getGeometryKey(sceneObject.customGeometry)
    const materialKey = this.getMaterialKey(sceneObject.customMaterial || new THREE.MeshStandardMaterial())
    const groupKey = `${geometryKey}_${materialKey}`
    
    // 지오메트리와 재질 캐싱
    this.geometryCache.set(geometryKey, sceneObject.customGeometry)
    this.materialCache.set(materialKey, sceneObject.customMaterial || new THREE.MeshStandardMaterial())
    
    // 그룹 생성 또는 가져오기
    let group = this.groups.get(groupKey)
    if (!group) {
      group = new InstanceGroup(
        groupKey,
        sceneObject.customGeometry,
        sceneObject.customMaterial || new THREE.MeshStandardMaterial(),
        this.scene
      )
      this.groups.set(groupKey, group)
    }
    
    // 인스턴스 데이터 생성
    const instanceData: InstanceData = {
      id: sceneObject.id,
      position: new THREE.Vector3(...sceneObject.position),
      rotation: new THREE.Euler(...sceneObject.rotation),
      scale: new THREE.Vector3(...sceneObject.scale),
      color: new THREE.Color(sceneObject.color),
      visible: sceneObject.visible !== false
    }
    
    group.addInstance(instanceData)
  }
  
  // 객체 제거
  removeObject(objectId: string): void {
    for (const [groupKey, group] of this.groups) {
      if (group.removeInstance(objectId)) {
        // 빈 그룹 정리
        if (group.instanceCount === 0) {
          group.dispose()
          this.groups.delete(groupKey)
        }
        break
      }
    }
  }
  
  // 객체 업데이트
  updateObject(objectId: string, updates: Partial<SceneObject>): void {
    for (const group of this.groups.values()) {
      const instanceUpdates: Partial<InstanceData> = {}
      
      if (updates.position) {
        instanceUpdates.position = new THREE.Vector3(...updates.position)
      }
      if (updates.rotation) {
        instanceUpdates.rotation = new THREE.Euler(...updates.rotation)
      }
      if (updates.scale) {
        instanceUpdates.scale = new THREE.Vector3(...updates.scale)
      }
      if (updates.color) {
        instanceUpdates.color = new THREE.Color(updates.color)
      }
      if (updates.visible !== undefined) {
        instanceUpdates.visible = updates.visible
      }
      
      if (Object.keys(instanceUpdates).length > 0) {
        group.updateInstance(objectId, instanceUpdates)
      }
    }
  }
  
  // 모든 그룹 업데이트 (매 프레임 호출)
  update(): void {
    this.resetStats()
    
    for (const group of this.groups.values()) {
      group.update()
      
      // 통계 업데이트
      this.stats.totalInstances += group.instanceCount
      if (group.visibleInstanceCount > 0) {
        this.stats.activeGroups++
        this.stats.drawCalls++
        
        // 삼각형 수 계산 (근사치)
        const positions = group.geometry.getAttribute('position')
        if (positions) {
          this.stats.trianglesRendered += (positions.count / 3) * group.visibleInstanceCount
        }
      }
    }
  }
  
  private resetStats(): void {
    this.stats.totalInstances = 0
    this.stats.activeGroups = 0
    this.stats.drawCalls = 0
    this.stats.trianglesRendered = 0
  }
  
  // 인스턴싱 효율성 체크
  getInstancingEfficiency(): { groupCount: number, avgInstancesPerGroup: number, efficiency: string } {
    const groupCount = this.groups.size
    const totalInstances = this.stats.totalInstances
    const avgInstancesPerGroup = groupCount > 0 ? totalInstances / groupCount : 0
    
    let efficiency = 'Poor'
    if (avgInstancesPerGroup >= 10) efficiency = 'Excellent'
    else if (avgInstancesPerGroup >= 5) efficiency = 'Good'
    else if (avgInstancesPerGroup >= 2) efficiency = 'Fair'
    
    return {
      groupCount,
      avgInstancesPerGroup: Math.round(avgInstancesPerGroup * 100) / 100,
      efficiency
    }
  }
  
  // 메모리 정리
  dispose(): void {
    this.groups.forEach(group => group.dispose())
    this.groups.clear()
    
    this.geometryCache.forEach(geometry => geometry.dispose())
    this.geometryCache.clear()
    
    this.materialCache.forEach(material => material.dispose())
    this.materialCache.clear()
  }
  
  // 디버그 정보
  getDebugInfo(): string {
    const efficiency = this.getInstancingEfficiency()
    return `Instancing: ${this.stats.totalInstances} instances in ${efficiency.groupCount} groups | ` +
           `Avg: ${efficiency.avgInstancesPerGroup}/group (${efficiency.efficiency}) | ` +
           `Draw calls: ${this.stats.drawCalls}`
  }
}