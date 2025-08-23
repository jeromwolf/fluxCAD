import { useEffect, useRef, useState } from 'react';
import { useCollaborationStore } from '../store/collaborationStore';
import { useSceneStore } from '../store/sceneStore';
import { PerformanceLevel, PerformanceUtils } from '../utils/performance';
import * as THREE from 'three';

interface CollaborativePerformanceConfig {
  // 사용자별 최대 업데이트 주기 (ms)
  userUpdateThrottles: {
    cursor: number;
    selection: number;
    objectSync: number;
  };
  
  // 네트워크 최적화
  enableCompression: boolean;
  batchUpdates: boolean;
  maxBatchSize: number;
  
  // 렌더링 최적화
  reduceQualityForRemoteUsers: boolean;
  maxRemoteUserCursors: number;
  simplifyRemoteObjects: boolean;
}

// 성능 레벨별 설정
const performanceConfigs: Record<PerformanceLevel, CollaborativePerformanceConfig> = {
  [PerformanceLevel.ULTRA]: {
    userUpdateThrottles: {
      cursor: 16,      // 60fps
      selection: 100,
      objectSync: 50
    },
    enableCompression: false,
    batchUpdates: false,
    maxBatchSize: 100,
    reduceQualityForRemoteUsers: false,
    maxRemoteUserCursors: 50,
    simplifyRemoteObjects: false
  },
  [PerformanceLevel.HIGH]: {
    userUpdateThrottles: {
      cursor: 33,      // 30fps
      selection: 150,
      objectSync: 100
    },
    enableCompression: true,
    batchUpdates: true,
    maxBatchSize: 50,
    reduceQualityForRemoteUsers: false,
    maxRemoteUserCursors: 20,
    simplifyRemoteObjects: false
  },
  [PerformanceLevel.MEDIUM]: {
    userUpdateThrottles: {
      cursor: 50,      // 20fps
      selection: 200,
      objectSync: 200
    },
    enableCompression: true,
    batchUpdates: true,
    maxBatchSize: 30,
    reduceQualityForRemoteUsers: true,
    maxRemoteUserCursors: 10,
    simplifyRemoteObjects: true
  },
  [PerformanceLevel.LOW]: {
    userUpdateThrottles: {
      cursor: 100,     // 10fps
      selection: 300,
      objectSync: 500
    },
    enableCompression: true,
    batchUpdates: true,
    maxBatchSize: 20,
    reduceQualityForRemoteUsers: true,
    maxRemoteUserCursors: 5,
    simplifyRemoteObjects: true
  },
  [PerformanceLevel.POTATO]: {
    userUpdateThrottles: {
      cursor: 200,     // 5fps
      selection: 500,
      objectSync: 1000
    },
    enableCompression: true,
    batchUpdates: true,
    maxBatchSize: 10,
    reduceQualityForRemoteUsers: true,
    maxRemoteUserCursors: 3,
    simplifyRemoteObjects: true
  }
};

