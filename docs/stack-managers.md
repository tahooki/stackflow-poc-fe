# Stack Manager / Back Manager / Layer Manager 정리

## 목적

- 스택형 내비게이션 구조를 일관된 규칙으로 관리한다.
- 레이어(Activity/Step/Overlay)의 우선순위와 뒤로가기 흐름을 명확히 정의한다.
- 개발자가 내부 로직을 빠르게 이해하도록 구조와 책임을 분리해 설명한다.

## 핵심 개념 요약

- StackManager: "스택(탭)" 단위의 생성/활성/히스토리 관리.
- LayerManager: "레이어(Activity/Step/Overlay)"의 등록/정렬/상태 산출.
- BackManager: "뒤로가기"를 레이어 -> 스택 순으로 위임.

## 구성 요소와 책임

### StackManager (`src/stack/stackManager.ts`)

- 여러 스택(탭)을 생성하고 활성 스택을 전환한다.
- `stackList` 기반으로 Stackflow 인스턴스를 만든다.
- 활성 스택, 스택 히스토리, 마지막 변경 시점을 관리한다.
- 스택 전환 이벤트를 구독자에게 알린다.

핵심 상태

- `activeStack`: 현재 활성 스택 이름
- `stackHistory`: 이전 스택 히스토리 (뒤로가기용)
- `lastStackUpdateAt`: 스택 전환 시각

### LayerManager (`src/lib/layerManager.ts`)

- 스택별로 `LayerController`를 제공한다.
- 각 스택의 레이어 상태(Activity/Step/Overlay)를 독립적으로 관리한다.

LayerController 주요 책임

- 레이어 등록/해제 및 그룹 관리
- 화면 계층(Activity/Step/Overlay) 정렬 및 상태 산출
- top 레이어 판단 및 back 동작 실행
- 레이어 변경 시 구독자에게 상태 broadcast

핵심 상태

- `frames`: 정렬된 레이어 목록
- `activityCount`, `stepCount`, `modalCount`
- `lastStackUpdateAt`: 레이어 변경 시각

### BackManager (`src/lib/backManager.ts`)

- back 버튼 처리 흐름을 조정한다.
- 현재 활성 스택의 LayerController로 back 동작을 위임한다.
- 레이어가 더 이상 없으면 스택 히스토리로 복귀하거나 초기 스택으로 리셋한다.

핵심 동작

- `handleBackPress`: 레이어 -> 스택 순으로 pop 전략 수행

## 데이터 흐름 (개발자 관점)

1. StackManager가 스택 인스턴스를 생성한다.
2. 각 스택에 대해 LayerManager가 LayerController를 제공한다.
3. UI가 레이어 등록/해제 → LayerController가 상태를 재계산한다.
4. BackManager가 back 입력 처리 → 레이어 pop → 필요 시 스택 pop.

## Back 동작 시나리오 (알고리즘)

1. top overlay가 있으면 overlay pop
2. overlay가 없으면 top step pop
3. step도 없고 top activity가 root가 아니면 activity pop
4. root activity면 "exit" 반환
5. BackManager가 stack history에서 이전 스택으로 이동
6. 히스토리도 없으면 init stack으로 reset

## 레이어 우선순위 규칙

- Overlay는 `openedAt` 또는 `order` 기반으로 최상단 판단
- Activity/Step은 `zIndex` 기반
- Overlay는 `activityId`가 일치하는 레이어가 우선

## PPT 구성 (개발자 관점)

- 슬라이드 1: 전체 구조 (StackManager / LayerManager / BackManager)
- 슬라이드 2: StackManager 상태와 전환 이벤트
- 슬라이드 3: LayerManager + LayerController 구조와 레이어 종류
- 슬라이드 4: 레이어 우선순위와 top 계산 규칙
- 슬라이드 5: Back 처리 플로우 (순차 pop 로직)
- 슬라이드 6: 런타임 시퀀스 (BackPress -> Layer -> Stack)

## 슬라이드 스크립트 (개발자 관점)

- 슬라이드 1: 세 매니저는 역할이 분리되어 있으며, 스택 상태와 레이어 상태가 서로 독립적으로 유지된다는 점이 핵심이다. BackManager는 이 둘을 묶어 back 처리의 오케스트레이션만 담당한다.

- 슬라이드 2: StackManager는 활성 스택과 히스토리를 단일 상태 모델로 유지한다. setActiveStack/popStackHistory/resetToInitStack 같은 이벤트는 모두 이 상태를 갱신하며, 구독자에게 전파된다.

- 슬라이드 3: LayerManager는 스택별로 LayerController를 제공하고, 레이어 등록/해제 시 정렬과 카운트를 즉시 재계산한다. 이 구조 덕분에 UI는 "현재 top 레이어"를 일관된 기준으로 알 수 있다.

- 슬라이드 4: 레이어 우선순위는 두 규칙으로 분기된다. Activity/Step은 zIndex로, Overlay는 openedAt/order로 계산된다. Overlay는 activityId가 일치하는 그룹을 우선해 top을 결정한다.

- 슬라이드 5: Back 로직은 항상 레이어 기준으로 시작한다. overlay -> step -> activity 순서로 pop하고, root activity면 exit를 반환한다. exit 이후에만 스택 히스토리를 pop하거나 초기화한다.

- 슬라이드 6: 실제 호출 흐름은 BackPress가 BackManager로 들어가고, LayerController가 pop 결과를 반환한다. 결과가 exit일 때만 StackManager가 히스토리를 조정한다는 점을 강조한다.

