import { useState, useCallback, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import {
  RerenderHeatmap,
  Box,
  useRenderCounter,
  RerenderBadge,
} from "../../lib/dx-kit";
import "../PlaceholderPage.css";

/**
 * # RerenderHeatmap 테스트 페이지
 *
 * ## 개요
 * RerenderHeatmap은 컴포넌트의 리렌더링을 시각적으로 추적하는 개발 도구입니다.
 * React 애플리케이션에서 불필요한 리렌더링을 찾아내고 최적화 포인트를 발견하는 데 유용합니다.
 *
 * ### 핵심 기능
 *
 * #### 1. 키보드 단축키 활성화
 * - **단축키**: `Cmd/Ctrl + Shift + R`
 * - 단축키를 누르면 1.5초 동안 리렌더링된 컴포넌트에 파란색 외곽선이 표시됩니다
 * - 별도의 UI 없이 작동하는 비침투적 도구입니다
 *
 * #### 2. 렌더 카운터
 * - `useRenderCounter(label)` 훅으로 컴포넌트의 렌더링 횟수를 추적합니다
 * - 매 렌더마다 카운트가 증가하며, 성능 병목을 찾는 데 도움이 됩니다
 *
 * #### 3. Box 래퍼 컴포넌트
 * - 자동으로 리렌더 카운트 배지를 표시하는 편리한 래퍼입니다
 * - `data-rerender` 속성이 자동으로 추가되어 하이라이트 대상이 됩니다
 *
 * ## Props
 *
 * ```typescript
 * interface RerenderHeatmapProps {
 *   enabledShortcut?: boolean;  // 키보드 단축키 활성화 여부 (기본값: true)
 * }
 *
 * // useRenderCounter
 * function useRenderCounter(label?: string): {
 *   count: number;
 *   label: string | undefined;
 * }
 *
 * // Box 컴포넌트
 * interface BoxProps {
 *   label: string;              // 컴포넌트 라벨 (배지에 표시됨)
 *   children: React.ReactNode;
 * }
 * ```
 *
 * ## 테스트 시나리오
 *
 * ### 시나리오 1: 기본 리렌더 감지
 * - 단순한 state 변경으로 컴포넌트를 리렌더링합니다
 * - Cmd/Ctrl + Shift + R을 눌러 하이라이트를 확인합니다
 *
 * ### 시나리오 2: 부모 리렌더로 인한 자식 리렌더
 * - 부모 컴포넌트가 리렌더될 때 자식도 함께 리렌더되는 현상을 관찰합니다
 * - React.memo로 최적화 전/후를 비교합니다
 *
 * ### 시나리오 3: 불필요한 리렌더 감지
 * - props가 변경되지 않았는데도 리렌더되는 컴포넌트를 찾습니다
 * - useCallback, useMemo로 최적화하는 방법을 실습합니다
 *
 * ### 시나리오 4: 렌더 카운트 비교
 * - 여러 컴포넌트의 렌더링 빈도를 비교합니다
 * - 어떤 컴포넌트가 가장 자주 렌더링되는지 파악합니다
 *
 * ### 시나리오 5: Context 변경에 따른 대량 리렌더
 * - Context 값이 변경될 때 구독하는 모든 컴포넌트가 리렌더되는 것을 관찰합니다
 *
 * ## 사용 방법
 * 1. 페이지에 `<RerenderHeatmap enabledShortcut />` 추가
 * 2. 추적하고 싶은 컴포넌트를 `<Box>` 또는 `data-rerender="1"` 속성으로 마킹
 * 3. 앱을 사용하면서 `Cmd/Ctrl + Shift + R` 단축키 활성화
 * 4. 파란색으로 하이라이트되는 컴포넌트들을 관찰
 * 5. 예상치 못한 리렌더가 있다면 최적화를 고려
 *
 * ## 최적화 전략
 * - **React.memo**: props가 같으면 리렌더 방지
 * - **useCallback**: 함수 참조를 메모이제이션
 * - **useMemo**: 계산 비용이 높은 값을 캐싱
 * - **Context 분리**: 자주 변경되는 값과 정적 값을 분리
 */

// 테스트용 컴포넌트들
function BasicCounter() {
  const [count, setCount] = useState(0);

  return (
    <Box label="BasicCounter">
      <div style={{ padding: 20, background: "#fef3c7", borderRadius: 8 }}>
        <h3>기본 카운터</h3>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>
          증가 (이 컴포넌트만 리렌더)
        </button>
      </div>
    </Box>
  );
}

function ParentWithChildren({
  variant,
}: {
  variant: "unoptimized" | "optimized";
}) {
  const [parentState, setParentState] = useState(0);
  const [childState, setChildState] = useState(0);

  return (
    <Box label={`Parent-${variant}`}>
      <div style={{ padding: 20, background: "#dbeafe", borderRadius: 8 }}>
        <h3>부모 컴포넌트 ({variant})</h3>
        <p>Parent State: {parentState}</p>
        <button onClick={() => setParentState(parentState + 1)}>
          부모 State 변경
        </button>
        <button
          onClick={() => setChildState(childState + 1)}
          style={{ marginLeft: 10 }}
        >
          자식 State 변경
        </button>

        <div style={{ marginTop: 16 }}>
          {variant === "unoptimized" ? (
            <UnoptimizedChild childState={childState} />
          ) : (
            <OptimizedChild childState={childState} />
          )}
        </div>
      </div>
    </Box>
  );
}

function UnoptimizedChild({ childState }: { childState: number }) {
  return (
    <Box label="UnoptimizedChild">
      <div style={{ padding: 12, background: "#fecaca", borderRadius: 6 }}>
        <strong>최적화 안 됨</strong>
        <p>Child State: {childState}</p>
        <small>부모가 리렌더되면 이 컴포넌트도 리렌더됩니다</small>
      </div>
    </Box>
  );
}

const OptimizedChild = memo(function OptimizedChild({
  childState,
}: {
  childState: number;
}) {
  return (
    <Box label="OptimizedChild">
      <div style={{ padding: 12, background: "#bbf7d0", borderRadius: 6 }}>
        <strong>React.memo로 최적화됨</strong>
        <p>Child State: {childState}</p>
        <small>props가 같으면 리렌더되지 않습니다</small>
      </div>
    </Box>
  );
});

function CallbackTest() {
  const [count, setCount] = useState(0);
  const [input, setInput] = useState("");

  // 최적화 안 된 콜백 - 매번 새로운 함수 생성
  const unoptimizedHandler = () => {
    console.log("Unoptimized handler called");
  };

  // 최적화된 콜백 - useCallback으로 메모이제이션
  const optimizedHandler = useCallback(() => {
    console.log("Optimized handler called");
  }, []);

  return (
    <Box label="CallbackTest">
      <div style={{ padding: 20, background: "#e9d5ff", borderRadius: 8 }}>
        <h3>Callback 테스트</h3>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>카운트 증가</button>

        <div style={{ marginTop: 16 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="타이핑 해보세요..."
            style={{ padding: 8, width: "100%", maxWidth: 300 }}
          />
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <ExpensiveChild label="Unoptimized" onClick={unoptimizedHandler} />
          <ExpensiveChildMemo label="Optimized" onClick={optimizedHandler} />
        </div>
      </div>
    </Box>
  );
}

function ExpensiveChild({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  const { count } = useRenderCounter(`ExpensiveChild-${label}`);

  return (
    <div style={{ padding: 12, background: "#fecaca", borderRadius: 6 }}>
      <strong>{label}</strong>
      <div>Renders: {count}</div>
      <small>부모가 리렌더되면 항상 리렌더</small>
    </div>
  );
}

const ExpensiveChildMemo = memo(function ExpensiveChildMemo({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  const { count } = useRenderCounter(`ExpensiveChild-${label}`);

  return (
    <div style={{ padding: 12, background: "#bbf7d0", borderRadius: 6 }}>
      <strong>{label}</strong>
      <div>Renders: {count}</div>
      <small>onClick이 같으면 리렌더 안 됨</small>
    </div>
  );
});

function MemoTest() {
  const [count, setCount] = useState(0);
  const [input, setInput] = useState("test");

  // 최적화 안 된 계산 - 매번 실행됨
  const unoptimizedExpensiveValue = (() => {
    console.log("Unoptimized: Expensive calculation running...");
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += i;
    }
    return result;
  })();

  // 최적화된 계산 - count가 변경될 때만 실행
  const optimizedExpensiveValue = useMemo(() => {
    console.log("Optimized: Expensive calculation running...");
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += i;
    }
    return result;
  }, [count]);

  return (
    <Box label="MemoTest">
      <div style={{ padding: 20, background: "#fecaca", borderRadius: 8 }}>
        <h3>useMemo 테스트</h3>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>카운트 증가</button>

        <div style={{ marginTop: 16 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="타이핑하면 리렌더 발생"
            style={{ padding: 8, width: "100%", maxWidth: 300 }}
          />
          <small style={{ display: "block", marginTop: 4 }}>
            👆 타이핑할 때 콘솔을 확인하세요!
          </small>
        </div>

        <div style={{ marginTop: 16 }}>
          <div>Unoptimized Value: {unoptimizedExpensiveValue}</div>
          <div>Optimized Value: {optimizedExpensiveValue}</div>
        </div>
      </div>
    </Box>
  );
}

function MassRenderTest() {
  const [trigger, setTrigger] = useState(0);

  return (
    <Box label="MassRenderTest">
      <div style={{ padding: 20, background: "#fde68a", borderRadius: 8 }}>
        <h3>대량 리렌더 테스트</h3>
        <p>Trigger: {trigger}</p>
        <button onClick={() => setTrigger(trigger + 1)}>
          모든 자식 리렌더 트리거
        </button>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 8,
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <MiniCard key={i} index={i} trigger={trigger} />
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#fff",
            borderRadius: 6,
          }}
        >
          💡 버튼을 클릭한 후 <kbd>Cmd/Ctrl + Shift + R</kbd>을 누르면 모든
          카드가 파란색으로 하이라이트됩니다!
        </div>
      </div>
    </Box>
  );
}

function MiniCard({ index, trigger }: { index: number; trigger: number }) {
  const { count } = useRenderCounter();

  return (
    <div
      data-rerender="1"
      style={{
        padding: 12,
        background: "#fff",
        borderRadius: 6,
        border: "1px solid #d1d5db",
        position: "relative",
      }}
    >
      <RerenderBadge label={`Card${index}`} count={count} />
      <div style={{ fontSize: 14 }}>Card {index}</div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>Renders: {count}</div>
    </div>
  );
}

export const RerenderHeatmapTestPage = () => {
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div
      className="placeholder-page"
      style={{ minHeight: "150vh", paddingBottom: 100 }}
    >
      {/* RerenderHeatmap 활성화 */}
      <RerenderHeatmap enabledShortcut />

      <div className="placeholder-container" style={{ maxWidth: 1200 }}>
        <div className="placeholder-icon">🔄</div>
        <h1>RerenderHeatmap 리렌더링 추적 테스트</h1>
        <p className="placeholder-description">
          불필요한 리렌더링을 찾아내고 최적화하는 도구
        </p>

        {/* 사용 방법 안내 */}
        <div
          style={{
            background: "#eff6ff",
            border: "2px solid #3b82f6",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <h2 style={{ marginTop: 0 }}>📖 사용 방법</h2>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              style={{
                padding: "4px 12px",
                cursor: "pointer",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
              }}
            >
              {showInstructions ? "숨기기" : "보기"}
            </button>
          </div>

          {showInstructions && (
            <>
              <ol style={{ lineHeight: 2, marginBottom: 20 }}>
                <li>아래 컴포넌트들과 상호작용하여 리렌더를 유발합니다</li>
                <li>
                  <kbd
                    style={{
                      padding: "2px 6px",
                      background: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      fontFamily: "monospace",
                    }}
                  >
                    Cmd/Ctrl + Shift + R
                  </kbd>{" "}
                  단축키를 누릅니다
                </li>
                <li>
                  리렌더된 컴포넌트에{" "}
                  <span style={{ color: "#3b82f6", fontWeight: 700 }}>
                    파란색 외곽선
                  </span>
                  이 표시됩니다
                </li>
                <li>우측 상단의 렌더 카운트 배지로 렌더링 횟수를 확인합니다</li>
                <li>예상치 못한 리렌더가 있다면 최적화를 고려합니다</li>
              </ol>

              <div
                style={{
                  padding: 16,
                  background: "#fff",
                  borderRadius: 8,
                  border: "1px solid #3b82f6",
                }}
              >
                <strong>💡 Pro Tip:</strong> 브라우저 콘솔을 열어두면 "Expensive
                calculation running..." 로그를 통해 불필요한 계산이 실행되는
                타이밍을 확인할 수 있습니다!
              </div>
            </>
          )}
        </div>

        {/* 시나리오 1: 기본 리렌더 감지 */}
        <div style={{ marginBottom: 30 }}>
          <h2>🎯 시나리오 1: 기본 리렌더 감지</h2>
          <p>
            state 변경으로 단일 컴포넌트만 리렌더됩니다.
            <br />
            <strong>테스트:</strong> 버튼을 클릭한 후 단축키를 누르세요.
          </p>
          <BasicCounter />
        </div>

        {/* 시나리오 2: 부모-자식 리렌더 비교 */}
        <div style={{ marginBottom: 30 }}>
          <h2>👨‍👧 시나리오 2: 부모-자식 리렌더 비교</h2>
          <p>
            부모가 리렌더될 때 자식의 동작이 최적화 여부에 따라 달라집니다.
            <br />
            <strong>테스트:</strong> "부모 State 변경"을 클릭한 후 단축키를
            누르세요.
          </p>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <ParentWithChildren variant="unoptimized" />
            <ParentWithChildren variant="optimized" />
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 예상 결과
            </summary>
            <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>
                <strong>Unoptimized:</strong> 부모의 "부모 State 변경" 버튼 클릭
                시 자식도 함께 파란색으로 하이라이트됩니다.
              </li>
              <li>
                <strong>Optimized:</strong> 부모의 "부모 State 변경" 버튼 클릭
                시 자식은 하이라이트되지 않습니다 (props가 변하지 않았으므로).
              </li>
              <li>
                두 경우 모두 "자식 State 변경" 버튼을 누르면 자식이
                리렌더됩니다.
              </li>
            </ul>
          </details>
        </div>

        {/* 시나리오 3: useCallback 비교 */}
        <div style={{ marginBottom: 30 }}>
          <h2>🔗 시나리오 3: useCallback 최적화</h2>
          <p>
            함수 참조를 메모이제이션하여 불필요한 자식 리렌더를 방지합니다.
            <br />
            <strong>테스트:</strong> input에 타이핑한 후 단축키를 누르세요.
          </p>
          <CallbackTest />

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 예상 결과
            </summary>
            <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>
                Input에 타이핑하면 부모 컴포넌트(CallbackTest)가 리렌더됩니다.
              </li>
              <li>
                <strong>Unoptimized:</strong> 부모가 리렌더되면 매번 새로운
                함수가 생성되므로 자식도 리렌더됩니다. 렌더 카운트가 계속
                증가합니다.
              </li>
              <li>
                <strong>Optimized:</strong> useCallback으로 함수 참조가
                유지되므로 자식이 리렌더되지 않습니다. 렌더 카운트가 증가하지
                않습니다.
              </li>
            </ul>
          </details>
        </div>

        {/* 시나리오 4: useMemo 비교 */}
        <div style={{ marginBottom: 30 }}>
          <h2>💾 시나리오 4: useMemo 최적화</h2>
          <p>
            비용이 높은 계산을 메모이제이션하여 불필요한 재계산을 방지합니다.
            <br />
            <strong>테스트:</strong> input에 타이핑하면서 콘솔을 확인하세요.
          </p>
          <MemoTest />

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 예상 결과
            </summary>
            <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>
                <strong>카운트 증가 버튼:</strong> 두 계산 모두 실행됩니다.
                콘솔에 두 로그가 모두 출력됩니다.
              </li>
              <li>
                <strong>Input 타이핑:</strong> Unoptimized는 매번 계산되지만
                Optimized는 count가 변하지 않았으므로 계산되지 않습니다. 콘솔에
                "Unoptimized" 로그만 출력됩니다.
              </li>
              <li>
                이 시나리오에서 useMemo는 불필요한 무거운 계산을 방지합니다.
              </li>
            </ul>
          </details>
        </div>

        {/* 시나리오 5: 대량 리렌더 */}
        <div style={{ marginBottom: 30 }}>
          <h2>🎆 시나리오 5: 대량 리렌더 시각화</h2>
          <p>
            여러 컴포넌트가 동시에 리렌더될 때 시각적 효과를 확인합니다.
            <br />
            <strong>테스트:</strong> 버튼 클릭 후 빠르게 단축키를 누르세요.
          </p>
          <MassRenderTest />

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 예상 결과
            </summary>
            <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>
                버튼을 클릭하면 trigger state가 변경되고 모든 MiniCard가
                리렌더됩니다.
              </li>
              <li>
                단축키를 누르면 12개의 카드 모두에 파란색 외곽선이 표시됩니다.
              </li>
              <li>각 카드의 렌더 카운트 배지도 증가합니다.</li>
              <li>
                이런 대량 리렌더가 발생하는 상황에서는
                virtualization(react-window 등)을 고려해야 합니다.
              </li>
            </ul>
          </details>
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
          <h2 style={{ marginTop: 0 }}>🚀 최적화 전략 가이드</h2>

          <h3>1. React.memo</h3>
          <p>props가 변경되지 않으면 리렌더를 방지합니다.</p>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 12,
              borderRadius: 6,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`const OptimizedComponent = memo(function MyComponent({ prop1, prop2 }) {
  return <div>{prop1} {prop2}</div>;
});

// 커스텀 비교 함수
const OptimizedWithCustomCompare = memo(
  MyComponent,
  (prevProps, nextProps) => {
    // true를 반환하면 리렌더 스킵
    return prevProps.id === nextProps.id;
  }
);`}
          </pre>

          <h3>2. useCallback</h3>
          <p>
            함수 참조를 메모이제이션하여 자식 컴포넌트의 불필요한 리렌더를
            방지합니다.
          </p>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 12,
              borderRadius: 6,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]); // a, b가 변경될 때만 함수 재생성

// ❌ 나쁜 예
<Child onClick={() => doSomething()} />

// ✅ 좋은 예
<Child onClick={handleClick} />`}
          </pre>

          <h3>3. useMemo</h3>
          <p>비용이 높은 계산 결과를 캐싱합니다.</p>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 12,
              borderRadius: 6,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]); // a, b가 변경될 때만 재계산

// 배열/객체도 메모이제이션 가능
const memoizedArray = useMemo(() => [a, b, c], [a, b, c]);
const memoizedObject = useMemo(() => ({ x, y }), [x, y]);`}
          </pre>

          <h3>4. Context 분리</h3>
          <p>자주 변경되는 값과 정적 값을 별도 Context로 분리합니다.</p>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 12,
              borderRadius: 6,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`// ❌ 나쁜 예: 모든 값을 하나의 Context에
const AppContext = createContext({ user, theme, cart });

// ✅ 좋은 예: 변경 빈도에 따라 분리
const UserContext = createContext(user);      // 거의 안 바뀜
const ThemeContext = createContext(theme);    // 가끔 바뀜
const CartContext = createContext(cart);      // 자주 바뀜`}
          </pre>

          <h3>5. 리스트 최적화</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 12,
              borderRadius: 6,
              overflow: "auto",
              fontSize: 13,
            }}
          >
            {`// 안정적인 key 사용
items.map(item => <Item key={item.id} {...item} />)

// 긴 리스트는 virtualization
import { FixedSizeList } from 'react-window';
<FixedSizeList height={500} itemCount={1000} itemSize={35}>
  {({ index, style }) => <Item style={style} {...items[index]} />}
</FixedSizeList>`}
          </pre>
        </div>

        {/* 언제 최적화할까? */}
        <div
          style={{
            background: "#fef3c7",
            border: "2px solid #f59e0b",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>⚖️ 언제 최적화해야 할까?</h2>

          <h3>✅ 최적화가 필요한 경우</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              렌더 카운트가 예상보다 훨씬 높을 때 (예: 버튼 1번 클릭에 10번
              렌더)
            </li>
            <li>리스트 아이템이 많고(100개 이상) 각 아이템이 무거울 때</li>
            <li>계산 비용이 높은 로직이 매 렌더마다 실행될 때</li>
            <li>실제로 성능 문제가 체감될 때 (버벅임, 지연)</li>
            <li>Profiler에서 렌더 시간이 오래 걸린다고 나올 때</li>
          </ul>

          <h3>❌ 최적화가 불필요한 경우</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>컴포넌트가 가볍고 렌더 비용이 낮을 때</li>
            <li>리렌더가 자주 일어나지 않을 때</li>
            <li>사용자가 성능 문제를 체감하지 못할 때</li>
            <li>코드 복잡도가 증가하는 대가가 클 때</li>
          </ul>

          <div
            style={{
              padding: 16,
              background: "#fff",
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <strong>💡 Remember:</strong> "조기 최적화는 모든 악의 근원이다" -
            Donald Knuth
            <br />
            먼저 측정하고, 병목을 찾고, 그 다음에 최적화하세요!
          </div>
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
          <h2 style={{ marginTop: 0 }}>💻 기본 사용 예제</h2>

          <h3>1. 기본 설정</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`import { RerenderHeatmap } from "../lib/dx-kit";

function App() {
  return (
    <>
      <RerenderHeatmap enabledShortcut />
      {/* 나머지 앱 */}
    </>
  );
}`}
          </pre>

          <h3>2. Box 래퍼 사용</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`import { Box } from "../lib/dx-kit";

function MyComponent() {
  return (
    <Box label="MyComponent">
      <div>내용...</div>
    </Box>
  );
}`}
          </pre>

          <h3>3. 커스텀 렌더 카운터</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`import { useRenderCounter, RerenderBadge } from "../lib/dx-kit";

function CustomComponent() {
  const { count, label } = useRenderCounter("CustomComponent");
  
  return (
    <div data-rerender="1" style={{ position: "relative" }}>
      <RerenderBadge label={label || "Component"} count={count} />
      <div>Rendered {count} times</div>
    </div>
  );
}`}
          </pre>

          <h3>4. 수동 data-rerender 속성</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`// Box를 쓸 수 없는 경우 직접 속성 추가
<div data-rerender="1">
  이 div는 리렌더 하이라이트 대상입니다
</div>`}
          </pre>
        </div>

        <Link to="/dx-kit" className="placeholder-back-link">
          ← DX Kit 허브로 돌아가기
        </Link>
      </div>
    </div>
  );
};
