import type { ActivityComponentType } from '@stackflow/react'

import { useFlow } from '../stackflow'

export type ProfileActivityParams = {
  username?: string
}

const ProfileActivity: ActivityComponentType<ProfileActivityParams> = ({
  params,
}: {
  params: ProfileActivityParams
}) => {
  const { pop, replace } = useFlow()
  const displayName = params.username ?? 'guest'

  return (
    <div className="activity">
      <section className="activity__header">
        <h1>Profile</h1>
        <p>Hello, {displayName}! This screen demonstrates optional params.</p>
      </section>

      <section className="activity__card">
        <h2>Try these actions</h2>
        <div className="activity__actions">
          <button type="button" onClick={() => pop()}>
            Pop to previous
          </button>
          <button
            type="button"
            onClick={() =>
              replace('detail', {
                topic: `${displayName}'s deep dive`,
                openedFrom: 'profile',
                step: 1,
              })
            }
          >
            Replace with detail
          </button>
        </div>
      </section>

      <section className="activity__card">
        <h2>Why this matters</h2>
        <p>
          Stackflow keeps the underlying scroll position and renders transitions even when
          the stack grows. Use this screen as a template when building heavier components.
        </p>
      </section>
    </div>
  )
}

export default ProfileActivity
