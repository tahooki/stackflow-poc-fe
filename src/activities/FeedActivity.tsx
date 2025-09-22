import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from '@stackflow/react';
import { useNavActions } from '../hooks/useNavActions';

const FeedActivity: ActivityComponentType = () => {
  const { push, pop } = useNavActions();

  return (
    <AppScreen appBar={{ title: "Feed" }}>
      <div className="activity__content">
        <section className="activity__card">
          <h2>Feed Screen</h2>
          <p>This is the feed activity.</p>
          <div className="activity__actions">
            <button type="button" onClick={() => push('Home', {})}>
              Go to Home
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

export default FeedActivity;
