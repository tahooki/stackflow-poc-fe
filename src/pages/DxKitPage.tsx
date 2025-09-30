import { useState } from "react";
import { Link } from "react-router-dom";
import "./PlaceholderPage.css";
import { 
  PerfHUD, 
  RerenderHeatmap, 
  StateSnapshotPanel, 
  LeakHUD, 
  OccupancyHUD, 
  JankAnalyzer,
  Box,
  useLeakWatch,
  withRenderProfiler,
  useInstrumentedHandler,
  useTimedEffect
} from "../lib/dx-kit";

// 테스트용 데모 컴포넌트들
function HeavyComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<number[]>([]);
  
  useLeakWatch("HeavyComponent");
  
  const handleAddItems = useInstrumentedHandler("HeavyComponent", () => {
    const newItems = Array.from({ length: 100 }, () => Math.random());
    setItems([...items, ...newItems]);
  });
  
  useTimedEffect("HeavyComponent", () => {
    // 시뮬레이션: 무거운 계산
    const start = performance.now();
    while (performance.now() - start < 50) {
      // 50ms 동안 CPU 점유
    }
  }, [count]);
  
  return (
    <Box label="HeavyComponent">
      <div style={{ padding: 20, background: "#f0f0f0", borderRadius: 8, marginBottom: 10 }}>
        <h3>Heavy Component Test</h3>
        <p>Count: {count}</p>
        <p>Items: {items.length}</p>
        <button onClick={() => setCount(count + 1)}>Increment (Heavy Effect)</button>
        <button onClick={handleAddItems} style={{ marginLeft: 10 }}>Add Items</button>
        <button onClick={() => setItems([])} style={{ marginLeft: 10 }}>Clear</button>
      </div>
    </Box>
  );
}

const ProfiledHeavyComponent = withRenderProfiler(HeavyComponent, "HeavyComponent");

function RerenderTestComponent() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  
  return (
    <Box label="RerenderTest">
      <div style={{ padding: 20, background: "#e3f2fd", borderRadius: 8, marginBottom: 10 }}>
        <h3>Re-render Test Component</h3>
        <p>State 1: {state1}</p>
        <p>State 2: {state2}</p>
        <button onClick={() => setState1(state1 + 1)}>Update State 1</button>
        <button onClick={() => setState2(state2 + 1)} style={{ marginLeft: 10 }}>Update State 2</button>
        <p style={{ fontSize: 12, marginTop: 10, opacity: 0.7 }}>
          💡 단축키: Cmd/Ctrl + Shift + R로 리렌더 하이라이트
        </p>
      </div>
    </Box>
  );
}

function MemoryLeakTestComponent() {
  const [mounted, setMounted] = useState(true);
  
  return (
    <div style={{ padding: 20, background: "#fff3e0", borderRadius: 8, marginBottom: 10 }}>
      <h3>Memory Leak Test</h3>
      <button onClick={() => setMounted(!mounted)}>
        {mounted ? "Unmount" : "Mount"} Component
      </button>
      {mounted && <LeakyComponent />}
      <p style={{ fontSize: 12, marginTop: 10, opacity: 0.7 }}>
        💡 컴포넌트를 언마운트한 후 Leak Watch HUD를 확인하세요
      </p>
    </div>
  );
}

function LeakyComponent() {
  useLeakWatch("LeakyComponent");
  
  return (
    <Box label="LeakyComponent">
      <div style={{ padding: 10, background: "white", marginTop: 10, borderRadius: 4 }}>
        Leaky Component Instance
      </div>
    </Box>
  );
}