export const useCollaborativePerformance = () => {
  const { isConnected, users, updateCursor, selectObject, syncSceneUpdate } = useCollaborationStore();
  const { objects } = useSceneStore();
  
  const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>(PerformanceLevel.HIGH);
  const [config, setConfig] = useState<CollaborativePerformanceConfig>(performanceConfigs[PerformanceLevel.HIGH]);
  
  // 쓰로틀링을 위한 타이머
  const throttleTimers = useRef<{
    cursor: number;
    selection: number;
    objectSync: Map<string, number>;
  }>({
    cursor: 0,
    selection: 0,
    objectSync: new Map()
  });
  
  // 업데이트 배치
  const updateBatch = useRef<{
    objects: Map<string, any>;
    flushTimer: number | null;
  }>({
    objects: new Map(),
    flushTimer: null
  });
  
  // 성능 레벨 자동 조정
  useEffect(() => {
    if (!isConnected) return;
    
    const checkPerformance = () => {
      const userCount = users.size;
      const objectCount = objects.length;
      
      // 사용자와 객체 수에 따른 성능 레벨 조정
      let recommendedLevel = PerformanceLevel.HIGH;
      
      if (userCount > 20 || objectCount > 1000) {
        recommendedLevel = PerformanceLevel.LOW;
      } else if (userCount > 10 || objectCount > 500) {
        recommendedLevel = PerformanceLevel.MEDIUM;
      } else if (userCount <= 3 && objectCount <= 100) {
        recommendedLevel = PerformanceLevel.ULTRA;
      }
      
      if (recommendedLevel !== performanceLevel) {
        console.log(`Adjusting collaborative performance: ${performanceLevel} -> ${recommendedLevel}`);
        setPerformanceLevel(recommendedLevel);
        setConfig(performanceConfigs[recommendedLevel]);
      }
    };
    
    const interval = setInterval(checkPerformance, 5000);
    checkPerformance();
    
    return () => clearInterval(interval);
  }, [isConnected, users.size, objects.length, performanceLevel]);
  
  // 쓰로틀된 커서 업데이트
  const throttledUpdateCursor = (position: { x: number; y: number; z: number }) => {
    const now = Date.now();
    if (now - throttleTimers.current.cursor < config.userUpdateThrottles.cursor) {
      return;
    }
    
    throttleTimers.current.cursor = now;
    updateCursor(position);
  };
  
  // 쓰로틀된 선택 업데이트
  const throttledSelectObject = (objectId: string | null) => {
    const now = Date.now();
    if (now - throttleTimers.current.selection < config.userUpdateThrottles.selection) {
      return;
    }
    
    throttleTimers.current.selection = now;
    selectObject(objectId);
  };
  
  // 배치 업데이트 처리
  const batchObjectUpdate = (objectId: string, update: any) => {
    if (!config.batchUpdates) {
      syncSceneUpdate({ objectId, ...update });
      return;
    }
    
    // 배치에 추가
    updateBatch.current.objects.set(objectId, {
      ...updateBatch.current.objects.get(objectId),
      ...update
    });
    
    // 배치 크기 확인
    if (updateBatch.current.objects.size >= config.maxBatchSize) {
      flushBatch();
      return;
    }
    
    // 타이머 설정
    if (!updateBatch.current.flushTimer) {
      updateBatch.current.flushTimer = window.setTimeout(() => {
        flushBatch();
      }, config.userUpdateThrottles.objectSync);
    }
  };
  
  // 배치 플러시
  const flushBatch = () => {
    if (updateBatch.current.objects.size === 0) return;
    
    const updates = Array.from(updateBatch.current.objects.entries()).map(([id, data]) => ({
      objectId: id,
      ...data
    }));
    
    // 압축 옵션
    if (config.enableCompression) {
      // 간단한 압축: 변경된 필드만 전송
      const compressedUpdates = updates.map(update => {
        const compressed: any = { objectId: update.objectId };
        
        // null이 아닌 값만 포함
        Object.entries(update).forEach(([key, value]) => {
          if (value !== null && value !== undefined && key !== 'objectId') {
            compressed[key] = value;
          }
        });
        
        return compressed;
      });
      
      syncSceneUpdate({ batch: compressedUpdates });
    } else {
      syncSceneUpdate({ batch: updates });
    }
    
    // 배치 초기화
    updateBatch.current.objects.clear();
    if (updateBatch.current.flushTimer) {
      clearTimeout(updateBatch.current.flushTimer);
      updateBatch.current.flushTimer = null;
    }
  };
  
  // 원격 사용자 커서 필터링
  const getVisibleUserCursors = () => {
    const allUsers = Array.from(users.values());
    
    if (allUsers.length <= config.maxRemoteUserCursors) {
      return allUsers;
    }
    
    // 가까운 사용자 우선
    const camera = new THREE.Camera(); // 실제 카메라 참조 필요
    const sorted = allUsers
      .filter(user => user.cursor)
      .map(user => ({
        user,
        distance: camera.position.distanceTo(
          new THREE.Vector3(user.cursor!.x, user.cursor!.y, user.cursor!.z)
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, config.maxRemoteUserCursors)
      .map(item => item.user);
    
    return sorted;
  };
  
  // 원격 객체 단순화
  const simplifyRemoteObject = (geometry: THREE.BufferGeometry): THREE.BufferGeometry => {
    if (!config.simplifyRemoteObjects) return geometry;
    
    // 버텍스 수 감소
    const positions = geometry.getAttribute('position');
    if (!positions || positions.count < 100) return geometry;
    
    // 50% 단순화
    const step = 2;
    const newPositions: number[] = [];
    
    for (let i = 0; i < positions.count; i += step) {
      newPositions.push(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
    }
    
    const simplified = new THREE.BufferGeometry();
    simplified.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    
    return simplified;
  };
  
  // 네트워크 상태에 따른 품질 조정
  const adjustQualityByNetworkCondition = () => {
    if (!('connection' in navigator)) return;
    
    const connection = (navigator as any).connection;
    const effectiveType = connection.effectiveType;
    
    let recommendedLevel = performanceLevel;
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        recommendedLevel = PerformanceLevel.POTATO;
        break;
      case '3g':
        recommendedLevel = PerformanceLevel.LOW;
        break;
      case '4g':
        recommendedLevel = PerformanceLevel.MEDIUM;
        break;
      default:
        // 현재 레벨 유지
    }
    
    if (recommendedLevel !== performanceLevel) {
      console.log(`Network-based quality adjustment: ${effectiveType} -> ${recommendedLevel}`);
      setPerformanceLevel(recommendedLevel);
      setConfig(performanceConfigs[recommendedLevel]);
    }
  };
  
  // 디버그 정보
  const getDebugInfo = () => {
    return {
      performanceLevel,
      activeUsers: users.size,
      visibleCursors: Math.min(users.size, config.maxRemoteUserCursors),
      batchSize: updateBatch.current.objects.size,
      throttles: config.userUpdateThrottles
    };
  };
  
  return {
    performanceLevel,
    config,
    throttledUpdateCursor,
    throttledSelectObject,
    batchObjectUpdate,
    flushBatch,
    getVisibleUserCursors,
    simplifyRemoteObject,
    adjustQualityByNetworkCondition,
    getDebugInfo
  };
};