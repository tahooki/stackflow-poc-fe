import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PerformancePage } from "./pages/PerformancePage";
import "./App.css";
import "./pages/PlaceholderPage.css";
import "@stackflow/plugin-basic-ui/index.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PerformancePage />} />
        <Route path="*" element={<PerformancePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
