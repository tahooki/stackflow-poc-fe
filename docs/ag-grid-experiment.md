# AG Grid 기반 카드/테이블 토글 실험 (2025-02)

## 개요
React + Stackflow Playground 안에서 AG Grid의 표준 테이블 레이아웃과 카드형 커스텀 렌더링을 토글로 전환하는 실험입니다. 어드민 주문 Fulfillment 데이터를 예시로 하여 `Table`/`Card` 두 가지 보기 방식을 지원합니다.

- **Table 모드**: 기본 컬럼 정의(주문번호, 고객명, 품목 수, 총액, 상태, 생성일, ETA)를 그대로 사용하면서 정렬/필터/페이징 기능을 활성화합니다.
- **Card 모드**: AG Grid의 cellRenderer를 이용해 각 행을 카드 UI로 그립니다. 카드 헤더에는 상태 배지와 고객명만 간단히 보여주고, 펼칠 경우 상세 메타 정보를 노출합니다.

## 구현 파일
- `src/activities/AgGridActivity.tsx`
  - `viewMode` 상태로 테이블/카드 전환
  - `CardRenderer`에서 확장/축소 토글 상태 관리
  - `ModuleRegistry.registerModules([AllCommunityModule])`로 커뮤니티 기능 등록
- `src/assets/agGridActivity.css`
  - 토글 버튼 스타일 및 카드 레이아웃 정의
  - 카드 확장 시 강조 효과, 모드별 Grid 스킨 조정
- `src/activities/HomeActivity.tsx`
  - 홈 화면에서 `Try AG Grid card view` 버튼으로 `orders` 액티비티 푸시

## Stackflow 연동
`src/App.tsx`에서 새로운 라우트 `orders`를 등록했습니다. 기본 네비게이션 흐름 내에서 새 액티비티를 스택으로 추가할 수 있습니다.

## 카드 렌더링 전략
1. 카드의 초기 상태는 접힌( collapsed ) 상태로, 고객 이름과 주문 번호, ETA 등 핵심 메타데이터 중 일부만 표시합니다.
2. `Expand` 버튼 클릭 시 전체 주문 메모/금액 정보가 나타나면서 카드 테두리 강조.
3. 카드 뷰에서는 Grid 헤더와 기본 보더를 제거하여 일반 리스트처럼 보이도록 처리했습니다.

## 향후 개선 아이디어
- 데이터셋을 API 응답으로 교체해 실시간 필터/정렬 동작 검증
- 카드 내부에 CTA 버튼(예: 주문 처리, 메모 추가) 추가
- Stackflow 플러그인에서 활동 스택 깊이에 따른 성능 측정 로그 수집
- `viewMode`를 플러그인 state로 이동시켜, 다른 화면에서도 동일 모드 유지

## 테스트 & 빌드
- `npm run build` 통과 (Vite + TypeScript)
- `npm run lint`는 기존 `NFXStack`, `navFlagPlugin`의 lint 문제로 실패 (미해결)
