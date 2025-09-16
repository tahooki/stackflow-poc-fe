import type { ActivityComponentType } from '@stackflow/react'
import { useMemo } from 'react'

import { useFlow } from '../stackflow'

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
  const { push, replace } = useFlow()
  const heroMessage = useMemo(() => messages[Math.floor(Math.random() * messages.length)], [])

  return (
    <div className="activity">
      <section className="activity__header">
        <h1>Stackflow Playground</h1>
        <p>{params.highlight ?? heroMessage}</p>
      </section>

      <section className="activity__card">
        <h2>Quick Navigation Check</h2>
        <p>Use the actions below to grow the stack and observe transitions.</p>
        <div className="activity__actions">
          <button
            type="button"
            onClick={() =>
              push('detail', {
                topic: 'Stackflow basics',
                openedFrom: 'home',
                step: 1,
              })
            }
          >
            Push detail screen
          </button>
          <button
            type="button"
            onClick={() =>
              push('profile', {
                username: 'stackflower',
              })
            }
          >
            Push profile screen
          </button>
          <button
            type="button"
            onClick={() =>
              replace('detail', {
                topic: 'Replaced detail screen',
                openedFrom: 'home',
                step: 1,
              })
            }
          >
            Replace with detail
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
  )
}

export default HomeActivity
