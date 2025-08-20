#!/bin/bash

# fluxCAD 개발 서버 실행 스크립트

echo "🚀 fluxCAD 개발 서버를 시작합니다..."
echo "📍 포트: 3009"
echo ""

# node_modules가 없으면 설치
if [ ! -d "node_modules" ]; then
    echo "📦 패키지를 설치합니다..."
    npm install
    echo ""
fi

# 개발 서버 실행
echo "🔧 개발 서버를 시작합니다..."
echo "🌐 브라우저가 자동으로 열립니다: http://localhost:3009"
echo ""
echo "종료하려면 Ctrl+C를 누르세요."
echo "================================"
echo ""

npm run dev