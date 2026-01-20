# Stackflow Vite 테스트 기획서

이 문서는 Stackflow 기능을 Vite 환경에서 검증하기 위한 테스트 기획서다.
기본 스택 동작, flag 패턴, 다중 스택, 스크롤 유지, depthRenderer/플러그인 관점을 포함한다.

## 범위

- 대상: 현재 React + Vite 앱에서 Stackflow 기본 기능 검증
- 포함: push/pop/replace/switch/params/scroll 유지, flag 패턴, multi-stack, 커스텀 플러그인, depthRenderer
- 제외: 백엔드 연동, 네트워크/권한 관련 로직

## 전제

- 테스트 러너: Vitest
- 렌더링 검증: React Testing Library (RTL)
- 필요 시: Playwright (gesture/transition E2E)
- 스택 초기화/플러그인 등록은 `src/lib/stack` 경로 기준으로 단일 진입점 유지
- 실험성 기능은 feature flag로 분리

## 테스트 목표

- 기본 스택 내비게이션이 예상대로 동작한다.
- flag 패턴과 다중 스택이 상호 간섭 없이 동작한다.
- scroll/state 유지 정책이 명확히 검증된다.
- 커스텀 플러그인이 lifecycle/transition에 영향을 주는지 확인한다.
- depthRenderer가 렌더링 범위를 안정적으로 제한하는지 확인한다.

## 테스트 그룹

### 1) 기본 스택 동작

- push: activity 추가, params/context 전달, enter-active/enter-done 전환 확인
- replace: 기존 activity exit 처리 + 신규 activity enter 상태 확인
- pop: top activity exit 처리, root 보호(no-op) 확인
- stepPush/stepReplace/stepPop: step 스택 변경, params 갱신 규칙 확인
- transition/global state: enter/exit 진행 중 `loading`, 완료 시 `idle` 확인
- pause/resume: 이벤트 큐잉 및 resume 시 재처리 확인
- activityId 재사용: 동일 ID push/replace 시 인덱스 재사용 여부 확인

### 2) 스크롤/상태 보존

- 동일 activity 재진입 시 scroll 복원 여부 확인
- 깊은 스택에서 뒤로가기 시 scroll state 유지 확인
- unmount 정책/renderer 필터링이 있을 때 scroll/state 손실 여부 기록

### 3) flag 패턴

- feature flag on/off에 따라 plugin/renderer가 분기되는지 확인
- flag on: 추가 lifecycle hook 동작 확인
- flag off: 기본 동작 유지 확인 (부작용 없어야 함)
- flag 조합: 다중 flag 충돌 없이 동작하는지 확인

### 4) 다중 스택 (multi-stack)

- stack A/B 전환 시 각각의 history/scroll 분리 확인
- 활성 스택 전환 시 비활성 스택 렌더/메모리 유지 정책 확인
- 동일 route 명칭이 다른 스택에 존재할 때 충돌 여부 확인

### 5) depthRenderer

- `maxVisible` 기준으로 렌더링 범위가 제한되는지 확인
- `exit-done` 상태는 렌더에서 제외되는지 확인
- depth가 줄어드는 시점에 floorIndex가 정상적으로 초기화되는지 확인
- `maxVisible <= 0`일 때 전체 렌더/예외 여부 확인

### 6) 커스텀 플러그인

- 최소 1개 custom plugin 구현
  - 예: transition 로그 플러그인, 스택 depth 추적 플러그인
- lifecycle hook 호출 순서/횟수 검증
- 플러그인 적용 전/후 동작 비교
- 타입 export 및 feature flag로 보호

## 테스트 설계 상세

### 공통 준비/테스트 데이터

- 스택 구성: `home`, `orders`, `snapshot`
- 액티비티 이름: `home`, `detail`, `depth`, `orders`, `snapshot`, `modal`
- depthRenderer 기본값: `maxVisible=5`
- 전환 시간: `transitionDuration`에 따라 `enter-active/exit-active`가 발생할 수 있으므로, 필요 시 fake timers로 완료 상태까지 진행

### 기본 테스트 케이스 (RTL + Vitest)

- 초기 스택: root 1개
  - 기대: root `enter-done`, `isTop/isActive/isRoot` true, `globalTransitionState=idle`
