import { basicUIPlugin } from '@stackflow/plugin-basic-ui';
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";

import { historySyncPlugin } from '@stackflow/plugin-history-sync';

import { stackflow } from '@stackflow/react';

import DetailActivity from './activities/DetailActivity';
import HomeActivity from './activities/HomeActivity';
import ProfileActivity from './activities/ProfileActivity';

const appStack = stackflow({
  transitionDuration: 350,
  activities: {
    home: HomeActivity,
    detail: DetailActivity,
    profile: ProfileActivity,
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
        detail: '/detail',
        profile: '/profile',
      },
      fallbackActivity: () => 'home',
    }),
  ],
})

export const { Stack, useFlow } = appStack
export type StackflowActivities = typeof appStack.activities
