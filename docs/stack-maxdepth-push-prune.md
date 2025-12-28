# maxDepth + push 언마운트 삭제 설계

스택이 깊어질 때 성능 저하를 막기 위해, `maxDepth`를 넘기는 `push`가 발생하면
오래된 스택 항목을 언마운트 시점에 제거하는 옵션을 설계한다.

## 목표
- `maxDepth`를 초과하지 않도록 스택을 자동 정리한다.
- `push`는 유지하되, 삭제 시점을 안전하게 언마운트로 지연한다.
- 뒤로가기 UX를 예측 가능하게 유지한다.
- 플러그인으로 손쉽게 적용 가능하게 한다.

## 배경
일부 화면은 전환 중에도 스택에 남아 있어야 안전하다.
즉시 제거하면 전환 애니메이션이나 스크롤 복원에 영향을 줄 수 있다.
따라서 "지연 삭제" 정책이 필요하다.

## 핵심 아이디어
- `push`가 호출될 때 스택 길이가 `maxDepth`를 초과하면,
  제거 대상 항목을 선정한다.
- 제거는 즉시가 아니라 **대상 화면이 언마운트되는 시점**에 수행한다.
- 제거 대상은 "가장 오래된 화면"을 기본으로 한다.

## 용어
- `maxDepth`: 허용되는 최대 스택 깊이.
- `pruneOnUnmount`: 언마운트 시 삭제하도록 표시하는 옵션.
- `pruneTarget`: 삭제 대상 후보 화면.

## API 제안

### 옵션
```ts
type StackDepthPolicy = {
  maxDepth: number;
  pruneOnUnmount?: boolean;
  keepRoot?: boolean;
};
```

### 기본값
- `maxDepth`: 12
- `pruneOnUnmount`: true
- `keepRoot`: true

## 동작 규칙
1. `push` 이후 스택 길이 `> maxDepth`이면 초과분을 계산한다.
2. 초과분만큼 `pruneTarget`을 선정한다.
3. `pruneOnUnmount`가 true이면 `pruneTarget`을 "언마운트 시 삭제"로 마킹한다.
4. 실제 삭제는 해당 화면이 언마운트되는 순간 수행한다.

## 제거 대상 선정 규칙
- 기본: 가장 오래된 화면부터 선택.
- `keepRoot`가 true이면 root는 보호 대상.
- 제거 대상이 이미 `pruneTarget`으로 표시돼 있으면 중복 표시하지 않는다.

## 예시 시나리오
`maxDepth = 4`, `keepRoot = true`

스택:
`root` -> `A` -> `B` -> `C`

`push D` 결과:
- 스택 길이 5 (초과 1)
- 제거 대상: `A` (root 보호)
- `A`는 언마운트 시 삭제로 표시

## 언마운트 시점 정의
- Stackflow의 화면이 실제로 DOM에서 제거되는 순간.
- 트랜지션 중에는 제거하지 않는다.

## Edge Cases
- **연속 push**: 여러 화면이 연달아 `pruneTarget`이 될 수 있음.
- **replace**: replace는 스택 길이를 늘리지 않으므로 대상에서 제외.
- **pop**: pop으로 언마운트가 발생하면 마킹된 대상이 제거됨.
- **중간 화면 제거**: 중간 화면을 pop으로 제거해도 마킹된 항목만 제거.

## 데이터 구조 제안
```ts
type ActivityMeta = {
  id: string;
  markedForPrune?: boolean;
};
```

`markedForPrune`가 true면 언마운트 시 실제 스택에서 제거한다.

## 플러그인 연동 위치
- `onPush`: 초과 깊이 계산 및 `markedForPrune` 지정.
- `onUnmount`: `markedForPrune` true인 항목을 스택에서 제거.

## 구성 예시
```ts
createStackflow({
  plugins: [
    stackDepthPlugin({
      maxDepth: 12,
      pruneOnUnmount: true,
      keepRoot: true,
    }),
  ],
});
```

## 텔레메트리
- `stackDepth`
- `pruneMarkedCount`
- `pruneExecutedCount`
- `pruneReason: "maxDepth"`

## 테스트 시나리오
- `maxDepth` 초과 push 후 pop 동작 확인.
- 전환 중 화면이 제거되지 않는지 확인.
- root 보호 여부 확인.
- 연속 push에서 prune 대상 누적 확인.

## 다음 단계
- 실제 Stackflow 훅과 호환되는 플러그인 인터페이스 확정.
- `layerManager`와의 책임 분리 검토.
- 정책 값을 환경 설정으로 외부화.
