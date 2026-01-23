# Stackflow Flag / BackManager / LayerManager 발표 자료 (코드 기반)

이 문서는 `docs/stackflow-flag-backmanager-layermanager.md`를 기반으로,
실제 코드 구현을 참고해 발표용 구조와 설명표를 정리한 자료다.

## 0) 참고 코드 위치

- Stackflow 인스턴스/플러그인 등록: `src/lib/stack/createStackflowInstance.ts`
- Flag 패턴 플러그인: `src/plugins/navFlagPlugin.ts`
- Stack -> Layer 동기화 플러그인: `src/plugins/layerStackPlugin.ts`
- Layer 상태 관리: `src/lib/layerManager.ts`
- Back 처리: `src/lib/backManager.ts`
- Back 브리지: `src/hooks/useBackKeyBridge.ts`, `src/hooks/useHistoryBackBridge.ts`
- 사용 예시 (UI): `src/activities/HomeActivity.tsx`

## 1) 슬라이드 구성안

1. Stackflow 기본 구조 (스택 생성 + 액션 흐름)
2. Flag 패턴 개요 (navFlag 플러그인)
3. Flag 동작 매트릭스 (SINGLE_TOP / CLEAR_TOP / CLEAR_STACK ...)
4. LayerManager 구조 (LayerController + 레이어 정렬)
5. BackManager 시퀀스 (레이어 -> 스택)
6. 실제 호출 흐름 (push -> layer sync -> back)
7. 데모/검증 포인트 (UI 상호작용 기준)

## 2) 슬라이드별 핵심 메시지

### 슬라이드 1: Stackflow 기본 구조

- Stackflow 인스턴스는 `stackflow()`로 생성되고 플러그인으로 확장된다.
- 액션 호출은 `useStackActions`에서 stack + flag + animate 조합으로 감싼다.
- 스택별 인스턴스는 `StackManager`에서 생성/관리된다.

핵심 코드
- `src/lib/stack/createStackflowInstance.ts`
- `src/hooks/useStackActions.ts`
- `src/stack/stackManager.ts`

### 슬라이드 2: Flag 패턴 개요

- Android Intent Flag와 유사하게, 호출부는 `navFlag`만 지정한다.
- `onBeforePush`에서 기본 push를 차단하고 직접 이벤트를 dispatch한다.
- 플래그는 내부 필드로 주입 후 sanitize로 제거된다.

핵심 코드
- `src/plugins/navFlagPlugin.ts`
- `src/hooks/useStackActions.ts`

### 슬라이드 3: Flag 동작 매트릭스

- 플래그별로 push/replace/pop 순서가 달라진다.
- 동일 activity 여부, 스택 내 존재 여부를 판단해 처리한다.

핵심 코드
- `src/plugins/navFlagPlugin.ts`

### 슬라이드 4: LayerManager 구조

- 스택별 `LayerController`를 제공하고 레이어 상태를 유지한다.
- Overlay는 `openedAt`/`order`, Activity/Step은 `zIndex`로 정렬된다.
- `popTopLayer`는 overlay -> step -> activity -> exit 순으로 처리한다.

핵심 코드
- `src/lib/layerManager.ts`
- `src/plugins/layerStackPlugin.ts`
- `src/hooks/useLayer.ts`

### 슬라이드 5: BackManager 시퀀스

- Back은 먼저 레이어에서 처리된다.
- 레이어가 exit를 반환하면 스택 히스토리를 pop하거나 초기 스택으로 reset한다.

핵심 코드
- `src/lib/backManager.ts`
- `src/stack/stackManager.ts`

### 슬라이드 6: 실제 호출 흐름

- `push(..., { navFlag })` → `navFlagPlugin` → Stack 이벤트 dispatch
- `layerStackPlugin`이 Stack 상태를 Layer로 동기화
- `handleBackPress`는 Layer 상태를 기준으로 pop 순서를 결정

핵심 코드
- `src/plugins/navFlagPlugin.ts`
- `src/plugins/layerStackPlugin.ts`
- `src/lib/backManager.ts`

### 슬라이드 7: 데모/검증 포인트

- Home 화면에서 Flag 동작 버튼 실행 → stack 변화 확인
- Layer Devtools로 현재 레이어 정렬/카운트 확인
- Back 버튼/브라우저 back으로 pop 흐름 확인

핵심 코드
- `src/activities/HomeActivity.tsx`
- `src/components/LayerStackDevtools.tsx`
- `src/components/BackBridgeButton.tsx`
- `src/hooks/useBackKeyBridge.ts`

## 3) 기능 설명표

