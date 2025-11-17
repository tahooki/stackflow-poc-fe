import { useMemo } from "react";

import type { StackRouteConfig } from "./nfxStackCore";
import {
  ensureStackflowInstance,
  registerActivities,
} from "./nfxStackCore";

type Props = {
  routes: ReadonlyArray<StackRouteConfig>;
  fallbackActivity?: string;
};

export function NFXStack({ routes, fallbackActivity }: Props) {
  const stack = useMemo(
    // routes 변화에 맞춰 Stackflow 인스턴스를 재평가하지만 실제 생성은 1회만 수행된다.
    () => ensureStackflowInstance(routes, fallbackActivity),
    [routes, fallbackActivity]
  );
  const { Stack, addActivity } = stack;

  useMemo(() => {
    // 선언된 액티비티를 Stackflow에 등록하되 이미 등록된 이름은 건너뛴다.
    registerActivities(routes, addActivity);
  }, [routes, addActivity]);

  return <Stack />;
}
