import React from 'react';
import { useThree } from '@react-three/fiber';
import { useCollaborationStore } from '../../store/collaborationStore';
import * as THREE from 'three';

export const CollaborativeCanvas: React.FC = () => {
  const { camera, scene } = useThree();
  const { isConnected, updateCursor } = useCollaborationStore();
  const raycaster = new THREE.Raycaster();
  
  React.useEffect(() => {
    if (!isConnected) return;
    
    const handlePointerMove = (event: PointerEvent) => {
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        updateCursor({
          x: point.x,
          y: point.y,
          z: point.z
        });
      }
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isConnected, camera, scene, updateCursor]);
  
  return null;
};