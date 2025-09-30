# 시나리오 JSON 가이드

## 시나리오 JSON 구조

시나리오는 `src/scenarios/defaultScenarios.json`에 정의되며, 각 시나리오는 다음과 같은 구조를 가집니다:

```json
{
  "scenarios": [
    {
      "id": "scenario-id",
      "title": "시나리오 제목",
      "description": "시나리오 설명",
      "flagLabel": "FLAG_TYPE",
      "entry": {
        "activityId": "entry-activity-id",
        "params": {}
      },
      "activities": [...]
    }
  ]
}
```

## Activity 구조

각 액티비티는 다음과 같은 요소들로 구성됩니다:

```json
{
  "id": "activity-id",
  "stageName": "Flow Stage",
  "activityTitle": "Activity 제목",
  "elements": [
    {
      "id": "element-id",
      "type": "text | navigate | modal | bottomSheet",
      "params": {...}
    }
  ]
}
```

## Navigation Element 예시

### 1. 기본 PUSH

```json
{
  "id": "basic-push",
  "type": "navigate",
  "params": {
    "label": "다음으로 이동",
    "targetActivityId": "next-activity",
    "flagBadge": "PUSH"
  }
}
```

### 2. SINGLE_TOP

```json
{
  "id": "single-top-nav",
  "type": "navigate",
  "params": {
    "label": "SINGLE_TOP으로 재진입",
    "targetActivityId": "current-activity",
    "navFlag": { "flag": "SINGLE_TOP" },
    "flagBadge": "SINGLE_TOP"
  }
}
```

### 3. CLEAR_TOP

```json
{
  "id": "clear-top-nav",
  "type": "navigate",
  "params": {
    "label": "CLEAR_TOP으로 되감기",
    "targetActivityId": "target-activity",
    "navFlag": {
      "flag": "CLEAR_TOP",
      "activity": "target-activity"
    },
    "flagBadge": "CLEAR_TOP"
  }
}
```

### 4. CLEAR_STACK

```json
{
  "id": "clear-stack-nav",
  "type": "navigate",
  "params": {
    "label": "스택 초기화",
    "targetActivityId": "home-activity",
    "navFlag": { "flag": "CLEAR_STACK" },
    "flagBadge": "CLEAR_STACK"
  }
}
```

### 5. JUMP_TO

```json
{
  "id": "jump-to-nav",
  "type": "navigate",
  "params": {
    "label": "JUMP_TO로 특정 액티비티 이동",
    "targetActivityId": "any-activity",
    "navFlag": {
      "flag": "JUMP_TO",
      "activity": "target-activity"
    },
    "flagBadge": "JUMP_TO"
  }
}
```

**주의**: JUMP_TO는 `targetActivityId`를 무시하고 `navFlag.activity`로 이동합니다.

### 6. CLEAR_TOP_SINGLE_TOP

```json
{
  "id": "cts-nav",
  "type": "navigate",
  "params": {
    "label": "CLEAR_TOP_SINGLE_TOP",
    "targetActivityId": "target-activity",
    "navFlag": {
      "flag": "CLEAR_TOP_SINGLE_TOP",
      "activity": "target-activity"
    },
    "flagBadge": "CLEAR_TOP_SINGLE_TOP"
  }
}
```

### 7. JUMP_TO_CLEAR_TOP

```json
{
  "id": "jtct-nav",
  "type": "navigate",
  "params": {
    "label": "JUMP_TO_CLEAR_TOP",
    "targetActivityId": "target-activity",
    "navFlag": {
      "flag": "JUMP_TO_CLEAR_TOP",
      "activity": "target-activity"
    },
    "flagBadge": "JUMP_TO_CLEAR_TOP"
  }
}
```

## Text Element 예시

```json
{
  "id": "text-element",
  "type": "text",
  "params": {
    "body": "표시할 텍스트 내용",
    "tone": "default | muted"
  }
}
```

## 전체 시나리오 예시

