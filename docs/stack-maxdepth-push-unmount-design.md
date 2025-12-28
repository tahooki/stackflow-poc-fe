# maxDepth + push 언마운트 삭제 옵션 설계서

`push`로 스택이 `maxDepth`를 초과할 때, 오래된 화면을 즉시 제거하지 않고
언마운트 시점에 안전하게 삭제하는 옵션을 정의한다.

## 목표
- 스택 깊이를 `maxDepth` 이하로 유지한다.
- 전환 중에는 화면을 제거하지 않는다.
- 뒤로가기 UX를 예측 가능하게 보존한다.
- 플러그인으로 간단히 적용 가능하게 한다.

## 핵심 개념
- `push`가 스택 길이를 초과시키면 제거 대상을 선정한다.
- 제거 대상은 "언마운트 시 삭제" 상태로 마킹한다.
- 실제 삭제는 해당 화면의 언마운트 이벤트에서 수행한다.

## 옵션 제안
```ts
type StackDepthOptions = {
  maxDepth: number;
  pruneOnUnmountOnPush?: boolean;
  keepRoot?: boolean;
  selectTarget?: "oldest" | "oldest-non-root";
};
```

기본값
- `maxDepth`: 12
- `pruneOnUnmountOnPush`: true
- `keepRoot`: true
- `selectTarget`: "oldest-non-root"

## 동작 규칙
1. `push` 직후 스택 길이를 계산한다.
2. 스택 길이 `> maxDepth`이면 초과 개수를 구한다.
3. 초과 개수만큼 제거 대상을 선택하고 마킹한다.
4. 마킹된 화면이 언마운트될 때 실제 삭제한다.

## 제거 대상 선정 규칙
- 기본: 가장 오래된 항목부터 선택.
- `keepRoot`가 true이면 root는 제외.
- 이미 마킹된 항목은 중복 마킹하지 않는다.

## 언마운트 기준
- 전환 애니메이션이 끝나고 DOM에서 제거되는 시점.
- 트랜지션 중에는 삭제하지 않는다.

## 예시 흐름
`maxDepth = 4`, `keepRoot = true`

스택: `root` -> `A` -> `B` -> `C`

`push D`:
- 길이 5 (초과 1)
- 제거 대상: `A`
- `A`는 언마운트 시 삭제로 마킹

## Edge Cases
- 연속 `push`: 여러 항목이 마킹될 수 있다.
- `replace`: 스택 길이를 늘리지 않으므로 대상에서 제외.
- `pop`: 마킹된 항목이 언마운트될 때 삭제.
- 중간 pop: pop 대상이 마킹이 아니면 삭제하지 않는다.

## 데이터 구조 예시
```ts
type ActivityMeta = {
  id: string;
  markedForPrune?: boolean;
  pruneReason?: "maxDepth";
};
```

## 플러그인 훅 제안
- `onPush`: 초과 계산 + 마킹
- `onUnmount`: 마킹 확인 후 실제 제거

## 텔레메트리
- `stackDepth`
- `pruneMarkedCount`
- `pruneExecutedCount`
- `pruneReason`

## 테스트 체크리스트
- `maxDepth` 초과 push 후 pop 시 정상 삭제
- 전환 중 삭제가 발생하지 않음
- root 보호 동작 확인
- 연속 push 시 마킹 누적 확인

## 확장 포인트
- 화면별 `noPrune` 플래그 지원
- 깊이별 다른 삭제 정책 지원
- 사용자 설정으로 `maxDepth` 조정
