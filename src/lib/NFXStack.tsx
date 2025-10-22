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

// 하나의 Stackflow 인스턴스를 반복 사용해 렌더마다 초기화 비용을 줄인다.
let appStack: ReturnType<typeof stackflow<ActivityRegistry>> | null = null;

// 액티비티를 한 번만 등록하기 위한 레지스트리.
const registeredActivities = new Set<string>();

// 액티비티 이름을 명시적으로 지정하지 않은 경우 displayName 등에서 유추한다.
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

// 최초 호출 시에만 Stackflow 인스턴스를 만들고, 기본 플러그인 구성을 적용한다.
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
    // routes 변화에 맞춰 Stackflow 인스턴스를 재평가하지만 실제 생성은 1회만 수행된다.
    () => ensureStackflowInstance(routes, fallbackActivity),
    [routes, fallbackActivity]
  );
  const { Stack, addActivity } = stack;

  useMemo(() => {
    // 선언된 액티비티를 Stackflow에 등록하되 이미 등록된 이름은 건너뛴다.
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
