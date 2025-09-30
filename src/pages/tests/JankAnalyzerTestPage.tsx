import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { JankAnalyzer } from "../../lib/dx-kit";
import "../PlaceholderPage.css";

/**
 * # JankAnalyzer 스크롤 jank 감지 테스트 페이지
 *
 * ## 개요
 * JankAnalyzer는 스크롤 성능을 실시간으로 모니터링하여
 * 프레임 드롭(jank)이 발생하는 지점을 시각적으로 표시하는 도구입니다.
 *
 * ### Jank란?
 * - **정의**: 부드러운 60fps 애니메이션/스크롤이 끊기는 현상
 * - **원인**: 프레임 간 간격이 16.7ms(1/60초)를 크게 초과할 때 발생
 * - **영향**: 사용자 경험 저하, "버벅임" 체감
 * - **목표**: 모든 프레임을 16.7ms 이내에 처리하여 60fps 유지
 *
 * ### 핵심 개념
 *
 * #### 1. 60fps 목표
 * - 1초 = 1000ms
 * - 60fps = 1000ms ÷ 60 = 16.7ms per frame
 * - 각 프레임을 16.7ms 안에 처리해야 부드러운 스크롤
 *
 * #### 2. Frame Drop (프레임 드롭)
 * - 프레임 처리 시간이 16.7ms를 초과하면 프레임 스킵
 * - 예: 33ms 걸리면 → 2프레임 스킵 → 30fps로 저하
 * - 사용자는 "끊김"으로 체감
 *
 * #### 3. Jank 감지 방식
 * - scroll 이벤트 발생 시 이전 이벤트와의 시간 간격(dt) 측정
 * - dt가 16.7ms * (1 + threshold)를 초과하면 jank로 판정
 * - 기본 threshold 0.2 → 16.7 * 1.2 = 20ms 초과 시 jank
 *
 * ### JankAnalyzer 기능
 *
 * #### 1. 실시간 감지
 * - requestAnimationFrame과 scroll 이벤트로 프레임 타이밍 추적
 * - threshold를 초과하는 프레임을 즉시 감지
 *
 * #### 2. 시각적 표시
 * - jank가 발생한 스크롤 위치에 빨간 선 표시
 * - 최근 5개까지 화면에 표시
 * - 우측 하단 HUD에 총 jank 발생 횟수 표시
 *
 * #### 3. 튜닝 가능한 민감도
 * - threshold 값으로 민감도 조절
 * - 0.1 = 매우 민감 (18.4ms 초과 시 감지)
 * - 0.2 = 적당 (20ms 초과 시 감지)
 * - 0.5 = 덜 민감 (25ms 초과 시 감지)
 *
 * ## Props
 *
 * ```typescript
 * interface JankAnalyzerProps {
 *   threshold?: number;  // jank 판정 임계값 (기본값: 0.2)
 *                        // 실제 임계값 = 16.7ms * (1 + threshold)
 * }
 * ```
 *
 * ## 테스트 시나리오
 *
 * ### 시나리오 1: 부드러운 스크롤 (jank 없음)
 * - 가벼운 콘텐츠를 빠르게 스크롤
 * - jank가 거의 발생하지 않음
 *
 * ### 시나리오 2: 무거운 렌더링으로 jank 유발
 * - 많은 이미지, 복잡한 레이아웃
 * - 스크롤 시 재렌더링으로 프레임 드롭
 *
 * ### 시나리오 3: 동적 콘텐츠 로딩
 * - 스크롤 시 새 콘텐츠 로드
 * - 데이터 페칭, 이미지 로딩으로 jank 발생
 *
 * ### 시나리오 4: 고의적인 메인 스레드 블로킹
 * - 스크롤 이벤트 핸들러에서 무거운 계산
 * - 명백한 jank 발생
 *
 * ### 시나리오 5: threshold 민감도 비교
 * - 다양한 threshold 값으로 감지 빈도 비교
 *
 * ## 최적화 전략
 * - Intersection Observer로 뷰포트 밖 콘텐츠 지연 렌더
 * - CSS containment로 레이아웃 범위 제한
 * - 이미지 lazy loading
 * - 가상화 (react-window, react-virtualized)
 * - passive event listener 사용
 * - will-change CSS 속성 활용
 */

