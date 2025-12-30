# 뎁스 렌더러 플러그인 적용 계획

이 문서는 “뎁스 렌더러 플러그인”을 도입하고,
깊이 조건에서 back 정책을 함께 정리하기 위한 적용 계획서다.

## 핵심 전제
- stackManager는 스택 인스턴스/활성 스택 전환만 관리하며, 스택 depth 자체에는 관여하지 않음.
- layerManager는 layerStackPlugin이 코어 스택을 읽어 복제한 프레임을 기준으로 상태/백키를 처리함.
- 렌더러에서 특정 depth 이하를 DOM에서 제외하면 언마운트는 가능하지만, 코어 스택/레이어 매니저의 논리적 히스토리는 그대로 남음.
- “깊이 넘으면 root로 점프”는 렌더러만으로 불가하고, onBeforePop에서 연속 pop/clear로 실제 스택을 줄여야 함.

## 목표
- depth 기준으로 렌더링을 줄여 DOM 언마운트를 유도한다.
- back 시 depth 임계점을 넘는 순간 root로 점프하는 정책을 적용한다.
- 기존 stackManager/layerManager 구조와 충돌 없이 동작하게 한다.

## 설계 방향
1) 뎁스 렌더러 플러그인
- 기본 renderer를 교체/래핑하여 `stack.render().activities`를 필터링한다.
- 예: `maxVisible = 5`이면 top 기준 최근 5개만 렌더.
- DOM에서 제거된 화면은 언마운트됨 (상태/스크롤 복원 손실 가능).
- `maxVisible`은 config로 주입하며, stack별 override를 지원한다.

2) back 정책 플러그인
- `onBeforePop`에서 depth 조건을 확인한다.
- 조건에 걸리면 `preventDefault()` 후 `dispatchEvent("Popped")`를 여러 번 호출하여 root로 이동.
- pop은 항상 top부터이므로, “중간만 제거”는 불가함을 전제로 한다.

## 변경 예상 위치
- 새 렌더러 플러그인: `src/plugins/depthRendererPlugin.tsx`
- back 정책 플러그인: `src/plugins/depthBackPolicyPlugin.ts`
- 플러그인 등록: `src/lib/stack/createStackflowInstance.ts`
- 문서 업데이트: `docs/stack-maxdepth-push-unmount-plan.md` 또는 관련 문서

## 단계별 계획
1. 렌더러 플러그인 초안 구현
   - depth 기준으로 렌더링 필터링
   - `exit-done` 제외 로직 유지
2. back 정책 플러그인 초안 구현
   - `onBeforePop`에서 depth 검사
   - 조건 충족 시 root까지 pop
3. 스택에 플러그인 적용
   - 기본 renderer 교체 또는 합성
4. UX 검증
   - depth가 커진 상태에서 back 흐름 확인
   - 리마운트 비용 및 체감 성능 확인

## TODO
- [ ] depth 렌더러 플러그인 API 정의 (`maxVisible`, `keepRoot`, stack별 설정 등)
- [ ] `depthRendererPlugin` 구현 및 등록
- [ ] `depthBackPolicyPlugin` 구현 및 등록
- [ ] back 시 root 점프 UX 검증
- [ ] 리마운트 비용 측정 및 기록 (`docs/perf-notes.md`)
