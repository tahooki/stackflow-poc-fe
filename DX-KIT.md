# react-dx-lite: 개발 툴 캡슐 상세 스펙

본 문서는 **모바일(특히 Galaxy Note20)** 환경을 우선 대상으로 하는 경량 DX(Developer eXperience) 캡슐들의 상세 스펙을 정의합니다. 모든 캡슐은 `NODE_ENV !== 'production'`에서만 활성화되며, `?dx=1` 또는 로컬 스토리지 `dx=on`으로 토글할 수 있습니다. 프레임워크는 React 18 기준입니다.

---

## 공통 운영 규칙

- **활성화 조건**: `NODE_ENV !== 'production'` 또는 URL 쿼리 `?dx=1`
- **표시 방식**: 상단 HUD(고정 배치), 섹션 오버레이(일시 하이라이트), 컴포넌트 모서리 배지
- **성능 가이드**: 대규모 리스트/그리드에는 루트 섹션 단위로만 계측 부착(오버헤드 최소화)
- **권장 프리셋(모바일/Note20)**:

  - FPS Danger: **< 45**
  - Heap Danger: **> 300MB**
  - Event Occupancy 경고: 최근 10초 누적 **≥ 500ms/컴포넌트**

---

## 1) 초경량 퍼포먼스 HUD (모바일 최적)

**목표**: 실제 기기에서 FPS/Heap/LongTask/리렌더 등 핵심 지표를 실시간 확인하고, 임계 초과 시 즉시 시각 경고를 제공.

### 표시 지표

- **FPS**: `requestAnimationFrame` 기반 0.5~1.0s 샘플링
- **JS Heap(MB)**: `performance.memory.usedJSHeapSize`(지원 브라우저 한정)
- **Re-render/초**: 최근 1초 동안 감지된 렌더 수(선택적)
- **LongTask 카운트**: `PerformanceObserver('longtask')`

### UI/UX

- HUD 위치: `top-right` (옵션: 네 모서리)
- 임계치 초과 시 **배경색 경고** + 콘솔에 디버그 링크 남김(`console.info('[HUD] ...')`)
- 쿼리 토글: `?devhud=1`

### API 표면

```tsx
<PerfHUD
  position="top-right"
  danger={{ fps: 45, heapMB: 300 }}
  sampleMs={500}
/>
```

### 구현 포인트

- FPS: `requestAnimationFrame` 루프에서 샘플링 윈도우 단위로 평균 FPS 계산
- Heap: 크롬/안드로이드 등 지원 환경에서만 갱신(미지원 시 `N/A`)
- LongTask: 50ms 초과 태스크 수 카운트

### 한계

- Heap 수치는 브라우저 제한. 정확도 대신 **트렌드 확인** 용도로 사용
- FPS만으로 레이아웃/페인트 비용 분리 불가 → 다른 캡슐과 병행 사용 권장

### 테스트 체크리스트

