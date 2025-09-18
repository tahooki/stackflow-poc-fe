import type {
  StackflowActions,
  StackflowPluginPreEffectHook,
} from '@stackflow/core';
import type { StackflowReactPlugin } from '@stackflow/react';

/**
 * Navigation flag semantics modeled after Android intent flags.
 */
export type NavFlag =
  | { flag: 'SINGLE_TOP' }
  | { flag: 'CLEAR_TOP'; activity: string }
  | { flag: 'JUMP_TO'; activity: string }
  | { flag: 'CLEAR_STACK' }
  | { flag: 'CLEAR_TOP_SINGLE_TOP'; activity: string }
  | { flag: 'JUMP_TO_CLEAR_TOP'; activity: string };

const NAV_FLAG_FIELD = '__navFlag';

type UnknownRecord = Record<string, unknown>;

type PushActionParams = Parameters<StackflowActions['push']>[0];

type ActivityParamsShape = PushActionParams['activityParams'] & UnknownRecord;
type ActivityContextShape = PushActionParams['activityContext'] & UnknownRecord;

type NavFlagCarrier = UnknownRecord & { [NAV_FLAG_FIELD]?: NavFlag };

const sanitizeRecord = <T extends UnknownRecord | undefined>(params: T): T => {
  if (!params || typeof params !== 'object') {
    return params;
  }

  if (!(NAV_FLAG_FIELD in params)) {
    return params;
  }

  const { [NAV_FLAG_FIELD]: _ignored, ...rest } = params as NavFlagCarrier;
  return rest as T;
};

const pickNavFlag = (params: UnknownRecord | undefined): NavFlag | undefined => {
  if (!params || typeof params !== 'object') {
    return undefined;
  }

  const candidate = (params as NavFlagCarrier)[NAV_FLAG_FIELD];
  return candidate;
};

const handleBeforePush: StackflowPluginPreEffectHook<PushActionParams> = ({ actionParams, actions }) => {
  const navFlag = pickNavFlag(actionParams.activityParams as UnknownRecord | undefined);

  if (!navFlag) {
    if ((actionParams.activityParams as UnknownRecord | undefined)?.hasOwnProperty?.(NAV_FLAG_FIELD)) {
      actions.overrideActionParams({
        ...actionParams,
        activityParams: sanitizeRecord(actionParams.activityParams as UnknownRecord) as ActivityParamsShape,
      });
    }
    return;
  }

  actions.preventDefault();

  const sanitizedParams = sanitizeRecord(actionParams.activityParams as UnknownRecord) as ActivityParamsShape;
  const sanitizedContext = sanitizeRecord(actionParams.activityContext as UnknownRecord | undefined) as
    | ActivityContextShape
    | undefined;

  const stack = actions.getStack();
  const top = stack.activities[stack.activities.length - 1];

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
      if (top?.name === actionParams.activityName) {
        replaceActivity(actionParams.activityName);
      } else {
        pushActivity(actionParams.activityName);
      }
      break;
    }
    case 'CLEAR_TOP': {
      if (!rewindToActivity(navFlag.activity)) {
        pushActivity(actionParams.activityName);
      }
      break;
    }
    case 'CLEAR_STACK': {
      for (let i = stack.activities.length - 1; i >= 0; i -= 1) {
        actions.pop();
      }
      pushActivity(actionParams.activityName);
      break;
    }
    case 'JUMP_TO': {
      pushActivity(navFlag.activity);
      break;
    }
    case 'CLEAR_TOP_SINGLE_TOP': {
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
      pushActivity(actionParams.activityName);
    }
  }
};

export const navFlagPlugin = (): StackflowReactPlugin => () => ({
  key: 'nav-flag-plugin',
  onBeforePush: handleBeforePush,
});

export const NAV_FLAG_INTERNAL_FIELD = NAV_FLAG_FIELD;
