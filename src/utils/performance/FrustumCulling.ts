import * as THREE from 'three';

export interface CullableObject {
  id: string;
  mesh: THREE.Mesh | THREE.InstancedMesh;
  boundingBox: THREE.Box3;
  boundingSphere: THREE.Sphere;
  lastVisibilityState: boolean;
  distanceToCamera: number;
}

export class FrustumCullingSystem {
  private camera: THREE.Camera;
  private frustum: THREE.Frustum;
  private projectionMatrix: THREE.Matrix4;
  private viewMatrix: THREE.Matrix4;
  private cullableObjects: Map<string, CullableObject> = new Map();
  
  // 성능 통계
  public stats = {
    totalObjects: 0,
    visibleObjects: 0,
    culledObjects: 0,
    frustumChecks: 0,
    averageCheckTime: 0
  };
  
  // 최적화 옵션
  private options = {
    useBoundingSphere: true,  // 구 체크 사용 (더 빠름)
    useBoundingBox: false,    // 박스 체크 사용 (더 정확함)
    hierarchicalCulling: true, // 계층적 컬링
    occlusionCulling: false,   // 오클루전 컬링 (실험적)
    distanceCulling: true,     // 거리 기반 컬링
    maxDistance: 500           // 최대 렌더링 거리
  };
  
  constructor(camera: THREE.Camera, options?: Partial<typeof FrustumCullingSystem.prototype.options>) {
    this.camera = camera;
    this.frustum = new THREE.Frustum();
    this.projectionMatrix = new THREE.Matrix4();
    this.viewMatrix = new THREE.Matrix4();
    
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }
  
  /**
   * 컬링 가능한 객체 추가
   */
  addObject(id: string, mesh: THREE.Mesh | THREE.InstancedMesh): void {
    // 바운딩 박스와 구 계산
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
    
    const boundingBox = mesh.geometry.boundingBox!.clone();
    const boundingSphere = mesh.geometry.boundingSphere!.clone();
    
    // 월드 좌표로 변환
    boundingBox.applyMatrix4(mesh.matrixWorld);
    boundingSphere.applyMatrix4(mesh.matrixWorld);
    
    this.cullableObjects.set(id, {
      id,
      mesh,
      boundingBox,
      boundingSphere,
      lastVisibilityState: true,
      distanceToCamera: 0
    });
  }
  
  /**
   * 객체 제거
   */
  removeObject(id: string): void {
    this.cullableObjects.delete(id);
  }
  
  /**
   * 객체 변환 업데이트
   */
  updateObjectTransform(id: string): void {
    const obj = this.cullableObjects.get(id);
    if (!obj) return;
    
    // 월드 매트릭스 업데이트
    obj.mesh.updateMatrixWorld();
    
    // 바운딩 박스/구 재계산
    obj.boundingBox.copy(obj.mesh.geometry.boundingBox!);
    obj.boundingBox.applyMatrix4(obj.mesh.matrixWorld);
    
    obj.boundingSphere.copy(obj.mesh.geometry.boundingSphere!);
    obj.boundingSphere.center.applyMatrix4(obj.mesh.matrixWorld);
    obj.boundingSphere.radius *= obj.mesh.scale.x; // 스케일 적용 (균등 스케일 가정)
  }
  
  /**
   * 프러스텀 컬링 수행
   */
  update(): void {
    const startTime = performance.now();
    
    // 카메라 매트릭스 업데이트
    this.camera.updateMatrixWorld();
    this.projectionMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projectionMatrix);
    
    // 통계 초기화
    this.stats.totalObjects = this.cullableObjects.size;
    this.stats.visibleObjects = 0;
    this.stats.culledObjects = 0;
    this.stats.frustumChecks = 0;
    
    const cameraPosition = this.camera.position;
    
    // 모든 객체에 대해 가시성 체크
    this.cullableObjects.forEach(obj => {
      let isVisible = true;
      
      // 거리 기반 컬링
      if (this.options.distanceCulling) {
        obj.distanceToCamera = obj.boundingSphere.center.distanceTo(cameraPosition);
        if (obj.distanceToCamera - obj.boundingSphere.radius > this.options.maxDistance) {
          isVisible = false;
        }
      }
      
      // 프러스텀 컬링
      if (isVisible) {
        this.stats.frustumChecks++;
        
        if (this.options.useBoundingSphere) {
          // 구 체크 (빠름)
          isVisible = this.frustum.intersectsSphere(obj.boundingSphere);
        } else if (this.options.useBoundingBox) {
          // 박스 체크 (정확함)
          isVisible = this.frustum.intersectsBox(obj.boundingBox);
        }
      }
      
      // 가시성 상태가 변경된 경우에만 업데이트
      if (isVisible !== obj.lastVisibilityState) {
        obj.mesh.visible = isVisible;
        obj.lastVisibilityState = isVisible;
      }
      
      // 통계 업데이트
      if (isVisible) {
        this.stats.visibleObjects++;
      } else {
        this.stats.culledObjects++;
      }
    });
    
