import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { PerformancePage } from "./pages/PerformancePage";
import "./App.css";
import "./pages/PlaceholderPage.css";
import "@stackflow/plugin-basic-ui/index.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/performance/*" element={<PerformancePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
