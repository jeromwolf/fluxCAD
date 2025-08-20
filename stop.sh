#!/bin/bash

# fluxCAD 개발 서버 종료 스크립트

PORT=3009

echo "🛑 fluxCAD 개발 서버를 종료합니다..."
echo "📍 포트: $PORT"
echo ""

# macOS/Linux에서 포트를 사용하는 프로세스 찾기
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PID=$(lsof -ti:$PORT)
else
    # Linux
    PID=$(lsof -ti:$PORT -sTCP:LISTEN)
fi

if [ -z "$PID" ]; then
    echo "ℹ️  포트 $PORT 에서 실행 중인 프로세스가 없습니다."
else
    echo "🔍 포트 $PORT 를 사용하는 프로세스를 찾았습니다: PID $PID"
    
    # 프로세스 정보 표시
    echo "📋 프로세스 정보:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        ps -p $PID -o pid,command
    else
        ps -p $PID -o pid,cmd
    fi
    echo ""
    
    # 프로세스 종료
    echo "⏹️  프로세스를 종료합니다..."
    kill -9 $PID
    
    if [ $? -eq 0 ]; then
        echo "✅ 성공적으로 종료되었습니다!"
    else
        echo "❌ 프로세스 종료 실패. sudo 권한이 필요할 수 있습니다."
        echo "   다음 명령어를 시도해보세요: sudo ./stop.sh"
    fi
fi

echo ""
echo "완료!"