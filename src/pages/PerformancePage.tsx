import { Link } from "react-router-dom";
import "./PlaceholderPage.css";

export const PerformancePage = () => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-container">
        <div className="placeholder-icon">⚡</div>
        <h1>Performance Testing</h1>
        <p className="placeholder-description">
          스택 네비게이션 성능 측정 및 분석 도구입니다.
        </p>

        <div className="placeholder-features">
          <div className="placeholder-feature-item">
            <strong>Stack Depth Testing</strong>
            <span>깊은 스택 구조에서의 성능 측정</span>
          </div>
          <div className="placeholder-feature-item">
            <strong>Render Latency</strong>
            <span>화면 전환 시 렌더링 지연 시간 분석</span>
          </div>
          <div className="placeholder-feature-item">
            <strong>Memory Profiling</strong>
            <span>스택 증가에 따른 메모리 사용량 추적</span>
          </div>
        </div>

        <div className="placeholder-status">
          <p>
            이 기능은 <code>performance</code> 브랜치에서 개발 중입니다.
          </p>
          <p className="placeholder-hint">
            해당 브랜치를 병합하면 이 페이지에서 기능을 사용할 수 있습니다.
          </p>
        </div>

        <Link to="/" className="placeholder-back-link">
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
};
