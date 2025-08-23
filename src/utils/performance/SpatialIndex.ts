import * as THREE from 'three'
import { SceneObject } from '@/types/scene'

// 옥트리 노드
export class OctreeNode {
  public bounds: THREE.Box3
  public center: THREE.Vector3
  public size: number
  public level: number
  public children: OctreeNode[] = []
  public objects: Map<string, SceneObject> = new Map()
  public isLeaf: boolean = true
  
  private static readonly MAX_OBJECTS = 10
  private static readonly MAX_LEVELS = 8
  
  constructor(bounds: THREE.Box3, level: number = 0) {
    this.bounds = bounds.clone()
    this.center = bounds.getCenter(new THREE.Vector3())
    this.size = bounds.getSize(new THREE.Vector3()).length()
    this.level = level
  }
  
  // 객체 추가
  insert(object: SceneObject): void {
    // 바운딩 박스가 이 노드와 교차하는지 확인
    const objectBounds = this.getObjectBounds(object)
    if (!this.bounds.intersectsBox(objectBounds)) {
      return
    }
    
    // 리프 노드이고 분할 조건을 만족하면 분할
    if (this.isLeaf) {
      this.objects.set(object.id, object)
      
      if (this.objects.size > OctreeNode.MAX_OBJECTS && this.level < OctreeNode.MAX_LEVELS) {
        this.subdivide()
      }
    } else {
      // 자식 노드들에게 분배
      for (const child of this.children) {
        child.insert(object)
      }
    }
  }
  
  // 객체 제거
  remove(objectId: string): boolean {
    if (this.isLeaf) {
      return this.objects.delete(objectId)
    } else {
      let removed = false
      for (const child of this.children) {
        if (child.remove(objectId)) {
          removed = true
        }
      }
      return removed
    }
  }
  
  // 프러스텀과 교차하는 객체들 쿼리
  queryFrustum(frustum: THREE.Frustum, result: SceneObject[] = []): SceneObject[] {
    // 노드가 프러스텀과 교차하지 않으면 스킵
    if (!frustum.intersectsBox(this.bounds)) {
      return result
    }
    
    if (this.isLeaf) {
      // 리프 노드의 객체들 검사
      for (const object of this.objects.values()) {
        const objectBounds = this.getObjectBounds(object)
        if (frustum.intersectsBox(objectBounds)) {
          result.push(object)
        }
      }
    } else {
      // 자식 노드들 재귀 검사
      for (const child of this.children) {
        child.queryFrustum(frustum, result)
      }
    }
    
    return result
  }
  
  // 특정 영역과 교차하는 객체들 쿼리
  queryBox(box: THREE.Box3, result: SceneObject[] = []): SceneObject[] {
    if (!this.bounds.intersectsBox(box)) {
      return result
    }
    
    if (this.isLeaf) {
      for (const object of this.objects.values()) {
        const objectBounds = this.getObjectBounds(object)
        if (box.intersectsBox(objectBounds)) {
          result.push(object)
        }
      }
    } else {
      for (const child of this.children) {
        child.queryBox(box, result)
      }
    }
    
    return result
  }
  
  // 구와 교차하는 객체들 쿼리
  querySphere(sphere: THREE.Sphere, result: SceneObject[] = []): SceneObject[] {
    if (!sphere.intersectsBox(this.bounds)) {
      return result
    }
    
    if (this.isLeaf) {
      for (const object of this.objects.values()) {
        const objectBounds = this.getObjectBounds(object)
        if (sphere.intersectsBox(objectBounds)) {
          result.push(object)
        }
      }
    } else {
      for (const child of this.children) {
        child.querySphere(sphere, result)
      }
    }
    
    return result
  }
  
  // 노드 분할
  private subdivide(): void {
    const halfSize = this.bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5)
    const center = this.center
    
