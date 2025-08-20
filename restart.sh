#!/bin/bash

# fluxCAD 개발 서버 재시작 스크립트

echo "🔄 fluxCAD 개발 서버를 재시작합니다..."
echo ""

# 먼저 종료
./stop.sh

echo ""
echo "⏳ 잠시 대기 중..."
sleep 2

# 다시 시작
./start.sh