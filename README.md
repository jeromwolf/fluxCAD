# fluxCAD

한국 최초의 웹 기반 3D CAD 플랫폼

## 🚀 시작하기

### 전체 시스템 실행 (프론트엔드 + 협업 서버)
```bash
./start-all.sh
```

### 개발 서버만 실행
```bash
./start.sh
```
또는
```bash
npm run dev
```

### 협업 서버만 실행
```bash
./start-collaboration.sh
```

### 협업 서버 종료
```bash
./stop-collaboration.sh
```

개발 서버는 http://localhost:5173 에서 실행됩니다.

### 프로덕션 빌드
```bash
./build.sh
```
또는
```bash
npm run build
```

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **3D Engine**: Three.js + React Three Fiber
- **CAD Kernel**: OpenCascade.js
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## 📁 프로젝트 구조

```
fluxCAD/
├── src/
│   ├── components/     # React 컴포넌트
│   ├── lib/           # 핵심 라이브러리 (OpenCascade)
│   ├── store/         # Zustand 상태 관리
│   ├── types/         # TypeScript 타입 정의
│   ├── hooks/         # 커스텀 React 훅
│   └── utils/         # 유틸리티 함수
├── public/            # 정적 파일
└── dist/             # 빌드 결과물
```

## 🎯 주요 기능

### 기본 기능
- ✅ 웹 브라우저에서 실행되는 3D CAD
- ✅ OpenCascade.js 기반 정밀 모델링
- ✅ 실시간 3D 렌더링
- ✅ 기본 도형 생성 (Box, Sphere, Cylinder, Cone)
- ✅ 객체 선택 및 관리
- ✅ CAD/Three.js 모드 전환

### 고급 모델링
- ✅ Boolean 연산 (Union, Subtraction, Intersection)
- ✅ 고급 작업 (Fillet, Chamfer, Shell, Pattern)
- ✅ 2D 스케치 시스템
- ✅ Extrude/Revolve 3D 변환

### 파일 입출력
- ✅ STL, OBJ, STEP, glTF 가져오기
- ✅ STL, OBJ, glTF 내보내기
- ✅ FluxCAD 프로젝트 파일 (.fluxcad)

### 렌더링 시스템
- ✅ PBR 재질 라이브러리 (20+ 재질)
- ✅ HDR 환경 조명
- ✅ 후처리 효과 (SSAO, Bloom, Tone Mapping)
- ✅ 성능 최적화 시스템

### 협업 기능 (NEW!)
- ✅ 실시간 다중 사용자 편집
- ✅ 사용자 커서 및 선택 상태 공유
- ✅ 실시간 채팅
- ✅ Yjs CRDT 기반 충돌 없는 동기화

## 📝 개발 명령어

### 프론트엔드
```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 타입 체크
npm run typecheck

# 빌드 프리뷰
npm run preview
```

### 협업 서버
```bash
# 서버 디렉토리로 이동
cd server

# Socket.io 서버 실행
npm start

# Yjs 서버 실행
npm run yjs
```

## 🔧 시스템 요구사항

- Node.js 18+
- 모던 브라우저 (Chrome 90+, Firefox 88+, Safari 14+)
- WebGL 2.0 지원
- WebAssembly 지원