```json
{
  "id": "example-flow",
  "title": "예제 플로우",
  "description": "A → B → C 흐름과 CLEAR_TOP 동작을 확인합니다.",
  "flagLabel": "EXAMPLE",
  "entry": {
    "activityId": "activity-a"
  },
  "activities": [
    {
      "id": "activity-a",
      "stageName": "Flow Stage",
      "activityTitle": "Activity A",
      "elements": [
        {
          "id": "a-intro",
          "type": "text",
          "params": {
            "body": "시작 화면입니다."
          }
        },
        {
          "id": "a-to-b",
          "type": "navigate",
          "params": {
            "label": "B로 이동",
            "targetActivityId": "activity-b",
            "flagBadge": "PUSH"
          }
        }
      ]
    },
    {
      "id": "activity-b",
      "stageName": "Flow Stage",
      "activityTitle": "Activity B",
      "elements": [
        {
          "id": "b-intro",
          "type": "text",
          "params": {
            "body": "Activity B입니다."
          }
        },
        {
          "id": "b-to-c",
          "type": "navigate",
          "params": {
            "label": "C로 이동",
            "targetActivityId": "activity-c",
            "flagBadge": "PUSH"
          }
        }
      ]
    },
    {
      "id": "activity-c",
      "stageName": "Flow Stage",
      "activityTitle": "Activity C",
      "elements": [
        {
          "id": "c-intro",
          "type": "text",
          "params": {
            "body": "Activity C입니다."
          }
        },
        {
          "id": "c-clear-top-b",
          "type": "navigate",
          "params": {
            "label": "CLEAR_TOP으로 B 복귀",
            "targetActivityId": "activity-b",
            "navFlag": {
              "flag": "CLEAR_TOP",
              "activity": "activity-b"
            },
            "flagBadge": "CLEAR_TOP"
          }
        }
      ]
    }
  ]
}
```

## 테스트 작성 방법

시나리오를 추가한 후 `src/scenarios/scenarioFlow.test.ts`에 테스트를 작성합니다:

```typescript
describe("시나리오: example-flow", () => {
  const scenario = scenarioDefinitions.find((s) => s.id === "example-flow");

  it("시나리오가 정의되어 있다", () => {
    expect(scenario).toBeDefined();
    expect(scenario?.title).toBe("예제 플로우");
  });

  it("A → B → C 순서로 이동한다", () => {
    const activityA = scenario?.activities.find((a) => a.id === "activity-a");
    const activityB = scenario?.activities.find((a) => a.id === "activity-b");
    const activityC = scenario?.activities.find((a) => a.id === "activity-c");

    executeNavigation(activityA!.activityName);
    executeNavigation(activityB!.activityName);
    executeNavigation(activityC!.activityName);

    expect(mockActions.getStackDepth()).toBe(3);
    expect(mockActions.getStackNames()).toEqual([
      activityA!.activityName,
      activityB!.activityName,
      activityC!.activityName,
    ]);
  });

  it("C에서 CLEAR_TOP으로 B로 복귀한다", () => {
    // ... 테스트 로직
  });
});
```

## Flag 동작 요약

| Flag                 | 동작                                        |
| -------------------- | ------------------------------------------- |
| PUSH                 | 스택에 새 액티비티 추가                     |
| SINGLE_TOP           | 최상단 동일 시 재진입, 아니면 push          |
| CLEAR_TOP            | 대상 위의 모든 액티비티 제거 후 재진입      |
| CLEAR_STACK          | 전체 스택 초기화                            |
| JUMP_TO              | targetActivityId 무시, 지정 액티비티로 이동 |
| CLEAR_TOP_SINGLE_TOP | CLEAR_TOP 실패 시 SINGLE_TOP                |
| JUMP_TO_CLEAR_TOP    | 스택에 있으면 되감기, 없으면 push           |

## 주의사항

1. **Activity Name**: 실제 내부적으로는 `scenarioId::activityId` 형식으로 변환됩니다.
2. **navFlag.activity**: 반드시 같은 시나리오 내의 액티비티 ID여야 합니다.
3. **flagBadge**: UI 표시용이며, 실제 동작은 `navFlag` 값으로 결정됩니다.
4. **Element ID**: 시나리오 내에서 고유해야 합니다.

## 디버깅 팁

테스트 실행 중 스택 상태를 확인하려면:

```typescript
console.log("현재 스택:", mockActions.getStackNames());
console.log("스택 깊이:", mockActions.getStackDepth());
console.log("최상단 액티비티:", mockActions.getCurrentActivity());
```