    // 평균 체크 시간 계산
    const checkTime = performance.now() - startTime;
    this.stats.averageCheckTime = this.stats.averageCheckTime * 0.9 + checkTime * 0.1;
  }
  
  /**
   * 계층적 프러스텀 컬링 (그룹 단위)
   */
  updateHierarchical(rootObject: THREE.Object3D): void {
    if (!this.options.hierarchicalCulling) {
      this.update();
      return;
    }
    
    // 카메라 매트릭스 업데이트
    this.camera.updateMatrixWorld();
    this.projectionMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projectionMatrix);
    
    // 재귀적으로 계층 구조 탐색
    this.traverseHierarchy(rootObject);
  }
  
  private traverseHierarchy(object: THREE.Object3D): boolean {
    // 그룹의 바운딩 박스 계산
    const box = new THREE.Box3();
    const hasGeometry = object.traverse(child => {
      if (child instanceof THREE.Mesh && child.geometry) {
        child.geometry.computeBoundingBox();
        const childBox = child.geometry.boundingBox!.clone();
        childBox.applyMatrix4(child.matrixWorld);
        box.union(childBox);
        return true;
      }
      return false;
    });
    
    if (!hasGeometry) return true;
    
    // 그룹 전체가 프러스텀 밖에 있으면 자식들도 모두 컬링
    if (!this.frustum.intersectsBox(box)) {
      object.visible = false;
      return false;
    }
    
    // 그룹이 보이면 자식들 개별 체크
    object.visible = true;
    object.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        const cullable = this.cullableObjects.get(child.uuid);
        if (cullable) {
          this.updateObjectVisibility(cullable);
        }
      } else {
        this.traverseHierarchy(child);
      }
    });
    
    return true;
  }
  
  private updateObjectVisibility(obj: CullableObject): void {
    const isVisible = this.frustum.intersectsSphere(obj.boundingSphere);
    
    if (isVisible !== obj.lastVisibilityState) {
      obj.mesh.visible = isVisible;
      obj.lastVisibilityState = isVisible;
    }
  }
  
  /**
   * 오클루전 쿼리 (실험적 기능)
   */
  async performOcclusionQuery(renderer: THREE.WebGLRenderer): Promise<void> {
    if (!this.options.occlusionCulling) return;
    
    // WebGL2의 오클루전 쿼리 기능 사용
    // 구현은 복잡하므로 기본 구조만 제공
    console.warn('Occlusion culling is experimental and not fully implemented');
  }
  
  /**
   * 디버그 시각화
   */
  createDebugHelpers(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'FrustumCullingDebug';
    
    // 프러스텀 시각화
    const frustumHelper = new THREE.CameraHelper(this.camera);
    group.add(frustumHelper);
    
    // 바운딩 박스/구 시각화
    this.cullableObjects.forEach(obj => {
      if (this.options.useBoundingSphere) {
        // 바운딩 구 헬퍼
        const sphereGeometry = new THREE.SphereGeometry(obj.boundingSphere.radius, 8, 4);
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: obj.lastVisibilityState ? 0x00ff00 : 0xff0000,
          wireframe: true,
          transparent: true,
          opacity: 0.3
        });
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphereMesh.position.copy(obj.boundingSphere.center);
        group.add(sphereMesh);
      } else {
        // 바운딩 박스 헬퍼
        const boxHelper = new THREE.Box3Helper(obj.boundingBox, 
          obj.lastVisibilityState ? 0x00ff00 : 0xff0000);
        group.add(boxHelper);
      }
    });
    
    return group;
  }
  
  /**
   * 옵션 업데이트
   */
  updateOptions(options: Partial<typeof FrustumCullingSystem.prototype.options>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * 통계 정보 가져오기
   */
  getStats(): typeof FrustumCullingSystem.prototype.stats {
    return { ...this.stats };
  }
  
  /**
   * 디버그 정보
   */
  getDebugInfo(): string {
    const cullingRatio = this.stats.totalObjects > 0 
      ? (this.stats.culledObjects / this.stats.totalObjects * 100).toFixed(1)
      : 0;
      
    return `Frustum Culling: ${this.stats.visibleObjects}/${this.stats.totalObjects} visible | ` +
           `${cullingRatio}% culled | ${this.stats.averageCheckTime.toFixed(2)}ms`;
  }
  
  /**
   * 메모리 정리
   */
  dispose(): void {
    this.cullableObjects.clear();
  }
}