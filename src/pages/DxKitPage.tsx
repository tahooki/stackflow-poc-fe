import { Link } from "react-router-dom";
import "./PlaceholderPage.css";

/**
 * # Developer Experience Kit (DX-Kit) - 메인 허브 페이지
 *
 * ## 개요
 * DX-Kit은 React 애플리케이션 개발 시 성능 모니터링, 디버깅, 최적화를 돕는
 * 6가지 독립적인 개발 도구 모음입니다.
 *
 * ## 캡슐 (도구) 목록
 *
 * ### 1. PerfHUD - 성능 모니터링
 * - FPS (Frames Per Second) 실시간 추적
 * - Heap Memory 사용량 모니터링
 * - Long Task (50ms 이상) 감지
 * - 우측 상단에 고정된 HUD로 표시
 *
 * ### 2. RerenderHeatmap - 리렌더링 추적
 * - Cmd/Ctrl + Shift + R 단축키로 활성화
 * - 리렌더링된 컴포넌트를 파란색 외곽선으로 하이라이트
 * - 렌더 카운트 배지로 렌더링 횟수 표시
 * - 불필요한 리렌더 감지 및 최적화 포인트 발견
 *
 * ### 3. StateSnapshotPanel - 상태 스냅샷
 * - 현재 애플리케이션 상태를 타임스탬프와 함께 저장
 * - 좌측 하단 패널에 스냅샷 목록 표시
 * - 저장된 상태로 복원 (Redux/Zustand 연동 필요)
 * - 타임 트래블 디버깅 지원
 *
 * ### 4. LeakWatch - 메모리 누수 감지
 * - FinalizationRegistry로 컴포넌트 GC 추적
 * - 언마운트 후 15초 내 GC 안 되면 누수 의심
 * - 좌측 상단 HUD에 alive/suspected 카운트 표시
 * - 타이머, 이벤트 리스너, 전역 참조 누수 탐지
 *
 * ### 5. OccupancyHUD - 이벤트 점유율 분석
 * - 컴포넌트별 render/commit/event/effect 시간 측정
 * - 좌측 중단 HUD에 상위 8개 컴포넌트 표시
 * - 성능 병목 지점 파악
 * - withRenderProfiler, useInstrumentedHandler, useTimedEffect 활용
 *
 * ### 6. JankAnalyzer - 스크롤 성능 분석
 * - 60fps 기준 프레임 드롭 감지
 * - jank 발생 위치에 빨간 선 표시
 * - 우측 하단 HUD에 총 jank 횟수 표시
 * - threshold로 민감도 조절 가능
 *
 * ## 사용 방법
 * 1. 각 캡슐의 전용 테스트 페이지로 이동
 * 2. 상세한 설명, 사용법, 테스트 시나리오 확인
 * 3. 다양한 케이스를 직접 테스트
 * 4. 최적화 전략 및 코드 예제 학습
 *
 * ## 개발 환경 통합
 * - 프로덕션 빌드에서는 제외 (환경 변수로 조건부 렌더링)
 * - 필요한 캡슐만 선택적으로 사용
 * - 각 캡슐은 독립적으로 작동
 */

const capsules = [
  {
    id: "perfhud",
    icon: "📊",
    title: "PerfHUD",
    subtitle: "성능 모니터링",
    description:
      "FPS, 메모리, Long Task를 실시간으로 추적하여 성능 문제를 즉시 발견",
    color: "#3b82f6",
    path: "/dx-kit/perfhud",
    features: [
      "FPS 실시간 추적",
      "Heap Memory 모니터링",
      "Long Task 감지",
      "위험 임계값 설정",
    ],
  },
  {
    id: "rerender",
    icon: "🔄",
    title: "RerenderHeatmap",
    subtitle: "리렌더링 추적",
    description: "불필요한 리렌더를 시각적으로 감지하고 최적화 포인트를 발견",
    color: "#10b981",
    path: "/dx-kit/rerender",
    features: [
      "단축키 하이라이트",
      "렌더 카운트 배지",
      "React.memo 비교",
      "최적화 전략",
    ],
  },
  {
    id: "snapshot",
    icon: "📸",
    title: "StateSnapshot",
    subtitle: "상태 스냅샷",
    description: "애플리케이션 상태를 저장하고 복원하여 타임 트래블 디버깅",
    color: "#8b5cf6",
    path: "/dx-kit/snapshot",
    features: [
      "상태 캡처",
      "타임스탬프 기록",
      "복원 기능",
      "Redux/Zustand 통합",
    ],
  },
  {
    id: "leakwatch",
    icon: "💧",
    title: "LeakWatch",
    subtitle: "메모리 누수 감지",
    description: "컴포넌트 언마운트 후 GC를 추적하여 메모리 누수를 탐지",
    color: "#ef4444",
    path: "/dx-kit/leakwatch",
    features: [
      "GC 추적",
      "누수 의심 표시",
      "타이머 누수",
      "이벤트 리스너 누수",
    ],
  },
  {
    id: "occupancy",
    icon: "⏱️",
    title: "OccupancyHUD",
    subtitle: "이벤트 점유율",
    description: "컴포넌트별 render/event/effect 시간을 측정하여 병목 발견",
    color: "#f59e0b",
    path: "/dx-kit/occupancy",
    features: ["Render 시간", "Event 시간", "Effect 시간", "점유율 순위"],
  },
  {
    id: "jank",
    icon: "🎯",
    title: "JankAnalyzer",
    subtitle: "스크롤 성능",
    description: "60fps 기준 프레임 드롭을 감지하고 jank 위치를 시각화",
    color: "#ec4899",
    path: "/dx-kit/jank",
    features: [
      "프레임 드롭 감지",
      "jank 위치 표시",
      "민감도 조절",
      "스크롤 최적화",
    ],
  },
];

