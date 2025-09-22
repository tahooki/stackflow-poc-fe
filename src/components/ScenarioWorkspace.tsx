import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import type {
  ScenarioBlueprint,
  ScenarioElement,
  ScenarioElementBottomSheet,
  ScenarioElementModal,
  ScenarioElementNavigate,
  ScenarioElementText,
} from "./ScenarioPanel.types";
import type { NavFlag } from "../hooks/useNavActions";

const componentPalette: Array<{
  type: ScenarioElement["type"];
  title: string;
  description: string;
}> = [
  {
    type: "text",
    title: "텍스트 섹션",
    description: "설명이나 주석을 추가하는 기본 텍스트 블록",
  },
  {
    type: "navigate",
    title: "페이지 이동 버튼",
    description: "push() 호출로 다른 Activity를 여는 버튼",
  },
  {
    type: "modal",
    title: "모달",
    description: "스택 위에서 떠 있는 overlay 단계",
  },
  {
    type: "bottomSheet",
    title: "바텀시트",
    description: "부분 화면 overlay를 표현하는 실험 구성 요소",
  },
];

type ActivityDraft = {
  id: string;
  title: string;
  stageName: string;
  elements: ScenarioElement[];
};

type ScenarioWorkspaceProps = {
  scenario: ScenarioBlueprint;
  onClose: () => void;
  onRun: () => void;
  isActionsReady: boolean;
  isRunning: boolean;
  onUpdateScenarioMeta: (meta: { title: string; description: string }) => void;
};

