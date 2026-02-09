# Stack Flag 3종 정리

현재 프로젝트에서 핵심으로 사용하는 플래그 3가지만 정리합니다.

- `SINGLE_TOP`
- `CLEAR_TOP`
- `CLEAR_STACK`

## 한눈에 보기

| Flag | 어떤 동작인가 | 언제 사용하나 |
| --- | --- | --- |
| `SINGLE_TOP` | 현재 top 화면과 같은 화면으로 이동 요청 시, 새로 쌓지 않고 top을 `replace`로 갱신 | 같은 화면 중복 적재를 막고 싶을 때 (연타, 재진입) |
| `CLEAR_TOP` | 스택 안에 대상 화면이 있으면 그 위를 `pop`하고 대상으로 복귀(`replace`), 없으면 일반 `push` | 이미 열린 화면으로 돌아가면서 중간 화면 정리하고 싶을 때 |
| `CLEAR_STACK` | 현재 스택을 전부 비우고 새 화면 하나만 `push` | 로그인/결제 완료 후 흐름 초기화처럼 이전 히스토리를 버려야 할 때 |

## 1) SINGLE_TOP

### 동작
- 요청한 화면이 현재 top과 같으면 새 화면을 쌓지 않습니다.
- 대신 top 화면을 `replace`해서 params만 갱신합니다.
- top이 다르면 일반 `push`처럼 새 화면을 쌓습니다.

### 언제 사용
- 같은 버튼을 여러 번 눌러 중복 화면이 쌓이는 것을 막고 싶을 때
- "같은 화면 재진입 + 데이터만 갱신" 패턴이 필요할 때

### 예시
```ts
push("detail", {
  params: { id: "42" },
  flag: new StackFlagSingleTop(),
});
```

## 2) CLEAR_TOP

### 동작
- 스택 내부에 대상 activity가 있으면, 그 위에 쌓인 화면을 모두 제거(`pop`)합니다.
- 그 다음 대상 화면으로 복귀(`replace`)합니다.
- 대상이 스택에 없으면 요청한 화면을 일반 `push`합니다.

### 언제 사용
- "이미 열려 있는 특정 화면"으로 되돌아가고 싶을 때
- 중간 단계 화면들을 정리해 스택을 깔끔하게 유지하고 싶을 때

### 예시
```ts
push("detail", {
  params: { id: "42", title: "Reused via CLEAR_TOP" },
  flag: new StackFlagClearTop("detail"),
});
```

## 3) CLEAR_STACK

### 동작
- 현재 스택을 전부 제거(`pop`)한 뒤
- 요청한 화면 하나만 새로 `push`합니다.

### 언제 사용
- 이전 흐름으로 뒤로 가면 안 되는 경우
- 세션 리셋, 온보딩 종료, 주문 완료 후 홈 복귀 같은 "흐름 초기화" 시나리오

### 예시
```ts
push("home", {
  params: { highlight: "Returned via CLEAR_STACK" },
  flag: new StackFlagClearStack(),
});
```

## 선택 가이드

- **중복 방지**가 목적이면: `SINGLE_TOP`
- **중간 화면 정리 + 특정 화면 복귀**가 목적이면: `CLEAR_TOP`
- **이전 히스토리 전체 폐기**가 목적이면: `CLEAR_STACK`

## 참고 코드

- 플래그 구현: `src/plugins/stackFlagPlugin.ts`
- 호출 API: `src/hooks/useStackActions.ts`
- 사용 예시:
  - `src/activities/HomeActivity.tsx`
  - `src/activities/DetailActivity.tsx`
  - `src/activities/ModalLabActivity.tsx`
