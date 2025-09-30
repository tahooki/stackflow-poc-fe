import type { NavFlag } from "../hooks/useNavActions";

type ScenarioElementBase<Type extends string, Params> = {
  id: string;
  type: Type;
  params: Params;
};

type ScenarioElementText = ScenarioElementBase<
  "text",
  {
    body: string;
    tone?: "default" | "muted";
  }
>;

type ScenarioElementNavigate<
  ActivityParams = unknown,
  PushOptions = { animate?: boolean } | undefined
> = ScenarioElementBase<
  "navigate",
  {
    label: string;
    targetActivityId: string;
    params?: ActivityParams;
    navFlag?: NavFlag;
    options?: PushOptions;
    flagBadge?: string;
  }
>;

type ScenarioElementModal = ScenarioElementBase<
  "modal",
  {
    label: string;
    description: string;
  }
>;

type ScenarioElementBottomSheet = ScenarioElementBase<
  "bottomSheet",
  {
    label: string;
    description: string;
  }
>;

type ScenarioElement<
  ActivityParams = unknown,
  PushOptions = { animate?: boolean } | undefined
> =
  | ScenarioElementText
  | ScenarioElementNavigate<ActivityParams, PushOptions>
  | ScenarioElementModal
  | ScenarioElementBottomSheet;

type ScenarioActivity<
  ActivityParams = unknown,
  PushOptions = { animate?: boolean } | undefined
> = {
  id: string;
  activityName: string;
  stageName: string;
  activityTitle: string;
  elements: ScenarioElement<ActivityParams, PushOptions>[];
};

type ScenarioBlueprint<
  ActivityParams = unknown,
  PushOptions = { animate?: boolean } | undefined
> = {
  id: string;
  title: string;
  description: string;
  flagLabel: string;
  activities: ScenarioActivity<ActivityParams, PushOptions>[];
};

export type {
  ScenarioBlueprint,
  ScenarioElement,
  ScenarioElementBottomSheet,
  ScenarioElementModal,
  ScenarioElementNavigate,
  ScenarioElementText,
  ScenarioActivity,
};
