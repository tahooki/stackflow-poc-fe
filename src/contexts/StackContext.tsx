import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createStackflowInstance, type StackInstance } from "../lib/stack/createStackflowInstance";
import {
  initStack,
  stackList,
  stackRoutes,
  type StackName,
} from "../stack/stackConfig";

type StackContextValue = {
  stacks: Record<StackName, StackInstance>;
  activeStack: StackName;
  setActiveStack: (next: StackName) => void;
};

const StackContext = createContext<StackContextValue | null>(null);

type StackScopeValue = {
  stackName: StackName;
};

const StackScopeContext = createContext<StackScopeValue | null>(null);

const createStacks = (): Record<StackName, StackInstance> => {
  const routes = stackRoutes.map((route) => ({
    name: route.name,
    activity: route.activity,
  }));

  return (Object.keys(stackList) as StackName[]).reduce(
    (acc, stackName) => {
      acc[stackName] = createStackflowInstance({
        stackName,
        initialActivity: stackList[stackName].initialActivity,
        routes,
      });
      return acc;
    },
    {} as Record<StackName, StackInstance>
  );
};

export const StackProvider = ({ children }: { children: ReactNode }) => {
  const stacks = useMemo(() => createStacks(), []);
  const [activeStack, setActiveStack] = useState<StackName>(initStack);

  const value = useMemo(
    () => ({
      stacks,
      activeStack,
      setActiveStack,
    }),
    [activeStack, stacks]
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