export const DxKitPage = () => {
  return (
    <div className="placeholder-page" style={{ minHeight: "100vh" }}>
      <div className="placeholder-container" style={{ maxWidth: 1400 }}>
        <div className="placeholder-icon">🛠️</div>
        <h1>Developer Experience Kit</h1>
        <p
          className="placeholder-description"
          style={{ maxWidth: 800, margin: "0 auto 50px" }}
        >
          React 애플리케이션의 성능 모니터링, 디버깅, 최적화를 위한
          <br />
          6가지 독립적인 개발 도구 모음
        </p>

        {/* 캡슐 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: 24,
            marginBottom: 50,
          }}
        >
          {capsules.map((capsule) => (
            <Link
              key={capsule.id}
              to={capsule.path}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                background: "#fff",
                borderRadius: 16,
                padding: 28,
                border: `3px solid ${capsule.color}`,
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = `0 12px 24px ${capsule.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {capsule.icon}
              </div>

              <h2
                style={{
                  margin: "0 0 4px 0",
                  fontSize: 24,
                  color: capsule.color,
                  textAlign: "center",
                }}
              >
                {capsule.title}
              </h2>

              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  textAlign: "center",
                  marginBottom: 16,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {capsule.subtitle}
              </div>

              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "#374151",
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                {capsule.description}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                {capsule.features.map((feature, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12,
                      padding: "4px 12px",
                      background: `${capsule.color}15`,
                      color: capsule.color,
                      borderRadius: 12,
                      fontWeight: 500,
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div
                style={{
                  marginTop: 20,
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  color: capsule.color,
                }}
              >
                테스트 페이지로 이동 →
              </div>
            </Link>
          ))}
        </div>

        {/* 특징 섹션 */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: 16,
            padding: 40,
            marginBottom: 40,
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: 30 }}>
            ✨ DX-Kit 특징
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 24,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>
                즉시 사용 가능
              </h3>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                설치 없이 import만으로
                <br />
                즉시 적용 가능
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔌</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>독립적 동작</h3>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                각 캡슐은 독립적으로
                <br />
                필요한 것만 선택 사용
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>
                실시간 모니터링
              </h3>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                개발 중 실시간으로
                <br />
                성능 이슈 즉시 발견
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18 }}>
                시각적 피드백
              </h3>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                HUD, 하이라이트 등<br />
                직관적인 시각화
              </p>
            </div>
          </div>
        </div>

        {/* 사용 시나리오 */}
        <div
          style={{
            background: "#eff6ff",
            border: "2px solid #3b82f6",
            borderRadius: 16,
            padding: 40,
            marginBottom: 40,
          }}
        >
          <h2 style={{ textAlign: "center", marginTop: 0, marginBottom: 30 }}>
            💼 언제 사용하나요?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>
                🔍 성능 문제 진단
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>페이지가 느려진 원인 파악</li>
                <li>어떤 컴포넌트가 병목인지 발견</li>
                <li>메모리 누수 의심 시 검증</li>
              </ul>
            </div>

            <div>
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>
                🚀 최적화 작업
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>불필요한 리렌더 제거</li>
                <li>무거운 계산 식별 및 최적화</li>
                <li>스크롤 성능 개선</li>
              </ul>
            </div>

            <div>
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>
                🐛 버그 디버깅
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>특정 상태로 빠르게 복원</li>
                <li>타임 트래블 디버깅</li>
                <li>상태 변화 흐름 추적</li>
              </ul>
            </div>

            <div>
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>
                📚 학습 및 교육
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>React 성능 최적화 학습</li>
                <li>메모리 관리 이해</li>
                <li>렌더링 메커니즘 파악</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 시작 가이드 */}
        <div
          style={{
            background: "#f0fdf4",
            border: "2px solid #10b981",
            borderRadius: 16,
            padding: 40,
            marginBottom: 40,
          }}
        >
          <h2 style={{ textAlign: "center", marginTop: 0, marginBottom: 30 }}>
            🚀 시작하기
          </h2>

          <ol style={{ lineHeight: 2, maxWidth: 700, margin: "0 auto" }}>
            <li>
              <strong>관심 있는 캡슐을 선택하세요</strong>
              <br />
              <small style={{ color: "#6b7280" }}>
                위 그리드에서 캡슐을 클릭하면 전용 테스트 페이지로 이동합니다
              </small>
            </li>
            <li>
              <strong>상세한 설명과 API 문서를 읽어보세요</strong>
              <br />
              <small style={{ color: "#6b7280" }}>
                각 페이지 상단에 기능, 사용법, Props가 자세히 설명되어 있습니다
              </small>
            </li>
            <li>
              <strong>다양한 시나리오를 직접 테스트하세요</strong>
              <br />
              <small style={{ color: "#6b7280" }}>
                정상 케이스부터 문제가 있는 케이스까지 모두 체험할 수 있습니다
              </small>
            </li>
            <li>
              <strong>최적화 전략과 코드 예제를 학습하세요</strong>
              <br />
              <small style={{ color: "#6b7280" }}>
                문제 해결 방법과 실전 코드가 제공됩니다
              </small>
            </li>
            <li>
              <strong>실제 프로젝트에 적용하세요</strong>
              <br />
              <small style={{ color: "#6b7280" }}>
                필요한 캡슐만 선택적으로 import하여 사용하세요
              </small>
            </li>
          </ol>
        </div>

        <Link
          to="/"
          className="placeholder-back-link"
          style={{ marginTop: 40 }}
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
};
