import { stackflow } from "@stackflow/react";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";

import { stackFlagPlugin } from "../../plugins/stackFlagPlugin";
import { layerStackPlugin } from "../../plugins/layerStackPlugin";
import { depthRendererPlugin } from "../../plugins/depthRendererPlugin";
import { depthBackPolicyPlugin } from "../../plugins/depthBackPolicyPlugin";
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
  maxVisible,
}: {
  stackName: StackName;
  initialActivity: ActivityName;
  routes: ReadonlyArray<StackRouteConfig>;
  maxVisible?: number;
}): StackInstance => {
  const rendererPlugin =
    maxVisible !== undefined
      ? depthRendererPlugin({ maxVisible })
    : basicRendererPlugin();

  const instance = stackflow<ActivityRegistry>({
    transitionDuration: 350,
    activities: {} as ActivityRegistry,
    initialActivity: () => initialActivity,
    plugins: [
      rendererPlugin,
      basicUIPlugin({
        theme: "android",
      }),
      stackFlagPlugin(),
      ...(maxVisible !== undefined
        ? [depthBackPolicyPlugin({ maxVisible })]
        : []),
      layerStackPlugin(stackName),
    ],
  });

  routes.forEach(({ name, activity }) => {
    instance.addActivity({ name, component: activity });
  });

  return instance;
};
