import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from '@stackflow/react';
import { useNavActions } from '../hooks/useNavActions';

const SettingsActivity: ActivityComponentType = () => {
  const { push, pop } = useNavActions();

  return (
    <AppScreen appBar={{ title: "Settings" }}>
      <div className="activity__content">
        <section className="activity__card">
          <h2>Settings Screen</h2>
          <p>This is the settings activity.</p>
          <div className="activity__actions">
            <button type="button" onClick={() => push('Feed', {})}>
              Go to Feed
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

export default SettingsActivity;
