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
  }, [actions]);
};

export type { NavFlag } from '../plugins/navFlagPlugin';
