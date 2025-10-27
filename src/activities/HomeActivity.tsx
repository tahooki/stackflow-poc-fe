import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from '@stackflow/react';
 
import { useMemo } from 'react';

import { useNavActions } from '../hooks/useNavActions';

export type HomeActivityParams = {
  highlight?: string
}

const messages = [
  'Stackflow brings mobile-style navigation directly to React.',
  'History Sync keeps the browser URL in lockstep with the activity stack.',
  'Start with the basic UI plugin to iterate quickly without custom chrome.',
]

const HomeActivity: ActivityComponentType<HomeActivityParams> = ({
  params,
}: {
  params: HomeActivityParams
}) => {
  const { push } = useNavActions()
  const heroMessage = useMemo(() => messages[Math.floor(Math.random() * messages.length)], [])

  return (
    <AppScreen appBar={{ title: "Home" }}>
      <section className="activity__header">
        <h1>Stackflow Playground</h1>
        <p>{params.highlight ?? heroMessage}</p>
      </section>

      <div className="activity__content">
        <section className="activity__card">
          <h2>Quick Navigation Check</h2>
          <p>Use the actions below to grow the stack and observe transitions.</p>
          <div className="activity__actions">
            <button type="button" onClick={() => push('detail', { id: String(Date.now()) })}>
              Push detail screen (baseline)
            </button>
            <button
              type="button"
              onClick={() =>
                push('detail', { id: '42', title: 'Reused via CLEAR_TOP' }, {
                  navFlag: { flag: 'CLEAR_TOP', activity: 'detail' },
                })
              }
            >
              Bring Detail 42 to front (CLEAR_TOP)
            </button>
            <button
              type="button"
              onClick={() =>
                push('detail', { id: '99', title: 'Jumped from notification' }, {
                  navFlag: { flag: 'JUMP_TO_CLEAR_TOP', activity: 'detail' },
                })
              }
            >
              Jump to Detail 99 (JUMP_TO_CLEAR_TOP)
            </button>
            <button
              type="button"
              onClick={() =>
                push('orders', undefined, {
                  navFlag: { flag: 'SINGLE_TOP' },
                })
              }
            >
              Try AG Grid card view
            </button>
          </div>
        </section>

        <section className="activity__card">
          <h2>Helpful Hints</h2>
          <ul className="activity__list">
            <li>Swipe from the left edge on mobile to pop the stack.</li>
            <li>Use the browser back button to confirm history synchronization.</li>
            <li>Activities can hold any stateful components you need to stress test.</li>
          </ul>
        </section>
      </div>

    </AppScreen>
  )
}

export default HomeActivity