    // 8개의 자식 노드 생성
    const childBounds = [
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(center.x - halfSize.x/2, center.y - halfSize.y/2, center.z - halfSize.z/2),
        halfSize
      ),
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(center.x + halfSize.x/2, center.y - halfSize.y/2, center.z - halfSize.z/2),
        halfSize
      ),
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(center.x - halfSize.x/2, center.y + halfSize.y/2, center.z - halfSize.z/2),
        halfSize
      ),
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(center.x + halfSize.x/2, center.y + halfSize.y/2, center.z - halfSize.z/2),
        halfSize
      ),
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(center.x - halfSize.x/2, center.y - halfSize.y/2, center.z + halfSize.z/2),
        halfSize
      ),
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(center.x + halfSize.x/2, center.y - halfSize.y/2, center.z + halfSize.z/2),
        halfSize
      ),
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(center.x - halfSize.x/2, center.y + halfSize.y/2, center.z + halfSize.z/2),
        halfSize
      ),
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(center.x + halfSize.x/2, center.y + halfSize.y/2, center.z + halfSize.z/2),
        halfSize
      )
    ]
    
    this.children = childBounds.map(bounds => new OctreeNode(bounds, this.level + 1))
    
    // 기존 객체들을 자식 노드들에 재분배
    for (const object of this.objects.values()) {
      for (const child of this.children) {
        child.insert(object)
      }
    }
    
    this.objects.clear()
    this.isLeaf = false
  }
  
  // 객체의 바운딩 박스 계산
  private getObjectBounds(object: SceneObject): THREE.Box3 {
    const position = new THREE.Vector3(...object.position)
    const scale = new THREE.Vector3(...object.scale)
    
    // 기본 바운딩 박스 (1x1x1 큐브 기준)
    let size = new THREE.Vector3(1, 1, 1).multiply(scale)
    
    if (object.customGeometry) {
      object.customGeometry.computeBoundingBox()
      if (object.customGeometry.boundingBox) {
        size = object.customGeometry.boundingBox.getSize(new THREE.Vector3()).multiply(scale)
      }
    }
    
    return new THREE.Box3().setFromCenterAndSize(position, size)
  }
  
  // 노드 통계
  getStats(): { totalNodes: number, leafNodes: number, totalObjects: number, maxDepth: number } {
    let totalNodes = 1
    let leafNodes = this.isLeaf ? 1 : 0
    let totalObjects = this.objects.size
    let maxDepth = this.level
    
    for (const child of this.children) {
      const childStats = child.getStats()
      totalNodes += childStats.totalNodes
      leafNodes += childStats.leafNodes
      totalObjects += childStats.totalObjects
      maxDepth = Math.max(maxDepth, childStats.maxDepth)
    }
    
    return { totalNodes, leafNodes, totalObjects, maxDepth }
  }
}

// 프러스텀 컬링 매니저
export class FrustumCuller {
  private camera: THREE.Camera
  private frustum: THREE.Frustum = new THREE.Frustum()
  private matrix: THREE.Matrix4 = new THREE.Matrix4()
  
  constructor(camera: THREE.Camera) {
    this.camera = camera
  }
  
  // 프러스텀 업데이트
  updateFrustum(): void {
    this.matrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(this.matrix)
  }
  
  // 객체가 프러스텀 내부에 있는지 확인
  isObjectVisible(object: SceneObject): boolean {
    const position = new THREE.Vector3(...object.position)
    const scale = new THREE.Vector3(...object.scale)
    
    // 간단한 구 기반 컬링
    const radius = Math.max(scale.x, scale.y, scale.z)
    const sphere = new THREE.Sphere(position, radius)
    
    return this.frustum.intersectsSphere(sphere)
  }
  
  // 바운딩 박스가 프러스텀 내부에 있는지 확인
  isBoxVisible(box: THREE.Box3): boolean {
    return this.frustum.intersectsBox(box)
  }
  
  // 구가 프러스텀 내부에 있는지 확인
  isSphereVisible(sphere: THREE.Sphere): boolean {
    return this.frustum.intersectsSphere(sphere)
  }
}

// 공간 인덱스 매니저
export class SpatialIndex {
  private octree: OctreeNode
  private frustumCuller: FrustumCuller
  private worldBounds: THREE.Box3
  
  // 성능 통계
  public stats = {
    totalObjects: 0,
    visibleObjects: 0,
    culledObjects: 0,
    octreeNodes: 0,
    queryTime: 0
  }
  
  constructor(worldBounds: THREE.Box3, camera: THREE.Camera) {
    this.worldBounds = worldBounds.clone()
    this.octree = new OctreeNode(worldBounds)
    this.frustumCuller = new FrustumCuller(camera)
  }
  
  // 객체 추가
  addObject(object: SceneObject): void {
    this.octree.insert(object)
  }
  
