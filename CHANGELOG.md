# 변경 이력

> 커밋 단위 요약. 상세 내용은 [DEVLOG.md](./DEVLOG.md) 및 [docs/devlogs/](./docs/devlogs/) 참고

---

## 2025년 10월

### 2025-10-30
- **deploy**: GitHub Pages 공개 배포 (c0f7f26)
  - 저장소: https://github.com/gogodevelop2/destruction-zone-web
  - 데모: https://gogodevelop2.github.io/destruction-zone-web/
  - gh-pages 브랜치 생성
- **fix**: Matter.js CDN 경로 수정 (cf9df94)
- **chore**: DOS 원본 파일 폴더 정리 (a4b26af)
- **docs**: 완료된 마이그레이션 계획 아카이브 이동 (4793bf1)
- **chore**: 구 코드 정리 및 개발 여정 보존 (8acc631)
- **docs**: 개발로그 주제별 재구조화 (6bb218a)
- **feat**: PixiJS 발사체 전환 완료 (3d93927)
  - Canvas 2D → PixiJS WebGL 완전 마이그레이션
  - ProjectileRenderer 객체 생성
  - 100-200개 발사체 동시 처리 준비

### 2025-10-29
- **feat**: TRON 스타일 + visualMargin 적용 (ce1927d)
  - 네온 그래픽 시스템 (3-layer rendering)
  - 3px visualMargin으로 물리/시각 분리
  - 충돌 안정성 개선 (iterations, chamfer)
  - 파티클 색상 변경 (red → white)
- **feat**: Phase 2 완성 - Projectile, Collision, AI (60a82e4)
  - Projectile 클래스 (LASER/MISSILE)
  - 충돌 감지 및 피해 시스템
  - 기본 AI 구현
- **docs**: Phase 1 개발 로그 작성 (e37ecab)

### 2025-10-28
- **feat**: Matter.js 프로토타입 추가 (Phase 1) (232649c)
  - Tank 클래스 구현
  - 기본 이동/회전 제어
  - 벽 충돌 처리
- **chore**: 구 문서 및 미사용 폴더 정리 (e4dbcf5)
- **docs**: Matter.js 리라이트 아키텍처 문서 (1bcbdf2)

---

## 2025년 1월

### 2025-01-27
- **feat**: Phase 1-2 프로토타입 완성
  - Matter.js 중심 아키텍처 확립
  - 단일 파일 프로토타입 (prototype.html)
  - 6탱크 멀티플레이 구현
- **docs**: ARCHITECTURE.md 작성 (508줄)
- **refactor**: 프로젝트 재구조화
  - 하이브리드 물리 방식 아카이브
  - 새 브랜치: `matter-js-rewrite`

---

## 브랜치 정보

- **main**: 안정 버전 (현재 비어있음)
- **matter-js-rewrite**: 현재 개발 브랜치 (활성)

---

## 커밋 컨벤션

- **feat**: 새 기능 추가
- **fix**: 버그 수정
- **docs**: 문서 변경
- **refactor**: 코드 리팩토링
- **perf**: 성능 개선
- **test**: 테스트 추가/수정
- **chore**: 빌드/설정 변경
