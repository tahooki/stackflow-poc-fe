import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { BackActionResult, LayerState } from "../lib/layerManager";
import { getLayerController } from "../lib/layerManager";
import { stackManager } from "../stack/stackManager";
import { useStacks } from "./StackContext";

type LayerStackContextValue = {
  state: LayerState;
  handleBack: () => Promise<BackActionResult>;
};

const LayerStackContext = createContext<LayerStackContextValue | null>(null);

export const LayerStackProvider = ({ children }: { children: ReactNode }) => {
  const { activeStack } = useStacks();
  const controller = useMemo(
    () => getLayerController(activeStack),
    [activeStack]
  );
  const [state, setState] = useState<LayerState>(controller.getState());

  useEffect(() => {
    setState(controller.getState());
    const unsubscribe = controller.subscribe(setState);
    return () => unsubscribe();
  }, [controller]);

  const handleBack = useCallback(
    () => stackManager.handleBackPress(),
    []
  );

  const value = useMemo(
    () => ({
      state,
      handleBack,
    }),
    [handleBack, state]
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
