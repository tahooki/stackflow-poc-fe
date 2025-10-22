import { useMemo } from 'react';

import { useFlow } from '../lib/NFXStack';
import type { NavFlag } from '../plugins/navFlagPlugin';
import { NAV_FLAG_INTERNAL_FIELD } from '../plugins/navFlagPlugin';

type UseFlowReturn = ReturnType<typeof useFlow>;
type PushArgs = Parameters<UseFlowReturn['push']>;
type ActivityName = PushArgs[0];
type ActivityParams = PushArgs[1];
type PushReturn = ReturnType<UseFlowReturn['push']>;

export type PushOptionsExt = {
  animate?: boolean;
  navFlag?: NavFlag;
};

type PushArgsWithFlag = [ActivityName, ActivityParams, PushOptionsExt?];

export const useNavActions = () => {
  const actions = useFlow();

  return useMemo(() => {
    // navFlag를 params에 주입하면서 animate 옵션은 기본 Stackflow push 옵션으로 전달한다.
    const pushWithFlag = ((
      activityName: ActivityName,
      params: ActivityParams,
      options?: PushOptionsExt,
    ): PushReturn => {
      const { navFlag, animate } = options ?? {};
      const payload = navFlag
        ? ({
            ...(params as Record<string, unknown>),
            [NAV_FLAG_INTERNAL_FIELD]: navFlag,
          } as ActivityParams)
        : params;

      const baseOptions = typeof animate === 'boolean' ? { animate } : undefined;

      return actions.push(activityName, payload, baseOptions);
    }) as (...args: PushArgsWithFlag) => PushReturn;

    return {
      ...actions,
      push: pushWithFlag,
    };
    // push 래퍼만 새로 만들어지므로 원본 액션 객체는 그대로 유지된다.
  }, [actions]);
};

export type { NavFlag } from '../plugins/navFlagPlugin';
