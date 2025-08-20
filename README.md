# fluxCAD

한국 최초의 웹 기반 3D CAD 플랫폼

## 🚀 시작하기

### 개발 서버 실행
```bash
./start.sh
```
또는
```bash
npm run dev
```

개발 서버는 http://localhost:3009 에서 실행됩니다.

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

- ✅ 웹 브라우저에서 실행되는 3D CAD
- ✅ OpenCascade.js 기반 정밀 모델링
- ✅ 실시간 3D 렌더링
- ✅ 기본 도형 생성 (Box, Sphere, Cylinder, Cone)
- ✅ 객체 선택 및 관리
- ✅ CAD/Three.js 모드 전환

## 📝 개발 명령어

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

## 🔧 시스템 요구사항

- Node.js 18+
- 모던 브라우저 (Chrome 90+, Firefox 88+, Safari 14+)
- WebGL 2.0 지원
- WebAssembly 지원