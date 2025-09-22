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
  ActivityName = string,
  ActivityParams = Record<string, unknown> | undefined,
  PushOptions = unknown
> = ScenarioElementBase<
  "navigate",
  {
    label: string;
    activityName: ActivityName;
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
  ActivityName = string,
  ActivityParams = Record<string, unknown> | undefined,
  PushOptions = unknown
> =
  | ScenarioElementText
  | ScenarioElementNavigate<ActivityName, ActivityParams, PushOptions>
  | ScenarioElementModal
  | ScenarioElementBottomSheet;

type ScenarioStage<
  ActivityName = string,
  ActivityParams = Record<string, unknown> | undefined,
  PushOptions = unknown
> = {
  id: string;
  stageName: string;
  activityTitle: string;
  elements: ScenarioElement<ActivityName, ActivityParams, PushOptions>[];
};

type ScenarioBlueprint<
  ActivityName = string,
  ActivityParams = Record<string, unknown> | undefined,
  PushOptions = unknown
> = {
  id: string;
  title: string;
  description: string;
  flagLabel: string;
  stages: ScenarioStage<ActivityName, ActivityParams, PushOptions>[];
};

export type {
  ScenarioBlueprint,
  ScenarioElement,
  ScenarioElementBottomSheet,
  ScenarioElementModal,
  ScenarioElementNavigate,
  ScenarioElementText,
  ScenarioStage,
};
