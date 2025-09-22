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
  ActivityParams = Record<string, unknown> | undefined,
  PushOptions = unknown
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
  ActivityParams = Record<string, unknown> | undefined,
  PushOptions = unknown
> =
  | ScenarioElementText
  | ScenarioElementNavigate<ActivityParams, PushOptions>
  | ScenarioElementModal
  | ScenarioElementBottomSheet;

type ScenarioActivity<
  ActivityParams = Record<string, unknown> | undefined,
  PushOptions = unknown
> = {
  id: string;
  activityName: string;
  stageName: string;
  activityTitle: string;
  elements: ScenarioElement<ActivityParams, PushOptions>[];
};

type ScenarioBlueprint<
  ActivityParams = Record<string, unknown> | undefined,
  PushOptions = unknown
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
