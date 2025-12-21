import { stackflow } from "@stackflow/react";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";

import { navFlagPlugin } from "../../plugins/navFlagPlugin";
import { layerStackPlugin } from "../../plugins/layerStackPlugin";
import type {
  ActivityName,
  ActivityRegistry,
  StackName,
  StackRouteConfig,
} from "../../stack/stackConfig";

export type StackInstance = ReturnType<typeof stackflow<ActivityRegistry>>;

export const createStackflowInstance = ({
  stackName,
  initialActivity,
  routes,
}: {
  stackName: StackName;
  initialActivity: ActivityName;
  routes: ReadonlyArray<StackRouteConfig>;
}): StackInstance => {
  const instance = stackflow<ActivityRegistry>({
    transitionDuration: 350,
    activities: {} as ActivityRegistry,
    initialActivity: () => initialActivity,
    plugins: [
      basicRendererPlugin(),
      basicUIPlugin({
        theme: "android",
      }),
      navFlagPlugin(),
      layerStackPlugin(stackName),
    ],
  });

  routes.forEach(({ name, activity }) => {
    instance.addActivity({ name, component: activity });
  });

  return instance;
};
