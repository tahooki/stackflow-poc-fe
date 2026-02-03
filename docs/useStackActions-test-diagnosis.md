# useStackActions 테스트 진단 (stackManager.getStack("home") 누락)

## 증상
- `ActionButton`에서 `useStackActions()`가 결국 `stackManager.getStack("home")`를 호출하는데, 스택이 없다고 에러가 발생함.
- 보통 **hook과 provider가 서로 다른 stackManager 인스턴스**를 보고 있거나, **다른 config로 생성된 stackManager**를 참조할 때 발생.

## 유력 원인 (우선순위 순)

1) **모듈 중복 로드 (import 경로 불일치)**
- `Cfg` 또는 `StackContext`가 서로 다른 경로로 import되어 모듈이 두 번 로드됨.
  - 예: `../config` vs `../../config/Cfg`, barrel export vs 직접 파일 경로
- 결과: provider는 A 인스턴스, hook은 B 인스턴스를 보고 있어 `Cfg.init()` 효과가 안 보임.

2) **테스트 간 전역 상태 오염**
- 다른 테스트 파일이 `Cfg`를 다른 설정으로 다시 초기화하거나 mocking함.
- `describe.sequential`은 파일 내부만 순차 실행이고, 다른 파일은 동시에 돌아갈 수 있음.
- 다른 테스트가 `home`이 없는 스택 설정으로 초기화하면 해당 테스트에서 실패.

3) **Provider의 stackManager 메모이제이션**
- `StackProvider`는 `useMemo(() => Cfg.getStack(), [])` 방식이라
  **provider가 마운트된 시점의 stackManager를 계속 유지**함.
- `Cfg.init()`이 **렌더 이후**에 호출되면 provider는 옛 인스턴스를 계속 사용.

4) **Config 불일치**
- `initStack` 또는 `stackList`에 `home`이 빠져 있는 경우.
- 타입상 `StackName`에 `home`이 있어도 실제 runtime config에 없으면 동일 증상.

5) **Mock 누수**
- 다른 테스트에서 `createStackflowInstance`나 `Cfg`를 mock하고
  reset/unmock가 제대로 안 되면 스택이 비어 있을 수 있음.

## 원인 좁히는 진단 포인트

렌더 직후 확인:
- `stackManagerRef?.getStackNames()`
- `Cfg.getStack().getStackNames()`
- `stackManagerRef === Cfg.getStack()`

이 값들이 다르면 **모듈 중복 로드** 또는 **전역 오염**이 거의 확실.

## 해결 옵션 (추천 순)

### A) 전역 싱글톤 강제 (가장 현실적)
- `globalThis.__STACKFLOW_CFG__`를 통해 항상 같은 `Cfg` 인스턴스를 사용.
- 이미 적용했다면, 다른 테스트에서 `Cfg`를 대체/재정의하지 않는지 확인 필요.

### B) import 경로 강제 통일
- 모든 곳에서 동일 경로만 사용 (alias 도입 권장):
  - 예: `@/config/Cfg`, `@/contexts/StackContext`
- barrel import와 직접 경로 섞어 쓰면 중복 로드 위험 큼.

### C) 테스트 파일 단위 Cfg 격리 (테스트 전용)
- 해당 테스트 파일에서 `Cfg`를 mock해서 새로운 인스턴스로 고정.
- 다른 테스트의 전역 변경 영향을 차단.

### D) Provider에 stackManager 주입 (코드 변경 필요)
- `StackProvider`에 `stackManager` prop 추가.
- 테스트에서 명시적으로 stackManager를 전달.
- 가장 깔끔하지만 프로덕션 코드 수정이 필요.

### E) Playwright로 E2E 전환
- 실제 브라우저 환경이라 모듈 중복 문제를 피하기 쉬움.
- 느리고 무겁지만 사용자 플로우 검증에 유리.

## 추천 흐름

1) `stackManagerRef === Cfg.getStack()` 먼저 확인.
2) 다르면 import 경로 통일 또는 전역 싱글톤 고정.
3) 같으면 config에 `home`이 포함됐는지 점검.
4) 그래도 안 되면 다른 테스트에서 전역 오염/모킹 발생 여부 확인.

