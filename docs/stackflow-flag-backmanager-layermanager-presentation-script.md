# Stackflow 발표 스크립트 (슬라이드별)

이 문서는 `stackflow-flag-backmanager-layermanager-presentation.md`의 슬라이드 구성에 맞춘
장면별 대사 스크립트다.

## 슬라이드 1: Stackflow 기본 구조

오늘은 Stackflow의 기본 스택 흐름과, flag/layer/back 매니저가 어떻게 엮이는지 보여드리겠습니다.
Stackflow 인스턴스는 플러그인 조합으로 생성되고, 각 스택은 StackManager가 관리합니다.
여기서 핵심은 `navFlagPlugin`과 `layerStackPlugin`이 각각 push 동작과 레이어 동기화를 담당한다는 점입니다.

## 슬라이드 2: Flag 패턴 개요

Flag 패턴은 호출부가 `navFlag`만 넘기면 실제 스택 조작은 플러그인이 대신 수행하도록 만든 구조입니다.
`onBeforePush` 훅에서 기본 push를 막고 직접 이벤트를 dispatch해 UX를 커스터마이즈합니다.
또 내부 키로 주입한 플래그는 sanitize해서 params 노출을 막습니다.

## 슬라이드 3: Flag 동작 매트릭스

각 플래그는 스택 상태에 따라 push/replace/pop 시퀀스가 다릅니다.
예를 들어 SINGLE_TOP은 top 비교 후 replace로 바꾸고, CLEAR_TOP은 목표까지 pop한 뒤 replace합니다.
즉, 플래그는 “스택 재구성 규칙”을 선언적으로 지정하는 방식입니다.

## 슬라이드 4: LayerManager 구조

LayerManager는 Activity/Step/Overlay를 하나의 레이어 스택으로 정렬합니다.
Overlay는 openedAt/order, Activity/Step은 zIndex 기반으로 top이 결정됩니다.
`layerStackPlugin`이 Stack 상태를 LayerController에 전달하고, UI는 이 레이어 상태를 읽어 동작합니다.

## 슬라이드 5: BackManager 시퀀스

Back은 레이어에서 먼저 처리됩니다.
Overlay -> Step -> Activity 순으로 pop하고, 더 이상 레이어가 없을 때 exit를 반환합니다.
exit일 때만 StackManager의 히스토리를 pop하거나 초기 스택으로 리셋합니다.

## 슬라이드 6: 실제 호출 흐름

사용자가 push를 호출하면 navFlag가 플러그인으로 전달되고, 이벤트 기반으로 스택이 바뀝니다.
스택 변경은 `layerStackPlugin`을 통해 레이어 상태로 반영됩니다.
Back 입력은 BackManager가 레이어 결과를 받고 스택 히스토리를 결정합니다.

## 슬라이드 7: 데모/검증 포인트

실제 데모에서는 Home 화면의 flag 버튼으로 스택 변화를 확인합니다.
Layer Devtools를 켜서 레이어 정렬과 카운트를 바로 확인하고,
브라우저 back이나 Back 버튼으로 pop 순서를 검증합니다.