## 슬라이드 이미지 프롬프트 (개발자 관점)

아래 프롬프트는 "PPT 슬라이드를 이미지로 생성"하는 목적에 맞춰, 레이아웃/타이포/색상/여백까지 구체적으로 작성한 버전이다.

### 슬라이드 1: 전체 구조 (StackManager / LayerManager / BackManager)

```text
16:9 PPT slide, clean tech blueprint style. Three vertical panels with bold titles: "StackManager", "LayerManager", "BackManager". Left panel shows stack list -> multiple Stackflow instances. Middle panel shows per-stack LayerController boxes (one per stack) with layer kinds (activity, step, modal, drawer, actionSheet) as stacked chips. Right panel shows BackManager orchestrating arrows between active stack and layer controller. Use thin grid background, teal + charcoal palette, orange accents for arrows. Large, readable labels, generous white space, crisp vector icons (stack, layers, back arrow). Modern infographic style: spacious layout, sharp typography hierarchy, thin line icons, card modules, dotted/curved connectors, 2-3 core colors plus neutral grays, minimal ornament.
```

### 슬라이드 2: StackManager 상태와 전환 이벤트

```text
16:9 PPT slide, minimal state-machine diagram. Center: "StackSwitchState" card listing activeStack, stackHistory[], lastStackUpdateAt. Surrounding arrows labeled setActiveStack(recordHistory), popStackHistory(), resetToInitStack(). Side note bubble: "emitStackSwitch -> subscribers". Top row shows createStackflowInstance per stack config (stack name, initialActivity, routes). Use clean monospace for state fields, bold sans-serif for titles. Navy background gradient, white cards, lime highlight for activeStack. Modern infographic style: spacious layout, sharp typography hierarchy, thin line icons, card modules, dotted/curved connectors, 2-3 core colors plus neutral grays, minimal ornament.
```

### 슬라이드 3: LayerManager + LayerController 구조

```text
16:9 PPT slide, split layout. Left: LayerManager with map of stackName -> LayerController (three stacked rectangles). Right: LayerController internals: layers Map, groups Map, listeners Set, state (frames[], activityCount, stepCount, modalCount, lastStackUpdateAt). Flow arrows from registerLayer / setGroupLayers / unregisterLayer / pruneOrphanedOverlays to refreshState -> emit. Use light gray background with subtle dot pattern, teal accents, thin line icons for map and broadcast. Modern infographic style: spacious layout, sharp typography hierarchy, thin line icons, card modules, dotted/curved connectors, 2-3 core colors plus neutral grays, minimal ornament.
```

### 슬라이드 4: 레이어 우선순위와 Top 계산 규칙

```text
16:9 PPT slide, formula + ranking diagram. Top area shows ordering formula: getLayerOrder = base + (order | openedAt | zIndex). Overlay base = 1,000,000,000,000. Activity/Step base = 0. Left column: overlay ranking by openedAt/order with activityId matching filter. Right column: activity top rule (isTop flag first, else highest zIndex among visible), step top rule (highest zIndex for activityId). Use contrasting blocks: overlays in orange, activities in blue, steps in green. Include tiny timeline arrow showing openedAt. Modern infographic style: spacious layout, sharp typography hierarchy, thin line icons, card modules, dotted/curved connectors, 2-3 core colors plus neutral grays, minimal ornament.
```

### 슬라이드 5: LayerController popTopLayer 플로우

```text
16:9 PPT slide, vertical flowchart with decision diamonds. Start: "handlingBack? -> popped none". Next: "topOverlay?" yes -> unregister + onClose -> popped overlay (modal/drawer/actionSheet). No -> "topActivity?" no -> popped exit. Yes -> "topStep?" yes -> onClose -> popped step. No -> "activity isRoot?" no -> onClose -> popped activity. Yes -> popped exit. Use dark background with neon cyan connectors, rounded rectangles, clear labels. Include small callout: "topOverlay matches activityId when possible". Modern infographic style: spacious layout, sharp typography hierarchy, thin line icons, card modules, dotted/curved connectors, 2-3 core colors plus neutral grays, minimal ornament.
```

### 슬라이드 6: BackManager 런타임 시퀀스

```text
16:9 PPT slide, sequence diagram. Actors: User Back Press, BackManager, StackManager, LayerController (active stack). Flow: BackManager -> LayerController.popTopLayer() -> result. If result != exit, return. If exit: BackManager -> StackManager.popStackHistory() -> (if exists) popped stack. Else -> StackManager.resetToInitStack() -> (if changed) popped stack. Else return exit. Use clean white background with soft gradient, thin gray lifelines, blue arrows, orange conditional branches. Emphasize "activeStack" read from StackManager at start. Modern infographic style: spacious layout, sharp typography hierarchy, thin line icons, card modules, dotted/curved connectors, 2-3 core colors plus neutral grays, minimal ornament.
```

### 모던한 인포그래픽 스타일 (공통 프롬프트)

```text
모던한 인포그래픽 스타일로 렌더링: 넓은 여백, 선명한 타이포, 얇은 라인 아이콘, 카드형 모듈, 레이어 간 연결은 점선/곡선. 컬러는 2-3개 핵심 색상 + 중립 회색 계열. 정보 위계가 뚜렷하도록 제목/서브타이틀/라벨 크기 대비를 크게. 시각 요소는 실제 데이터를 강조하도록 간결하게 유지하고, 불필요한 장식은 배제.
```