function ScrollJankTestComponent() {
  const items = Array.from({ length: 100 }, (_, i) => i);
  
  return (
    <div style={{ padding: 20, background: "#f3e5f5", borderRadius: 8 }}>
      <h3>Scroll Jank Test</h3>
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        💡 아래 리스트를 빠르게 스크롤하면 jank를 감지합니다
      </p>
      <div style={{ height: 300, overflow: "auto", border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
        {items.map((i) => (
          <div key={i} style={{ padding: 10, marginBottom: 5, background: "white", borderRadius: 4 }}>
            Item {i} - Lorem ipsum dolor sit amet consectetur
          </div>
        ))}
      </div>
    </div>
  );
}

export const DxKitPage = () => {
  const [activeCapsulesState, setActiveCapsulesState] = useState({
    perfHUD: true,
    rerender: true,
    snapshot: true,
    leak: true,
    occupancy: true,
    jank: true,
  });

  const toggleCapsule = (name: keyof typeof activeCapsulesState) => {
    setActiveCapsulesState((prev: typeof activeCapsulesState) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="placeholder-page" style={{ minHeight: "200vh" }}>
      {/* DX Kit 캡슐들 */}
      {activeCapsulesState.perfHUD && <PerfHUD position="top-right" danger={{ fps: 45, heapMB: 300 }} />}
      {activeCapsulesState.rerender && <RerenderHeatmap enabledShortcut />}
      {activeCapsulesState.snapshot && <StateSnapshotPanel max={10} />}
      {activeCapsulesState.leak && <LeakHUD />}
      {activeCapsulesState.occupancy && <OccupancyHUD />}
      {activeCapsulesState.jank && <JankAnalyzer threshold={0.2} />}

      <div className="placeholder-container" style={{ maxWidth: 1200 }}>
        <div className="placeholder-icon">🛠️</div>
        <h1>Developer Experience Kit - Live Demo</h1>
        <p className="placeholder-description">
          각 캡슐을 실시간으로 테스트해보세요
        </p>

        {/* 캡슐 토글 패널 */}
        <div style={{ 
          background: "#f5f5f5", 
          padding: 20, 
          borderRadius: 8, 
          marginBottom: 30,
          border: "2px solid #ddd"
        }}>
          <h3 style={{ marginTop: 0 }}>활성화된 캡슐 (HUDs)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {Object.entries(activeCapsulesState).map(([key, value]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={value} 
                  onChange={() => toggleCapsule(key as keyof typeof activeCapsulesState)}
                  style={{ marginRight: 8 }}
                />
                <span>{key}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 캡슐 설명 */}
        <div className="placeholder-features" style={{ textAlign: "left", marginBottom: 30 }}>
          <div className="placeholder-feature-item">
            <strong>🎯 PerfHUD</strong>
            <span>FPS, Heap Memory, LongTask 실시간 모니터링 (우측 상단)</span>
          </div>
          <div className="placeholder-feature-item">
            <strong>🔄 Rerender Heatmap</strong>
            <span>Cmd/Ctrl + Shift + R로 리렌더 하이라이트 활성화</span>
          </div>
          <div className="placeholder-feature-item">
            <strong>📸 State Snapshot</strong>
            <span>현재 상태 저장 및 복원 (좌측 하단)</span>
          </div>
          <div className="placeholder-feature-item">
            <strong>💧 Leak Watch</strong>
            <span>메모리 누수 의심 컴포넌트 추적 (좌측 상단)</span>
          </div>
          <div className="placeholder-feature-item">
            <strong>⏱️ Occupancy HUD</strong>
            <span>이벤트/렌더/이펙트 점유율 분석 (좌측 중단)</span>
          </div>
          <div className="placeholder-feature-item">
            <strong>📊 Jank Analyzer</strong>
            <span>스크롤 프레임 드롭 감지 (우측 하단)</span>
          </div>
        </div>

        {/* 테스트 컴포넌트들 */}
        <div style={{ marginTop: 40 }}>
          <h2>Interactive Test Components</h2>
          
          <ProfiledHeavyComponent />
          
          <RerenderTestComponent />
          
          <MemoryLeakTestComponent />
          
          <ScrollJankTestComponent />
        </div>

        <div style={{ marginTop: 40, padding: 20, background: "#e8f5e9", borderRadius: 8 }}>
          <h3>💡 사용 팁</h3>
          <ul style={{ textAlign: "left", lineHeight: 1.8 }}>
            <li><strong>PerfHUD</strong>: 버튼을 연속으로 클릭하여 FPS 저하 확인</li>
            <li><strong>Rerender</strong>: Cmd/Ctrl + Shift + R을 누르면 리렌더된 컴포넌트가 파란 외곽선으로 표시됩니다</li>
            <li><strong>Snapshot</strong>: 좌측 하단 패널에서 Save 버튼으로 상태 저장</li>
            <li><strong>Leak Watch</strong>: 컴포넌트를 마운트/언마운트하며 좌측 상단 HUD 관찰</li>
            <li><strong>Occupancy</strong>: Heavy Effect 버튼을 클릭하면 점유율 증가 확인</li>
            <li><strong>Jank</strong>: 스크롤 영역을 빠르게 스크롤하면 빨간 선으로 jank 표시</li>
          </ul>
        </div>

        <Link to="/" className="placeholder-back-link" style={{ marginTop: 40 }}>
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
};