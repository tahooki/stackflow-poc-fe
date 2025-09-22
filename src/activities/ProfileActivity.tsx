import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from '@stackflow/react';
import { useNavActions } from '../hooks/useNavActions';

const ProfileActivity: ActivityComponentType = () => {
  const { push, pop } = useNavActions();

  return (
    <AppScreen appBar={{ title: "Profile" }}>
      <div className="activity__content">
        <section className="activity__card">
          <h2>Profile Screen</h2>
          <p>This is the profile activity.</p>
          <div className="activity__actions">
            <button type="button" onClick={() => push('Settings', {})}>
              Go to Settings
            </button>
            <button type="button" onClick={pop}>
              Back
            </button>
          </div>
        </section>
      </div>
    </AppScreen>
  );
};

export default ProfileActivity;
