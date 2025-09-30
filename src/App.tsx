import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { PerformancePage } from "./pages/PerformancePage";
import { DxKitPage } from "./pages/DxKitPage";
import { ScenarioApp } from "./pages/ScenarioApp";

// DX-Kit 테스트 페이지들
import { PerfHUDTestPage } from "./pages/tests/PerfHUDTestPage";
import { RerenderHeatmapTestPage } from "./pages/tests/RerenderHeatmapTestPage";
import { StateSnapshotTestPage } from "./pages/tests/StateSnapshotTestPage";
import { LeakWatchTestPage } from "./pages/tests/LeakWatchTestPage";
import { OccupancyHUDTestPage } from "./pages/tests/OccupancyHUDTestPage";
import { JankAnalyzerTestPage } from "./pages/tests/JankAnalyzerTestPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scenarios/*" element={<ScenarioApp />} />
        <Route path="/performance/*" element={<PerformancePage />} />

        {/* DX-Kit 메인 허브 */}
        <Route path="/dx-kit" element={<DxKitPage />} />

        {/* DX-Kit 각 캡슐 테스트 페이지들 */}
        <Route path="/dx-kit/perfhud" element={<PerfHUDTestPage />} />
        <Route path="/dx-kit/rerender" element={<RerenderHeatmapTestPage />} />
        <Route path="/dx-kit/snapshot" element={<StateSnapshotTestPage />} />
        <Route path="/dx-kit/leakwatch" element={<LeakWatchTestPage />} />
        <Route path="/dx-kit/occupancy" element={<OccupancyHUDTestPage />} />
        <Route path="/dx-kit/jank" element={<JankAnalyzerTestPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