- push 1회
  - 기대: 신규 activity `enter-active`(또는 skip 시 `enter-done`), top/active 갱신
- push with `skipEnterActiveState`
  - 기대: 즉시 `enter-done`, `globalTransitionState=idle`
- replace 1회
  - 기대: 기존 activity `exitedBy` 기록, 신규 activity enter 상태, visible 유지
- pop 1회 (depth>1)
  - 기대: top `exit-active`(또는 skip 시 `exit-done`), active는 이전 activity로 전환
- pop (root only)
  - 기대: no-op, stack 변화 없음
- stepPush/stepReplace/stepPop
  - 기대: steps 길이/마지막 step id/params 갱신 규칙 일치
- stepPop (steps=1)
  - 기대: no-op
- pause/resume
  - 기대: pause 동안 변경 없음 + pausedEvents 누적, resume 시 이벤트 재처리
- activityId 재사용
  - 기대: 동일 ID push/replace 시 인덱스 재사용으로 visible 증가 없음

### 상세 테스트 케이스

#### 기본 스택 동작

- TC-CORE-001: 초기화 시 root 1개 생성
  - 전제: `home` 스택 초기화
  - 절차: Stackflow init → stack 조회
  - 기대: activities 길이 1, root가 `isTop/isActive/isRoot` true
- TC-CORE-002: push 시 top/active 변경
  - 전제: root 상태
  - 절차: `push({ activityName: "detail", activityId, activityParams })`
  - 기대: activities 길이 2, top/active가 "detail"
- TC-CORE-003: push + params 전달
  - 절차: `push`에 params 전달 → activity params 확인
  - 기대: top activity params가 입력값과 일치
- TC-CORE-004: replace 시 기존 activity exit 처리
  - 절차: `replace({ activityName: "detail", activityId })`
  - 기대: 기존 top `exitedBy` 설정, 신규 activity enter 상태
- TC-CORE-005: pop 시 이전 activity 복귀
  - 전제: depth>=2
  - 절차: `pop()`
  - 기대: 이전 activity가 active, top activity `exit-active/exit-done`
- TC-CORE-006: root pop no-op
  - 전제: root 1개만 존재
  - 절차: `pop()`
  - 기대: activities 변화 없음
- TC-CORE-007: skipEnterActiveState 적용
  - 절차: `push({ skipEnterActiveState: true })`
  - 기대: 즉시 `enter-done`, `globalTransitionState=idle`
- TC-CORE-008: skipExitActiveState 적용
  - 전제: depth>=2
  - 절차: `pop({ skipExitActiveState: true })`
  - 기대: 즉시 `exit-done`
- TC-CORE-009: transition 완료 후 idle
  - 절차: push/pop 후 timer advance
  - 기대: `globalTransitionState=idle`

#### Step 동작

- TC-STEP-001: stepPush로 steps 추가
  - 전제: activity 1개 이상
  - 절차: `stepPush({ stepId, stepParams })`
  - 기대: steps 길이 +1, params가 stepParams로 갱신
- TC-STEP-002: stepReplace로 마지막 step 교체
  - 절차: `stepReplace({ stepId, stepParams })`
  - 기대: 마지막 step id/params 교체
- TC-STEP-003: stepPop로 마지막 step 제거
  - 전제: steps >= 2
  - 절차: `stepPop()`
  - 기대: steps 길이 -1, params는 이전 step 기준
- TC-STEP-004: stepPop (steps=1) no-op
  - 전제: steps=1
  - 절차: `stepPop()`
  - 기대: steps 변화 없음
- TC-STEP-005: step 대상 activity 지정
  - 전제: depth>=2
  - 절차: `stepPush({ targetActivityId: 이전 activity id })`
  - 기대: 최신 activity가 아닌 지정 activity만 변경

#### Pause/Resume

- TC-PAUSE-001: pause 동안 이벤트 누적
  - 절차: `pause()` → `push()` → stack 확인
  - 기대: 변화 없음, `pausedEvents` 누적
- TC-PAUSE-002: resume 시 누적 이벤트 처리
  - 절차: `resume()` → stack 확인
  - 기대: 누적 이벤트 반영 후 `globalTransitionState` 복귀