| 기능 | 설명 | 코드 레퍼런스 |
| --- | --- | --- |
| Stackflow 기본 스택 | stackflow 인스턴스 생성, stack 리스트 관리, active stack 전환 | `src/lib/stack/createStackflowInstance.ts`, `src/stack/stackManager.ts` |
| Flag 패턴 | push 전에 navFlag를 읽고 push/replace/pop 시퀀스를 직접 실행 | `src/plugins/navFlagPlugin.ts` |
| Flag 주입/전달 | navFlag를 내부 필드로 params에 숨겨 전달 | `src/hooks/useStackActions.ts` |
| LayerManager | 레이어(Activity/Step/Overlay) 상태/정렬/카운트 관리 | `src/lib/layerManager.ts` |
| Stack -> Layer 동기화 | Stack 상태를 LayerController에 반영 | `src/plugins/layerStackPlugin.ts` |
| Overlay 등록 | 모달/드로워 등을 레이어로 등록/해제 | `src/hooks/useLayer.ts`, `src/hooks/useImperativeModal.tsx` |
| BackManager | 레이어 pop 결과에 따라 stack 히스토리 pop/reset | `src/lib/backManager.ts` |
| Back 브리지 | 네이티브/브라우저 back 입력을 handleBackPress로 전달 | `src/hooks/useBackKeyBridge.ts`, `src/hooks/useHistoryBackBridge.ts` |

## 4) 코드 설명표

| 모듈 | 주요 함수/메서드 | 역할 | 포인트 |
| --- | --- | --- | --- |
| `navFlagPlugin` | `handleBeforePush` | push 이전 훅에서 플래그 처리 | `preventDefault()` 후 직접 `dispatchEvent()`로 push/replace/pop 실행 |
| `navFlagPlugin` | `sanitizeRecord` | 내부 필드 제거 | `__navFlag`를 params/context에서 제거해 노출 방지 |
| `navFlagPlugin` | `rewindToActivity` | 지정 액티비티까지 pop | 대상 인덱스 찾아 pop 횟수 계산 후 replace |
| `useStackActions` | `push` | navFlag 주입 + stack switch | params에 `__navFlag`를 추가해 플러그인에 전달 |
| `layerStackPlugin` | `buildStackLayers` | Stack -> Layer 변환 | Activity/Step을 레이어로 매핑하고 `onClose` 바인딩 |
| `layerStackPlugin` | `onInit`/`onChanged` | 레이어 동기화 | stack 변경 시 그룹 레이어 갱신 + orphan overlay 정리 |
| `LayerController` | `registerLayer` | 레이어 등록 | overlay는 id 자동 생성 + group 연동 |
| `LayerController` | `setGroupLayers` | 그룹 레이어 갱신 | 기존 그룹과 diff 계산 후 상태 재계산 |
| `LayerController` | `getLayerOrder` | 정렬 기준 계산 | overlay는 `openedAt/order`, activity/step은 `zIndex` |
| `LayerController` | `popTopLayer` | back 시퀀스 | overlay -> step -> activity -> exit 순서 |
| `BackManager` | `handleBackPress` | back 오케스트레이션 | Layer 결과가 exit일 때만 stack history 처리 |
| `StackManager` | `setActiveStack` | stack 전환 | history 기록 여부 옵션 제공 |
| `StackManager` | `popStackHistory` | 이전 stack 복귀 | history가 있으면 activeStack 전환 |
| `StackManager` | `resetToInitStack` | 기본 stack reset | history 비우고 init stack으로 이동 |

## 5) Flag 매트릭스 (발표용 요약)

| Flag | 동작 요약 | 코드상 처리 |
| --- | --- | --- |
| `SINGLE_TOP` | top이 동일하면 replace, 아니면 push | `top?.name` 비교 후 dispatch |
| `CLEAR_TOP` | 대상이 있으면 그 위 pop + replace | `rewindToActivity(activity)` |
| `CLEAR_STACK` | 전체 pop 후 push | `dispatchPopTimes(stack.activities.length)` |
| `JUMP_TO` | 요청과 무관하게 지정 activity push | `dispatchPush(navFlag.activity)` |
| `CLEAR_TOP_SINGLE_TOP` | CLEAR_TOP 실패 시 SINGLE_TOP 적용 | rewind 실패 후 top 비교 |
| `JUMP_TO_CLEAR_TOP` | 대상이 있으면 pop+replace, 없으면 push | `rewindToActivity(target)` 분기 |

## 6) 데모 시나리오 (발표 리허설용)

1. Home 화면에서 `CLEAR_TOP` 버튼 클릭 → 동일 detail이 스택 내에서 재사용됨.
2. `SINGLE_TOP` 버튼 → top 동일 시 replace로 params 갱신.
3. `JUMP_TO_CLEAR_TOP` → target이 있으면 pop+replace, 없으면 push.
4. Layer Devtools 토글 → overlay/step/activity 정렬 상태 확인.
5. Back 버튼(또는 브라우저 back) → overlay -> step -> activity -> stack 순으로 pop.

