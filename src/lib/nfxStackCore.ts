import { stackflow } from "@stackflow/react";
import type { ActivityComponentType } from "@stackflow/react";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import type { RouteLike } from "@stackflow/plugin-history-sync";

import { navFlagPlugin } from "../plugins/navFlagPlugin";

type GenericActivity = ActivityComponentType<Record<string, unknown>>;
export type ActivityRegistry = Record<string, GenericActivity>;
type RouteRegistry = Record<string, RouteLike<GenericActivity>>;

export type StackRouteConfig<
  TActivity extends GenericActivity = GenericActivity
> = {
  name?: string;
  activity: TActivity;
  route?: RouteLike<TActivity>;
  initial?: boolean;
};

type StackInstance = ReturnType<typeof stackflow<ActivityRegistry>>;

let appStack: StackInstance | null = null;

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

export const ensureStackflowInstance = (
  configs: ReadonlyArray<StackRouteConfig>,
  fallbackActivity?: string
): StackInstance => {
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

export const registerActivities = (
  routes: ReadonlyArray<StackRouteConfig>,
  addActivity: StackInstance["addActivity"]
) => {
  routes.forEach((config) => {
    const name = resolveActivityName(config);

    if (registeredActivities.has(name)) {
      return;
    }

    addActivity({
      name,
      component: config.activity,
    });
    registeredActivities.add(name);
  });
};

const getAppStack = () => {
  if (!appStack) {
    throw new Error(
      "NFXStack has not been initialized yet. Render <NFXStack /> first."
    );
  }

  return appStack;
};

export const useFlow = () => {
  return getAppStack().useFlow();
};

export const useStepFlow = <
  K extends Extract<keyof ActivityRegistry, string>
>(
  activityName: K
) => {
  return getAppStack().useStepFlow(activityName);
};