export const JankAnalyzerTestPage = () => {
  const [threshold, setThreshold] = useState(0.2);
  const [isHeavyRenderActive, setIsHeavyRenderActive] = useState(false);
  const [blockMainThread, setBlockMainThread] = useState(false);

  // 스크롤 이벤트에서 메인 스레드 블로킹
  useEffect(() => {
    if (!blockMainThread) return;

    const handler = () => {
      // 50ms 동안 메인 스레드 블로킹
      const start = performance.now();
      while (performance.now() - start < 50) {
        Math.random() * Math.random();
      }
    };

    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, [blockMainThread]);

  // 가벼운 콘텐츠
  const lightItems = Array.from({ length: 50 }, (_, i) => i);

  // 무거운 콘텐츠
  const heavyItems = Array.from({ length: 100 }, (_, i) => i);

  return (
    <div className="placeholder-page" style={{ paddingBottom: 100 }}>
      {/* JankAnalyzer 활성화 */}
      <JankAnalyzer threshold={threshold} />

      <div className="placeholder-container" style={{ maxWidth: 1200 }}>
        <div className="placeholder-icon">📊</div>
        <h1>JankAnalyzer 스크롤 Jank 감지 테스트</h1>
        <p className="placeholder-description">
          스크롤 성능을 실시간 모니터링하여 프레임 드롭 지점을 시각화
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
            <strong>🔍 JankAnalyzer 읽는 법:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.8 }}>
              <li>
                <strong style={{ color: "#ef4444" }}>빨간 수평선:</strong>{" "}
                jank가 발생한 스크롤 위치
              </li>
              <li>
                <strong>우측 하단 HUD:</strong> 총 jank 발생 횟수 (누적)
              </li>
              <li>최근 5개의 jank만 화면에 표시됩니다</li>
              <li>
                threshold = {threshold} → 임계값 ={" "}
                {(16.7 * (1 + threshold)).toFixed(1)}ms
              </li>
            </ul>
          </div>

          <ol style={{ lineHeight: 2 }}>
            <li>아래 시나리오들을 활성화합니다</li>
            <li>페이지를 빠르게 스크롤합니다</li>
            <li>빨간 선이 나타나는 위치를 관찰합니다</li>
            <li>우측 하단 HUD에서 jank 카운트를 확인합니다</li>
            <li>어떤 콘텐츠에서 jank가 많이 발생하는지 분석합니다</li>
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
            <strong>💡 팁:</strong> 빠른 스크롤일수록 jank가 더 잘 감지됩니다.
            마우스 휠을 빠르게 돌리거나 스크롤바를 드래그해보세요!
          </div>
        </div>

        {/* threshold 설정 */}
        <div
          style={{
            background: "#f3f4f6",
            borderRadius: 12,
            padding: 24,
            marginBottom: 30,
          }}
        >
          <h2 style={{ marginTop: 0 }}>⚙️ Jank 감지 민감도 설정</h2>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
            >
              Threshold: {threshold}
              <span style={{ marginLeft: 12, color: "#6b7280" }}>
                (임계값: {(16.7 * (1 + threshold)).toFixed(1)}ms)
              </span>
            </label>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              style={{ width: "100%", maxWidth: 600 }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                maxWidth: 600,
                fontSize: 12,
                color: "#6b7280",
                marginTop: 4,
              }}
            >
              <span>0.05 (매우 민감)</span>
              <span>0.5 (적당)</span>
              <span>1.0 (둔감)</span>
            </div>
          </div>

          <div
            style={{
              padding: 12,
              background: "#fff",
              borderRadius: 6,
            }}
          >
            <strong>Threshold 설명:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.8 }}>
              <li>
                <strong>0.1 이하:</strong> 작은 프레임 지연도 감지 (개발 시
                유용)
              </li>
              <li>
                <strong>0.2 (권장):</strong> 체감 가능한 jank만 감지
              </li>
              <li>
                <strong>0.5 이상:</strong> 심각한 jank만 감지
              </li>
            </ul>
          </div>
        </div>

        {/* 시나리오 1: 가벼운 콘텐츠 */}
        <div style={{ marginBottom: 30 }}>
          <h2>✅ 시나리오 1: 가벼운 콘텐츠 (jank 적음)</h2>
          <p>
            단순한 텍스트 리스트를 빠르게 스크롤합니다.
            <br />
            <strong>예상:</strong> jank가 거의 발생하지 않거나 매우 적음
          </p>

          <div
            style={{
              background: "#f0fdf4",
              border: "2px solid #10b981",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Light Content List</h3>
            <div
              style={{
                maxHeight: 300,
                overflow: "auto",
                background: "#fff",
                borderRadius: 8,
                padding: 16,
              }}
            >
              {lightItems.map((i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    background: "#f3f4f6",
                    borderRadius: 4,
                  }}
                >
                  Light Item {i} - Simple text content
                </div>
              ))}
            </div>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>위 박스 안을 빠르게 스크롤합니다</li>
              <li>빨간 선이 거의 나타나지 않는 것을 확인합니다</li>
              <li>
                우측 하단 HUD에서 jank 카운트가 0~2 정도인 것을 확인합니다
              </li>
              <li>부드러운 스크롤 경험을 체감합니다</li>
            </ol>
          </details>
        </div>

        {/* 시나리오 2: 무거운 콘텐츠 */}
        <div style={{ marginBottom: 30 }}>
          <h2>❌ 시나리오 2: 무거운 렌더링 (jank 많음)</h2>
          <p>
            복잡한 레이아웃과 많은 요소를 스크롤합니다.
            <br />
            <strong>예상:</strong> jank가 빈번하게 발생
          </p>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isHeavyRenderActive}
                onChange={(e) => setIsHeavyRenderActive(e.target.checked)}
                style={{ marginRight: 8, width: 20, height: 20 }}
              />
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                무거운 콘텐츠 활성화 (스크롤 성능 저하)
              </span>
            </label>
          </div>

          {isHeavyRenderActive && (
            <div
              style={{
                background: "#fef2f2",
                border: "2px solid #ef4444",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Heavy Content List</h3>
              <div
                style={{
                  maxHeight: 400,
                  overflow: "auto",
                  background: "#fff",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                {heavyItems.map((i) => (
                  <div
                    key={i}
                    style={{
                      padding: 16,
                      marginBottom: 12,
                      background: `linear-gradient(135deg, ${`hsl(${
                        i * 3.6
                      }, 70%, 85%)`}, ${`hsl(${
                        (i * 3.6 + 30) % 360
                      }, 70%, 90%)`})`,
                      borderRadius: 8,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <strong>Heavy Item {i}</strong>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 4,
                      }}
                    >
                      {Array.from({ length: 10 }, (_, j) => (
                        <div
                          key={j}
                          style={{
                            padding: 4,
                            background: "#fff",
                            borderRadius: 4,
                            fontSize: 10,
                            textAlign: "center",
                          }}
                        >
                          {j}
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>"무거운 콘텐츠 활성화" 체크박스를 선택합니다</li>
              <li>박스 안을 빠르게 스크롤합니다</li>
              <li>여러 개의 빨간 선이 나타나는 것을 확인합니다</li>
              <li>우측 하단 HUD에서 jank 카운트가 증가합니다</li>
              <li>스크롤이 시나리오 1보다 덜 부드러운 것을 체감합니다</li>
            </ol>
          </details>
        </div>

        {/* 시나리오 3: 메인 스레드 블로킹 */}
        <div style={{ marginBottom: 30 }}>
          <h2>🚫 시나리오 3: 메인 스레드 블로킹 (심각한 jank)</h2>
          <p>
            스크롤 이벤트 핸들러에서 의도적으로 50ms 동안 메인 스레드를
            블로킹합니다.
            <br />
            <strong>예상:</strong> 모든 스크롤에서 jank 발생
          </p>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={blockMainThread}
                onChange={(e) => setBlockMainThread(e.target.checked)}
                style={{ marginRight: 8, width: 20, height: 20 }}
              />
              <span style={{ fontSize: 16, fontWeight: 600, color: "#dc2626" }}>
                ⚠️ 메인 스레드 블로킹 활성화 (극심한 jank)
              </span>
            </label>
          </div>

          {blockMainThread && (
            <div
              style={{
                padding: 16,
                background: "#fef2f2",
                border: "2px solid #dc2626",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <strong>⚠️ 경고:</strong> 메인 스레드 블로킹이 활성화되었습니다!
              <br />
              페이지 전체를 스크롤할 때 매우 버벅일 것입니다.
            </div>
          )}

          <div
            style={{
              background: "#fff7ed",
              border: "2px solid #f97316",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Blocking Scroll Area</h3>
            <p>
              이 영역뿐만 아니라 <strong>페이지 전체</strong>를 스크롤할 때
              블로킹이 적용됩니다.
            </p>
            <div
              style={{
                maxHeight: 300,
                overflow: "auto",
                background: "#fff",
                borderRadius: 8,
                padding: 16,
              }}
            >
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    background: "#fed7aa",
                    borderRadius: 4,
                  }}
                >
                  Blocking Item {i} - Scroll is intentionally janky!
                </div>
              ))}
            </div>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              📝 테스트 절차
            </summary>
            <ol style={{ marginTop: 12, lineHeight: 1.8 }}>
              <li>"메인 스레드 블로킹 활성화" 체크박스를 선택합니다</li>
              <li>페이지 전체를 스크롤합니다 (이 영역 밖에서도)</li>
              <li>스크롤할 때마다 빨간 선이 나타나는 것을 확인합니다</li>
              <li>스크롤이 매우 버벅이고 끊기는 것을 체감합니다</li>
              <li>우측 하단 HUD에서 jank 카운트가 빠르게 증가합니다</li>
              <li>체크박스를 해제하면 스크롤이 다시 부드러워집니다</li>
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
              {`// ❌ 나쁜 예: 스크롤 이벤트에서 무거운 작업
window.addEventListener("scroll", () => {
  const result = heavyCalculation(); // 50ms+
  updateUI(result);
});

// ✅ 좋은 예 1: passive listener + debounce
import { debounce } from 'lodash';

const handleScroll = debounce(() => {
  const result = heavyCalculation();
  updateUI(result);
}, 100);

window.addEventListener("scroll", handleScroll, { passive: true });

// ✅ 좋은 예 2: requestIdleCallback
window.addEventListener("scroll", () => {
  requestIdleCallback(() => {
    const result = heavyCalculation();
    updateUI(result);
  });
}, { passive: true });

// ✅ 좋은 예 3: Intersection Observer (뷰포트 감지)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadContent(entry.target);
    }
  });
});`}
            </pre>
          </details>
        </div>

        {/* 실시간 비교 */}
        <div style={{ marginBottom: 30 }}>
          <h2>🔬 시나리오 4: 실시간 비교</h2>
          <p>세 가지 시나리오를 동시에 활성화하고 스크롤 성능을 비교합니다.</p>

          <div
            style={{
              background: "#e9d5ff",
              border: "2px solid #8b5cf6",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>비교 테스트 절차</h3>
            <ol style={{ lineHeight: 1.8 }}>
              <li>threshold를 0.2로 설정합니다</li>
              <li>
                페이지 상단의 "가벼운 콘텐츠"만 스크롤합니다 → jank 카운트 확인
                (A)
              </li>
              <li>
                "무거운 콘텐츠"를 활성화하고 스크롤합니다 → jank 카운트 확인 (B)
              </li>
              <li>
                "메인 스레드 블로킹"도 활성화하고 스크롤합니다 → jank 카운트
                확인 (C)
              </li>
              <li>예상: A &lt; B &lt;&lt; C</li>
            </ol>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "#fff",
                borderRadius: 6,
              }}
            >
              <strong>📊 예상 결과:</strong>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>
                  <strong>가벼운 콘텐츠:</strong> jank 0~2회
                </li>
                <li>
                  <strong>무거운 콘텐츠:</strong> jank 5~15회
                </li>
                <li>
                  <strong>메인 스레드 블로킹:</strong> jank 20회 이상 (거의 모든
                  스크롤)
                </li>
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
          <h2 style={{ marginTop: 0 }}>🚀 스크롤 Jank 최적화 전략</h2>

          <h3>1. 이벤트 리스너 최적화</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <strong>Passive Listener:</strong>{" "}
              <code>{"{ passive: true }"}</code> 옵션으로 스크롤 블로킹 방지
            </li>
            <li>
              <strong>Debounce/Throttle:</strong> 이벤트 발생 빈도 제한
            </li>
            <li>
              <strong>requestIdleCallback:</strong> 우선순위 낮은 작업 지연 실행
            </li>
          </ul>

          <h3>2. 렌더링 최적화</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <strong>가상화:</strong> react-window, react-virtualized로 보이는
              부분만 렌더
            </li>
            <li>
              <strong>Lazy Loading:</strong> 이미지, 컴포넌트 지연 로드
            </li>
            <li>
              <strong>Intersection Observer:</strong> 뷰포트에 들어올 때만
              활성화
            </li>
            <li>
              <strong>React.memo:</strong> 불필요한 리렌더 방지
            </li>
          </ul>

          <h3>3. CSS 최적화</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <strong>will-change:</strong> 브라우저에게 변경 예고
            </li>
            <li>
              <strong>transform/opacity:</strong> GPU 가속 활용
            </li>
            <li>
              <strong>contain:</strong> 레이아웃 계산 범위 제한
            </li>
            <li>
              <strong>content-visibility:</strong> 화면 밖 콘텐츠 렌더링 스킵
            </li>
          </ul>

          <h3>4. 레이아웃 최적화</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <strong>Layout Thrashing 방지:</strong> 읽기/쓰기 분리
            </li>
            <li>
              <strong>Fixed 헤더 최적화:</strong> position: sticky 고려
            </li>
            <li>
              <strong>복잡한 선택자 피하기:</strong> CSS 선택자 단순화
            </li>
          </ul>

          <h3>5. 이미지/미디어 최적화</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>
              <strong>loading="lazy":</strong> 네이티브 이미지 lazy loading
            </li>
            <li>
              <strong>적절한 크기:</strong> srcset으로 반응형 이미지
            </li>
            <li>
              <strong>포맷 최적화:</strong> WebP, AVIF 사용
            </li>
            <li>
              <strong>Placeholder:</strong> 블러 이미지 또는 스켈레톤
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

          <h3>1. 기본 사용법</h3>
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
            {`import { JankAnalyzer } from "../lib/dx-kit";

function App() {
  return (
    <>
      <JankAnalyzer threshold={0.2} />
      {/* 나머지 콘텐츠 */}
    </>
  );
}`}
          </pre>

          <h3>2. 민감도 조절</h3>
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
            {`// 매우 민감 - 작은 지연도 감지
<JankAnalyzer threshold={0.1} />

// 적당 (권장)
<JankAnalyzer threshold={0.2} />

// 둔감 - 심각한 jank만 감지
<JankAnalyzer threshold={0.5} />`}
          </pre>

          <h3>3. 개발 환경에서만 사용</h3>
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
            {`{process.env.NODE_ENV === 'development' && (
  <JankAnalyzer threshold={0.2} />
)}`}
          </pre>

          <h3>4. 스크롤 최적화 예제</h3>
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
            {`// Passive event listener
useEffect(() => {
  const handleScroll = () => {
    // 가벼운 작업만
    console.log(window.scrollY);
  };
  
  window.addEventListener("scroll", handleScroll, { 
    passive: true // 중요!
  });
  
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

// Intersection Observer로 lazy loading
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 뷰포트에 들어왔을 때만 로드
        entry.target.src = entry.target.dataset.src;
      }
    });
  },
  { rootMargin: "50px" } // 50px 전에 미리 로드
);

// CSS 최적화
const styles = {
  // GPU 가속
  transform: "translateZ(0)",
  willChange: "transform",
  
  // 레이아웃 범위 제한
  contain: "layout style paint",
  
  // 화면 밖 렌더링 스킵
  contentVisibility: "auto"
};`}
          </pre>
        </div>

        <Link to="/dx-kit" className="placeholder-back-link">
          ← DX Kit 허브로 돌아가기
        </Link>
      </div>

      {/* 추가 스크롤 콘텐츠 (jank 테스트용) */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px 40px",
        }}
      >
        <h2>추가 스크롤 영역 (전체 페이지 테스트용)</h2>
        <p>이 영역까지 스크롤하여 jank를 테스트할 수 있습니다.</p>
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            style={{
              padding: 20,
              marginBottom: 12,
              background: "#f3f4f6",
              borderRadius: 8,
            }}
          >
            <strong>Extra Content {i}</strong>
            <p style={{ margin: "8px 0 0 0" }}>
              Scroll through this area to accumulate jank hits. The analyzer
              tracks the entire page scroll performance.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