- Note20 실기, 원격 디버깅(chrome://inspect)으로 Heap/FPS 변화 관찰
- 임계치 경고 색상 변화, 콘솔 링크 동작 확인

---

## 2) 리렌더 히트맵 토글

**목표**: 과도한 리렌더가 발생하는 지점을 빠르게 식별.

### 기능

- **단축키**: ⌘/Ctrl + Shift + R → 1~2초 동안 리렌더된 컴포넌트 외곽선 하이라이트
- **렌더 카운트 뱃지**: `useRenderCounter(label)`로 모서리에 렌더 횟수 표시
- **자동 팁**: 익명 함수/객체 props 전달, 과도한 context 범위 등 패턴 감지 시 HUD/툴팁 안내

### API 표면

```tsx
<RerenderHeatmap enabledShortcut />;
const c = useRenderCounter("UsersTable");
```

### 구현 포인트

- React Profiler 이벤트 또는 커스텀 렌더 카운터 훅으로 최근 렌더 여부 플래그 저장
- 하이라이트는 CSS outline/box-shadow를 1~2초 적용

### 한계

- 대규모 리스트 전체 아이템 계측은 오버헤드 ↑ → 상위 섹션/루트에만 적용

### 테스트 체크리스트

- 단축키 토글 동작, 외곽선/뱃지 표시 타이밍 검증
- 팁 노출 조건(익명 핸들러/객체) 유효성 확인

---

## 3) 상태 스냅샷 & 복원(오류 재현)

**목표**: QA/버그 재현을 버튼 한 번으로. 동일 화면과 상태를 즉시 복원.

### 지원 스토어

- Redux / Zustand / Recoil(어댑터 제공)

### 기능

- **스냅샷 저장/로드 패널**: 최근 N개 스냅샷(타임스탬프/라우트 포함)
- **에러 오버레이 연동**: "이 스냅샷으로 다시 열기" 버튼
- **이벤트/라우트 이력**: 최근 10~20개 사용자 이벤트(선택) 동봉

### API 표면

```tsx
<StateSnapshotPanel adapters={["redux", "zustand"]} max={10} />
```

### 구현 포인트

- 각 스토어 별 직렬화/역직렬화 util 제공
- 민감 정보 마스킹 규칙(키명/경로 기반) 적용 옵션

### 한계

- 직렬화 불가한 리소스(함수/소켓/AbortSignal 등)는 참조만 기록하거나 제외

### 테스트 체크리스트

- 다양한 라우트/상태 조합 스냅샷 저장→복원 → UI 동일성 확인
- 에러 발생 시 오버레이에서 복원 버튼 동작

---

## 4) 메모리 누수 가시화 (Leak Watch)

**목표**: 언마운트 후에도 GC되지 않는 인스턴스 감지, 누수 의심 신호 시각화.

### 지표/표시

- **Leak Score(60s)**: 최근 60초간 언마운트했지만 GC 미발생 인스턴스 수
- **Alive Timeline**: 레이블별 인스턴스 카운트 추이
- **LEAK? 배지**: 컴포넌트 모서리에 점등(언마운트 + N초 경과 + finalize 없음)
- **원인 힌트**: timers/listeners/sockets 미정리 카운트

### API 표면

```tsx
const { trackInterval, trackListener, trackSocket } =
  useLeakWatch("UsersTable");
<LeakHUD position="top-right" graceMs={15000} />;
```

### 구현 포인트

- 각 인스턴스에 고유 토큰 부여 → `WeakRef` 보관, `FinalizationRegistry` 등록
- 언마운트 시각 기록, **grace 기간** 경과에도 finalize 이벤트 없으면 suspected++
- 리소스 추적 헬퍼(`trackInterval`, `trackListener`)로 미정리 흔적 시각화

### 한계

- GC 타이밍은 비결정적 → 지표는 **의심 신호**로 사용(확정적 누수 단정 금지)

### 테스트 체크리스트

- 페이지 이동/탭 전환/리스트 진입·이탈 반복 → suspected 감소 여부 확인
- 타이머/리스너 정리 누락 시 카운트 증가 확인

---

## 5) 이벤트 점유율 가시화 (Event Occupancy)

**목표**: 메인 스레드 시간을 많이 소비하는 컴포넌트를 식별.

### 수집 축

- **renderMs**: React Profiler `actualDuration`
- **commitMs**: `commitTime - startTime - renderMs`(근사)
- **eventMs**: onClick/onChange 등 동기 핸들러 실행 시간
- **effectMs**: `useEffect`/`useLayoutEffect` 실행 및 cleanup 시간
- **가중 감쇄 윈도**: 최근 10초(새 이벤트일수록 가중 ↑)

### HUD 표시

- 레이블별 총 점유 ms 상위 N 표시 + 분해 항목(render/commit/event/effect)
- 임계치(예: 10초 윈도 누적 ≥ 500ms) 초과 시 붉은 경고

### API 표면

```tsx
const Panel = withRenderProfiler(PanelImpl, "UsersPanel");
const onChange = useInstrumentedHandler("UsersPanel", "change", handler);
useTimedEffect("UsersPanel", effect, [deps]);
<OccupancyHUD dangerTotalMs={500} />;
```

### 구현 포인트

- 핸들러/이펙트 래핑으로 동기 구간 시간 측정
- LongTask 브리지(선택): 50ms 초과 태스크를 최근 스코프에 귀속(힌트 용도)

### 한계

- 렌더 외 브라우저 레이아웃/페인트 비용은 직접 분리 불가(별도 CSS/레이아웃 캡슐과 병행 권장)

### 테스트 체크리스트

- 무거운 필터/정렬 조작 시 해당 레이블의 event/effect 상승 확인
- 최적화(알고리즘/워커 오프로드) 후 지표 하락 확인

---

## 6) Scroll Jank Analyzer (모바일 특화)

**목표**: 스크롤 중 drop frame이 발생하는 구간 자동 검출/시각화.

### 탐지/표시

- `event.timeStamp` 간 간격Δ와 RAF 타임라인으로 dropped frame 추정
- 특정 섹션에서 jank↑ 시 **일시 빨간 라인 오버레이** + HUD에 섹션/시간대 표기

### API 표면

```tsx
<JankAnalyzer sections={["#list", "#detail"]} threshold={0.2} />
```

### 구현 포인트

- 스크롤 이벤트 쓰로틀(예: 50~100ms) 및 RAF 수집 병행
- 사용자가 머무르는 섹션 ID를 IntersectionObserver로 추정하여 귀속

### 한계

- 스크롤 이벤트 손실/브라우저 최적화로 완전한 프레임 드롭 수치는 아님(정성 지표)

### 테스트 체크리스트

- 이미지 로딩/레이아웃 시프트가 큰 섹션에서 오버레이 점등 확인
- `content-visibility`, `contain`, 이미지 사이즈 최적화 후 개선 확인

---

## 통합 사용 예시

```tsx
import {
  DXScope,
  PerfHUD,
  RerenderHeatmap,
  StateSnapshotPanel,
  LeakHUD,
  OccupancyHUD,
  JankAnalyzer,
} from "react-dx-lite";

export default function App() {
  return (
    <DXScope
      capsules={[
        "perfHUD",
        "rerender",
        "snapshot",
        "leak",
        "occupancy",
        "jank",
      ]}
    >
      <PerfHUD position="top-right" danger={{ fps: 45, heapMB: 300 }} />
      <RerenderHeatmap enabledShortcut />
      <StateSnapshotPanel adapters={["redux", "zustand"]} />
      <LeakHUD position="top-right" graceMs={15000} />
      <OccupancyHUD dangerTotalMs={500} />
      <JankAnalyzer sections={["#list", "#detail"]} threshold={0.2} />
      {/* App Routes */}
    </DXScope>
  );
}
```

---

## 도입 로드맵(권장)

1. **PerfHUD + RerenderHeatmap** → 즉시 체감/가시성 확보
2. **LeakHUD + Snapshot** → 재현성/누수 대응 체계화
3. **OccupancyHUD + JankAnalyzer** → 입력/스크롤 품질 안정화

---

## 라이선스 및 배포 가이드(초안)

- 라이선스: MIT(초안)
- 패키징: `react-dx-lite`(core) + `capsule-*`(서브 패키지)
- 트리셰이킹: 프로덕션 번들에서 캡슐 코드 제거(`process.env.NODE_ENV` 분기)
- 템플릿: Next/Vite 스타터 제공(POC 시드)

---

## 부록: 정책/보안

- 수집 데이터는 기본적으로 **로컬 메모리**에서만 유지. 외부 전송은 기본 **비활성**.
- 에러/스냅샷 내 개인 정보 마스킹 규칙 제공(키 블록 리스트).

---

# 각 캡슐 핵심 구현 예제 (POC 수준)

> 모든 코드는 **dev 전용**입니다. 성능 오버헤드를 줄이기 위해 대규모 리스트 전체보다는 섹션/루트 수준에 붙이는 것을 권장합니다.

## 1) PerfHUD — FPS/Heap/LongTask 미니 구현

```tsx
// PerfHUD.tsx
import React, { useEffect, useRef, useState } from "react";

function useFps(sampleMs = 500) {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const t0 = useRef(performance.now());
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      frames.current++;
      if (now - t0.current >= sampleMs) {
        setFps(Math.round((frames.current * 1000) / (now - t0.current)));
        frames.current = 0;
        t0.current = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sampleMs]);
  return fps;
}

function useHeapMB() {
  const [mb, setMb] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      const m: any = (performance as any).memory;
      if (m?.usedJSHeapSize)
        setMb(Math.round(m.usedJSHeapSize / (1024 * 1024)));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return mb;
}

function useLongTasks() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;
    try {
      const obs = new PerformanceObserver((list) => {
        setCount((c) => c + list.getEntries().length);
      });
      // @ts-ignore
      obs.observe({ type: "longtask", buffered: true });
      return () => obs.disconnect();
    } catch {}
  }, []);
  return count;
}

export function PerfHUD({
  danger = { fps: 45, heapMB: 300 },
  position = "top-right" as const,
}) {
  const fps = useFps();
  const heap = useHeapMB();
  const longTasks = useLongTasks();
  const dangerOn = (fps && fps < danger.fps) || (heap && heap > danger.heapMB);
  const pos = {
    "top-left": { top: 10, left: 10 },
    "top-right": { top: 10, right: 10 },
    "bottom-left": { bottom: 10, left: 10 },
    "bottom-right": { bottom: 10, right: 10 },
  }[position];

  useEffect(() => {
    if (dangerOn) console.info("[PerfHUD] danger", { fps, heap });
  }, [dangerOn]);

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 2147483647,
        padding: "6px 8px",
        borderRadius: 8,
        font: "12px ui-monospace,monospace",
        background: dangerOn ? "rgba(220,38,38,.9)" : "rgba(0,0,0,.75)",
        color: "#fff",
        boxShadow: "0 4px 18px rgba(0,0,0,.2)",
        ...pos,
      }}
    >
      <div>FPS: {fps}</div>
      <div>Heap: {heap ? `${heap}MB` : "N/A"}</div>
      <div>LongTasks: {longTasks}</div>
    </div>
  );
}
```

## 2) Rerender Heatmap — 외곽선/배지 표시

```tsx
// rerender-heatmap.tsx
import React, { useEffect, useRef, useState } from "react";

const bus = { lastRenders: new WeakMap<object, number>() };

export function useRenderCounter(label?: string) {
  const token = useRef({});
  const [count, setCount] = useState(0);
  useEffect(() => {
    const now = performance.now();
    bus.lastRenders.set(token.current, now);
    setCount((c) => c + 1);
  });
  return { count, label };
}

export function RerenderBadge({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 4,
        right: 4,
        background: "rgba(0,0,0,.6)",
        color: "#fff",
        padding: "2px 6px",
        borderRadius: 6,
        font: "11px ui-monospace,monospace",
        pointerEvents: "none",
      }}
    >
      {label} · {count}
    </div>
  );
}

export function RerenderHeatmap({
  enabledShortcut = true,
}: {
  enabledShortcut?: boolean;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!enabledShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = (e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyR";
      if (mod) {
        setOn(true);
        setTimeout(() => setOn(false), 1500);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabledShortcut]);

  useEffect(() => {
    if (!on) return;
    const sheets = new CSSStyleSheet();
    sheets.replaceSync(
      `*[data-rerender="1"]{outline:2px solid rgba(59,130,246,.9)!important;outline-offset:2px;border-radius:6px}`
    );
    // @ts-ignore
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheets];
    const id = setTimeout(() => {
      // @ts-ignore
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s: any) => s !== sheets
      );
    }, 1500);
    return () => clearTimeout(id);
  }, [on]);

  return null;
}

// 사용 예: 컴포넌트 루트 div에 data-rerender 바인딩
export function Box({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { count } = useRenderCounter(label);
  return (
    <div data-rerender={1} style={{ position: "relative" }}>
      <RerenderBadge label={label} count={count} />
      {children}
    </div>
  );
}
```

## 3) 상태 스냅샷 — Redux/Zustand 어댑터 예제

```tsx
// snapshot-panel.tsx
import React, { useState } from "react";
import { useStore as useZustandStore } from "zustand"; // 선택
import { useSelector } from "react-redux"; // 선택

type Snap = { id: string; at: number; route?: string; data: any };

export function StateSnapshotPanel({
  adapters = ["redux"] as ("redux" | "zustand")[],
  max = 10,
}) {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const reduxState = adapters.includes("redux") ? useSelector((s) => s) : null;
  const zustandState = adapters.includes("zustand")
    ? useZustandStore((s) => s)
    : (null as any);

  const capture = () => {
    const data = { redux: reduxState, zustand: zustandState };
    const snap: Snap = {
      id: Math.random().toString(36).slice(2),
      at: Date.now(),
      route: location.pathname,
      data,
    };
    setSnaps((arr) => [snap, ...arr].slice(0, max));
  };

  const restore = (snap: Snap) => {
    // 실제 프로젝트에선 각 스토어 set/dispatch 로 복원
    console.info(
      "[Snapshot] restore needed → wire into redux/zustand setters",
      snap
    );
    alert("복원 훅에 연결 필요: 콘솔 참고");
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 10,
        bottom: 10,
        background: "rgba(0,0,0,.7)",
        color: "#fff",
        padding: 8,
        borderRadius: 8,
        font: "12px ui-monospace,monospace",
        zIndex: 2147483647,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Snapshots</div>
      <button onClick={capture}>Save</button>
      <ul style={{ maxHeight: 160, overflow: "auto", marginTop: 6 }}>
        {snaps.map((s) => (
          <li key={s.id} style={{ marginBottom: 6 }}>
            <code>
              {new Date(s.at).toLocaleTimeString()} · {s.route}
            </code>
            <button onClick={() => restore(s)} style={{ marginLeft: 6 }}>
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 4) Leak Watch — WeakRef + FinalizationRegistry

```tsx
// leak-watch.ts
class LeakTracker {
  registry?: FinalizationRegistry<string>;
  items = new Map<
    string,
    { label: string; unmountedAt?: number; finalizedAt?: number }
  >();
  constructor() {
    if (typeof FinalizationRegistry !== "undefined") {
      this.registry = new FinalizationRegistry((id) => {
        const it = this.items.get(id);
        if (it) it.finalizedAt = performance.now();
      });
    }
  }
  create(label: string) {
    const id = `${label}#${Math.random().toString(36).slice(2)}`;
    const token = { id };
    this.items.set(id, { label });
    this.registry?.register(token, id);
    return {
      id,
      onUnmount: () => {
        const it = this.items.get(id);
        if (it) it.unmountedAt = performance.now();
      },
    };
  }
  snapshot(graceMs = 15000) {
    const now = performance.now();
    const by: Record<string, { alive: number; suspected: number }> = {};
    for (const [id, it] of this.items) {
      const key = it.label;
      by[key] ??= { alive: 0, suspected: 0 };
      by[key].alive++;
      if (it.unmountedAt && !it.finalizedAt && now - it.unmountedAt > graceMs)
        by[key].suspected++;
    }
    return by;
  }
}
export const leakTracker = new LeakTracker();

import React, { useEffect, useRef, useState } from "react";
export function useLeakWatch(label: string) {
  const handle = useRef(leakTracker.create(label));
  useEffect(() => () => handle.current.onUnmount(), []);
}

export function LeakHUD() {
  const [snap, setSnap] = useState(leakTracker.snapshot());
  useEffect(() => {
    const id = setInterval(() => setSnap(leakTracker.snapshot()), 1000);
    return () => clearInterval(id);
  }, []);
  const rows = Object.entries(snap)
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.suspected - a.suspected)
    .slice(0, 6);
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "rgba(0,0,0,.75)",
        color: "#fff",
        padding: 8,
        borderRadius: 8,
        font: "12px ui-monospace,monospace",
        zIndex: 2147483647,
      }}
    >
      <div style={{ fontWeight: 700 }}>Leak Watch</div>
      {rows.map((r) => (
        <div key={r.label}>
          {r.label}: alive {r.alive} ·{" "}
          {r.suspected > 0 ? `LEAK? ${r.suspected}` : "ok"}
        </div>
      ))}
    </div>
  );
}
```

## 5) Event Occupancy — 렌더/이벤트/이펙트 시간 합산

```tsx
// occupancy.tsx
import React, { Profiler, useCallback, useEffect, useState } from "react";

