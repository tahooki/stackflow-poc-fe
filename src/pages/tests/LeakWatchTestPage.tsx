import { useState } from "react";
import { Link } from "react-router-dom";
import { LeakHUD, useLeakWatch, Box } from "../../lib/dx-kit";
import "../PlaceholderPage.css";

/**
 * # LeakWatch 메모리 누수 감지 테스트 페이지
 *
 * ## 개요
 * LeakWatch는 React 컴포넌트의 메모리 누수를 감지하는 도구입니다.
 * FinalizationRegistry API를 사용하여 언마운트된 컴포넌트가 가비지 컬렉션되는지 추적합니다.
 *
 * ### 핵심 개념
 *
 * #### 메모리 누수란?
 * - 컴포넌트가 언마운트되었는데도 메모리에서 해제되지 않는 현상
 * - 참조가 남아있어 가비지 컬렉션이 이루어지지 않음
 * - 시간이 지나면서 메모리 사용량이 계속 증가
 *
 * #### 일반적인 원인
 * 1. **타이머 정리 실패**: setInterval, setTimeout이 cleanup되지 않음
 * 2. **이벤트 리스너 제거 실패**: addEventListener 후 removeEventListener 누락
 * 3. **전역 변수 참조**: 전역 객체가 컴포넌트를 참조
 * 4. **클로저 캡처**: 클로저가 컴포넌트 인스턴스를 붙잡고 있음
 * 5. **외부 라이브러리**: 라이브러리가 정리되지 않은 참조를 유지
 *
 * ### LeakWatch 작동 원리
 *
 * 1. **컴포넌트 추적**: `useLeakWatch("컴포넌트명")` 훅으로 컴포넌트를 등록
 * 2. **언마운트 감지**: useEffect cleanup에서 언마운트 시점을 기록
 * 3. **가비지 컬렉션 대기**: 일정 시간(기본 15초) 동안 GC를 기다림
 * 4. **누수 의심 플래그**: 시간 내에 GC되지 않으면 "LEAK?" 표시
 * 5. **FinalizationRegistry**: 실제 GC가 발생하면 최종화 콜백 실행
 *
 * ### HUD 표시 정보
 * - **alive**: 현재 마운트된 인스턴스 수
 * - **suspected**: 언마운트되었지만 GC되지 않은 의심 인스턴스 수
 * - **ok**: 정상적으로 GC된 상태
 *
 * ## API
 *
 * ```typescript
 * // 컴포넌트에서 사용
 * function MyComponent() {
 *   useLeakWatch("MyComponent");
 *   // ... 컴포넌트 로직
 * }
 *
 * // HUD 표시
 * <LeakHUD />
 * ```
 *
 * ## 테스트 시나리오
 *
 * ### 시나리오 1: 정상 컴포넌트 (누수 없음)
 * - cleanup이 제대로 구현된 컴포넌트
 * - 언마운트 후 정상적으로 GC됨
 *
 * ### 시나리오 2: 타이머 누수
 * - setInterval/setTimeout이 cleanup되지 않음
 * - 언마운트 후에도 타이머가 컴포넌트를 참조
 *
 * ### 시나리오 3: 이벤트 리스너 누수
 * - addEventListener 후 removeEventListener 누락
 * - 전역 이벤트 객체가 컴포넌트를 참조
 *
 * ### 시나리오 4: 전역 변수 누수
 * - window 객체에 컴포넌트 인스턴스 저장
 * - 언마운트 후에도 전역 참조가 유지됨
 *
 * ### 시나리오 5: 대량 마운트/언마운트
 * - 여러 컴포넌트를 빠르게 생성/제거
 * - 누수가 누적되는 패턴을 관찰
 *
 * ## 브라우저 호환성
 * - FinalizationRegistry는 Chrome 84+, Firefox 79+, Safari 14.1+에서 지원
 * - 미지원 브라우저에서는 추적이 작동하지 않음
 *
 * ## 주의사항
 * - GC는 브라우저가 결정하므로 즉시 발생하지 않을 수 있음
 * - 누수 의심이 표시되어도 곧 GC될 수 있음 (false positive)
 * - 실제 메모리 누수 확인은 Chrome DevTools Memory Profiler와 병행
 */

