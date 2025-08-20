#!/bin/bash

# fluxCAD 빌드 스크립트

echo "🏗️  fluxCAD 프로덕션 빌드를 시작합니다..."
echo ""

# node_modules가 없으면 설치
if [ ! -d "node_modules" ]; then
    echo "📦 패키지를 설치합니다..."
    npm install
    echo ""
fi

# 타입 체크
echo "📝 TypeScript 타입 체크 중..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "❌ 타입 체크 실패!"
    exit 1
fi
echo "✅ 타입 체크 성공!"
echo ""

# 빌드
echo "🔨 프로덕션 빌드 중..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패!"
    exit 1
fi

echo ""
echo "✅ 빌드 완료!"
echo "📁 빌드 결과: ./dist"
echo ""
echo "프리뷰 서버를 실행하려면: npm run preview"