import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from '@stackflow/react';
 
import { useMemo } from 'react';

import { useFlow } from '../stackflow';

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
  const { push } = useFlow()
  const heroMessage = useMemo(() => messages[Math.floor(Math.random() * messages.length)], [])

  return (
    <AppScreen appBar={{ title: "Home" }}>
      <section className="activity__header">
        <h1>Stackflow Playground</h1>
        <p>{params.highlight ?? heroMessage}</p>
      </section>

      <section className="activity__card">
        <h2>Quick Navigation Check</h2>
        <p>Use the actions below to grow the stack and observe transitions.</p>
        <div className="activity__actions">
          <button type="button" onClick={() => push('home', { highlight: 'Hello, World!' })}>
            Push detail screen
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
    </AppScreen>
  )
}

export default HomeActivity
