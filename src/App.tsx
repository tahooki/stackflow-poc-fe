import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { PerformancePage } from "./pages/PerformancePage";
import { DxKitPage } from "./pages/DxKitPage";
import { ScenarioApp } from "./pages/ScenarioApp";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scenarios/*" element={<ScenarioApp />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/dx-kit" element={<DxKitPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
