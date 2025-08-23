#!/bin/bash

# FluxCAD 협업 서버 종료 스크립트

echo "🛑 FluxCAD 협업 서버를 종료합니다..."

# Socket.io 서버 프로세스 종료
SOCKETIO_PIDS=$(pgrep -f "node collaboration-server.js")
if [ ! -z "$SOCKETIO_PIDS" ]; then
    echo "Socket.io 서버 종료 중..."
    kill $SOCKETIO_PIDS
fi

# Yjs 서버 프로세스 종료
YJS_PIDS=$(pgrep -f "node yjs-server.js")
if [ ! -z "$YJS_PIDS" ]; then
    echo "Yjs 서버 종료 중..."
    kill $YJS_PIDS
fi

# 포트 확인 및 강제 종료 (필요한 경우)
PORT_3001=$(lsof -ti:3001)
if [ ! -z "$PORT_3001" ]; then
    echo "포트 3001 프로세스 종료 중..."
    kill -9 $PORT_3001
fi

PORT_1234=$(lsof -ti:1234)
if [ ! -z "$PORT_1234" ]; then
    echo "포트 1234 프로세스 종료 중..."
    kill -9 $PORT_1234
fi

echo "✅ 모든 협업 서버가 종료되었습니다."