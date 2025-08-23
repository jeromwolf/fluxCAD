import React from 'react';
import { Html } from '@react-three/drei';
import { useCollaborationStore } from '../../store/collaborationStore';
import { MousePointer2 } from 'lucide-react';

const UserCursors: React.FC = () => {
  const { users } = useCollaborationStore();
  
  return (
    <>
      {Array.from(users.values()).map((user) => {
        if (!user.cursor) return null;
        
        return (
          <Html
            key={user.id}
            position={[user.cursor.x, user.cursor.y, user.cursor.z]}
            center
            distanceFactor={10}
            style={{
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className="relative"
                style={{ color: user.color }}
              >
                <MousePointer2 
                  className="w-6 h-6 drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                  }}
                />
              </div>
              <div
                className="mt-1 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
                style={{ 
                  backgroundColor: user.color,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {user.name}
              </div>
            </div>
          </Html>
        );
      })}
    </>
  );
};

export default UserCursors;