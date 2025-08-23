import React from 'react';
import { Eye, EyeOff, MousePointer2 } from 'lucide-react';
import { useCollaborationStore } from '../../store/collaborationStore';

const UserList: React.FC = () => {
  const { currentUser, users } = useCollaborationStore();
  
  const userArray = Array.from(users.values());
  
  return (
    <div className="p-4 space-y-3">
      {/* 현재 사용자 */}
      {currentUser && (
        <div className="bg-gray-800 p-3 rounded-lg border-2 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{currentUser.name} (나)</p>
                <p className="text-gray-400 text-xs">활성</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 다른 사용자들 */}
      {userArray.map(user => (
        <div key={user.id} className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold relative"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
                {user.cursor && (
                  <MousePointer2 className="absolute -bottom-1 -right-1 w-3 h-3 text-white bg-gray-900 rounded-full p-0.5" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-gray-400 text-xs flex items-center gap-1">
                  {user.selectedObject ? (
                    <>
                      <Eye className="w-3 h-3" />
                      객체 선택 중
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" />
                      대기 중
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {userArray.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          다른 사용자가 없습니다
        </div>
      )}
    </div>
  );
};

export default UserList;