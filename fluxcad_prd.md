# fluxCAD - Product Requirements Document

## 1. Executive Summary

### Product Vision
fluxCAD는 한국 최초의 웹 기반 3D CAD 플랫폼으로, 브라우저에서 실행되는 전문적인 3D 설계 도구를 제공합니다. 기존 데스크톱 CAD 소프트웨어의 한계를 뛰어넘어 실시간 협업, 클라우드 기반 작업, 크로스 플랫폼 접근성을 실현합니다.

### Key Value Propositions
- **Zero Installation**: 브라우저만으로 즉시 사용 가능
- **Real-time Collaboration**: 실시간 멀티유저 설계 협업
- **Cloud Native**: 언제 어디서나 접근 가능한 클라우드 스토리지
- **Korean Market Focus**: 국내 설계 업무 환경에 최적화

## 2. Market Analysis

### Target Market
- **Primary**: 중소 설계사무소, 스타트업, 프리랜서 설계자
- **Secondary**: 대학교 설계 교육, 개인 프로젝트 사용자
- **Future**: 대기업 설계팀의 협업 도구

### Market Gap
- 국내 웹 기반 3D CAD 제품 부재
- 기존 국산 CAD(마이다스캐드, CADian) 모두 데스크톱 기반 2D 중심
- 외산 웹 CAD(Fusion 360, OnShape) 대비 현지화 부족

## 3. Product Goals & Success Metrics

### Primary Goals
1. **MVP Launch**: 2024년 Q2 베타 버전 출시
2. **User Acquisition**: 런치 후 6개월 내 1,000명 등록 사용자
3. **Feature Completeness**: 기본 3D 모델링 도구 완성도 90%
4. **Performance**: 브라우저에서 60fps 유지, 5초 이내 로딩

### Success Metrics
- **사용자 증가율**: 월 20% 성장
- **사용자 활성도**: 주 3회 이상 사용률 40%
- **설계 완성도**: 사용자당 월 평균 5개 프로젝트 완성
- **협업 사용률**: 전체 프로젝트 중 50% 이상 멀티유저 작업

## 4. Core Features (MVP)

### 4.1 3D Modeling Engine
**기본 형상 생성**
- Primitive 객체: Box, Sphere, Cylinder, Cone
- Sketch-based 모델링: 2D 스케치 → 3D Extrude/Revolve
- Boolean 연산: Union, Subtract, Intersect

**편집 도구**
- Transform: Move, Rotate, Scale
- Modify: Fillet, Chamfer, Shell
- Pattern: Linear, Circular Array

### 4.2 User Interface
**3D Viewport**
- WebGL 기반 렌더링
- Camera Controls: Orbit, Pan, Zoom
- Selection & Highlight 시스템
- Grid & Axis 표시

**Tool Panels**
- Feature Tree (모델 히스토리)
- Properties Panel
- Tool Palette
- Layer Manager

### 4.3 File Management
**Local Storage**
- Browser IndexedDB 기반 로컬 저장
- 자동 저장 (30초 간격)
- 버전 히스토리 (최근 10개)

**Export/Import**
- Export: STL, OBJ, STEP (OpenCascade.js 활용)
- Import: STL, OBJ 기본 지원
- 2D Drawing Export: SVG, PDF

### 4.4 Real-time Collaboration
**멀티유저 편집**
- WebSocket 기반 실시간 동기화
- 사용자별 커서 및 선택 영역 표시
- 충돌 방지: Operational Transformation

**커뮤니케이션**
- 인라인 댓글 시스템
- 변경 사항 히스토리
- 사용자 권한 관리 (Owner, Editor, Viewer)

## 5. Technical Architecture

### 5.1 Frontend Stack
```
React 18 + TypeScript
├── Three.js (3D 렌더링)
├── OpenCascade.js (CAD 커널)
├── React Three Fiber (React-Three.js 통합)
├── Zustand (상태 관리)
├── Socket.io-client (실시간 통신)
└── Tailwind CSS (UI 스타일링)
```

### 5.2 Backend Stack
```
Node.js + Express + TypeScript
├── Socket.io (실시간 통신)
├── PostgreSQL (사용자 데이터)
├── Redis (세션, 캐시)
├── AWS S3 (파일 스토리지)
└── JWT (인증)
```

### 5.3 Core Libraries
- **OpenCascade.js**: CAD 지오메트리 연산
- **Three.js**: WebGL 렌더링 엔진
- **Yjs**: 실시간 협업을 위한 CRDT
- **React Three Fiber**: React와 Three.js 통합

### 5.4 Browser Requirements
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **WebGL 2.0** 지원 필수
- **WebAssembly** 지원 필수
- **Minimum RAM**: 4GB (권장 8GB)

