import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  OFFLINE = 'offline'
}

export interface NetworkConfig {
  socketUrl: string;
  yjsUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  offlineQueueSize: number;
  heartbeatInterval: number;
}

export interface QueuedOperation {
  id: string;
  type: 'socket' | 'yjs';
  operation: string;
  data: any;
  timestamp: number;
}

export class NetworkManager {
  private socket: Socket | null = null;
  private yjsProvider: WebsocketProvider | null = null;
  private config: NetworkConfig;
  
  // 연결 상태
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  
  // 오프라인 큐
  private offlineQueue: QueuedOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  
  // 콜백
  private onStateChange: ((state: ConnectionState) => void) | null = null;
  private onReconnect: (() => void) | null = null;
  private onOffline: (() => void) | null = null;
  private onOnline: (() => void) | null = null;
  
  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = {
      socketUrl: 'http://localhost:3001',
      yjsUrl: 'ws://localhost:1234',
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      offlineQueueSize: 100,
      heartbeatInterval: 5000,
      ...config
    };
    
    this.setupNetworkListeners();
  }
  
  /**
   * 네트워크 상태 리스너 설정
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // 페이지 가시성 변경 감지 (탭 전환)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  /**
   * Socket.io 연결
   */
  connectSocket(query: any = {}): Socket {
    this.setConnectionState(ConnectionState.CONNECTING);
    
    this.socket = io(this.config.socketUrl, {
      query,
      reconnection: false, // 수동 재연결 관리
      transports: ['websocket', 'polling']
    });
    
    // Socket 이벤트 핸들러
    this.socket.on('connect', () => {
      console.log('Socket.io 연결됨');
      this.setConnectionState(ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushOfflineQueue('socket');
      
      if (this.onReconnect && this.reconnectAttempts > 0) {
        this.onReconnect();
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket.io 연결 해제:', reason);
      this.stopHeartbeat();
      
      if (reason === 'io server disconnect') {
        // 서버가 연결을 끊은 경우
        this.setConnectionState(ConnectionState.DISCONNECTED);
      } else {
        // 클라이언트 측 연결 끊김
        this.attemptReconnect();
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket.io 오류:', error);
    });
    
    // 하트비트 응답
    this.socket.on('pong', () => {
      // 서버 응답 확인
    });
    
    return this.socket;
  }
  
  /**
   * Yjs WebSocket 연결
   */
  connectYjs(roomId: string, doc: Y.Doc): WebsocketProvider {
    this.yjsProvider = new WebsocketProvider(
      this.config.yjsUrl,
      roomId,
      doc,
      {
        connect: true,
        params: {},
        // WebSocket 옵션
        WebSocketPolyfill: WebSocket,
        resyncInterval: 5000,
        maxBackoffTime: 10000
      }
    );
    
    this.yjsProvider.on('status', (event: any) => {
      console.log('Yjs 연결 상태:', event.status);
      
      if (event.status === 'connected') {
        this.flushOfflineQueue('yjs');
      }
    });
    
    this.yjsProvider.on('connection-error', (event: any) => {
      console.error('Yjs 연결 오류:', event);
    });
    
    return this.yjsProvider;
  }
  
  /**
   * 재연결 시도
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.log('재연결 시도 횟수 초과');
      this.setConnectionState(ConnectionState.OFFLINE);
      return;
    }
    
    this.setConnectionState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;
    
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`재연결 시도 ${this.reconnectAttempts}/${this.config.reconnectAttempts} (${delay}ms 후)`);
    
    this.reconnectTimer = window.setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
      
      if (this.yjsProvider && this.yjsProvider.wsconnected === false) {
        this.yjsProvider.connect();
      }
    }, delay);
  }
  
  /**
   * 수동 재연결
   */
  reconnect(): void {
    this.reconnectAttempts = 0;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.attemptReconnect();
  }
  
  /**
   * 하트비트 시작
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, this.config.heartbeatInterval);
  }
  
  /**
   * 하트비트 중지
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * 오프라인 큐에 작업 추가
   */
  queueOperation(type: 'socket' | 'yjs', operation: string, data: any): void {
    if (this.offlineQueue.length >= this.config.offlineQueueSize) {
      // 가장 오래된 작업 제거
      this.offlineQueue.shift();
    }
    
    this.offlineQueue.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      operation,
      data,
      timestamp: Date.now()
    });
    
    console.log(`오프라인 작업 큐에 추가: ${operation}`);
  }
  
  /**
   * 오프라인 큐 처리
   */
  private flushOfflineQueue(type: 'socket' | 'yjs'): void {
    const operations = this.offlineQueue.filter(op => op.type === type);
    
    if (operations.length === 0) return;
    
    console.log(`${operations.length}개의 오프라인 작업 처리 중...`);
    
    operations.forEach(op => {
      try {
        if (type === 'socket' && this.socket?.connected) {
          this.socket.emit(op.operation, op.data);
        } else if (type === 'yjs' && this.yjsProvider?.wsconnected) {
          // Yjs 작업 처리 (필요한 경우 구현)
          console.log('Yjs 오프라인 작업:', op);
        }
        
        // 성공적으로 처리된 작업 제거
        const index = this.offlineQueue.indexOf(op);
        if (index > -1) {
          this.offlineQueue.splice(index, 1);
        }
      } catch (error) {
        console.error('오프라인 작업 처리 실패:', error);
      }
    });
  }
  
  /**
   * 네트워크 온라인 핸들러
   */
  private handleOnline = (): void => {
    console.log('네트워크 온라인');
    this.isOnline = true;
    
    if (this.onOnline) {
      this.onOnline();
    }
    
    // 자동 재연결 시도
    if (this.connectionState === ConnectionState.OFFLINE) {
      this.reconnect();
    }
  };
  
  /**
   * 네트워크 오프라인 핸들러
   */
  private handleOffline = (): void => {
    console.log('네트워크 오프라인');
    this.isOnline = false;
    this.setConnectionState(ConnectionState.OFFLINE);
    
    if (this.onOffline) {
      this.onOffline();
    }
  };
  
  /**
   * 페이지 가시성 변경 핸들러
   */
  private handleVisibilityChange = (): void => {
    if (!document.hidden && this.connectionState === ConnectionState.DISCONNECTED) {
      // 페이지가 다시 활성화되면 재연결
      this.reconnect();
    }
  };
  
  /**
   * 연결 상태 설정
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      
      if (this.onStateChange) {
        this.onStateChange(state);
      }
    }
  }
  
  /**
   * Socket.io 작업 실행 (오프라인 큐 지원)
   */
  emitSocket(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.queueOperation('socket', event, data);
    }
  }
  
  /**
   * 현재 연결 상태
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * 온라인 상태
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }
  
  /**
   * 오프라인 큐 크기
   */
  getQueueSize(): number {
    return this.offlineQueue.length;
  }
  
  /**
   * 오프라인 큐 가져오기
   */
  getOfflineQueue(): QueuedOperation[] {
    return [...this.offlineQueue];
  }
  
  /**
   * 오프라인 큐 클리어
   */
  clearOfflineQueue(): void {
    this.offlineQueue = [];
  }
  
  /**
   * 이벤트 핸들러 설정
   */
  setEventHandlers(handlers: {
    onStateChange?: (state: ConnectionState) => void;
    onReconnect?: () => void;
    onOffline?: () => void;
    onOnline?: () => void;
  }): void {
    if (handlers.onStateChange) this.onStateChange = handlers.onStateChange;
    if (handlers.onReconnect) this.onReconnect = handlers.onReconnect;
    if (handlers.onOffline) this.onOffline = handlers.onOffline;
    if (handlers.onOnline) this.onOnline = handlers.onOnline;
  }
  
  /**
   * 연결 해제
   */
  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.yjsProvider) {
      this.yjsProvider.disconnect();
      this.yjsProvider = null;
    }
    
    this.setConnectionState(ConnectionState.DISCONNECTED);
  }
  
  /**
   * 정리
   */
  dispose(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    this.disconnect();
    this.clearOfflineQueue();
  }
}