const createElementId = (type: ScenarioElement["type"]) =>
  `${type}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const createNavigateDefaults = (): ScenarioElementNavigate => ({
  id: createElementId("navigate"),
  type: "navigate",
  params: {
    label: "Detail push",
    targetActivityId: "activity-id",
    params: { id: "example" },
    flagBadge: "DEFAULT",
  },
});

const createTextDefaults = (): ScenarioElementText => ({
  id: createElementId("text"),
  type: "text",
  params: {
    body: "신규 텍스트를 입력해 주세요.",
    tone: "default",
  },
});

const createModalDefaults = (): ScenarioElementModal => ({
  id: createElementId("modal"),
  type: "modal",
  params: {
    label: "ModalOverlay",
    description: "모달 설명을 입력하세요.",
  },
});

const createBottomSheetDefaults = (): ScenarioElementBottomSheet => ({
  id: createElementId("bottomSheet"),
  type: "bottomSheet",
  params: {
    label: "BottomSheet",
    description: "바텀시트 설명을 입력하세요.",
  },
});

const buildElementDefaults = (type: ScenarioElement["type"]): ScenarioElement => {
  switch (type) {
    case "navigate":
      return createNavigateDefaults();
    case "modal":
      return createModalDefaults();
    case "bottomSheet":
      return createBottomSheetDefaults();
    case "text":
    default:
      return createTextDefaults();
  }
};

const ScenarioWorkspace = ({
  scenario,
  onClose,
  onRun,
  isActionsReady,
  isRunning,
  onUpdateScenarioMeta,
}: ScenarioWorkspaceProps) => {
  const [activities, setActivities] = useState<ActivityDraft[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [paramsDraft, setParamsDraft] = useState("");
  const [optionsDraft, setOptionsDraft] = useState("");
  const [paramError, setParamError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [navFlagDraft, setNavFlagDraft] = useState({ flag: "", activity: "" });
  const [scenarioTitle, setScenarioTitle] = useState(scenario.title);
  const [scenarioDescription, setScenarioDescription] = useState(
    scenario.description
  );

  useEffect(() => {
    const mappedActivities = scenario.activities.map((activity, index) => ({
      id: activity.id,
      title: activity.activityTitle || `Activity ${index + 1}`,
      stageName: activity.stageName,
      elements: activity.elements,
    }));

    if (mappedActivities.length === 0) {
      const fallbackId = createElementId("text");
      setActivities([
        {
          id: fallbackId,
          title: "새 Activity",
          stageName: "Flow",
          elements: [createTextDefaults()],
        },
      ]);
      setSelectedActivityId(fallbackId);
      setSelectedElementId(null);
      return;
    }

    setActivities(mappedActivities);
    setSelectedActivityId(mappedActivities[0].id);
    setSelectedElementId(null);
    setScenarioTitle(scenario.title);
    setScenarioDescription(scenario.description);
  }, [scenario]);

  const selectedActivity = useMemo(
    () => activities.find((activity) => activity.id === selectedActivityId) || null,
    [activities, selectedActivityId]
  );

  const selectedElement = useMemo(() => {
    if (!selectedActivity || !selectedElementId) {
      return null;
    }
    return (
      selectedActivity.elements.find((element) => element.id === selectedElementId) ||
      null
    );
  }, [selectedActivity, selectedElementId]);

  useEffect(() => {
    if (selectedElement?.type === "navigate") {
      setParamsDraft(
        selectedElement.params.params
          ? JSON.stringify(selectedElement.params.params, null, 2)
          : ""
      );
      setOptionsDraft(
        selectedElement.params.options
          ? JSON.stringify(selectedElement.params.options, null, 2)
          : ""
      );
      setParamError(null);
      setOptionsError(null);
      setNavFlagDraft({
        flag: selectedElement.params.navFlag?.flag ?? "",
        activity:
          "activity" in (selectedElement.params.navFlag ?? {})
            ? selectedElement.params.navFlag?.activity ?? ""
            : "",
      });
      return;
    }

    setParamsDraft("");
    setOptionsDraft("");
    setParamError(null);
    setOptionsError(null);
    setNavFlagDraft({ flag: "", activity: "" });
  }, [selectedElement]);

  const updateActivity = useCallback(
    (activityId: string, updater: (activity: ActivityDraft) => ActivityDraft) => {
      setActivities((current) =>
        current.map((activity) =>
          activity.id === activityId ? updater(activity) : activity
        )
      );
    },
    []
  );

  const updateElement = useCallback(
    (
      activityId: string,
      elementId: string,
      updater: (element: ScenarioElement) => ScenarioElement
    ) => {
      updateActivity(activityId, (activity) => ({
        ...activity,
        elements: activity.elements.map((element) =>
          element.id === elementId ? updater(element) : element
        ),
      }));
    },
    [updateActivity]
  );

  const handleAddActivity = () => {
    const newId = createElementId("text");
    const newActivity: ActivityDraft = {
      id: newId,
      title: `Activity ${activities.length + 1}`,
      stageName: "Flow",
      elements: [],
    };
    setActivities((current) => [...current, newActivity]);
    setSelectedActivityId(newId);
    setSelectedElementId(null);
  };

  const handleActivityTitleChange = (
    activityId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    updateActivity(activityId, (activity) => ({
      ...activity,
      title: value,
    }));
  };

  const handleAddElement = (type: ScenarioElement["type"]) => {
    if (!selectedActivityId) {
      return;
    }
    const newElement = buildElementDefaults(type);
    updateActivity(selectedActivityId, (activity) => ({
      ...activity,
      elements: [...activity.elements, newElement],
    }));
    setSelectedElementId(newElement.id);
  };

  const handleSelectElement = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  const handleTextChange = <
    Key extends keyof ScenarioElementText["params"]
  >(
    element: ScenarioElementText,
    field: Key,
    value: ScenarioElementText["params"][Key]
  ) => {
    if (!selectedActivityId) {
      return;
    }
    updateElement(selectedActivityId, element.id, (current) => ({
      ...current,
      params: {
        ...current.params,
        [field]: value,
      },
    }));
  };

  const handleOverlayChange = <
    Element extends ScenarioElementModal | ScenarioElementBottomSheet,
    Key extends keyof Element["params"]
  >(
    element: Element,
    field: Key,
    value: Element["params"][Key]
  ) => {
    if (!selectedActivityId) {
      return;
    }
    updateElement(selectedActivityId, element.id, (current) => ({
      ...current,
      params: {
        ...current.params,
        [field]: value,
      },
    }));
  };

  const handleNavigateChange = <
    Key extends keyof ScenarioElementNavigate["params"]
  >(
    element: ScenarioElementNavigate,
    field: Key,
    value: ScenarioElementNavigate["params"][Key]
  ) => {
    if (!selectedActivityId) {
      return;
    }
    updateElement(selectedActivityId, element.id, (current) => ({
      ...current,
      params: {
        ...current.params,
        [field]: value,
      },
    }));
  };

  const requiresActivityFlags: NavFlag["flag"][] = [
    "CLEAR_TOP",
    "JUMP_TO",
    "CLEAR_TOP_SINGLE_TOP",
    "JUMP_TO_CLEAR_TOP",
  ];

  const normalizeNavFlag = (
    flagDraft: string,
    activityDraft: string
  ): NavFlag | undefined => {
    const trimmedFlag = flagDraft.trim();
    if (!trimmedFlag) {
      return undefined;
    }

    const normalizedFlag = trimmedFlag.toUpperCase();
    const flagValue = normalizedFlag as NavFlag["flag"];
    if (requiresActivityFlags.includes(flagValue)) {
      const trimmedActivity = activityDraft.trim();
      if (!trimmedActivity) {
        return undefined;
      }
      return {
        flag: flagValue,
        activity: trimmedActivity,
      } as NavFlag;
    }

    return { flag: flagValue } as NavFlag;
  };

  const handleNavFlagDraftChange = (
    element: ScenarioElementNavigate,
    draft: { flag: string; activity: string }
  ) => {
    setNavFlagDraft(draft);
    const normalized = normalizeNavFlag(draft.flag, draft.activity);
    handleNavigateChange(element, "navFlag", normalized);
  };

  const handleParamsBlur = (element: ScenarioElementNavigate) => {
    if (!selectedActivityId) {
      return;
    }
    if (!paramsDraft.trim()) {
      handleNavigateChange(element, "params", undefined);
      setParamError(null);
      return;
    }

    try {
      const parsed = JSON.parse(paramsDraft);
      handleNavigateChange(element, "params", parsed);
      setParamError(null);
    } catch (caught) {
      void caught;
      setParamError("JSON 형식이 잘못되었습니다.");
    }
  };

  const handleOptionsBlur = (element: ScenarioElementNavigate) => {
    if (!selectedActivityId) {
      return;
    }
    if (!optionsDraft.trim()) {
      handleNavigateChange(element, "options", undefined);
      setOptionsError(null);
      return;
    }

    try {
      const parsed = JSON.parse(optionsDraft);
      handleNavigateChange(element, "options", parsed);
      setOptionsError(null);
    } catch (caught) {
      void caught;
      setOptionsError("JSON 형식이 잘못되었습니다.");
    }
  };

  const renderElementPreview = (element: ScenarioElement) => {
    switch (element.type) {
      case "text":
        return (
          <div className="workspace-element workspace-element--text">
            <span className="workspace-element__eyebrow">TEXT</span>
            <p>{element.params.body}</p>
          </div>
        );
      case "navigate":
        return (
          <div className="workspace-element workspace-element--navigate">
            <span className="workspace-element__eyebrow">NAVIGATE</span>
            <strong>{element.params.label}</strong>
            <small>{element.params.targetActivityId}</small>
          </div>
        );
      case "modal":
        return (
          <div className="workspace-element workspace-element--modal">
            <span className="workspace-element__eyebrow">MODAL</span>
            <strong>{element.params.label}</strong>
            <p>{element.params.description}</p>
          </div>
        );
      case "bottomSheet":
        return (
          <div className="workspace-element workspace-element--bottom-sheet">
            <span className="workspace-element__eyebrow">BOTTOM SHEET</span>
            <strong>{element.params.label}</strong>
            <p>{element.params.description}</p>
          </div>
        );
      default:
        return null;
    }
  };

  const handleRunScenario = (event: FormEvent) => {
    event.preventDefault();
    onRun();
  };

  const handleScenarioTitleChange = (value: string) => {
    setScenarioTitle(value);
    onUpdateScenarioMeta({
      title: value,
      description: scenarioDescription,
    });
  };

  const handleScenarioDescriptionChange = (value: string) => {
    setScenarioDescription(value);
    onUpdateScenarioMeta({
      title: scenarioTitle,
      description: value,
    });
  };

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <header className="workspace-sidebar__header">
          <button type="button" onClick={onClose} className="workspace-back">
            ← 시나리오 보드
          </button>
          <div className="workspace-scenario-meta">
            <label className="workspace-input workspace-input--flush">
              <span>시나리오 제목</span>
              <input
                type="text"
                value={scenarioTitle}
                onChange={(event) => handleScenarioTitleChange(event.target.value)}
                placeholder="시나리오 제목"
              />
            </label>
            <label className="workspace-input workspace-input--flush">
              <span>설명</span>
              <textarea
                value={scenarioDescription}
                onChange={(event) =>
                  handleScenarioDescriptionChange(event.target.value)
                }
                placeholder="시나리오 설명"
                rows={3}
              />
            </label>
          </div>
        </header>
        <section className="workspace-activities">
          <header className="workspace-activities__header">
            <h2>Activities</h2>
            <button type="button" onClick={handleAddActivity}>
              + 추가
            </button>
          </header>
          <ul>
            {activities.map((activity) => {
              const isSelected = activity.id === selectedActivityId;
              return (
                <li key={activity.id}>
                  <button
                    type="button"
                    className={
                      isSelected
                        ? "workspace-activity workspace-activity--active"
                        : "workspace-activity"
                    }
                    onClick={() => {
                      setSelectedActivityId(activity.id);
                      setSelectedElementId(null);
                    }}
                  >
                    <span className="workspace-activity__title">
                      {activity.title || "제목 없음"}
                    </span>
                    <span className="workspace-activity__meta">
                      {activity.elements.length} components
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </aside>

      <main className="workspace-canvas">
        <header className="workspace-canvas__header">
          <div>
            <span className="workspace-canvas__label">캔버스</span>
            <h2>{selectedActivity?.title ?? "선택된 Activity 없음"}</h2>
          </div>
          <form className="workspace-canvas__controls" onSubmit={handleRunScenario}>
            <button
              type="submit"
              className={
                isRunning
                  ? "workspace-run workspace-run--running"
                  : "workspace-run"
              }
              disabled={!isActionsReady}
            >
              {isRunning ? "실행중" : "실행"}
            </button>
          </form>
        </header>

        {selectedActivity ? (
          <section className="workspace-canvas__body">
            <label className="workspace-input">
              <span>Activity Title</span>
              <input
                type="text"
                value={selectedActivity.title}
                onChange={(event) =>
                  handleActivityTitleChange(selectedActivity.id, event)
                }
                placeholder="Activity 명을 입력하세요"
              />
            </label>

            <div className="workspace-canvas__elements">
              {selectedActivity.elements.length === 0 ? (
                <div className="workspace-empty">
                  구성 요소가 없습니다. 오른쪽 패널에서 컴포넌트를 추가하세요.
                </div>
              ) : (
                selectedActivity.elements.map((element) => {
                  const isElementSelected = element.id === selectedElementId;
                  return (
                    <button
                      key={element.id}
                      type="button"
                      className={
                        isElementSelected
                          ? "workspace-element-wrapper workspace-element-wrapper--active"
                          : "workspace-element-wrapper"
                      }
                      onClick={() => handleSelectElement(element.id)}
                    >
                      {renderElementPreview(element)}
                    </button>
                  );
                })
              )}
            </div>
          </section>
        ) : (
          <section className="workspace-empty">
            왼쪽 목록에서 Activity를 선택하거나 새로 추가하세요.
          </section>
        )}
      </main>

      <aside className="workspace-inspector">
        <section className="workspace-components">
          <header>
            <h2>Components</h2>
            <p>캔버스에 배치할 요소를 선택하세요.</p>
          </header>
          <ul>
            {componentPalette.map((component) => (
              <li key={component.type}>
                <button
                  type="button"
                  onClick={() => handleAddElement(component.type)}
                >
                  <strong>{component.title}</strong>
                  <span>{component.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="workspace-editor">
          <header>
            <h2>Parameters</h2>
            <p>선택된 요소의 속성을 수정하세요.</p>
          </header>
          {selectedElement ? (
            <div className="workspace-editor__body">
              {selectedElement.type === "text" && (
                <>
                  <label className="workspace-input">
                    <span>본문</span>
                    <textarea
                      value={selectedElement.params.body}
                      onChange={(event) =>
                        handleTextChange(
                          selectedElement,
                          "body",
                          event.target.value
                        )
                      }
                    />
                  </label>
                  <label className="workspace-input">
                    <span>톤</span>
                    <select
                      value={selectedElement.params.tone ?? "default"}
                      onChange={(event) =>
                        handleTextChange(
                          selectedElement,
                          "tone",
                          event.target.value as ScenarioElementText["params"]["tone"]
                        )
                      }
                    >
                      <option value="default">기본</option>
                      <option value="muted">Muted</option>
                    </select>
                  </label>
                </>
              )}

              {selectedElement.type === "navigate" && (
                <>
                  <label className="workspace-input">
                    <span>버튼 라벨</span>
                    <input
                      type="text"
                      value={selectedElement.params.label}
                      onChange={(event) =>
                        handleNavigateChange(
                          selectedElement,
                          "label",
                          event.target.value
                        )
                      }
                    />
                  </label>
                  <label className="workspace-input">
                    <span>Target Activity ID</span>
                    <input
                      type="text"
                      value={selectedElement.params.targetActivityId}
                      onChange={(event) =>
                        handleNavigateChange(
                          selectedElement,
                          "targetActivityId",
                          event.target.value
                        )
                      }
                    />
                  </label>
                  <label className="workspace-input">
                    <span>Flag 배지</span>
                    <input
                      type="text"
                      value={selectedElement.params.flagBadge ?? ""}
                      onChange={(event) =>
                        handleNavigateChange(
                          selectedElement,
                          "flagBadge",
                          event.target.value || undefined
                        )
                      }
                    />
                  </label>
                  <label className="workspace-input">
                    <span>NAV Flag</span>
                    <div className="workspace-input__group">
                      <input
                        type="text"
                        placeholder="flag"
                        value={navFlagDraft.flag}
                        onChange={(event) =>
                          handleNavFlagDraftChange(selectedElement, {
                            flag: event.target.value,
                            activity: navFlagDraft.activity,
                          })
                        }
                      />
                      <input
                        type="text"
                        placeholder="activity"
                        value={navFlagDraft.activity}
                        onChange={(event) =>
                          handleNavFlagDraftChange(selectedElement, {
                            flag: navFlagDraft.flag,
                            activity: event.target.value,
                          })
                        }
                      />
                    </div>
                  </label>
                  <label className="workspace-input">
                    <span>Params (JSON)</span>
                    <textarea
                      value={paramsDraft}
                      onChange={(event) => setParamsDraft(event.target.value)}
                      onBlur={() => handleParamsBlur(selectedElement)}
                      placeholder="{}"
                    />
                    {paramError ? (
                      <span className="workspace-error">{paramError}</span>
                    ) : null}
                  </label>
                  <label className="workspace-input">
                    <span>Options (JSON)</span>
                    <textarea
                      value={optionsDraft}
                      onChange={(event) => setOptionsDraft(event.target.value)}
                      onBlur={() => handleOptionsBlur(selectedElement)}
                      placeholder="{}"
                    />
                    {optionsError ? (
                      <span className="workspace-error">{optionsError}</span>
                    ) : null}
                  </label>
                </>
              )}

              {selectedElement.type === "modal" && (
                <>
                  <label className="workspace-input">
                    <span>레이블</span>
                    <input
                      type="text"
                      value={selectedElement.params.label}
                      onChange={(event) =>
                        handleOverlayChange(
                          selectedElement,
                          "label",
                          event.target.value
                        )
                      }
                    />
                  </label>
                  <label className="workspace-input">
                    <span>설명</span>
                    <textarea
                      value={selectedElement.params.description}
                      onChange={(event) =>
                        handleOverlayChange(
                          selectedElement,
                          "description",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </>
              )}

              {selectedElement.type === "bottomSheet" && (
                <>
                  <label className="workspace-input">
                    <span>레이블</span>
                    <input
                      type="text"
                      value={selectedElement.params.label}
                      onChange={(event) =>
                        handleOverlayChange(
                          selectedElement,
                          "label",
                          event.target.value
                        )
                      }
                    />
                  </label>
                  <label className="workspace-input">
                    <span>설명</span>
                    <textarea
                      value={selectedElement.params.description}
                      onChange={(event) =>
                        handleOverlayChange(
                          selectedElement,
                          "description",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </>
              )}
            </div>
          ) : (
            <div className="workspace-empty workspace-empty--light">
              요소를 선택하면 속성이 표시됩니다.
            </div>
          )}
        </section>
      </aside>
    </div>
  );
};

export { ScenarioWorkspace };
