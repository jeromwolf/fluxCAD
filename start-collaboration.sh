#!/bin/bash

# FluxCAD 협업 서버 시작 스크립트

echo "🚀 FluxCAD 협업 서버를 시작합니다..."

# 서버 디렉토리로 이동
cd server

# 백그라운드에서 Socket.io 서버 시작
echo "📡 Socket.io 서버 시작 (포트 3001)..."
node collaboration-server.js &
SOCKETIO_PID=$!

# 백그라운드에서 Yjs 서버 시작
echo "🔄 Yjs 동기화 서버 시작 (포트 1234)..."
node yjs-server.js &
YJS_PID=$!

echo ""
echo "✅ 협업 서버가 시작되었습니다!"
echo "   - Socket.io 서버: http://localhost:3001 (PID: $SOCKETIO_PID)"
echo "   - Yjs 서버: ws://localhost:1234 (PID: $YJS_PID)"
echo ""
echo "🛑 서버를 종료하려면 Ctrl+C를 누르세요."
echo ""

# Ctrl+C 시그널 처리
trap "echo ''; echo '🛑 서버를 종료합니다...'; kill $SOCKETIO_PID $YJS_PID; exit" INT

# 프로세스가 실행 중인 동안 대기
wait