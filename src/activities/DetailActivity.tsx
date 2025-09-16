import type { ActivityComponentType } from '@stackflow/react'

import { useFlow } from '../stackflow'

export type DetailActivityParams = {
  topic: string
  openedFrom: string
  step: number
}

const DetailActivity: ActivityComponentType<DetailActivityParams> = ({
  params,
}: {
  params: DetailActivityParams
}) => {
  const { push, pop } = useFlow()
  const nextStep = params.step + 1

  return (
    <div className="activity">
      <section className="activity__header">
        <h1>{params.topic}</h1>
        <p>Arrived from: {params.openedFrom}</p>
      </section>

      <section className="activity__card">
        <h2>Stack Operations</h2>
        <div className="activity__actions">
          <button
            type="button"
            onClick={() =>
              push('detail', {
                topic: `${params.topic} depth ${nextStep}`,
                openedFrom: 'detail',
                step: nextStep,
              })
            }
          >
            Push another detail
          </button>
          <button
            type="button"
            onClick={() =>
              push('profile', {
                username: `guest-${Date.now().toString(36)}`,
              })
            }
          >
            Push profile from detail
          </button>
          <button type="button" onClick={() => pop()}>
            Pop this screen
          </button>
        </div>
      </section>

      <section className="activity__card">
        <h2>Params snapshot</h2>
        <pre className="activity__code">{JSON.stringify(params, null, 2)}</pre>
      </section>
    </div>
  )
}

export default DetailActivity
