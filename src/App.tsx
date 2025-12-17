import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import { BackBridgeButton } from "./components/BackBridgeButton";
import { BottomNav } from "./components/BottomNav";
import { LayerStackDevtools } from "./components/LayerStackDevtools";
import { StackViewport } from "./components/StackViewport";
import { LayerStackProvider } from "./contexts/LayerStackContext";
import { StackProvider } from "./contexts/StackContext";
import { useBackKeyBridge } from "./hooks/useBackKeyBridge";
import { useHistoryBackBridge } from "./hooks/useHistoryBackBridge";
import { GlobalLayout } from "./layouts/GlobalLayout";

const AppShell = () => {
  useBackKeyBridge();
  useHistoryBackBridge();

  return (
    <LayerStackProvider>
      <GlobalLayout>
        <StackViewport />
        <BottomNav />
        <LayerStackDevtools />
        <BackBridgeButton />
      </GlobalLayout>
    </LayerStackProvider>
  );
};

function App() {
  return (
    <StackProvider>
      <AppShell />
    </StackProvider>
  );
}

export default App;
