# Stackflow 텍스트 노트 스크립트 (섹션별)

이 문서는 `stackflow-flag-backmanager-layermanager-notes.md`의 섹션 흐름에 맞춘
설명용 스크립트다. 발표가 아니라 읽는 형식으로 구성했다.

## 1) 큰 그림 요약

Stackflow는 스택 네비게이션을 플러그인으로 확장하는 구조입니다.
Flag는 push 전에 동작을 재정의하고, LayerManager는 화면 레이어를 스택처럼 관리합니다.
BackManager는 레이어 pop 결과를 기준으로 스택 히스토리를 조정합니다.

## 2) Stackflow 인스턴스 구성

Stackflow 인스턴스는 플러그인 조합으로 생성됩니다.
여기서 `navFlagPlugin`과 `layerStackPlugin`이 핵심 확장 포인트입니다.
플러그인 구조를 이해하면 이후 동작을 쉽게 추적할 수 있습니다.

## 3) Flag 패턴 개요

호출부는 `useStackActions.push`에 navFlag를 넘기고,
플러그인이 `onBeforePush`에서 기본 push를 차단한 뒤 직접 이벤트를 dispatch합니다.
플래그는 내부 키로 전달하고 sanitize로 params 노출을 막습니다.

## 4) LayerManager 동작

Stack의 Activity/Step은 레이어로 변환되어 LayerController에 등록됩니다.
Overlay는 openedAt/order 기준, Activity/Step은 zIndex 기준으로 정렬됩니다.
back 동작은 overlay -> step -> activity 순서로 pop됩니다.

## 5) BackManager 흐름

BackManager는 레이어 결과가 exit일 때만 스택 히스토리를 변경합니다.
히스토리가 있으면 이전 스택으로, 없으면 init 스택으로 리셋합니다.
즉, 레이어가 먼저, 스택이 나중입니다.

## 6) Back 입력 브리지

브라우저 back이나 네이티브 back 입력은 `handleBackPress`로 전달됩니다.
이 브리지 덕분에 실제 페이지 이동 없이 Stackflow 내부 상태만 변경됩니다.

## 7) 데모 포인트

Home 화면의 flag 버튼으로 stack 재구성을 확인합니다.
Layer Devtools로 레이어 순서와 카운트를 즉시 확인하고,
Back 버튼으로 pop 흐름을 확인합니다.

## 8) 빠른 요약

Stackflow는 플러그인 중심의 스택 네비게이션이고,
navFlag는 push 전에 스택 재구성 규칙을 선언합니다.
LayerManager는 레이어 상태를 유지하고, BackManager는 pop의 최종 결정을 담당합니다.

