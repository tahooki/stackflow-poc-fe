import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { getStackSwitchController } from "../lib/layerManager";
import { stackManager, type StackManager } from "../stack/stackManager";
import type { StackName } from "../stack/stackConfig";

type StackContextValue = {
  stackManager: StackManager;
  activeStack: StackName;
  setActiveStack: (next: StackName) => void;
};

const StackContext = createContext<StackContextValue | null>(null);

type StackScopeValue = {
  stackName: StackName;
};

const StackScopeContext = createContext<StackScopeValue | null>(null);

export const StackProvider = ({ children }: { children: ReactNode }) => {
  const manager = useMemo(() => stackManager, []);
  const stackSwitch = useMemo(
    () => getStackSwitchController(manager.config.initStack),
    [manager]
  );
  const activeStack = useSyncExternalStore(
    stackSwitch.subscribe.bind(stackSwitch),
    () => stackSwitch.getState().activeStack as StackName,
    () => stackSwitch.getState().activeStack as StackName
  );
  const setActiveStack = useCallback(
    (next: StackName) => stackSwitch.setActiveStack(next),
    [stackSwitch]
  );

  const value = useMemo(
    () => ({
      stackManager: manager,
      activeStack,
      setActiveStack,
    }),
    [activeStack, manager, setActiveStack]
  );

  return <StackContext.Provider value={value}>{children}</StackContext.Provider>;
};

export const StackScopeProvider = ({
  stackName,
  children,
}: {
  stackName: StackName;
  children: ReactNode;
}) => {
  const value = useMemo(() => ({ stackName }), [stackName]);
  return (
    <StackScopeContext.Provider value={value}>
      {children}
    </StackScopeContext.Provider>
  );
};

export const useStacks = () => {
  const ctx = useContext(StackContext);
  if (!ctx) {
    throw new Error("useStacks must be used within StackProvider.");
  }
  return ctx;
};

export const useOptionalStackScope = () => useContext(StackScopeContext);
