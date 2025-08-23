import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { useCollaborationStore } from '../store/collaborationStore';
import { useSceneStore } from '../store/sceneStore';
import { useAppStore } from '../store/appStore';
import * as THREE from 'three';

export const useCollaborativeSync = () => {
  const { doc, isConnected, updateCursor, selectObject: updateSelection } = useCollaborationStore();
  const { objects, addObject, updateObject, deleteObject, selectedObject } = useSceneStore();
  const { transformMode } = useAppStore();
  
  const raycasterRef = useRef(new THREE.Raycaster());
  const lastSyncRef = useRef<string>('');
  
  useEffect(() => {
    if (!doc || !isConnected) return;
    
    // Yjs 맵 초기화
    const objectsMap = doc.getMap('objects');
    const operationsArray = doc.getArray('operations');
    
    // 기존 객체들을 Yjs에 동기화
    objects.forEach(obj => {
      const objData = {
        id: obj.id,
        type: obj.type,
        name: obj.name,
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale,
        color: obj.color,
        visible: obj.visible,
        geometry: obj.geometry ? {
          type: obj.geometry.type,
          // 지오메트리 데이터 직렬화
          vertices: obj.geometry.vertices,
          faces: obj.geometry.faces,
          parameters: obj.geometry.parameters
        } : null
      };
      objectsMap.set(obj.id, objData);
    });
    
    // 객체 변경 감지 및 동기화
    const handleObjectsChange = () => {
      const changes = Array.from(objectsMap.entries());
      const currentIds = new Set(objects.map(obj => obj.id));
      
      changes.forEach(([id, objData]: [string, any]) => {
        if (!currentIds.has(id)) {
          // 새 객체 추가
          addObject({
            ...objData,
            geometry: objData.geometry ? new THREE.BoxGeometry(1, 1, 1) : undefined // 임시
          });
        } else {
          // 기존 객체 업데이트
          const existingObj = objects.find(obj => obj.id === id);
          if (existingObj && JSON.stringify(existingObj) !== JSON.stringify(objData)) {
            updateObject(id, objData);
          }
        }
      });
      
      // 삭제된 객체 처리
      currentIds.forEach(id => {
        if (!objectsMap.has(id)) {
          deleteObject(id);
        }
      });
    };
    
    // 작업 히스토리 처리
    const handleOperationsChange = () => {
      const operations = operationsArray.toArray();
      const lastOp = operations[operations.length - 1];
      
      if (lastOp && lastOp.timestamp !== lastSyncRef.current) {
        lastSyncRef.current = lastOp.timestamp;
        
        switch (lastOp.type) {
          case 'add':
            addObject(lastOp.data);
            break;
          case 'update':
            updateObject(lastOp.objectId, lastOp.data);
            break;
          case 'delete':
            deleteObject(lastOp.objectId);
            break;
        }
      }
    };
    
    objectsMap.observe(handleObjectsChange);
    operationsArray.observe(handleOperationsChange);
    
    return () => {
      objectsMap.unobserve(handleObjectsChange);
      operationsArray.unobserve(handleOperationsChange);
    };
  }, [doc, isConnected, objects]);
  
  // 선택 상태 동기화
  useEffect(() => {
    if (!isConnected) return;
    
    updateSelection(selectedObject);
  }, [selectedObject, isConnected]);
  
  // 마우스 커서 추적
  const trackMousePosition = (event: MouseEvent, camera: THREE.Camera, scene: THREE.Scene) => {
    if (!isConnected) return;
    
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    raycasterRef.current.setFromCamera(mouse, camera);
    const intersects = raycasterRef.current.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      updateCursor({
        x: point.x,
        y: point.y,
        z: point.z
      });
    }
  };
  
  // 객체 변경 시 Yjs 업데이트
  const syncObjectChange = (objectId: string, changes: any) => {
    if (!doc || !isConnected) return;
    
    const objectsMap = doc.getMap('objects');
    const operationsArray = doc.getArray('operations');
    
    const existingObj = objectsMap.get(objectId);
    if (existingObj) {
      objectsMap.set(objectId, { ...existingObj, ...changes });
      
      operationsArray.push([{
        type: 'update',
        objectId,
        data: changes,
        timestamp: Date.now().toString(),
        userId: useCollaborationStore.getState().currentUser?.id
      }]);
    }
  };
  
  const syncObjectAddition = (object: any) => {
    if (!doc || !isConnected) return;
    
    const objectsMap = doc.getMap('objects');
    const operationsArray = doc.getArray('operations');
    
    objectsMap.set(object.id, object);
    
    operationsArray.push([{
      type: 'add',
      data: object,
      timestamp: Date.now().toString(),
      userId: useCollaborationStore.getState().currentUser?.id
    }]);
  };
  
  const syncObjectDeletion = (objectId: string) => {
    if (!doc || !isConnected) return;
    
    const objectsMap = doc.getMap('objects');
    const operationsArray = doc.getArray('operations');
    
    objectsMap.delete(objectId);
    
    operationsArray.push([{
      type: 'delete',
      objectId,
      timestamp: Date.now().toString(),
      userId: useCollaborationStore.getState().currentUser?.id
    }]);
  };
  
  return {
    trackMousePosition,
    syncObjectChange,
    syncObjectAddition,
    syncObjectDeletion
  };
};