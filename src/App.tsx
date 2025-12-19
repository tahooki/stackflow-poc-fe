import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import { useEffect, useState } from "react";

import { BackBridgeButton } from "./components/BackBridgeButton";
import { BottomNav } from "./components/BottomNav";
import { LayerStackDevtools } from "./components/LayerStackDevtools";
import { Cfg } from "./config/Cfg";
import { LayerStackProvider } from "./contexts/LayerStackContext";
import { StackProvider } from "./contexts/StackContext";
import { useBackKeyBridge } from "./hooks/useBackKeyBridge";
import { useHistoryBackBridge } from "./hooks/useHistoryBackBridge";
import { GlobalLayout } from "./layouts/GlobalLayout";
import { stackManagerConfig } from "./stack/stackConfig";

const AppShell = () => {
  useBackKeyBridge();
  useHistoryBackBridge();

  return (
    <LayerStackProvider>
      <BottomNav />
      <LayerStackDevtools />
      <BackBridgeButton />
    </LayerStackProvider>
  );
};

function App() {
  const [ready, setReady] = useState(() => Cfg.isInitialized());

  useEffect(() => {
    if (!Cfg.isInitialized()) {
      Cfg.init({
        stack: stackManagerConfig,
        layer: {},
      });
      setReady(true);
    }
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <GlobalLayout>
      <StackProvider>
        <AppShell />
      </StackProvider>
    </GlobalLayout>
  );
}

export default App;
