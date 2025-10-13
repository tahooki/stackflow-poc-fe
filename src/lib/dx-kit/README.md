# React DX-Kit

모바일 환경(특히 Galaxy Note20)을 우선 대상으로 하는 경량 DX(Developer eXperience) 도구 모음입니다.

## 📦 포함된 캡슐들

### 1. PerfHUD - 성능 모니터링
- **FPS**: requestAnimationFrame 기반 실시간 측정
- **JS Heap**: 메모리 사용량 추적 (Chrome/Android)
- **LongTask**: 50ms 초과 태스크 카운트
- **위치**: 우측 상단 (커스터마이징 가능)

```tsx
<PerfHUD position="top-right" danger={{ fps: 45, heapMB: 300 }} />
```

### 2. RerenderHeatmap - 리렌더 시각화
- **자동 플래시**: 리렌더 직후 1.2초간 파란 외곽선을 자동 표시
- **단축키**: Cmd/Ctrl + Shift + R로 전체 추적 대상을 동시에 플래시
- **배지**: 컴포넌트별 렌더 횟수 표시
- **Box 옵션**: `highlightOnMount`로 초기 렌더 하이라이트 여부 제어
- **커스터마이징**: `useRerenderFlash()`로 Box 없이도 직접 플래시 상태 제어

```tsx
<RerenderHeatmap />

// 가장 간단한 사용법
<Box label="MyComponent">
  {/* content */}
</Box>

// Box를 쓰기 어려운 경우
const { active, triggerFlash } = useRerenderFlash(800);
useEffect(() => {
  triggerFlash(); // rerender 시점에서 호출
}, [someSignal, triggerFlash]);
return (
  <div data-rerender={active ? "1" : undefined}>
    {/* content */}
  </div>
);
```

### 3. StateSnapshotPanel - 상태 스냅샷
- **저장**: 현재 상태를 타임스탬프와 함께 저장
- **복원**: 저장된 상태로 되돌아가기
- **위치**: 좌측 하단

```tsx
<StateSnapshotPanel max={10} />
```

### 4. LeakHUD - 메모리 누수 감지
- **추적**: WeakRef + FinalizationRegistry 사용
- **표시**: 언마운트 후 GC되지 않은 컴포넌트 표시
- **위치**: 좌측 상단

```tsx
<LeakHUD />

// 컴포넌트에서 사용
function MyComponent() {
  useLeakWatch("MyComponent");
  // ...
}
```

### 5. OccupancyHUD - 이벤트 점유율
- **측정**: render/commit/event/effect 시간 추적
- **분석**: 메인 스레드 점유율 상위 N개 표시
- **위치**: 좌측 중단

```tsx
<OccupancyHUD />

// HOC로 컴포넌트 래핑
const MyComponent = withRenderProfiler(MyComponentImpl, "MyComponent");

// 핸들러 계측
const handler = useInstrumentedHandler("MyComponent", () => {
  // ...
});

// Effect 계측
useTimedEffect("MyComponent", () => {
  // ...
}, [deps]);
```

### 6. JankAnalyzer - 스크롤 성능
- **감지**: 스크롤 중 프레임 드롭 자동 감지
- **표시**: jank 발생 위치에 빨간 선 오버레이
- **위치**: 우측 하단

```tsx
<JankAnalyzer threshold={0.2} />
```

## 🚀 사용 방법

```tsx
import {
  PerfHUD,
  RerenderHeatmap,
  StateSnapshotPanel,
  LeakHUD,
  OccupancyHUD,
  JankAnalyzer,
} from "./lib/dx-kit";

function App() {
  return (
    <>
      {process.env.NODE_ENV !== "production" && (
        <>
          <PerfHUD position="top-right" danger={{ fps: 45, heapMB: 300 }} />
          <RerenderHeatmap />
          <StateSnapshotPanel max={10} />
          <LeakHUD />
          <OccupancyHUD />
          <JankAnalyzer threshold={0.2} />
        </>
      )}
      {/* Your app */}
    </>
  );
}
```

## 💡 권장 임계값 (모바일/Note20)
- FPS Danger: **< 45**
- Heap Danger: **> 300MB**
- Event Occupancy 경고: **≥ 500ms/component (10초 윈도)**

## ⚠️ 주의사항
- 모든 캡슐은 **개발 환경 전용**입니다
- 프로덕션 빌드에서는 자동으로 제외되어야 합니다
- 대규모 리스트에는 섹션/루트 단위로만 계측 적용 권장

## 📖 더 자세한 내용
`DX-KIT.md` 참고