## 6. User Experience Design

### 6.1 User Onboarding
1. **Welcome Screen**: 3D 모델 갤러리로 제품 소개
2. **Interactive Tutorial**: 기본 박스 모델링 가이드
3. **Template Selection**: 빈 프로젝트 vs 샘플 프로젝트
4. **First Model**: 10분 내 첫 번째 모델 완성 가능

### 6.2 Workflow Design
```
프로젝트 생성 → 스케치 작성 → 3D 모델링 → 
협업/리뷰 → 수정/개선 → 최종 출력
```

### 6.3 Accessibility
- 키보드 단축키 완전 지원
- 화면 확대/축소 200%까지 지원
- 고대비 모드 제공
- 다국어 지원 (한국어, 영어)

## 7. Development Phases

### Phase 1: Core MVP (3개월)
- [ ] Basic 3D modeling engine
- [ ] File save/load system
- [ ] User authentication
- [ ] Basic UI framework

### Phase 2: Collaboration (2개월)
- [ ] Real-time multi-user editing
- [ ] Comment & annotation system
- [ ] Project sharing features
- [ ] Version control

### Phase 3: Advanced Features (2개월)
- [ ] Advanced modeling tools
- [ ] Import/Export enhancement
- [ ] Performance optimization
- [ ] Mobile responsive design

### Phase 4: Beta Launch (1개월)
- [ ] User testing & feedback
- [ ] Bug fixes & polish
- [ ] Documentation
- [ ] Beta user acquisition

## 8. Technical Challenges & Solutions

### 8.1 Performance Optimization
**Challenge**: 복잡한 3D 모델의 브라우저 렌더링
**Solution**: 
- Level-of-Detail (LOD) 시스템
- Frustum culling & Occlusion culling
- Web Workers를 활용한 계산 분산

### 8.2 CAD Kernel Integration
**Challenge**: OpenCascade.js의 대용량 WASM 파일
**Solution**:
- Progressive loading (필요한 모듈만 순차 로딩)
- CDN 캐싱 최적화
- Bundle splitting

### 8.3 Real-time Collaboration
**Challenge**: 대용량 3D 데이터의 실시간 동기화
**Solution**:
- Delta compression (변경분만 전송)
- Binary protocol 사용
- Conflict resolution algorithm

## 9. Security & Privacy

### 9.1 Data Protection
- 모든 통신 HTTPS 암호화
- 사용자 파일 AWS S3 암호화 저장
- GDPR 준수 개인정보 처리

### 9.2 Access Control
- JWT 기반 인증 시스템
- 프로젝트별 권한 관리
- API Rate limiting

## 10. Monetization Strategy

### 10.1 Freemium Model
**Free Tier**:
- 3개 프로젝트 제한
- 1GB 스토리지
- 기본 export 형식

**Pro Tier** (월 ₩29,000):
- 무제한 프로젝트
- 10GB 스토리지
- 고급 export 형식
- 우선 지원

**Team Tier** (월 ₩49,000/사용자):
- Pro 기능 전체
- 팀 관리 도구
- 고급 협업 기능
- SSO 연동

## 11. Launch Strategy

### 11.1 Beta Testing
- 설계사무소 5개사 파일럿 진행
- 대학교 설계 수업 도입 (2개교)
- 온라인 커뮤니티 베타 유저 모집

### 11.2 Marketing Channels
- 건축/기계 설계 온라인 커뮤니티
- LinkedIn B2B 마케팅
- 유튜브 튜토리얼 콘텐츠
- 설계 경진대회 스폰서십

## 12. Risk Assessment

### 12.1 Technical Risks
- **WebGL 호환성**: 구형 브라우저 대응 방안 필요
- **성능 한계**: 대용량 모델 처리 성능 제약
- **네트워크 의존성**: 오프라인 모드 필요성

### 12.2 Business Risks
- **시장 접수**: 기존 CAD 업체의 웹 진출
- **사용자 습관**: 데스크톱 CAD에 익숙한 사용자들
- **기술 변화**: WebGPU 등 새로운 웹 기술 등장

## 13. Success Factors

### 13.1 Critical Success Factors
1. **Performance**: 데스크톱 CAD 대비 80% 이상 성능
2. **Usability**: 30분 내 기본 사용법 습득 가능
3. **Reliability**: 99.5% 이상 서비스 가용성
4. **Community**: 활발한 사용자 커뮤니티 형성

### 13.2 Key Performance Indicators
- Monthly Active Users (MAU)
- Average Session Duration
- Feature Adoption Rate
- Customer Satisfaction Score (CSAT)
- Net Promoter Score (NPS)

---

**Document Version**: 1.0  
**Last Updated**: 2024년 8월  
**Next Review**: 프로토타입 완성 후