  // 객체 제거
  removeObject(objectId: string): void {
    this.octree.remove(objectId)
  }
  
  // 가시적 객체들 쿼리 (프러스텀 컬링)
  getVisibleObjects(): SceneObject[] {
    const startTime = performance.now()
    
    this.frustumCuller.updateFrustum()
    const visibleObjects = this.octree.queryFrustum(this.frustumCuller.frustum)
    
    this.stats.queryTime = performance.now() - startTime
    this.stats.visibleObjects = visibleObjects.length
    this.updateStats()
    
    return visibleObjects
  }
  
  // 특정 영역의 객체들 쿼리
  getObjectsInBox(box: THREE.Box3): SceneObject[] {
    return this.octree.queryBox(box)
  }
  
  // 특정 반경 내 객체들 쿼리
  getObjectsInSphere(center: THREE.Vector3, radius: number): SceneObject[] {
    const sphere = new THREE.Sphere(center, radius)
    return this.octree.querySphere(sphere)
  }
  
  // 가장 가까운 객체 찾기
  findNearestObject(position: THREE.Vector3, maxDistance: number = Infinity): SceneObject | null {
    const searchSphere = new THREE.Sphere(position, maxDistance)
    const candidates = this.octree.querySphere(searchSphere)
    
    let nearest: SceneObject | null = null
    let nearestDistance = maxDistance
    
    for (const object of candidates) {
      const objectPos = new THREE.Vector3(...object.position)
      const distance = position.distanceTo(objectPos)
      
      if (distance < nearestDistance) {
        nearest = object
        nearestDistance = distance
      }
    }
    
    return nearest
  }
  
  // 레이와 교차하는 객체들 찾기 (레이캐스팅 최적화)
  raycastCandidates(ray: THREE.Ray, maxDistance: number = Infinity): SceneObject[] {
    const candidates: SceneObject[] = []
    
    // 레이를 따라 여러 점에서 구 쿼리 수행 (단순한 근사)
    const step = Math.min(10, maxDistance / 10)
    for (let t = 0; t <= maxDistance; t += step) {
      const point = ray.at(t, new THREE.Vector3())
      const localCandidates = this.getObjectsInSphere(point, step)
      
      for (const candidate of localCandidates) {
        if (!candidates.find(obj => obj.id === candidate.id)) {
          candidates.push(candidate)
        }
      }
    }
    
    return candidates
  }
  
  // 옥트리 리빌드 (대량 업데이트 후)
  rebuild(objects: SceneObject[]): void {
    // 새 옥트리 생성
    this.octree = new OctreeNode(this.worldBounds)
    
    // 모든 객체 재삽입
    for (const object of objects) {
      this.octree.insert(object)
    }
  }
  
  // 세계 영역 확장
  expandWorldBounds(newBounds: THREE.Box3): void {
    this.worldBounds.union(newBounds)
    // 필요시 옥트리 리빌드
  }
  
  // 통계 업데이트
  private updateStats(): void {
    const octreeStats = this.octree.getStats()
    this.stats.totalObjects = octreeStats.totalObjects
    this.stats.culledObjects = this.stats.totalObjects - this.stats.visibleObjects
    this.stats.octreeNodes = octreeStats.totalNodes
  }
  
  // 디버그 정보
  getDebugInfo(): string {
    const octreeStats = this.octree.getStats()
    return `Spatial: ${this.stats.visibleObjects}/${this.stats.totalObjects} visible | ` +
           `Octree: ${octreeStats.totalNodes} nodes, depth ${octreeStats.maxDepth} | ` +
           `Query: ${this.stats.queryTime.toFixed(2)}ms`
  }
  
  // 옥트리 시각화용 헬퍼 생성 (디버깅)
  createDebugHelper(): THREE.Group {
    const group = new THREE.Group()
    group.name = 'OctreeDebug'
    
    const addNodeHelper = (node: OctreeNode, depth: number = 0) => {
      if (node.isLeaf && node.objects.size > 0) {
        const boxHelper = new THREE.Box3Helper(node.bounds, new THREE.Color().setHSL(depth / 8, 1, 0.5))
        group.add(boxHelper)
      }
      
      for (const child of node.children) {
        addNodeHelper(child, depth + 1)
      }
    }
    
    addNodeHelper(this.octree)
    return group
  }
}