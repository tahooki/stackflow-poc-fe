import type {
  StackflowActions,
  StackflowPluginPreEffectHook,
} from '@stackflow/core';
import type { StackflowReactPlugin } from '@stackflow/react';

/**
 * Android의 Intent Flag 개념을 Stackflow에 이식한 플러그인 구현.
 * 호출부는 navFlag만 지정하고, 실제 스택 조정은 모두 플러그인에서 처리하도록 강제합니다.
 */
export type NavFlag =
  | { flag: 'SINGLE_TOP' }
  | { flag: 'CLEAR_TOP'; activity: string }
  | { flag: 'JUMP_TO'; activity: string }
  | { flag: 'CLEAR_STACK' }
  | { flag: 'CLEAR_TOP_SINGLE_TOP'; activity: string }
  | { flag: 'JUMP_TO_CLEAR_TOP'; activity: string };

/**
 * 호출부에서 주입하는 내부 키. 실제 params로 전달되지는 않도록 sanitize 단계에서 제거합니다.
 */
const NAV_FLAG_FIELD = '__navFlag';

type UnknownRecord = Record<string, unknown>;

type PushActionParams = Parameters<StackflowActions['push']>[0];

type ActivityParamsShape = PushActionParams['activityParams'] & UnknownRecord;
type ActivityContextShape = PushActionParams['activityContext'] & UnknownRecord;

type NavFlagCarrier = UnknownRecord & { [NAV_FLAG_FIELD]?: NavFlag };

/**
 * params/context 객체에 섞여 들어온 내부 키를 제거합니다.
 * 단순 Object spread로 복사하면서 __navFlag 필드를 제외합니다.
 */
const sanitizeRecord = <T extends UnknownRecord | undefined>(params: T): T => {
  if (!params || typeof params !== 'object') {
    return params;
  }

  if (!Object.prototype.hasOwnProperty.call(params, NAV_FLAG_FIELD)) {
    return params;
  }

  const rest = { ...(params as NavFlagCarrier) };
  delete rest[NAV_FLAG_FIELD];
  return rest as T;
};

/**
 * params에 숨겨둔 navFlag 정보를 추출합니다. 없으면 undefined 반환.
 */
const pickNavFlag = (params: UnknownRecord | undefined): NavFlag | undefined => {
  if (!params || typeof params !== 'object') {
    return undefined;
  }

  const candidate = (params as NavFlagCarrier)[NAV_FLAG_FIELD];
  return candidate;
};

/**
 * onBeforePush 훅: 플래그를 읽고 기본 push 동작을 대체하거나 수정합니다.
 */
const handleBeforePush: StackflowPluginPreEffectHook<PushActionParams> = ({ actionParams, actions }) => {
  const navFlag = pickNavFlag(actionParams.activityParams as UnknownRecord | undefined);

  if (!navFlag) {
    // 플래그는 없지만 내부 키가 남아있다면, 호출부 params가 노출되지 않도록 제거합니다.
    if (Object.prototype.hasOwnProperty.call(actionParams.activityParams ?? {}, NAV_FLAG_FIELD)) {
      actions.overrideActionParams({
        ...actionParams,
        activityParams: sanitizeRecord(actionParams.activityParams as UnknownRecord) as ActivityParamsShape,
      });
    }
    return;
  }

  // 기본 push를 막고 플래그에 따라 직접 push/pop/replace 시퀀스를 실행합니다.
  actions.preventDefault();

  const sanitizedParams = sanitizeRecord(actionParams.activityParams as UnknownRecord) as ActivityParamsShape;
  const sanitizedContext = sanitizeRecord(actionParams.activityContext as UnknownRecord | undefined) as
    | ActivityContextShape
    | undefined;

  const stack = actions.getStack();
  const top = stack.activities[stack.activities.length - 1];

  // push/replace 시에 재사용할 공통 유틸리티.
  const pushActivity = (activityName: string) => {
    actions.push({
      activityId: actionParams.activityId,
      activityName,
      activityParams: sanitizedParams,
      activityContext: sanitizedContext,
      skipEnterActiveState: actionParams.skipEnterActiveState,
    });
  };

  const replaceActivity = (activityName: string) => {
    actions.replace({
      activityId: actionParams.activityId,
      activityName,
      activityParams: sanitizedParams,
      activityContext: sanitizedContext,
      skipEnterActiveState: actionParams.skipEnterActiveState,
    });
  };

  // 목표 액티비티까지 스택을 되감은 뒤 replace로 재진입.
  const rewindToActivity = (activityName: string) => {
    const index = stack.activities.findIndex((activity) => activity.name === activityName);
    if (index < 0) {
      return false;
    }

    for (let i = stack.activities.length - 1; i > index; i -= 1) {
      actions.pop();
    }

    replaceActivity(activityName);
    return true;
  };

  switch (navFlag.flag) {
    case 'SINGLE_TOP': {
      // 최상단이 동일하면 replace, 아니면 push.
      if (top?.name === actionParams.activityName) {
        replaceActivity(actionParams.activityName);
      } else {
        pushActivity(actionParams.activityName);
      }
      break;
    }
    case 'CLEAR_TOP': {
      // 대상이 스택에 있으면 위를 정리하고 replace, 없으면 새로 push.
      if (!rewindToActivity(navFlag.activity)) {
        pushActivity(actionParams.activityName);
      }
      break;
    }
    case 'CLEAR_STACK': {
      // 전체 스택을 비운 뒤 새 액티비티를 push.
      for (let i = stack.activities.length - 1; i >= 0; i -= 1) {
        actions.pop();
      }
      pushActivity(actionParams.activityName);
      break;
    }
    case 'JUMP_TO': {
      // 호출부 요청과 상관없이 지정된 액티비티로 이동.
      pushActivity(navFlag.activity);
      break;
    }
    case 'CLEAR_TOP_SINGLE_TOP': {
      // 먼저 CLEAR_TOP 시도, 실패하면 SINGLE_TOP 규칙 적용.
      if (rewindToActivity(navFlag.activity)) {
        break;
      }
      if (top?.name === actionParams.activityName) {
        replaceActivity(actionParams.activityName);
      } else {
        pushActivity(actionParams.activityName);
      }
      break;
    }
    case 'JUMP_TO_CLEAR_TOP': {
      const target = navFlag.activity;
      if (rewindToActivity(target)) {
        break;
      }
      pushActivity(target);
      break;
    }
    default: {
      // 안전장치: 정의되지 않은 플래그는 기본 push로 처리.
      pushActivity(actionParams.activityName);
    }
  }
};

export const navFlagPlugin = (): StackflowReactPlugin => () => ({
  key: 'nav-flag-plugin',
  onBeforePush: handleBeforePush,
});

export const NAV_FLAG_INTERNAL_FIELD = NAV_FLAG_FIELD;