#### Activity ID 재사용

- TC-ID-001: 동일 activityId push 재사용
  - 절차: 동일 id로 `push` 반복
  - 기대: 인덱스 재사용, activities 길이 증가 없음
- TC-ID-002: 동일 activityId replace 재사용
  - 절차: 동일 id로 `replace`
  - 기대: 동일 인덱스에 새 activity 상태 반영

### flag 패턴 케이스

- flag on/off 별로 같은 케이스를 반복 실행
- plugin이 설치된 상태에서 stack events가 기록되는지 검증
- flag off에서 이벤트/side-effect가 발생하지 않는지 확인

### 플러그인 검증 케이스

- onBeforePush/onAfterPush 호출 횟수 검증
- onBeforePop preventDefault가 의도대로 동작하는지 확인
- onChange/transition 이벤트 payload 확인

### depthRenderer 검증 케이스

- `maxVisible=3`에서 depth 5까지 push
  - 기대: 렌더된 activity 수는 3
- pop으로 depth가 3 이하로 감소
  - 기대: floorIndex 초기화로 root까지 렌더 복귀
- `exit-done` 상태 activity가 렌더 목록에 포함되지 않음
- `maxVisible=0` 또는 음수
  - 기대: 모든 activity 렌더 또는 명시적 no-op 처리 확인

#### depthRenderer 상세 케이스

- TC-DEPTH-001: maxVisible 제한 적용
  - 전제: `maxVisible=3`
  - 절차: depth 5까지 push
  - 기대: 렌더 activity 수 3, 가장 최신 3개만 렌더
- TC-DEPTH-002: depth 감소 시 floorIndex 리셋
  - 절차: pop으로 depth <= maxVisible
  - 기대: root 포함 전체 렌더 복구
- TC-DEPTH-003: exit-done 제외
  - 절차: pop 후 transition 완료 상태
  - 기대: exit-done activity는 렌더 목록에서 제외
- TC-DEPTH-004: maxVisible=0/음수
  - 절차: 옵션 변경 후 렌더
  - 기대: 전체 렌더 또는 옵션 비활성 처리 확인

### 스크롤/상태 테스트 케이스

- 긴 리스트에서 특정 scroll 위치 확보
- push → pop 후 scroll 위치 복구 검증
- renderer 필터링 사용 시 scroll/state 손실 기록

## 파일/구조 제안

- 테스트 진입점
  - `src/lib/stack/createStackflowInstance.ts`
- 테스트 유틸
  - `src/tests/stackflow/helpers.ts`
- 기본 테스트
  - `src/tests/stackflow/basic.test.tsx`
- flag 패턴
  - `src/tests/stackflow/flags.test.tsx`
- multi-stack
  - `src/tests/stackflow/multi-stack.test.tsx`
- 플러그인
  - `src/tests/stackflow/plugin.test.tsx`
- depthRenderer
  - `src/tests/stackflow/depth-renderer.test.tsx`

## 수용 기준 (Acceptance)

- 기본 stack 기능 테스트가 모두 통과한다.
- flag on/off 결과가 명확히 분리된다.
- multi-stack 전환 시 state/scroll이 유지된다.
- 커스텀 플러그인이 의도한 lifecycle hook을 정확히 호출한다.
- depthRenderer가 maxVisible 규칙을 정확히 따른다.

## 일정/우선순위

1. 기본 스택 테스트 케이스 작성
2. flag 패턴 및 multi-stack 테스트 확장
3. depthRenderer 테스트 추가
4. 커스텀 플러그인 구현 + 테스트

## 개발 Todo

- [ ] Vitest/RTL 환경 점검 및 공통 테스트 헬퍼 구성
- [ ] 기본 스택 테스트(TC-CORE/TC-STEP/TC-PAUSE/TC-ID) 구현
- [ ] flag 패턴 테스트 구현
- [ ] multi-stack 전환 테스트 구현
- [ ] depthRenderer 테스트(TC-DEPTH) 구현
- [ ] 커스텀 플러그인 테스트 구현
- [ ] 실패 케이스(등록되지 않은 activity 등) 검증 추가
