import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { Cfg } from "../config/Cfg";
import type { StackManager } from "../stack/stackManager";
import type { StackName } from "../stack/stackConfig";

import "../assets/stackViewport.css";

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
  const manager = useMemo(() => Cfg.getStack(), []);
  const activeStack = useSyncExternalStore(
    manager.subscribeStackSwitch.bind(manager),
    () => manager.getStackSwitchState().activeStack,
    () => manager.getStackSwitchState().activeStack
  );
  const [mountedStacks, setMountedStacks] = useState(
    () => new Set<StackName>([activeStack])
  );
  const setActiveStack = useCallback(
    (next: StackName) => manager.setActiveStack(next),
    [manager]
  );

  useEffect(() => {
    setMountedStacks((prev) => {
      if (prev.has(activeStack)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(activeStack);
      return next;
    });
  }, [activeStack]);

  const value = useMemo(
    () => ({
      stackManager: manager,
      activeStack,
      setActiveStack,
    }),
    [activeStack, manager, setActiveStack]
  );

  return (
    <StackContext.Provider value={value}>
      <div className="stack-viewport" data-active-stack={activeStack}>
        {manager.getStackNames().map((stackName: StackName) => {
          const StackComponent = manager.getStack(stackName).Stack;
          const isActive = stackName === activeStack;
          const isMounted = mountedStacks.has(stackName) || isActive;

          return (
            <div
              key={stackName}
              className={[
                "stack-viewport__stack",
                isActive ? "stack-viewport__stack--active" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              >
              <StackScopeProvider stackName={stackName}>
                {isMounted ? <StackComponent /> : null}
              </StackScopeProvider>
            </div>
          );
        })}
      </div>
      {children}
    </StackContext.Provider>
  );
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
