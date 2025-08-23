import React, { useState } from 'react';
import { Users, MessageSquare, UserPlus, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { ConnectionState } from '../../utils/collaboration/NetworkManager';
import UserList from './UserList';
import ChatPanel from './ChatPanel';

const CollaborationPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'chat'>('users');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  
  const { 
    isConnected, 
    connectionState,
    currentUser, 
    users, 
    disconnect, 
    initializeCollaboration,
    reconnect,
    offlineQueueSize,
    isOfflineMode
  } = useCollaborationStore();
  
  const handleJoinRoom = () => {
    if (roomId && userName) {
      initializeCollaboration(roomId, userName);
      setShowJoinModal(false);
      setRoomId('');
      setUserName('');
    }
  };
  
  const handleDisconnect = () => {
    if (window.confirm('협업 세션을 종료하시겠습니까?')) {
      disconnect();
    }
  };
  
  return (
    <div className="absolute top-20 right-4 w-80 bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gray-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold flex items-center gap-2">
            {connectionState === ConnectionState.CONNECTED ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                협업 모드
              </>
            ) : connectionState === ConnectionState.RECONNECTING ? (
              <>
                <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
                재연결 중...
              </>
            ) : connectionState === ConnectionState.OFFLINE ? (
              <>
                <WifiOff className="w-4 h-4 text-orange-400" />
                오프라인 모드
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-400" />
                연결 안됨
              </>
            )}
          </h3>
          <div className="flex gap-2">
            {connectionState === ConnectionState.RECONNECTING && (
              <button
                onClick={reconnect}
                className="text-yellow-400 hover:text-yellow-300 text-sm"
              >
                재연결
              </button>
            )}
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                연결 해제
              </button>
            ) : (
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                참가
              </button>
            )}
          </div>
        </div>
        
        {/* 오프라인 상태 표시 */}
        {isOfflineMode && offlineQueueSize > 0 && (
          <div className="bg-orange-500 bg-opacity-20 text-orange-300 text-xs p-2 rounded flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            오프라인: {offlineQueueSize}개 작업 대기 중
          </div>
        )}
      </div>
      
      {isConnected && (
        <>
          {/* 탭 */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'users'
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              참가자 ({users.size})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'chat'
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              채팅
            </button>
          </div>
          
          {/* 콘텐츠 */}
          <div className="h-96">
            {activeTab === 'users' ? <UserList /> : <ChatPanel />}
          </div>
        </>
      )}
      
      {!isConnected && (
        <div className="p-8 text-center text-gray-400">
          <p className="mb-4">협업 세션에 참가하여 실시간으로 함께 작업하세요.</p>
          <button
            onClick={() => setShowJoinModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <UserPlus className="w-4 h-4" />
            협업 시작
          </button>
        </div>
      )}
      
      {/* 참가 모달 */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-xl font-semibold text-white mb-4">협업 세션 참가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">사용자 이름</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">룸 ID</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="룸 ID를 입력하세요"
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomId || !userName}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded-lg"
                >
                  참가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationPanel;