import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PerfHUD } from "../../lib/dx-kit";
import "../PlaceholderPage.css";

/**
 * # PerfHUD 테스트 페이지
 *
 * ## 개요
 * PerfHUD는 실시간 성능 모니터링 오버레이로, 다음 세 가지 핵심 메트릭을 추적합니다:
 *
 * ### 1. FPS (Frames Per Second)
 * - 현재 프레임 레이트를 실시간으로 측정합니다
 * - requestAnimationFrame을 사용하여 500ms마다 샘플링합니다
 * - 일반적으로 60fps가 이상적이며, 45fps 이하일 때 경고 상태가 됩니다
 * - **사용 사례**: 애니메이션 성능, 렌더링 부하 감지
 *
 * ### 2. Heap Memory
 * - JavaScript 힙 메모리 사용량을 MB 단위로 표시합니다
 * - Chrome의 performance.memory API를 사용합니다 (Chrome/Edge에서만 작동)
 * - 1초마다 업데이트됩니다
 * - **사용 사례**: 메모리 누수 감지, 메모리 사용 패턴 파악
 *
 * ### 3. Long Tasks
 * - 50ms 이상 소요되는 작업을 감지합니다
 * - PerformanceObserver API를 사용합니다
 * - 누적 카운트로 표시됩니다
 * - **사용 사례**: 메인 스레드 블로킹 작업 감지
 *
 * ## Props
 *
 * ```typescript
 * interface PerfHUDProps {
 *   danger?: {
 *     fps: number;      // 이 값 이하면 위험 상태 (기본값: 45)
 *     heapMB: number;   // 이 값 이상이면 위험 상태 (기본값: 300)
 *   };
 *   position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"; // HUD 위치 (기본값: "top-right")
 * }
 * ```
 *
 * ## 테스트 시나리오
 *
 * ### 시나리오 1: FPS 저하 테스트
 * - 무거운 계산을 수행하여 프레임 레이트를 의도적으로 떨어뜨립니다
 * - HUD의 FPS 값이 감소하고, 배경색이 빨간색으로 변하는지 확인합니다
 *
 * ### 시나리오 2: 메모리 증가 테스트
 * - 대량의 데이터를 할당하여 힙 메모리를 증가시킵니다
 * - HUD의 Heap 값이 증가하는지 확인합니다
 *
 * ### 시나리오 3: Long Task 발생 테스트
 * - 동기 작업으로 메인 스레드를 블로킹합니다
 * - LongTasks 카운터가 증가하는지 확인합니다
 *
 * ### 시나리오 4: 위치 변경 테스트
 * - HUD의 위치를 4개 코너로 변경해봅니다
 * - 각 위치에서 올바르게 표시되는지 확인합니다
 *
 * ### 시나리오 5: 임계값 커스터마이징
 * - danger 임계값을 변경하여 경고 상태 트리거를 테스트합니다
 *
 * ## 브라우저 호환성
 * - FPS: 모든 모던 브라우저
 * - Heap Memory: Chrome/Edge만 지원 (다른 브라우저에서는 "N/A" 표시)
 * - Long Tasks: Chrome/Edge 지원
 */

export const PerfHUDTestPage = () => {
  // HUD 설정
  const [hudPosition, setHudPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right"
  >("top-right");
  const [dangerFps, setDangerFps] = useState(45);
  const [dangerHeap, setDangerHeap] = useState(300);

  // 시나리오 1: FPS 저하
  const [isDroppingFPS, setIsDroppingFPS] = useState(false);

  useEffect(() => {
    if (!isDroppingFPS) return;

    let raf: number;
    const heavyLoop = () => {
      // 무거운 계산으로 프레임 드롭 유발
      const start = performance.now();
      while (performance.now() - start < 80) {
        // 80ms 동안 CPU 점유
        Math.random() * Math.random();
      }
      raf = requestAnimationFrame(heavyLoop);
    };
    raf = requestAnimationFrame(heavyLoop);

    return () => cancelAnimationFrame(raf);
  }, [isDroppingFPS]);

  // 시나리오 2: 메모리 증가
  const [memoryData, setMemoryData] = useState<number[][]>([]);

  const allocateMemory = () => {
    // 약 10MB의 데이터 할당
    const chunk = Array.from({ length: 1000000 }, () => Math.random());
    setMemoryData((prev) => [...prev, chunk]);
  };

  const clearMemory = () => {
    setMemoryData([]);
  };

  // 시나리오 3: Long Task 발생
  const triggerLongTask = () => {
    const start = performance.now();
    // 100ms 동안 메인 스레드 블로킹
    while (performance.now() - start < 100) {
      Math.random() * Math.random();
    }
  };

  // 시나리오 4: 연속 Long Task
  const [isContinuousLongTask, setIsContinuousLongTask] = useState(false);

  useEffect(() => {
    if (!isContinuousLongTask) return;

    const interval = setInterval(() => {
      const start = performance.now();
      while (performance.now() - start < 60) {
        Math.random() * Math.random();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isContinuousLongTask]);

  // 시나리오 5: 복합 스트레스 테스트
  const [isStressTest, setIsStressTest] = useState(false);

  useEffect(() => {
    if (!isStressTest) return;

    const interval = setInterval(() => {
      // 메모리 할당
      const chunk = Array.from({ length: 500000 }, () => Math.random());
      setMemoryData((prev) => [...prev.slice(-5), chunk]); // 최근 5개만 유지
    }, 1000);

    let raf: number;
    const loop = () => {
      const start = performance.now();
      while (performance.now() - start < 40) {
        Math.random() * Math.random();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(raf);
    };
  }, [isStressTest]);

  return (
    <div
      className="placeholder-page"
      style={{ minHeight: "150vh", paddingBottom: 100 }}
    >
      {/* PerfHUD 표시 */}
      <PerfHUD
        position={hudPosition}
        danger={{ fps: dangerFps, heapMB: dangerHeap }}
      />

      <div className="placeholder-container" style={{ maxWidth: 1200 }}>
        <div className="placeholder-icon">📊</div>
        <h1>PerfHUD 성능 모니터링 테스트</h1>
        <p className="placeholder-description">
          실시간 FPS, 메모리, Long Task 모니터링 캡슐
        </p>

        {/* HUD 설정 패널 */}
        <div
          style={{
            background: "#f0f9ff",
            border: "2px solid #0ea5e9",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>⚙️ HUD 설정</h2>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
            >
              HUD 위치
            </label>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {(
                [
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ] as const
              ).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setHudPosition(pos)}
                  style={{
                    padding: "8px 16px",
                    background: hudPosition === pos ? "#0ea5e9" : "#fff",
                    color: hudPosition === pos ? "#fff" : "#000",
                    border: "1px solid #0ea5e9",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div>
              <label
                style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
              >
                위험 FPS 임계값 (현재: {dangerFps})
              </label>
              <input
                type="range"
                min="20"
                max="60"
                value={dangerFps}
                onChange={(e) => setDangerFps(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <small>FPS가 이 값 이하로 떨어지면 빨간색으로 표시됩니다</small>
            </div>

            <div>
              <label
                style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
              >
                위험 Heap 임계값 (현재: {dangerHeap}MB)
              </label>
              <input
                type="range"
                min="100"
                max="500"
                step="10"
                value={dangerHeap}
                onChange={(e) => setDangerHeap(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <small>힙 메모리가 이 값 이상이면 빨간색으로 표시됩니다</small>
            </div>
          </div>
        </div>

        {/* 시나리오 1: FPS 저하 */}
        <div
          style={{
            background: "#fef3c7",
            border: "2px solid #f59e0b",
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>🎯 시나리오 1: FPS 저하 테스트</h2>
          <p>
            requestAnimationFrame 내에서 무거운 계산을 수행하여 프레임 레이트를
            떨어뜨립니다.
            <br />
            <strong>예상 결과:</strong> HUD의 FPS 값이 감소하고, 배경색이
            빨간색으로 변합니다.
          </p>

          <button
            onClick={() => setIsDroppingFPS(!isDroppingFPS)}
            style={{
              padding: "12px 24px",
              background: isDroppingFPS ? "#ef4444" : "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {isDroppingFPS ? "⏹️ FPS 드롭 중지" : "▶️ FPS 드롭 시작"}
          </button>

          {isDroppingFPS && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "#fff",
                borderRadius: 6,
              }}
            >
              ⚠️ 현재 프레임 드롭이 활성화되어 있습니다. 우측 상단의 PerfHUD를
              확인하세요!
            </div>
          )}

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 방법 상세
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>"FPS 드롭 시작" 버튼을 클릭합니다</li>
              <li>우측 상단 (또는 설정한 위치)의 PerfHUD를 관찰합니다</li>
              <li>FPS 값이 10-20 정도로 떨어지는 것을 확인합니다</li>
              <li>HUD 배경색이 검은색에서 빨간색으로 변하는지 확인합니다</li>
              <li>콘솔에 "[PerfHUD] danger" 로그가 출력되는지 확인합니다</li>
              <li>"FPS 드롭 중지" 버튼을 클릭하여 정상화합니다</li>
              <li>FPS가 다시 60에 가까워지는지 확인합니다</li>
            </ol>
          </details>
        </div>

        {/* 시나리오 2: 메모리 증가 */}
        <div
          style={{
            background: "#dbeafe",
            border: "2px solid #3b82f6",
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>💾 시나리오 2: 메모리 증가 테스트</h2>
          <p>
            대량의 배열 데이터를 할당하여 힙 메모리를 증가시킵니다.
            <br />
            <strong>예상 결과:</strong> HUD의 Heap 값이 증가합니다.
            (Chrome/Edge만 작동)
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={allocateMemory}
              style={{
                padding: "12px 24px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              ➕ 메모리 할당 (~10MB)
            </button>

            <button
              onClick={clearMemory}
              style={{
                padding: "12px 24px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              🗑️ 메모리 해제
            </button>

            <span
              style={{
                padding: "8px 16px",
                background: "#fff",
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              할당된 청크: {memoryData.length}개
            </span>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 방법 상세
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>PerfHUD의 초기 Heap 값을 확인합니다 (예: 50MB)</li>
              <li>"메모리 할당" 버튼을 여러 번 클릭합니다</li>
              <li>Heap 값이 점진적으로 증가하는지 확인합니다</li>
              <li>
                설정한 임계값(기본 300MB)을 넘으면 빨간색으로 변하는지
                확인합니다
              </li>
              <li>"메모리 해제" 버튼을 클릭합니다</li>
              <li>
                가비지 컬렉션 후 Heap 값이 감소하는지 확인합니다 (시간이 걸릴 수
                있음)
              </li>
            </ol>
            <div
              style={{
                padding: 12,
                background: "#fff",
                borderRadius: 6,
                marginTop: 8,
              }}
            >
              ℹ️ <strong>Note:</strong> Heap Memory는 Chrome과 Edge에서만
              작동합니다. Firefox나 Safari에서는 "N/A"로 표시됩니다.
            </div>
          </details>
        </div>

        {/* 시나리오 3: Long Task */}
        <div
          style={{
            background: "#fce7f3",
            border: "2px solid #ec4899",
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>⏱️ 시나리오 3: Long Task 발생 테스트</h2>
          <p>
            50ms 이상 소요되는 동기 작업을 실행하여 Long Task를 발생시킵니다.
            <br />
            <strong>예상 결과:</strong> HUD의 LongTasks 카운터가 증가합니다.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={triggerLongTask}
              style={{
                padding: "12px 24px",
                background: "#ec4899",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              ⚡ 단일 Long Task 발생 (100ms)
            </button>

            <button
              onClick={() => setIsContinuousLongTask(!isContinuousLongTask)}
              style={{
                padding: "12px 24px",
                background: isContinuousLongTask ? "#ef4444" : "#8b5cf6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              {isContinuousLongTask
                ? "⏹️ 연속 Long Task 중지"
                : "🔁 연속 Long Task 시작"}
            </button>
          </div>

          {isContinuousLongTask && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "#fff",
                borderRadius: 6,
              }}
            >
              ⚠️ 0.5초마다 60ms Long Task가 발생하고 있습니다.
            </div>
          )}

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 방법 상세
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>PerfHUD의 초기 LongTasks 값을 확인합니다 (보통 0)</li>
              <li>"단일 Long Task 발생" 버튼을 여러 번 클릭합니다</li>
              <li>LongTasks 카운터가 증가하는지 확인합니다</li>
              <li>"연속 Long Task 시작" 버튼을 클릭합니다</li>
              <li>LongTasks 값이 자동으로 증가하는지 확인합니다</li>
              <li>동시에 FPS도 떨어질 수 있습니다</li>
              <li>"연속 Long Task 중지" 버튼으로 테스트를 종료합니다</li>
            </ol>
            <div
              style={{
                padding: 12,
                background: "#fff",
                borderRadius: 6,
                marginTop: 8,
              }}
            >
              ℹ️ <strong>Note:</strong> Long Task API는 Chrome과 Edge에서만
              작동합니다.
            </div>
          </details>
        </div>

        {/* 시나리오 4: 복합 스트레스 테스트 */}
        <div
          style={{
            background: "#fee2e2",
            border: "2px solid #dc2626",
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>🔥 시나리오 4: 복합 스트레스 테스트</h2>
          <p>
            FPS 저하와 메모리 증가를 동시에 발생시켜 전체적인 성능 저하를
            시뮬레이션합니다.
            <br />
            <strong>예상 결과:</strong> 모든 메트릭이 동시에 악화되는 것을
            관찰할 수 있습니다.
          </p>

          <button
            onClick={() => setIsStressTest(!isStressTest)}
            style={{
              padding: "16px 32px",
              background: isStressTest ? "#ef4444" : "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {isStressTest
              ? "⏹️ 스트레스 테스트 중지"
              : "🚀 스트레스 테스트 시작"}
          </button>

          {isStressTest && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "#fff",
                borderRadius: 6,
                border: "2px solid #dc2626",
              }}
            >
              <strong>⚠️ 주의:</strong> 복합 스트레스 테스트가 진행 중입니다!
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>FPS가 30-40 정도로 떨어질 것입니다</li>
                <li>메모리가 점진적으로 증가할 것입니다</li>
                <li>Long Tasks가 지속적으로 발생할 것입니다</li>
              </ul>
            </div>
          )}

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 방법 상세
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>"스트레스 테스트 시작" 버튼을 클릭합니다</li>
              <li>PerfHUD의 모든 메트릭을 동시에 관찰합니다</li>
              <li>FPS가 떨어지는 것을 확인합니다</li>
              <li>Heap이 천천히 증가하는 것을 확인합니다</li>
              <li>LongTasks 카운터가 증가하는 것을 확인합니다</li>
              <li>HUD가 빨간색으로 변하는지 확인합니다</li>
              <li>페이지 전체의 반응성이 저하되는 것을 체감합니다</li>
              <li>충분히 관찰한 후 "중지" 버튼을 클릭합니다</li>
              <li>메트릭이 점진적으로 정상화되는 것을 확인합니다</li>
            </ol>
          </details>
        </div>

        {/* 사용 팁 */}
        <div
          style={{
            background: "#f0fdf4",
            border: "2px solid #10b981",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>💡 PerfHUD 활용 팁</h2>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <strong>개발 중 항상 켜두기:</strong>
              개발 환경에서 PerfHUD를 항상 활성화하여 의도치 않은 성능 저하를
              즉시 감지하세요.
            </li>
            <li>
              <strong>임계값 조정:</strong>
              프로젝트의 성능 목표에 맞게 danger 임계값을 조정하세요. 예: 모바일
              타겟이면 FPS 임계값을 더 높게 설정.
            </li>
            <li>
              <strong>Long Task 모니터링:</strong>
              Long Task가 자주 발생하면 작업을 Web Worker로 이동하거나
              requestIdleCallback을 사용하는 것을 고려하세요.
            </li>
            <li>
              <strong>메모리 트렌드 관찰:</strong>
              특정 액션 후 메모리가 계속 증가하면 메모리 누수를 의심하세요.
              LeakHUD와 함께 사용하면 더 효과적입니다.
            </li>
            <li>
              <strong>프로덕션에서 제거:</strong>
              PerfHUD는 개발 도구이므로 프로덕션 빌드에서는 제외하세요. 환경
              변수로 조건부 렌더링하는 것을 추천합니다.
            </li>
          </ul>
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

          <h3>기본 사용법</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`import { PerfHUD } from "../lib/dx-kit";

function App() {
  return (
    <>
      <PerfHUD />
      {/* 나머지 앱 컴포넌트 */}
    </>
  );
}`}
          </pre>

          <h3>커스터마이징</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`<PerfHUD 
  position="bottom-right"
  danger={{ 
    fps: 30,    // 모바일 타겟
    heapMB: 500 // 더 큰 허용치
  }}
/>`}
          </pre>

          <h3>조건부 렌더링 (프로덕션 제외)</h3>
          <pre
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`{process.env.NODE_ENV === 'development' && (
  <PerfHUD position="top-right" />
)}`}
          </pre>
        </div>

        <Link to="/dx-kit" className="placeholder-back-link">
          ← DX Kit 허브로 돌아가기
        </Link>
      </div>
    </div>
  );
};
