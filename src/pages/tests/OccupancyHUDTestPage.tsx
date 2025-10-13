import { useState } from "react";
import { Link } from "react-router-dom";
import {
  OccupancyHUD,
  withRenderProfiler,
  useInstrumentedHandler,
  useTimedEffect,
} from "../../lib/dx-kit";
import "../PlaceholderPage.css";

/**
 * # OccupancyHUD 이벤트 점유율 분석 테스트 페이지
 *
 * ## 개요
 * OccupancyHUD는 React 컴포넌트의 렌더/커밋/이벤트/이펙트가 얼마나 많은 시간을 차지하는지
 * 실시간으로 추적하여 성능 병목을 찾아내는 도구입니다.
 *
 * ### 핵심 개념
 *
 * #### 1. Render Time (렌더 시간)
 * - 컴포넌트가 React 요소를 생성하는 데 걸리는 시간
 * - React.Profiler의 `actualDuration`으로 측정
 * - 복잡한 JSX, 많은 하위 컴포넌트일수록 증가
 *
 * #### 2. Commit Time (커밋 시간)
 * - React가 DOM을 실제로 업데이트하는 시간
 * - `start`부터 `commit`까지의 시간에서 render 시간을 뺀 값
 * - DOM 조작이 많을수록 증가
 *
 * #### 3. Event Time (이벤트 시간)
 * - 이벤트 핸들러 실행에 걸린 총 시간
 * - onClick, onChange 등의 핸들러를 계측
 * - 무거운 동기 작업이 있으면 증가
 *
 * #### 4. Effect Time (이펙트 시간)
 * - useEffect 콜백 실행에 걸린 총 시간
 * - 마운트, 업데이트, 언마운트 모두 포함
 * - API 호출, 데이터 처리 등으로 증가
 *
 * ### HUD 표시 정보
 * - 좌측 중단에 고정된 패널로 표시
 * - 상위 8개 컴포넌트를 총 점유 시간 순으로 정렬
 * - 각 컴포넌트별로 render/commit/event/effect 시간을 ms 단위로 표시
 * - 약 10초간의 누적 시간을 추적 (정확한 기간은 구현에 따라 다름)
 *
 * ## API
 *
 * ```typescript
 * // 1. Render 시간 측정
 * const ProfiledComponent = withRenderProfiler(MyComponent, "MyComponent");
 *
 * // 2. 이벤트 핸들러 시간 측정
 * const handleClick = useInstrumentedHandler("MyComponent", () => {
 *   // 핸들러 로직
 * });
 *
 * // 3. Effect 시간 측정
 * useTimedEffect("MyComponent", () => {
 *   // 이펙트 로직
 * }, [deps]);
 *
 * // 4. HUD 표시
 * <OccupancyHUD />
 * ```
 *
 * ## 테스트 시나리오
 *
 * ### 시나리오 1: Render 시간 측정
 * - 복잡한 JSX를 렌더링하는 컴포넌트
 * - 많은 자식 컴포넌트를 가진 컴포넌트
 *
 * ### 시나리오 2: Event 시간 측정
 * - 무거운 계산을 수행하는 이벤트 핸들러
 * - 여러 핸들러가 연속으로 실행되는 경우
 *
 * ### 시나리오 3: Effect 시간 측정
 * - 데이터 처리를 수행하는 이펙트
 * - 외부 라이브러리 초기화 이펙트
 *
 * ### 시나리오 4: 통합 점유율 분석
 * - 여러 컴포넌트가 동시에 작동
 * - 어떤 컴포넌트가 가장 많은 시간을 차지하는지 비교
 *
 * ## 최적화 가이드
 * - **Render 높음**: React.memo, useMemo, 컴포넌트 분할 고려
 * - **Event 높음**: 무거운 작업을 Web Worker로 이동, debounce/throttle 적용
 * - **Effect 높음**: 비동기 처리, 지연 로딩, 조건부 실행 고려
 * - **Commit 높음**: DOM 조작 최소화, 가상화 (virtualization) 적용
 */

