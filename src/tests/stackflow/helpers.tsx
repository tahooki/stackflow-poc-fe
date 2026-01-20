import type { ActivityComponentType } from "@stackflow/react";
import type { StackflowReactPlugin } from "@stackflow/react";
import { stackflow } from "@stackflow/react";
import { render } from "@testing-library/react";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";

type ActivityParams = Record<string, string | undefined>;
type TestActivities = Record<string, ActivityComponentType<ActivityParams>>;

const makeActivity =
  (name: string): ActivityComponentType<ActivityParams> =>
  ({ params }) =>
    (
      <div
        data-testid={`activity-${name}`}
        data-activity-name={name}
        data-params={JSON.stringify(params ?? {})}
      >
        {name}
      </div>
    );

export const defaultActivities: TestActivities = {
  home: makeActivity("home"),
  detail: makeActivity("detail"),
  depth: makeActivity("depth"),
  orders: makeActivity("orders"),
  snapshot: makeActivity("snapshot"),
  modal: makeActivity("modal"),
};

export type CreateTestStackflowOptions = {
  initialActivity?: string;
  transitionDuration?: number;
  plugins?: StackflowReactPlugin[];
  activities?: TestActivities;
};

export const createTestStackflow = ({
  initialActivity = "home",
  transitionDuration = 0,
  plugins,
  activities = defaultActivities,
}: CreateTestStackflowOptions = {}) => {
  const instance = stackflow({
    activities,
    transitionDuration,
    initialActivity: () => initialActivity,
    plugins: plugins ?? [basicRendererPlugin()],
  });

  const renderResult = render(<instance.Stack />);
  return { instance, renderResult };
};

export const getActiveActivities = (
  instance: ReturnType<typeof createTestStackflow>["instance"]
) =>
  instance.actions
    .getStack()
    .activities.filter((activity) => activity.transitionState !== "exit-done");

export const getActiveActivityNames = (
  instance: ReturnType<typeof createTestStackflow>["instance"]
) => getActiveActivities(instance).map((activity) => activity.name);

export const getTopActivity = (
  instance: ReturnType<typeof createTestStackflow>["instance"]
) => {
  const active = getActiveActivities(instance);
  return active[active.length - 1] ?? null;
};
