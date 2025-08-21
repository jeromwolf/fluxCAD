// 협업 관련 타입 정의

// 사용자 정보
export interface User {
  id: string
  name: string
  color: string
  avatar?: string
  isOnline: boolean
  lastSeen: Date
}

// 사용자 프레젠스 (현재 상태)
export interface UserPresence {
  userId: string
  cursor?: {
    x: number
    y: number
    z: number
  }
  selectedObjectId?: string | null
  viewport?: {
    camera: {
      position: [number, number, number]
      target: [number, number, number]
    }
  }
  isTyping?: boolean
  lastActivity: Date
}

// 협업 이벤트 타입
export enum CollaborationEventType {
  // 연결 관련
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  
  // 프레젠스 관련
  PRESENCE_UPDATE = 'presence_update',
  CURSOR_MOVE = 'cursor_move',
  SELECTION_CHANGE = 'selection_change',
  
  // 객체 관련
  OBJECT_CREATE = 'object_create',
  OBJECT_UPDATE = 'object_update',
  OBJECT_DELETE = 'object_delete',
  
  // 스케치 관련
  SKETCH_CREATE = 'sketch_create',
  SKETCH_UPDATE = 'sketch_update',
  SKETCH_DELETE = 'sketch_delete',
  
  // 프로젝트 관련
  PROJECT_UPDATE = 'project_update',
  
  // 채팅/코멘트
  MESSAGE_SEND = 'message_send',
  COMMENT_ADD = 'comment_add',
  COMMENT_UPDATE = 'comment_update',
  COMMENT_DELETE = 'comment_delete',
  
  // 동기화
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  
  // 오류
  ERROR = 'error'
}

// 협업 이벤트
export interface CollaborationEvent<T = any> {
  id: string
  type: CollaborationEventType
  userId: string
  timestamp: Date
  data: T
  version?: number // 이벤트 버전 (충돌 해결용)
}

// 객체 변경 이벤트 데이터
export interface ObjectChangeData {
  objectId: string
  changes: Partial<{
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
    color: string
    name: string
    visible: boolean
  }>
  previousValues?: any // 이전 값 (undo용)
}

// 충돌 해결 전략
export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  FIRST_WRITE_WINS = 'first_write_wins',
  MANUAL = 'manual',
  MERGE = 'merge'
}

// 충돌 정보
export interface Conflict {
  id: string
  objectId: string
  localChange: ObjectChangeData
  remoteChange: ObjectChangeData
  strategy: ConflictResolutionStrategy
  resolved: boolean
  resolution?: ObjectChangeData
}

// 협업 세션
export interface CollaborationSession {
  id: string
  projectId: string
  host: User
  participants: User[]
  startedAt: Date
  settings: {
    maxParticipants: number
    allowGuests: boolean
    requireApproval: boolean
    conflictResolution: ConflictResolutionStrategy
  }
}

// 메시지/코멘트
export interface Message {
  id: string
  userId: string
  content: string
  timestamp: Date
  edited?: boolean
  editedAt?: Date
}

export interface Comment extends Message {
  objectId?: string
  position?: [number, number, number]
  resolved?: boolean
  replies?: Comment[]
}

// 동기화 상태
export interface SyncState {
  lastSyncedAt: Date
  pendingChanges: number
  isSyncing: boolean
  syncErrors: string[]
}

// 권한 레벨
export enum PermissionLevel {
  VIEWER = 'viewer',      // 보기만 가능
  COMMENTER = 'commenter', // 보기 + 댓글
  EDITOR = 'editor',      // 보기 + 댓글 + 편집
  ADMIN = 'admin'         // 모든 권한
}

// 사용자 권한
export interface UserPermission {
  userId: string
  level: PermissionLevel
  grantedBy: string
  grantedAt: Date
}

// WebSocket 메시지 타입
export interface WebSocketMessage<T = any> {
  type: 'event' | 'request' | 'response' | 'error'
  id: string
  event?: CollaborationEventType
  data: T
  error?: string
}

// 협업 상태
export interface CollaborationState {
  session: CollaborationSession | null
  currentUser: User | null
  users: Map<string, User>
  presence: Map<string, UserPresence>
  permissions: Map<string, UserPermission>
  messages: Message[]
  comments: Comment[]
  conflicts: Conflict[]
  syncState: SyncState
  isConnected: boolean
  connectionError: string | null
}