// 정상 컴포넌트 (누수 없음)
function CleanComponent({ id }: { id: string }) {
  useLeakWatch(`CleanComponent-${id}`);

  return (
    <Box label={`Clean-${id}`}>
      <div
        style={{
          padding: 16,
          background: "#d1fae5",
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <strong>✅ Clean Component {id}</strong>
        <p style={{ fontSize: 13, margin: "8px 0 0 0" }}>
          cleanup이 제대로 구현됨
        </p>
      </div>
    </Box>
  );
}

// 타이머 누수 컴포넌트
function LeakyTimerComponent({ id }: { id: string }) {
  useLeakWatch(`LeakyTimer-${id}`);

  // ❌ 나쁜 예: cleanup 없는 setInterval
  useState(() => {
    setInterval(() => {
      console.log(`LeakyTimer-${id} is still running...`);
    }, 2000);
    return undefined; // cleanup 없음!
  });

  return (
    <Box label={`LeakyTimer-${id}`}>
      <div
        style={{
          padding: 16,
          background: "#fecaca",
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <strong>❌ Leaky Timer {id}</strong>
        <p style={{ fontSize: 13, margin: "8px 0 0 0" }}>
          setInterval이 cleanup되지 않음
        </p>
      </div>
    </Box>
  );
}

// 이벤트 리스너 누수 컴포넌트
function LeakyEventComponent({ id }: { id: string }) {
  useLeakWatch(`LeakyEvent-${id}`);

  // ❌ 나쁜 예: 이벤트 리스너 제거 안 함
  useState(() => {
    const handler = () => {
      console.log(`LeakyEvent-${id} handling scroll...`);
    };
    window.addEventListener("scroll", handler);
    // removeEventListener 누락!
    return undefined;
  });

  return (
    <Box label={`LeakyEvent-${id}`}>
      <div
        style={{
          padding: 16,
          background: "#fed7aa",
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <strong>❌ Leaky Event Listener {id}</strong>
        <p style={{ fontSize: 13, margin: "8px 0 0 0" }}>
          scroll 이벤트 리스너가 정리 안 됨
        </p>
      </div>
    </Box>
  );
}

// 전역 변수 누수 컴포넌트
const globalRefs: any[] = [];

function LeakyGlobalComponent({ id }: { id: string }) {
  useLeakWatch(`LeakyGlobal-${id}`);

  // ❌ 나쁜 예: 전역 배열에 참조 저장
  useState(() => {
    const ref = { id, timestamp: Date.now() };
    globalRefs.push(ref);
    // 언마운트 시 제거 안 함!
    return undefined;
  });

  return (
    <Box label={`LeakyGlobal-${id}`}>
      <div
        style={{
          padding: 16,
          background: "#fde68a",
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <strong>❌ Leaky Global Reference {id}</strong>
        <p style={{ fontSize: 13, margin: "8px 0 0 0" }}>
          전역 배열이 컴포넌트를 참조
        </p>
      </div>
    </Box>
  );
}

export const LeakWatchTestPage = () => {
  // 시나리오 1: 정상 컴포넌트
  const [cleanComponents, setCleanComponents] = useState<string[]>([]);

  // 시나리오 2: 타이머 누수
  const [leakyTimerComponents, setLeakyTimerComponents] = useState<string[]>(
    []
  );

  // 시나리오 3: 이벤트 리스너 누수
  const [leakyEventComponents, setLeakyEventComponents] = useState<string[]>(
    []
  );

  // 시나리오 4: 전역 변수 누수
  const [leakyGlobalComponents, setLeakyGlobalComponents] = useState<string[]>(
    []
  );

  const addCleanComponent = () => {
    const id = `clean-${Date.now()}`;
    setCleanComponents([...cleanComponents, id]);
  };

  const removeCleanComponent = (id: string) => {
    setCleanComponents(cleanComponents.filter((c) => c !== id));
  };

  const clearCleanComponents = () => {
    setCleanComponents([]);
  };

  const addLeakyTimerComponent = () => {
    const id = `timer-${Date.now()}`;
    setLeakyTimerComponents([...leakyTimerComponents, id]);
  };

  const removeLeakyTimerComponent = (id: string) => {
    setLeakyTimerComponents(leakyTimerComponents.filter((c) => c !== id));
  };

  const clearLeakyTimerComponents = () => {
    setLeakyTimerComponents([]);
  };

  const addLeakyEventComponent = () => {
    const id = `event-${Date.now()}`;
    setLeakyEventComponents([...leakyEventComponents, id]);
  };

  const removeLeakyEventComponent = (id: string) => {
    setLeakyEventComponents(leakyEventComponents.filter((c) => c !== id));
  };

  const clearLeakyEventComponents = () => {
    setLeakyEventComponents([]);
  };

  const addLeakyGlobalComponent = () => {
    const id = `global-${Date.now()}`;
    setLeakyGlobalComponents([...leakyGlobalComponents, id]);
  };

  const removeLeakyGlobalComponent = (id: string) => {
    setLeakyGlobalComponents(leakyGlobalComponents.filter((c) => c !== id));
  };

  const clearLeakyGlobalComponents = () => {
    setLeakyGlobalComponents([]);
  };

  const clearAllGlobalRefs = () => {
    globalRefs.length = 0;
    alert("전역 참조를 모두 제거했습니다. 이제 GC가 진행될 수 있습니다.");
  };

  return (
    <div
      className="placeholder-page"
      style={{ minHeight: "200vh", paddingBottom: 100 }}
    >
      {/* LeakHUD 표시 */}
      <LeakHUD />

      <div className="placeholder-container" style={{ maxWidth: 1200 }}>
        <div className="placeholder-icon">💧</div>
        <h1>LeakWatch 메모리 누수 감지 테스트</h1>
        <p className="placeholder-description">
          컴포넌트 언마운트 후 가비지 컬렉션을 추적하여 메모리 누수를 탐지
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
            <strong>🔍 좌측 상단의 LeakHUD 읽는 법:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.8 }}>
              <li>
                <code
                  style={{
                    background: "#f3f4f6",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  alive 3
                </code>
                : 현재 마운트된 컴포넌트 인스턴스 수
              </li>
              <li>
                <code
                  style={{
                    background: "#fef3c7",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  ok
                </code>
                : 언마운트 후 정상적으로 가비지 컬렉션됨
              </li>
              <li>
                <code
                  style={{
                    background: "#fecaca",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  LEAK? 2
                </code>
                : 언마운트 후 15초가 지났는데도 GC 안 됨 (누수 의심!)
              </li>
            </ul>
          </div>

          <ol style={{ lineHeight: 2 }}>
            <li>아래 시나리오에서 컴포넌트를 생성합니다</li>
            <li>좌측 상단 HUD에서 "alive" 카운트가 증가하는 것을 확인합니다</li>
            <li>컴포넌트를 제거(언마운트)합니다</li>
            <li>15초 이상 기다립니다 (브라우저가 GC를 실행할 시간)</li>
            <li>
              <strong>정상:</strong> "ok" 상태로 유지됩니다
              <br />
              <strong>누수:</strong> "LEAK? N" 으로 표시됩니다
            </li>
            <li>콘솔에서 누수 컴포넌트의 로그가 계속 출력되는지 확인합니다</li>
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
            <strong>⚠️ 주의:</strong> GC는 브라우저가 필요할 때 실행되므로
            "LEAK?" 표시가 즉시 나타나지 않을 수 있습니다. 또한 일시적으로
            "LEAK?"로 표시되다가 곧 정상화될 수도 있습니다.
            <br />
            <br />
            <strong>확실한 누수 확인:</strong> Chrome DevTools → Memory → Take
            Heap Snapshot으로 실제 메모리 상태를 확인하세요.
          </div>
        </div>

        {/* 시나리오 1: 정상 컴포넌트 */}
        <div style={{ marginBottom: 30 }}>
          <h2>✅ 시나리오 1: 정상 컴포넌트 (누수 없음)</h2>
          <p>
            cleanup이 제대로 구현된 컴포넌트입니다. 언마운트 후 정상적으로
            가비지 컬렉션됩니다.
            <br />
            <strong>예상 결과:</strong> 언마운트 후 "ok" 상태 유지
          </p>

          <div
            style={{
              background: "#f0fdf4",
              border: "2px solid #10b981",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={addCleanComponent}
                style={{
                  padding: "10px 20px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ➕ 정상 컴포넌트 추가
              </button>
              <button
                onClick={clearCleanComponents}
                style={{
                  padding: "10px 20px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                🗑️ 모두 제거
              </button>
              <span
                style={{
                  padding: "8px 16px",
                  background: "#fff",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Count: {cleanComponents.length}
              </span>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {cleanComponents.map((id) => (
                <div
                  key={id}
                  style={{ display: "flex", gap: 8, alignItems: "stretch" }}
                >
                  <div style={{ flex: 1 }}>
                    <CleanComponent id={id} />
                  </div>
                  <button
                    onClick={() => removeCleanComponent(id)}
                    style={{
                      padding: "0 16px",
                      background: "#f87171",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>"정상 컴포넌트 추가" 버튼을 3번 클릭합니다</li>
              <li>
                좌측 상단 LeakHUD에서 "CleanComponent" 항목이 나타나고 alive 3이
                표시됩니다
              </li>
              <li>"모두 제거" 버튼을 클릭하여 컴포넌트들을 언마운트합니다</li>
              <li>15초 이상 기다립니다</li>
              <li>
                LeakHUD에서 "CleanComponent: alive 0 · ok" 로 표시되는지
                확인합니다
              </li>
              <li>콘솔에 "CleanComponent" 관련 로그가 없는지 확인합니다</li>
            </ol>
          </details>
        </div>

        {/* 시나리오 2: 타이머 누수 */}
        <div style={{ marginBottom: 30 }}>
          <h2>❌ 시나리오 2: 타이머 누수 (setInterval)</h2>
          <p>
            setInterval이 cleanup되지 않아 언마운트 후에도 계속 실행됩니다.
            <br />
            <strong>예상 결과:</strong> 언마운트 후 "LEAK? N" 표시, 콘솔 로그
            계속 출력
          </p>

          <div
            style={{
              background: "#fef2f2",
              border: "2px solid #ef4444",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={addLeakyTimerComponent}
                style={{
                  padding: "10px 20px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ➕ 누수 타이머 추가
              </button>
              <button
                onClick={clearLeakyTimerComponents}
                style={{
                  padding: "10px 20px",
                  background: "#991b1b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                🗑️ 모두 제거
              </button>
              <span
                style={{
                  padding: "8px 16px",
                  background: "#fff",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Count: {leakyTimerComponents.length}
              </span>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {leakyTimerComponents.map((id) => (
                <div
                  key={id}
                  style={{ display: "flex", gap: 8, alignItems: "stretch" }}
                >
                  <div style={{ flex: 1 }}>
                    <LeakyTimerComponent id={id} />
                  </div>
                  <button
                    onClick={() => removeLeakyTimerComponent(id)}
                    style={{
                      padding: "0 16px",
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {leakyTimerComponents.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: "#fef3c7",
                  borderRadius: 6,
                  border: "1px solid #f59e0b",
                }}
              >
                ⚠️ 콘솔을 열어두세요! 언마운트 후에도 2초마다 로그가 출력됩니다.
              </div>
            )}
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>브라우저 콘솔을 엽니다 (F12)</li>
              <li>"누수 타이머 추가" 버튼을 2번 클릭합니다</li>
              <li>
                콘솔에 2초마다 "LeakyTimer-xxx is still running..." 로그가
                출력됩니다
              </li>
              <li>"모두 제거" 버튼을 클릭하여 컴포넌트들을 언마운트합니다</li>
              <li>⚠️ 언마운트 후에도 콘솔 로그가 계속 출력됩니다!</li>
              <li>15초 이상 기다립니다</li>
              <li>LeakHUD에서 "LeakyTimer: alive 0 · LEAK? 2" 로 표시됩니다</li>
              <li>페이지를 새로고침해야 타이머가 정리됩니다</li>
            </ol>
          </details>

          <details style={{ marginTop: 8 }}>
            <summary
              style={{ cursor: "pointer", fontWeight: 600, color: "#10b981" }}
            >
              ✅ 올바른 구현 방법
            </summary>
            <pre
              style={{
                marginTop: 12,
                background: "#1e293b",
                color: "#e2e8f0",
                padding: 16,
                borderRadius: 8,
                overflow: "auto",
                fontSize: 13,
              }}
            >
              {`function CleanTimerComponent() {
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Running...");
    }, 2000);
    
    // ✅ cleanup에서 타이머 제거
    return () => clearInterval(interval);
  }, []);
  
  return <div>Clean Timer</div>;
}`}
            </pre>
          </details>
        </div>

        {/* 시나리오 3: 이벤트 리스너 누수 */}
        <div style={{ marginBottom: 30 }}>
          <h2>❌ 시나리오 3: 이벤트 리스너 누수</h2>
          <p>
            scroll 이벤트 리스너가 제거되지 않아 컴포넌트가 메모리에 남습니다.
            <br />
            <strong>예상 결과:</strong> 스크롤 시 언마운트된 컴포넌트의 로그
            출력
          </p>

          <div
            style={{
              background: "#fff7ed",
              border: "2px solid #f97316",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={addLeakyEventComponent}
                style={{
                  padding: "10px 20px",
                  background: "#f97316",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ➕ 누수 이벤트 추가
              </button>
              <button
                onClick={clearLeakyEventComponents}
                style={{
                  padding: "10px 20px",
                  background: "#9a3412",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                🗑️ 모두 제거
              </button>
              <span
                style={{
                  padding: "8px 16px",
                  background: "#fff",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Count: {leakyEventComponents.length}
              </span>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {leakyEventComponents.map((id) => (
                <div
                  key={id}
                  style={{ display: "flex", gap: 8, alignItems: "stretch" }}
                >
                  <div style={{ flex: 1 }}>
                    <LeakyEventComponent id={id} />
                  </div>
                  <button
                    onClick={() => removeLeakyEventComponent(id)}
                    style={{
                      padding: "0 16px",
                      background: "#f97316",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {leakyEventComponents.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: "#fef3c7",
                  borderRadius: 6,
                  border: "1px solid #f59e0b",
                }}
              >
                ⚠️ 컴포넌트를 언마운트한 후 페이지를 스크롤해보세요!
                <br />
                콘솔에 언마운트된 컴포넌트의 로그가 계속 출력됩니다.
              </div>
            )}
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>콘솔을 엽니다</li>
              <li>"누수 이벤트 추가" 버튼을 3번 클릭합니다</li>
              <li>
                페이지를 스크롤하면 콘솔에 "handling scroll..." 로그가
                출력됩니다
              </li>
              <li>"모두 제거" 버튼을 클릭하여 언마운트합니다</li>
              <li>페이지를 스크롤합니다</li>
              <li>⚠️ 언마운트된 컴포넌트의 로그가 여전히 출력됩니다!</li>
              <li>LeakHUD에서 "LEAK?" 상태를 확인합니다</li>
            </ol>
          </details>

          <details style={{ marginTop: 8 }}>
            <summary
              style={{ cursor: "pointer", fontWeight: 600, color: "#10b981" }}
            >
              ✅ 올바른 구현 방법
            </summary>
            <pre
              style={{
                marginTop: 12,
                background: "#1e293b",
                color: "#e2e8f0",
                padding: 16,
                borderRadius: 8,
                overflow: "auto",
                fontSize: 13,
              }}
            >
              {`function CleanEventComponent() {
  useEffect(() => {
    const handler = () => {
      console.log("Handling scroll...");
    };
    
    window.addEventListener("scroll", handler);
    
    // ✅ cleanup에서 이벤트 리스너 제거
    return () => window.removeEventListener("scroll", handler);
  }, []);
  
  return <div>Clean Event</div>;
}`}
            </pre>
          </details>
        </div>

        {/* 시나리오 4: 전역 변수 누수 */}
        <div style={{ marginBottom: 30 }}>
          <h2>❌ 시나리오 4: 전역 변수 누수</h2>
          <p>
            전역 배열이 컴포넌트 참조를 보관하고 있어 GC가 불가능합니다.
            <br />
            <strong>예상 결과:</strong> 전역 참조를 제거해야 GC가 진행됨
          </p>

          <div
            style={{
              background: "#fefce8",
              border: "2px solid #eab308",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={addLeakyGlobalComponent}
                style={{
                  padding: "10px 20px",
                  background: "#eab308",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ➕ 누수 전역 추가
              </button>
              <button
                onClick={clearLeakyGlobalComponents}
                style={{
                  padding: "10px 20px",
                  background: "#991b1b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                🗑️ 컴포넌트만 제거
              </button>
              <button
                onClick={clearAllGlobalRefs}
                style={{
                  padding: "10px 20px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                ✅ 전역 참조도 제거
              </button>
              <span
                style={{
                  padding: "8px 16px",
                  background: "#fff",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Components: {leakyGlobalComponents.length} | Global Refs:{" "}
                {globalRefs.length}
              </span>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {leakyGlobalComponents.map((id) => (
                <div
                  key={id}
                  style={{ display: "flex", gap: 8, alignItems: "stretch" }}
                >
                  <div style={{ flex: 1 }}>
                    <LeakyGlobalComponent id={id} />
                  </div>
                  <button
                    onClick={() => removeLeakyGlobalComponent(id)}
                    style={{
                      padding: "0 16px",
                      background: "#eab308",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {leakyGlobalComponents.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: "#fef3c7",
                  borderRadius: 6,
                  border: "1px solid #f59e0b",
                }}
              >
                ⚠️ 컴포넌트를 제거해도 전역 배열에 참조가 남아있습니다.
                <br />
                "전역 참조도 제거" 버튼을 눌러야 GC가 진행됩니다.
              </div>
            )}
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>"누수 전역 추가" 버튼을 3번 클릭합니다</li>
              <li>"Global Refs: 3"이 표시됩니다</li>
              <li>"컴포넌트만 제거" 버튼을 클릭합니다</li>
              <li>"Components: 0" 이지만 "Global Refs: 3"은 그대로입니다</li>
              <li>15초 이상 기다립니다</li>
              <li>LeakHUD에서 "LEAK? 3" 상태를 확인합니다</li>
              <li>"전역 참조도 제거" 버튼을 클릭합니다</li>
              <li>조금 기다리면 "ok" 상태로 변합니다 (GC 완료)</li>
            </ol>
          </details>

          <details style={{ marginTop: 8 }}>
            <summary
              style={{ cursor: "pointer", fontWeight: 600, color: "#10b981" }}
            >
              ✅ 올바른 구현 방법
            </summary>
            <pre
              style={{
                marginTop: 12,
                background: "#1e293b",
                color: "#e2e8f0",
                padding: 16,
                borderRadius: 8,
                overflow: "auto",
                fontSize: 13,
              }}
            >
              {`const globalRefs: any[] = [];

function CleanGlobalComponent({ id }: { id: string }) {
  useEffect(() => {
    const ref = { id, timestamp: Date.now() };
    globalRefs.push(ref);
    
    // ✅ cleanup에서 전역 배열에서도 제거
    return () => {
      const index = globalRefs.indexOf(ref);
      if (index > -1) {
        globalRefs.splice(index, 1);
      }
    };
  }, [id]);
  
  return <div>Clean Global Component</div>;
}`}
            </pre>
          </details>
        </div>

        {/* 실전 가이드 */}
        <div
          style={{
            background: "#f0fdf4",
            border: "2px solid #10b981",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>🎯 메모리 누수 방지 실전 가이드</h2>

          <h3>1. 타이머 관리</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>setInterval, setTimeout은 항상 cleanup에서 clear</li>
            <li>requestAnimationFrame도 cancelAnimationFrame으로 정리</li>
            <li>debounce/throttle 라이브러리 함수도 cancel 메서드 확인</li>
          </ul>

          <h3>2. 이벤트 리스너 관리</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>addEventListener는 항상 removeEventListener와 쌍으로</li>
            <li>window, document 같은 전역 객체 이벤트는 특히 주의</li>
            <li>커스텀 이벤트 시스템도 unsubscribe 구현</li>
          </ul>

          <h3>3. 외부 라이브러리 정리</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>지도 API (Google Maps, Mapbox): map.remove()</li>
            <li>차트 라이브러리 (Chart.js, D3): destroy() 또는 remove()</li>
            <li>WebSocket, EventSource: close() 호출</li>
            <li>Intersection Observer, Mutation Observer: disconnect()</li>
          </ul>

          <h3>4. 전역 변수/클로저 주의</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>window 객체에 직접 할당 금지</li>
            <li>전역 배열/맵에 저장 시 cleanup에서 제거</li>
            <li>클로저가 큰 객체를 캡처하지 않도록 주의</li>
          </ul>

          <h3>5. React 특수 케이스</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>언마운트 후 setState 금지 (isMounted 플래그 활용)</li>
            <li>useEffect 의존성 배열 정확하게 지정</li>
            <li>Context 구독은 자동 정리되지만 커스텀 구독은 수동 정리</li>
          </ul>

          <h3>6. 디버깅 도구</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <strong>LeakWatch:</strong> 빠른 1차 스크리닝
            </li>
            <li>
              <strong>Chrome DevTools Memory:</strong> 정확한 메모리 프로파일링
            </li>
            <li>
              <strong>React DevTools Profiler:</strong> 컴포넌트 렌더링 분석
            </li>
            <li>
              <strong>Performance API:</strong> 메모리 사용량 측정
            </li>
          </ul>
        </div>

        {/* Chrome DevTools 가이드 */}
        <div
          style={{
            background: "#eff6ff",
            border: "2px solid #3b82f6",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            🔍 Chrome DevTools로 메모리 누수 확인
          </h2>

          <h3>Heap Snapshot 방법</h3>
          <ol style={{ lineHeight: 1.8 }}>
            <li>Chrome DevTools 열기 (F12)</li>
            <li>Memory 탭으로 이동</li>
            <li>"Heap snapshot" 선택 후 "Take snapshot"</li>
            <li>컴포넌트를 마운트하고 스냅샷 찍기 (Snapshot A)</li>
            <li>컴포넌트를 언마운트하고 스냅샷 찍기 (Snapshot B)</li>
            <li>Snapshot B에서 "Comparison" 드롭다운으로 A와 비교</li>
            <li>
              Detached DOM nodes나 컴포넌트 인스턴스를 찾아 참조 체인 분석
            </li>
          </ol>

          <h3>Allocation Timeline 방법</h3>
          <ol style={{ lineHeight: 1.8 }}>
            <li>"Allocation instrumentation on timeline" 선택</li>
            <li>"Start" 버튼 클릭</li>
            <li>컴포넌트를 마운트/언마운트 반복</li>
            <li>"Stop" 버튼 클릭</li>
            <li>파란색 막대(할당)가 있는데 회색 막대(해제)가 없다면 누수</li>
          </ol>

          <h3>유용한 필터</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <code>Detached</code>: 분리된 DOM 노드 찾기
            </li>
            <li>
              <code>FiberNode</code>: React 컴포넌트 인스턴스 찾기
            </li>
            <li>
              <code>closure</code>: 클로저에 의한 참조 찾기
            </li>
            <li>
              <code>Interval</code> 또는 <code>Timeout</code>: 정리 안 된 타이머
            </li>
          </ul>
        </div>

        <Link to="/dx-kit" className="placeholder-back-link">
          ← DX Kit 허브로 돌아가기
        </Link>
      </div>
    </div>
  );
};