// 시나리오 1: Heavy Render
function HeavyRenderComponent({ complexity }: { complexity: number }) {
  // 복잡한 렌더링
  const items = Array.from({ length: complexity * 10 }, (_, i) => i);

  return (
    <div
      style={{
        padding: 16,
        background: "#dbeafe",
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <h3>Heavy Render Component</h3>
      <p>Complexity: {complexity}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 4,
        }}
      >
        {items.map((i) => (
          <div
            key={i}
            style={{
              padding: 4,
              background: "#3b82f6",
              color: "#fff",
              fontSize: 10,
              borderRadius: 2,
            }}
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}

const ProfiledHeavyRender = withRenderProfiler(
  HeavyRenderComponent,
  "HeavyRender"
);

// 시나리오 2: Heavy Event
function HeavyEventComponent() {
  const [count, setCount] = useState(0);

  // 무거운 이벤트 핸들러
  const handleLightClick = useInstrumentedHandler("HeavyEvent", () => {
    setCount(count + 1);
  });

  const handleHeavyClick = useInstrumentedHandler("HeavyEvent", () => {
    // 50ms 동안 CPU 점유
    const start = performance.now();
    while (performance.now() - start < 50) {
      Math.random() * Math.random();
    }
    setCount(count + 1);
  });

  const handleVeryHeavyClick = useInstrumentedHandler("HeavyEvent", () => {
    // 100ms 동안 CPU 점유
    const start = performance.now();
    while (performance.now() - start < 100) {
      Math.random() * Math.random();
    }
    setCount(count + 1);
  });

  return (
    <div
      style={{
        padding: 16,
        background: "#fef3c7",
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <h3>Heavy Event Component</h3>
      <p>Count: {count}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={handleLightClick}>Light Click (즉시)</button>
        <button onClick={handleHeavyClick}>Heavy Click (50ms)</button>
        <button onClick={handleVeryHeavyClick}>Very Heavy Click (100ms)</button>
      </div>
    </div>
  );
}

const ProfiledHeavyEvent = withRenderProfiler(
  HeavyEventComponent,
  "HeavyEvent"
);

// 시나리오 3: Heavy Effect
function HeavyEffectComponent({ intensity }: { intensity: number }) {
  const [trigger, setTrigger] = useState(0);

  // 무거운 이펙트
  useTimedEffect(
    "HeavyEffect",
    () => {
      const start = performance.now();
      // intensity * 20ms 동안 CPU 점유
      while (performance.now() - start < intensity * 20) {
        Math.random() * Math.random();
      }
      console.log(`HeavyEffect ran for ${intensity * 20}ms`);
    },
    [trigger, intensity]
  );

  return (
    <div
      style={{
        padding: 16,
        background: "#fce7f3",
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <h3>Heavy Effect Component</h3>
      <p>
        Intensity: {intensity} (= {intensity * 20}ms)
      </p>
      <p>Trigger: {trigger}</p>
      <button onClick={() => setTrigger(trigger + 1)}>Trigger Effect</button>
    </div>
  );
}

const ProfiledHeavyEffect = withRenderProfiler(
  HeavyEffectComponent,
  "HeavyEffect"
);

// 시나리오 4: 복합 컴포넌트
function ComplexComponent() {
  const [data, setData] = useState<number[]>([]);

  const handleGenerate = useInstrumentedHandler("ComplexComp", () => {
    // 이벤트 시간 증가
    const newData = Array.from({ length: 100 }, () => Math.random());
    setData(newData);
  });

  useTimedEffect(
    "ComplexComp",
    () => {
      // 이펙트 시간 증가
      if (data.length > 0) {
        const start = performance.now();
        while (performance.now() - start < 30) {
          // 30ms 처리
        }
      }
    },
    [data]
  );

  // 렌더 시간 증가 (많은 요소)
  return (
    <div
      style={{
        padding: 16,
        background: "#e9d5ff",
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <h3>Complex Component</h3>
      <p>Data points: {data.length}</p>
      <button onClick={handleGenerate}>Generate Data</button>
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 4,
          maxHeight: 200,
          overflow: "auto",
        }}
      >
        {data.map((val, i) => (
          <div
            key={i}
            style={{
              padding: 4,
              background: "#8b5cf6",
              color: "#fff",
              fontSize: 10,
              borderRadius: 2,
            }}
          >
            {val.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}

const ProfiledComplexComponent = withRenderProfiler(
  ComplexComponent,
  "ComplexComp"
);

export const OccupancyHUDTestPage = () => {
  const [renderComplexity, setRenderComplexity] = useState(5);
  const [effectIntensity, setEffectIntensity] = useState(2);
  const [showAllComponents, setShowAllComponents] = useState(false);

  return (
    <div
      className="placeholder-page"
      style={{ minHeight: "150vh", paddingBottom: 100 }}
    >
      {/* OccupancyHUD 표시 */}
      <OccupancyHUD />

      <div className="placeholder-container" style={{ maxWidth: 1200 }}>
        <div className="placeholder-icon">⏱️</div>
        <h1>OccupancyHUD 이벤트 점유율 분석 테스트</h1>
        <p className="placeholder-description">
          컴포넌트별로 render/commit/event/effect 시간을 추적하여 성능 병목 발견
        </p>

        {/* 사용 방법 */}
        <div
          style={{
            background: "#eff6ff",
            border: "2px solid #3b82f6",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>📖 사용 방법 및 판독</h2>

          <div
            style={{
              padding: 16,
              background: "#fff",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <strong>🔍 좌측 중단의 OccupancyHUD 읽는 법:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.8 }}>
              <li>
                <strong>컴포넌트명:</strong> 추적 중인 컴포넌트 이름
              </li>
              <li>
                <strong>총 시간 (ms):</strong> render + commit + event + effect
                합산
              </li>
              <li>
                <strong>render:</strong> 컴포넌트 렌더링에 소요된 시간
              </li>
              <li>
                <strong>commit:</strong> DOM 업데이트에 소요된 시간
              </li>
              <li>
                <strong>event:</strong> 이벤트 핸들러 실행 시간
              </li>
              <li>
                <strong>effect:</strong> useEffect 실행 시간
              </li>
            </ul>
          </div>

          <ol style={{ lineHeight: 2 }}>
            <li>아래 컴포넌트들과 상호작용합니다</li>
            <li>좌측 중단의 OccupancyHUD를 관찰합니다</li>
            <li>어떤 컴포넌트가 가장 많은 시간을 소비하는지 확인합니다</li>
            <li>
              각 컴포넌트의 render/event/effect 중 어느 것이 높은지 분석합니다
            </li>
            <li>병목 지점을 파악하고 최적화 전략을 수립합니다</li>
          </ol>

          <div
            style={{
              padding: 12,
              background: "#fef3c7",
              borderRadius: 6,
              marginTop: 16,
              border: "1px solid #f59e0b",
            }}
          >
            <strong>💡 팁:</strong> HUD는 약 10초간의 누적 데이터를 보여줍니다.
            연속으로 버튼을 클릭하면 누적 시간이 증가하는 것을 볼 수 있습니다.
          </div>
        </div>

        {/* 전체 컴포넌트 토글 */}
        <div
          style={{
            marginBottom: 30,
            padding: 20,
            background: "#f3f4f6",
            borderRadius: 12,
          }}
        >
          <label
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={showAllComponents}
              onChange={(e) => setShowAllComponents(e.target.checked)}
              style={{ marginRight: 8, width: 20, height: 20 }}
            />
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              모든 테스트 컴포넌트 표시 (OccupancyHUD에서 비교하기)
            </span>
          </label>
        </div>

        {showAllComponents && (
          <>
            {/* 시나리오 1: Heavy Render */}
            <div style={{ marginBottom: 30 }}>
              <h2>🎨 시나리오 1: Render 시간 측정</h2>
              <p>
                복잡한 JSX를 렌더링하여 render 시간을 증가시킵니다.
                <br />
                <strong>관찰:</strong> HUD에서 "HeavyRender" 항목의 render 값이
                높게 나타납니다.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  복잡도: {renderComplexity} (= {renderComplexity * 10}개 요소)
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={renderComplexity}
                  onChange={(e) => setRenderComplexity(Number(e.target.value))}
                  style={{ width: "100%", maxWidth: 400 }}
                />
              </div>

              <ProfiledHeavyRender complexity={renderComplexity} />

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  📝 테스트 절차
                </summary>
                <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
                  <li>복잡도 슬라이더를 1부터 20까지 천천히 이동합니다</li>
                  <li>좌측 중단 HUD에서 "HeavyRender" 항목을 찾습니다</li>
                  <li>
                    복잡도가 증가할수록 render 시간이 증가하는 것을 관찰합니다
                  </li>
                  <li>복잡도 20일 때 render 값이 가장 높은지 확인합니다</li>
                </ol>
              </details>
            </div>

            {/* 시나리오 2: Heavy Event */}
            <div style={{ marginBottom: 30 }}>
              <h2>⚡ 시나리오 2: Event 시간 측정</h2>
              <p>
                무거운 계산을 수행하는 이벤트 핸들러로 event 시간을
                증가시킵니다.
                <br />
                <strong>관찰:</strong> "HeavyEvent" 항목의 event 값이 높게
                나타납니다.
              </p>

              <ProfiledHeavyEvent />

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  📝 테스트 절차
                </summary>
                <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
                  <li>"Light Click" 버튼을 10번 빠르게 클릭합니다</li>
                  <li>HUD에서 "HeavyEvent"의 event 값을 확인합니다 (낮음)</li>
                  <li>"Heavy Click (50ms)" 버튼을 10번 클릭합니다</li>
                  <li>event 값이 크게 증가한 것을 확인합니다 (약 500ms+)</li>
                  <li>"Very Heavy Click (100ms)" 버튼을 5번 클릭합니다</li>
                  <li>event 값이 더욱 증가합니다 (약 1000ms+)</li>
                  <li>버튼 클릭 시 UI가 버벅이는 것을 체감합니다</li>
                </ol>
              </details>
            </div>

            {/* 시나리오 3: Heavy Effect */}
            <div style={{ marginBottom: 30 }}>
              <h2>🔄 시나리오 3: Effect 시간 측정</h2>
              <p>
                무거운 작업을 수행하는 useEffect로 effect 시간을 증가시킵니다.
                <br />
                <strong>관찰:</strong> "HeavyEffect" 항목의 effect 값이 높게
                나타납니다.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Intensity: {effectIntensity} (= {effectIntensity * 20}ms per
                  effect)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={effectIntensity}
                  onChange={(e) => setEffectIntensity(Number(e.target.value))}
                  style={{ width: "100%", maxWidth: 400 }}
                />
              </div>

              <ProfiledHeavyEffect intensity={effectIntensity} />

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  📝 테스트 절차
                </summary>
                <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
                  <li>Intensity를 5로 설정합니다 (= 100ms per effect)</li>
                  <li>"Trigger Effect" 버튼을 여러 번 클릭합니다</li>
                  <li>
                    HUD에서 "HeavyEffect"의 effect 값이 증가하는 것을 확인합니다
                  </li>
                  <li>Intensity를 10으로 올립니다 (= 200ms per effect)</li>
                  <li>
                    다시 버튼을 클릭하고 effect 값이 더 빠르게 증가하는지
                    확인합니다
                  </li>
                  <li>콘솔에서 "HeavyEffect ran for Xms" 로그를 확인합니다</li>
                </ol>
              </details>
            </div>

            {/* 시나리오 4: 복합 컴포넌트 */}
            <div style={{ marginBottom: 30 }}>
              <h2>🎯 시나리오 4: 통합 점유율 분석</h2>
              <p>
                render, event, effect가 모두 발생하는 복합 컴포넌트입니다.
                <br />
                <strong>관찰:</strong> "ComplexComp"에서 세 가지 시간이 모두
                나타납니다.
              </p>

              <ProfiledComplexComponent />

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  📝 테스트 절차
                </summary>
                <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
                  <li>"Generate Data" 버튼을 클릭합니다</li>
                  <li>
                    이벤트 핸들러 실행 → data 생성 → 리렌더 → effect 실행 순으로
                    진행됩니다
                  </li>
                  <li>
                    HUD에서 "ComplexComp"의 event, render, effect가 모두
                    증가합니다
                  </li>
                  <li>버튼을 10번 연속 클릭합니다</li>
                  <li>
                    총 점유 시간(total)이 가장 높은 컴포넌트가 "ComplexComp"인지
                    확인합니다
                  </li>
                  <li>세 가지 시간 중 어느 것이 가장 높은지 분석합니다</li>
                </ol>
              </details>
            </div>
          </>
        )}

        {/* 비교 테스트 */}
        <div style={{ marginBottom: 30 }}>
          <h2>📊 시나리오 5: 컴포넌트 점유율 비교</h2>
          <p>
            모든 컴포넌트를 활성화하고 여러 상호작용을 수행한 후 HUD에서 어떤
            컴포넌트가 가장 많은 시간을 차지하는지 비교합니다.
          </p>

          <div
            style={{
              background: "#fef3c7",
              border: "2px solid #f59e0b",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>빠른 테스트 시나리오</h3>
            <ol style={{ lineHeight: 1.8 }}>
              <li>"모든 테스트 컴포넌트 표시" 체크박스를 활성화합니다</li>
              <li>Render 복잡도를 15로 설정합니다</li>
              <li>Effect Intensity를 7로 설정합니다</li>
              <li>HeavyEvent의 "Very Heavy Click" 버튼을 5번 클릭합니다</li>
              <li>HeavyEffect의 "Trigger Effect" 버튼을 5번 클릭합니다</li>
              <li>ComplexComponent의 "Generate Data" 버튼을 3번 클릭합니다</li>
              <li>Render 슬라이더를 1에서 20까지 천천히 이동합니다</li>
              <li>좌측 중단 HUD를 확인합니다</li>
            </ol>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "#fff",
                borderRadius: 6,
              }}
            >
              <strong>📈 예상 결과:</strong>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>HeavyEvent: event 시간이 가장 높음 (500ms+)</li>
                <li>HeavyRender: render 시간이 높음 (복잡도에 따라)</li>
                <li>HeavyEffect: effect 시간이 높음 (700ms+)</li>
                <li>ComplexComp: 모든 시간이 골고루 높음</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 최적화 가이드 */}
        <div
          style={{
            background: "#f0fdf4",
            border: "2px solid #10b981",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>🚀 점유율 기반 최적화 전략</h2>

          <h3>1. Render 시간이 높을 때</h3>
          <p>
            <strong>원인:</strong> 복잡한 JSX, 많은 자식 컴포넌트, 비효율적인
            렌더링
          </p>
          <p>
            <strong>해결:</strong>
          </p>
          <ul style={{ lineHeight: 1.8 }}>
            <li>React.memo로 불필요한 리렌더 방지</li>
            <li>useMemo로 복잡한 계산 결과 캐싱</li>
            <li>컴포넌트를 더 작은 단위로 분할</li>
            <li>가상화(react-window, react-virtualized) 적용</li>
            <li>조건부 렌더링으로 불필요한 요소 제거</li>
          </ul>

          <h3>2. Event 시간이 높을 때</h3>
          <p>
            <strong>원인:</strong> 이벤트 핸들러에서 무거운 동기 작업 수행
          </p>
          <p>
            <strong>해결:</strong>
          </p>
          <ul style={{ lineHeight: 1.8 }}>
            <li>debounce/throttle로 이벤트 빈도 줄이기</li>
            <li>무거운 계산을 Web Worker로 이동</li>
            <li>requestIdleCallback으로 우선순위 낮은 작업 지연</li>
            <li>setTimeout으로 작업을 다음 틱으로 미루기</li>
            <li>대량 데이터 처리 시 청킹(chunking) 적용</li>
          </ul>

          <h3>3. Effect 시간이 높을 때</h3>
          <p>
            <strong>원인:</strong> useEffect에서 무거운 동기 작업, 불필요한
            의존성
          </p>
          <p>
            <strong>해결:</strong>
          </p>
          <ul style={{ lineHeight: 1.8 }}>
            <li>비동기 작업으로 변환 (async/await)</li>
            <li>의존성 배열 최적화로 불필요한 실행 방지</li>
            <li>useLayoutEffect 대신 useEffect 사용 (비동기)</li>
            <li>데이터 로딩은 React Query, SWR 같은 라이브러리 활용</li>
            <li>초기화 작업은 lazy loading으로 지연</li>
          </ul>

          <h3>4. Commit 시간이 높을 때</h3>
          <p>
            <strong>원인:</strong> DOM 조작이 많음, 레이아웃 thrashing
          </p>
          <p>
            <strong>해결:</strong>
          </p>
          <ul style={{ lineHeight: 1.8 }}>
            <li>DOM 업데이트 배치 처리</li>
            <li>CSS transform/opacity 사용 (reflow 최소화)</li>
            <li>가상화로 DOM 노드 수 줄이기</li>
            <li>will-change CSS 속성 활용</li>
          </ul>

          <h3>5. 총 점유 시간이 높은 컴포넌트 우선 최적화</h3>
          <p>
            HUD의 상위 목록에 있는 컴포넌트부터 최적화하는 것이 효율적입니다.
            Pareto 원칙(80/20 법칙)에 따라 상위 20% 컴포넌트를 최적화하면 전체
            성능의 80%가 개선될 수 있습니다.
          </p>
        </div>

        {/* 코드 예제 */}
        <div
          style={{
            background: "#f8fafc",
            border: "2px solid #64748b",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>💻 코드 사용 예제</h2>

          <h3>1. Render 시간 측정</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`import { withRenderProfiler } from "../lib/dx-kit";

function MyComponent() {
  return <div>...</div>;
}

// Profiler로 감싸기
const ProfiledMyComponent = withRenderProfiler(MyComponent, "MyComponent");

// 사용
<ProfiledMyComponent />`}
          </pre>

          <h3>2. Event 시간 측정</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`import { useInstrumentedHandler } from "../lib/dx-kit";

function MyComponent() {
  const [count, setCount] = useState(0);
  
  // 이벤트 핸들러를 계측
  const handleClick = useInstrumentedHandler("MyComponent", () => {
    // 무거운 작업
    doHeavyCalculation();
    setCount(count + 1);
  });
  
  return <button onClick={handleClick}>Click</button>;
}`}
          </pre>

          <h3>3. Effect 시간 측정</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`import { useTimedEffect } from "../lib/dx-kit";

function MyComponent() {
  const [data, setData] = useState(null);
  
  // useEffect 대신 useTimedEffect 사용
  useTimedEffect("MyComponent", () => {
    // 무거운 이펙트 로직
    const result = processData();
    setData(result);
  }, [/* deps */]);
  
  return <div>{data}</div>;
}`}
          </pre>

          <h3>4. 모두 함께 사용</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`import { 
  OccupancyHUD, 
  withRenderProfiler, 
  useInstrumentedHandler,
  useTimedEffect
} from "../lib/dx-kit";

function MyComponent() {
  const [count, setCount] = useState(0);
  
  const handleClick = useInstrumentedHandler("MyComponent", () => {
    setCount(count + 1);
  });
  
  useTimedEffect("MyComponent", () => {
    console.log("Effect running");
  }, [count]);
  
  return <button onClick={handleClick}>Count: {count}</button>;
}

const ProfiledMyComponent = withRenderProfiler(MyComponent, "MyComponent");

function App() {
  return (
    <>
      <OccupancyHUD />
      <ProfiledMyComponent />
    </>
  );
}`}
          </pre>
        </div>

        <Link to="/dx-kit" className="placeholder-back-link">
          ← DX Kit 허브로 돌아가기
        </Link>
      </div>
    </div>
  );
};
