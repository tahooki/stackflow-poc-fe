import { useMemo } from "react";

import { stackflow } from "@stackflow/react";
import type { ActivityComponentType } from "@stackflow/react";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import type { RouteLike } from "@stackflow/plugin-history-sync";

import { navFlagPlugin } from "../plugins/navFlagPlugin";

// ActivityComponentType 제네릭이 사실상 불공변이어서 공용 레지스트리는 `any`로 둬야 한다.
// 액티비티를 선언하는 쪽에서 params 타입은 유지되지만, 내부 저장소는 모든 형태를 받아야 한다.
type ActivityRegistry = Record<string, ActivityComponentType<any>>;
type RouteRegistry = Record<string, RouteLike<ActivityComponentType<any>>>;

export type StackRouteConfig<
  TActivity extends ActivityComponentType<any> = ActivityComponentType<any>
> = {
  name?: string;
  activity: TActivity;
  route?: RouteLike<TActivity>;
  initial?: boolean;
};

type Props = {
  routes: ReadonlyArray<StackRouteConfig>;
  fallbackActivity?: string;
};

let appStack: ReturnType<typeof stackflow<ActivityRegistry>> | null = null;

const registeredActivities = new Set<string>();

const resolveActivityName = (config: StackRouteConfig) => {
  if (config.name) {
    return config.name;
  }

  const activityMeta = config.activity;
  const inferred = activityMeta.name;
  const name =
    typeof inferred === "string" && inferred.length > 0 ? inferred : null;

  if (!name) {
    throw new Error(
      "NFXStack: every route config must provide a name or an activity with a stable displayName."
    );
  }

  return name;
};
const buildRouteMap = (configs: ReadonlyArray<StackRouteConfig>) =>
  configs.reduce<RouteRegistry>((acc, config) => {
    if (config.route) {
      acc[resolveActivityName(config)] = config.route;
    }
    return acc;
  }, {});

const ensureStackflowInstance = (
  configs: ReadonlyArray<StackRouteConfig>,
  fallbackActivity?: string
) => {
  if (!appStack) {
    if (configs.length === 0) {
      throw new Error("NFXStack requires at least one route configuration.");
    }

    const initialConfig =
      configs.find((config) => config.initial) ?? configs[0];
    const initialName = resolveActivityName(initialConfig);
    const fallbackName = fallbackActivity ?? initialName;
    const historyRoutes = buildRouteMap(configs);

    appStack = stackflow<ActivityRegistry>({
      transitionDuration: 350,
      activities: {} as ActivityRegistry,
      initialActivity: () => initialName,
      plugins: [
        basicRendererPlugin(),
        basicUIPlugin({
          theme: "android",
        }),
        navFlagPlugin(),
        historySyncPlugin({
          routes: historyRoutes,
          fallbackActivity: () => fallbackName,
        }),
      ],
    });
  }

  return appStack;
};

export function NFXStack({ routes, fallbackActivity }: Props) {
  const stack = useMemo(
    () => ensureStackflowInstance(routes, fallbackActivity),
    [routes, fallbackActivity]
  );
  const { Stack, addActivity } = stack;

  useMemo(() => {
    routes.forEach((config) => {
      const name = resolveActivityName(config);
      const component = config.activity;

      if (registeredActivities.has(name)) {
        return;
      }

      addActivity({
        name,
        component,
      });
      registeredActivities.add(name);
    });
  }, [routes, addActivity]);

  return <Stack />;
}

export const useFlow = () => {
  if (!appStack) {
    throw new Error(
      "NFXStack has not been initialized yet. Render <NFXStack /> first."
    );
  }

  return appStack.useFlow();
};
