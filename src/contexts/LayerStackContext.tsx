import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { BackActionResult, LayerState } from "../lib/layerManager";
import { layerController } from "../lib/layerManager";

type LayerStackContextValue = {
  state: LayerState;
  handleBack: () => Promise<BackActionResult>;
};

const LayerStackContext = createContext<LayerStackContextValue | null>(null);

export const LayerStackProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LayerState>(layerController.getState());

  useEffect(() => {
    const unsubscribe = layerController.subscribe(setState);
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      state,
      handleBack: () => layerController.handleBackPress(),
    }),
    [state]
  );

  return (
    <LayerStackContext.Provider value={value}>
      {children}
    </LayerStackContext.Provider>
  );
};

export const useLayerStack = () => {
  const ctx = useContext(LayerStackContext);
  if (!ctx) {
    throw new Error("useLayerStack must be used within LayerStackProvider.");
  }
  return ctx;
};
