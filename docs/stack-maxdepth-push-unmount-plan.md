# maxDepth + push 언마운트 삭제 적용 개발 계획

이 문서는 `docs/stack-maxdepth-push-unmount-design.md`의 설계를 실제 프로젝트에
적용하기 위한 개발 계획과 작업 항목을 정리한다.

## 목표
- `push` 시 스택이 `maxDepth`를 초과하면 언마운트 시점에 안전하게 삭제한다.
- 전환 중 삭제로 인한 UX 문제를 방지한다.
- 옵션 기반으로 점진적으로 적용한다.

## 범위
- Stackflow 플러그인 형태로 정책 구현.
- `layerManager` 또는 스택 관리 모듈과의 연동 지점 정의.
- 텔레메트리 및 테스트 시나리오 추가.

## 적용 대상
- Stackflow 기반 네비게이션 흐름 전반.
- 스택이 깊어질 수 있는 화면 흐름(리스트 -> 상세 -> 상세 반복 등).

## 설계 요약
- `push` 후 스택 길이 계산 → 초과분 마킹.
- 마킹된 화면은 언마운트 시점에만 제거.
- root는 기본 보호 대상.

## 구현 단계
1. 플러그인 인터페이스 확정
2. 스택 메타데이터 구조 정의
3. `onPush`에서 마킹 로직 구현
4. `onUnmount`에서 실제 삭제 처리
5. 옵션 및 기본값 연결
6. 텔레메트리 추가
7. 테스트/검증

## 예상 변경 파일
- `src/lib/layerManager.ts` (연동 지점 확인)
- 새 플러그인 파일 (예: `src/lib/stackflow/stackDepthPlugin.ts`)
- 설정 또는 플러그인 등록부
- 문서 업데이트

## 위험 요소
- 전환 중 삭제 타이밍 충돌
- root 보호 정책 누락
- 연속 push 시 마킹 누적 처리 오류

## 검증 시나리오
- `maxDepth` 초과 push → pop 시 안전한 삭제
- 전환 중 삭제 미발생 확인
- root 보호 동작 확인
- 연속 push 후 마킹 누적 확인

## TODO 리스트
- [ ] Stackflow 플러그인 시그니처 조사 및 확정
- [ ] `ActivityMeta`/`markedForPrune` 구조 정의
- [ ] `onPush`에서 초과 계산 및 마킹 로직 구현
- [ ] `onUnmount`에서 실제 제거 로직 구현
- [ ] `keepRoot` 및 `selectTarget` 옵션 지원
- [ ] 텔레메트리 필드 정의 및 수집 연결
- [ ] 스택 깊이 스트레스 테스트 화면 구성
- [ ] `docs/perf-notes.md`에 측정 결과 기록
- [ ] 문서에 사용 예시 추가
