import React from 'react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { useSceneStore } from '../../store/sceneStore';
import { Box, Edges } from '@react-three/drei';
import * as THREE from 'three';

const UserSelections: React.FC = () => {
  const { users } = useCollaborationStore();
  const { objects } = useSceneStore();
  
  const userSelectionsMap = new Map<string, { user: any; object: any }>();
  
  // 각 사용자의 선택된 객체 매핑
  Array.from(users.values()).forEach(user => {
    if (user.selectedObject) {
      const selectedObj = objects.find(obj => obj.id === user.selectedObject);
      if (selectedObj) {
        userSelectionsMap.set(user.selectedObject, { user, object: selectedObj });
      }
    }
  });
  
  return (
    <>
      {Array.from(userSelectionsMap.values()).map(({ user, object }) => {
        // 객체의 바운딩 박스 계산
        const geometry = object.geometry;
        const boundingBox = new THREE.Box3();
        
        if (geometry) {
          geometry.computeBoundingBox();
          boundingBox.copy(geometry.boundingBox!);
        }
        
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        boundingBox.getSize(size);
        boundingBox.getCenter(center);
        
        return (
          <group
            key={`${user.id}-${object.id}`}
            position={object.position}
            rotation={object.rotation}
            scale={object.scale}
          >
            <Box args={[size.x * 1.1, size.y * 1.1, size.z * 1.1]}>
              <meshBasicMaterial visible={false} />
              <Edges
                color={user.color}
                lineWidth={2}
                renderOrder={1000}
              />
            </Box>
          </group>
        );
      })}
    </>
  );
};

export default UserSelections;