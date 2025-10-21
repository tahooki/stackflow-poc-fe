import { Link } from "react-router-dom";
import "./HomePage.css";

export const HomePage = () => {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">Stackflow POC</h1>
        <p className="home-description">
          Stackflow 프레임워크를 활용한 다양한 기능 테스트 및 데모
        </p>

        <div className="feature-grid">
          <Link to="/scenarios" className="feature-card">
            <div className="feature-icon">📱</div>
            <h2>Scenarios</h2>
            <p>
              스택 네비게이션 시나리오 테스트 및 데모 환경. 다양한 화면 흐름을
              시각화하고 테스트할 수 있습니다.
            </p>
            <span className="feature-badge">Current Branch</span>
          </Link>

          <Link to="/performance" className="feature-card">
            <div className="feature-icon">⚡</div>
            <h2>Performance</h2>
            <p>
              스택 깊이, 렌더링 성능, 메모리 사용량 등을 측정하고 분석하는 성능
              테스트 도구입니다.
            </p>
            <span className="feature-badge feature-badge-pending">
              Coming Soon
            </span>
          </Link>
        </div>

        <footer className="home-footer">
          <p>
            <a
              href="https://github.com/daangn/stackflow"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stackflow GitHub
            </a>
            {" | "}
            <a
              href="https://stackflow.so"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};