const store = new Map<
  string,
  { render: number; commit: number; event: number; effect: number; ts: number }
>();
const add = (k: string, f: keyof ReturnType<typeof getZero>, ms: number) => {
  const v = store.get(k) ?? getZero();
  v[f] += ms;
  v.ts = performance.now();
  store.set(k, v);
};
function getZero() {
  return { render: 0, commit: 0, event: 0, effect: 0, ts: performance.now() };
}

export function withRenderProfiler<P>(
  Comp: React.ComponentType<P>,
  label?: string
) {
  const name = label ?? Comp.displayName ?? Comp.name ?? "Component";
  return (props: P) => (
    <Profiler
      id={name}
      onRender={(id, phase, actualDuration, baseDuration, start, commit) => {
        add(id, "render", actualDuration);
        add(id, "commit", Math.max(0, commit - start - actualDuration));
      }}
    >
      <Comp {...props} />
    </Profiler>
  );
}

export function useInstrumentedHandler<T extends (...a: any[]) => any>(
  label: string,
  fn: T
): T {
  return useCallback(
    ((...args: any[]) => {
      const t0 = performance.now();
      try {
        return fn(...args);
      } finally {
        add(label, "event", performance.now() - t0);
      }
    }) as any,
    [label, fn]
  ) as T;
}

