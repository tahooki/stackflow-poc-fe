import { basicUIPlugin } from '@stackflow/plugin-basic-ui';
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";

import { historySyncPlugin } from '@stackflow/plugin-history-sync';

import { stackflow } from '@stackflow/react';

import HomeActivity from './activities/HomeActivity';

const appStack = stackflow({
  transitionDuration: 350,
  activities: {
    home: HomeActivity,
  },
  initialActivity: () => 'home',
  plugins: [
    basicRendererPlugin(),
    basicUIPlugin({
      theme: 'android',
    }),
    historySyncPlugin({
      routes: {
        home: '/',
      },
      fallbackActivity: () => 'home',
    }),
  ],
})

export const { Stack, useFlow } = appStack
export type StackflowActivities = typeof appStack.activities
