import { create } from 'zustand';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { io, Socket } from 'socket.io-client';
import { NetworkManager, ConnectionState } from '../utils/collaboration/NetworkManager';

interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number; z: number };
  selectedObject?: string;
  avatar?: string;
}

interface CollaborationState {
  // 연결 상태
  isConnected: boolean;
  connectionState: ConnectionState;
  roomId: string | null;
  
  // 사용자 관리
  currentUser: User | null;
  users: Map<string, User>;
  
  // Yjs 문서
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  
  // Socket.io
  socket: Socket | null;
  
  // 네트워크 매니저
  networkManager: NetworkManager | null;
  
  // 채팅
  messages: Array<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: number;
  }>;
  
  // 오프라인 상태
  offlineQueueSize: number;
  isOfflineMode: boolean;
  
  // 액션
  initializeCollaboration: (roomId: string, userName: string) => void;
  disconnect: () => void;
  updateCursor: (position: { x: number; y: number; z: number }) => void;
  selectObject: (objectId: string | null) => void;
  sendMessage: (message: string) => void;
  
  // 3D 씬 동기화
  syncSceneUpdate: (update: any) => void;
  onSceneUpdate: (callback: (update: any) => void) => void;
  
  // 네트워크 관리
  reconnect: () => void;
  getConnectionInfo: () => { state: ConnectionState; queueSize: number };
}

const generateUserColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FECA57', '#FF9FF3', '#54A0FF', '#48DBFB'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  isConnected: false,
  connectionState: ConnectionState.DISCONNECTED,
  roomId: null,
  currentUser: null,
  users: new Map(),
  doc: null,
  provider: null,
  socket: null,
  networkManager: null,
  messages: [],
  offlineQueueSize: 0,
  isOfflineMode: false,
  
  initializeCollaboration: (roomId: string, userName: string) => {
    const state = get();
    
    // 이미 연결되어 있으면 먼저 연결 해제
    if (state.isConnected) {
      state.disconnect();
    }
    
    // NetworkManager 생성
    const networkManager = new NetworkManager();
    
    // 이벤트 핸들러 설정
    networkManager.setEventHandlers({
      onStateChange: (connectionState) => {
        set({ 
          connectionState,
          isConnected: connectionState === ConnectionState.CONNECTED,
          isOfflineMode: connectionState === ConnectionState.OFFLINE
        });
      },
      onReconnect: () => {
        console.log('재연결 성공!');
        // 재연결 시 사용자 정보 재전송
        const currentUser = get().currentUser;
        if (currentUser) {
          networkManager.emitSocket('user-join', currentUser);
        }
      },
      onOffline: () => {
        console.log('오프라인 모드 전환');
        set({ isOfflineMode: true });
      },
      onOnline: () => {
        console.log('온라인 복귀');
        set({ isOfflineMode: false });
      }
    });
    
    // Yjs 문서 생성
    const doc = new Y.Doc();
    
    // Socket.io 연결
    const socket = networkManager.connectSocket({ roomId, userName });
    
    // Yjs 프로바이더 연결
    const provider = networkManager.connectYjs(roomId, doc);
    
    // 현재 사용자 설정
    const currentUser: User = {
      id: socket.id || Math.random().toString(36).substr(2, 9),
      name: userName,
      color: generateUserColor()
    };
    
    // Socket.io 이벤트 처리
    socket.on('connect', () => {
      console.log('협업 서버 연결됨');
      
      // 사용자 입장 알림
      networkManager.emitSocket('user-join', currentUser);
    });
    
    socket.on('users-update', (users: User[]) => {
      const usersMap = new Map(users.map(user => [user.id, user]));
      set({ users: usersMap });
    });
    
    socket.on('user-cursor-update', ({ userId, cursor }: { userId: string; cursor: any }) => {
      const users = new Map(get().users);
      const user = users.get(userId);
      if (user) {
        user.cursor = cursor;
        set({ users });
      }
    });
    
    socket.on('user-selection-update', ({ userId, objectId }: { userId: string; objectId: string | null }) => {
      const users = new Map(get().users);
      const user = users.get(userId);
      if (user) {
        user.selectedObject = objectId || undefined;
        set({ users });
      }
    });
    
    socket.on('new-message', (message) => {
      set({ messages: [...get().messages, message] });
    });
    
    // Yjs 동기화 이벤트
    provider.on('status', (event: any) => {
      console.log('Yjs 연결 상태:', event.status);
    });
    
    // 오프라인 큐 크기 모니터링
    const queueMonitor = setInterval(() => {
      set({ offlineQueueSize: networkManager.getQueueSize() });
    }, 1000);
    
    set({
      roomId,
      currentUser,
      doc,
      provider,
      socket,
      networkManager
    });
    
    // 정리 함수에 인터벌 제거 추가
    return () => clearInterval(queueMonitor);
  },
  
  disconnect: () => {
    const { networkManager, doc } = get();
    
    if (networkManager) {
      networkManager.dispose();
    }
    
    if (doc) {
      doc.destroy();
    }
    
    set({
      isConnected: false,
      connectionState: ConnectionState.DISCONNECTED,
      roomId: null,
      currentUser: null,
      users: new Map(),
      doc: null,
      provider: null,
      socket: null,
      networkManager: null,
      messages: [],
      offlineQueueSize: 0,
      isOfflineMode: false
    });
  },
  
  updateCursor: (position: { x: number; y: number; z: number }) => {
    const { networkManager, currentUser } = get();
    if (networkManager && currentUser) {
      networkManager.emitSocket('cursor-update', position);
    }
  },
  
  selectObject: (objectId: string | null) => {
    const { networkManager, currentUser } = get();
    if (networkManager && currentUser) {
      networkManager.emitSocket('selection-update', objectId);
    }
  },
  
  sendMessage: (message: string) => {
    const { networkManager, currentUser } = get();
    if (networkManager && currentUser && message.trim()) {
      const messageData = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        userName: currentUser.name,
        message: message.trim(),
        timestamp: Date.now()
      };
      networkManager.emitSocket('send-message', messageData);
    }
  },
  
  syncSceneUpdate: (update: any) => {
    const { doc } = get();
    if (doc) {
      // Yjs를 통한 씬 업데이트 동기화
      const sceneMap = doc.getMap('scene');
      sceneMap.set('update', update);
    }
  },
  
  onSceneUpdate: (callback: (update: any) => void) => {
    const { doc } = get();
    if (doc) {
      const sceneMap = doc.getMap('scene');
      sceneMap.observe(() => {
        const update = sceneMap.get('update');
        if (update) {
          callback(update);
        }
      });
    }
  },
  
  reconnect: () => {
    const { networkManager } = get();
    if (networkManager) {
      networkManager.reconnect();
    }
  },
  
  getConnectionInfo: () => {
    const { networkManager, connectionState } = get();
    return {
      state: connectionState,
      queueSize: networkManager ? networkManager.getQueueSize() : 0
    };
  }
}));