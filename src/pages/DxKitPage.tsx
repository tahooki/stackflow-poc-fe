import { Link } from "react-router-dom";
import "./PlaceholderPage.css";

export const DxKitPage = () => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-container">
        <div className="placeholder-icon">🛠️</div>
        <h1>Developer Experience Kit</h1>
        <p className="placeholder-description">
          개발자 경험을 향상시키는 도구 모음입니다.
        </p>

        <div className="placeholder-features">
          <div className="placeholder-feature-item">
            <strong>Enhanced Debugging</strong>
            <span>스택 상태 및 전환 과정 시각화</span>
          </div>
          <div className="placeholder-feature-item">
            <strong>Development Tools</strong>
            <span>실시간 네비게이션 로깅 및 분석</span>
          </div>
          <div className="placeholder-feature-item">
            <strong>Testing Utilities</strong>
            <span>시나리오 기반 테스트 자동화 도구</span>
          </div>
        </div>

        <div className="placeholder-status">
          <p>
            이 기능은 <code>dx-kit</code> 브랜치에서 개발 중입니다.
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