export function useTimedEffect(
  label: string,
  cb: React.EffectCallback,
  deps: any[]
) {
  useEffect(() => {
    const t0 = performance.now();
    let clean: any;
    try {
      clean = cb();
    } finally {
      add(label, "effect", performance.now() - t0);
    }
    return () => {
      const c0 = performance.now();
      clean?.();
      add(label, "effect", performance.now() - c0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function OccupancyHUD() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    const id = setInterval(() => {
      const snap = Array.from(store.entries())
        .map(([k, v]) => ({
          label: k,
          total: v.render + v.commit + v.event + v.effect,
          ...v,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);
      setRows(snap);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        background: "rgba(0,0,0,.75)",
        color: "#fff",
        padding: 8,
        borderRadius: 8,
        font: "12px ui-monospace,monospace",
        zIndex: 2147483647,
        minWidth: 260,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        Event Occupancy (≈10s)
      </div>
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{r.label}</span>
            <b>{Math.round(r.total)}ms</b>
          </div>
          <small>
            render {Math.round(r.render)} · commit {Math.round(r.commit)} ·
            event {Math.round(r.event)} · effect {Math.round(r.effect)}
          </small>
        </div>
      ))}
    </div>
  );
}
```

## 6) Scroll Jank Analyzer — 드랍 프레임 구간 표시

```tsx
// jank-analyzer.tsx
import React, { useEffect, useRef, useState } from "react";

type Hit = { at: number; y: number };
export function JankAnalyzer({ threshold = 0.2 }: { threshold?: number }) {
  const [hits, setHits] = useState<Hit[]>([]);
  const last = useRef({ t: performance.now(), y: window.scrollY });
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = now - last.current.t; // ms
      const dy = Math.abs(window.scrollY - last.current.y);
      last.current = { t: now, y: window.scrollY };
      // 드랍 추정: dt가 16.7ms* (1+threshold) 보다 크게 튀면 hit
      if (dt > 16.7 * (1 + threshold))
        setHits((h) => [...h.slice(-49), { at: now, y: window.scrollY }]);
    };
    const loop = (t: number) => {
      prev = t;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return (
    <>
      {hits.slice(-5).map((h, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: h.y,
            left: 0,
            right: 0,
            height: 2,
            background: "rgba(239,68,68,.8)",
            pointerEvents: "none",
          }}
        />
      ))}
      <div
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          background: "rgba(0,0,0,.7)",
          color: "#fff",
          padding: 6,
          borderRadius: 6,
          font: "12px ui-monospace,monospace",
        }}
      >
        Jank hits: {hits.length}
      </div>
    </>
  );
}
```

---

## 통합 사용 예 (App 레벨)

```tsx
// App.tsx (예시)
import React from "react";
import { PerfHUD } from "./PerfHUD";
import { RerenderHeatmap, Box } from "./rerender-heatmap";
import { StateSnapshotPanel } from "./snapshot-panel";
import { LeakHUD, useLeakWatch } from "./leak-watch";
import {
  OccupancyHUD,
  withRenderProfiler,
  useInstrumentedHandler,
  useTimedEffect,
} from "./occupancy";
import { JankAnalyzer } from "./jank-analyzer";

function UsersPanelImpl() {
  useTimedEffect(
    "UsersPanel",
    () => {
      /* 비싼 동기 계산 등 */
    },
    []
  );
  const onChange = useInstrumentedHandler("UsersPanel", () => {
    /* ... */
  });
  useLeakWatch("UsersPanel");
  return (
    <Box label="UsersPanel">
      <input onChange={onChange} />
    </Box>
  );
}
const UsersPanel = withRenderProfiler(UsersPanelImpl, "UsersPanel");

export default function App() {
  return (
    <>
      {process.env.NODE_ENV !== "production" && (
        <>
          <PerfHUD danger={{ fps: 45, heapMB: 300 }} />
          <RerenderHeatmap enabledShortcut />
          <StateSnapshotPanel adapters={["redux", "zustand"]} />
          <LeakHUD />
          <OccupancyHUD />
          <JankAnalyzer threshold={0.2} />
        </>
      )}
      <UsersPanel />
    </>
  );
}
```
