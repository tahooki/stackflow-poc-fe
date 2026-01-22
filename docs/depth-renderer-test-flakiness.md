# Depth Renderer Test Flakiness Notes

## 현상 요약

- 다른 프로젝트로 `src/tests/stackflow/depth-renderer.test.tsx`를 옮겨서 실행했을 때,
  `it("limits rendered activities to maxVisible", ...)` 테스트가 간헐적으로 실패한다.
- 동일 테스트만 남겨놓고 실행해도 통과/실패가 번갈아 나타난다.

## 관측된 에러 메시지

- `ReferenceError: Element is not defined`
- `This error originated in "src/.../depth-renderer.test.tsx" test file...`
  `This error was caught after test environment was torn down...`
  `Make sure to cancel any running tasks before test finishes...`

## 이해한 상태 (가능한 원인 범주)

- **DOM 환경 누락 가능성**: 옮겨간 프로젝트에서 테스트 환경이 `node`로 설정되어 있거나
  `jsdom` 설정이 누락되어 `global.Element`가 없어졌을 가능성이 있다.
  이 경우 DOM API를 참조하는 시점에 `Element is not defined`가 발생할 수 있다.
- **비동기 작업 잔존 가능성**: `instance.actions.push(...)` 이후 Stackflow 내부 또는
  렌더러 플러그인이 타이머/RAF/마이크로태스크 등을 예약하고, 테스트 종료 후에도
  비동기 작업이 남아 있어 teardown 이후 에러가 발생했을 수 있다.
- **레이스 컨디션**: 비동기 작업이 테스트 종료 전에 끝나면 통과하고,
  teardown 이후에 실행되면 실패하는 형태로 보인다.

## 현재 판단

- 에러가 "테스트 환경 teardown 이후"에 발생한다는 메시지로 보아
  **비동기 작업이 완전히 정리되지 않은 상태에서 테스트가 종료**되는 증상으로 이해된다.
- 동시에 `Element` 관련 에러가 보이는 점은 **테스트 환경 구성(jsdom/DOM globals)**
  문제도 함께 존재할 수 있음을 시사한다.

## 추가 추정 (가장 가능성이 높은 원인)

- **Stackflow 내부의 타이머 폴링**: `dispatchEvent` 시 `setInterval`로
  transition 상태를 폴링하는 구조가 있어, 테스트 종료 시점에 타이머가 남으면
  teardown 이후에도 실행될 수 있다. 이때 jsdom이 내려간 상태면 `Element` 참조가
  터지면서 플래키하게 실패한다. (타이머가 teardown 이전에 끝나면 통과)

## 빠른 확인 포인트 (재현/진단용)

- 테스트 시작 시 `globalThis.Element` 존재 여부 확인
- fake timers로 남은 타이머를 비우면 flake가 사라지는지 확인
- `globalTransitionState=idle`을 기다린 뒤 assertions 수행
