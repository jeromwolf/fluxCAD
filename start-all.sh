#!/bin/bash

# FluxCAD 전체 시스템 시작 스크립트

echo "🚀 FluxCAD 전체 시스템을 시작합니다..."
echo ""

# 협업 서버 시작
echo "1️⃣ 협업 서버 시작..."
./start-collaboration.sh &
COLLAB_PID=$!

# 잠시 대기 (서버 시작 시간)
sleep 2

# 개발 서버 시작
echo ""
echo "2️⃣ 개발 서버 시작..."
echo "   주소: http://localhost:5173"
echo ""
npm run dev &
DEV_PID=$!

echo ""
echo "✅ FluxCAD가 실행 중입니다!"
echo ""
echo "📌 접속 정보:"
echo "   - 웹 애플리케이션: http://localhost:5173"
echo "   - Socket.io 서버: http://localhost:3001"
echo "   - Yjs 서버: ws://localhost:1234"
echo ""
echo "🛑 종료하려면 Ctrl+C를 누르세요."
echo ""

# Ctrl+C 시그널 처리
trap "echo ''; echo '🛑 시스템을 종료합니다...'; ./stop-collaboration.sh; kill $DEV_PID; exit" INT

# 프로세스가 실행 중인 동안 대기
wait