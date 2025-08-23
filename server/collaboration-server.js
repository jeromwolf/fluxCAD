const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// 방별 사용자 관리
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('새 사용자 연결:', socket.id);
  
  const { roomId, userName } = socket.handshake.query;
  
  if (!roomId) {
    console.log('룸 ID가 없어 연결 거부');
    socket.disconnect();
    return;
  }
  
  // 룸 참가
  socket.join(roomId);
  
  // 룸에 사용자 추가
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  
  const room = rooms.get(roomId);
  
  // 사용자 입장 처리
  socket.on('user-join', (userData) => {
    room.set(socket.id, {
      ...userData,
      id: socket.id,
      lastActivity: Date.now()
    });
    
    // 모든 사용자에게 업데이트된 사용자 목록 전송
    const users = Array.from(room.values());
    io.to(roomId).emit('users-update', users);
    
    console.log(`${userName}님이 ${roomId} 룸에 입장했습니다.`);
  });
  
  // 커서 업데이트
  socket.on('cursor-update', (cursor) => {
    const user = room.get(socket.id);
    if (user) {
      user.cursor = cursor;
      user.lastActivity = Date.now();
      
      // 다른 사용자들에게 커서 위치 전송
      socket.to(roomId).emit('user-cursor-update', {
        userId: socket.id,
        cursor
      });
    }
  });
  
  // 선택 업데이트
  socket.on('selection-update', (objectId) => {
    const user = room.get(socket.id);
    if (user) {
      user.selectedObject = objectId;
      user.lastActivity = Date.now();
      
      // 다른 사용자들에게 선택 상태 전송
      socket.to(roomId).emit('user-selection-update', {
        userId: socket.id,
        objectId
      });
    }
  });
  
  // 메시지 전송
  socket.on('send-message', (message) => {
    // 모든 사용자에게 메시지 전송
    io.to(roomId).emit('new-message', message);
    console.log(`메시지 전송: ${message.userName}: ${message.message}`);
  });
  
  // 연결 해제
  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
    
    if (room) {
      room.delete(socket.id);
      
      // 룸이 비었으면 삭제
      if (room.size === 0) {
        rooms.delete(roomId);
      } else {
        // 남은 사용자들에게 업데이트
        const users = Array.from(room.values());
        socket.to(roomId).emit('users-update', users);
      }
    }
  });
});

// 비활성 사용자 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5분
  
  rooms.forEach((room, roomId) => {
    room.forEach((user, userId) => {
      if (now - user.lastActivity > timeout) {
        room.delete(userId);
        io.to(roomId).emit('users-update', Array.from(room.values()));
      }
    });
    
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`협업 서버가 포트 ${PORT}에서 실행 중입니다.`);
});