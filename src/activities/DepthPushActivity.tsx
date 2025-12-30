import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import { useMemo } from "react";

import { useStackActions } from "../hooks/useStackActions";

export type DepthPushActivityParams = {
  count?: string;
};

const DepthPushActivity: ActivityComponentType<DepthPushActivityParams> = ({
  params,
}: {
  params: DepthPushActivityParams;
}) => {
  const { push } = useStackActions();
  const current = useMemo(() => {
    const parsed = Number(params.count ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.count]);

  const pushNext = (times = 1) => {
    let nextCount = current;
    for (let i = 0; i < times; i += 1) {
      nextCount += 1;
      push("depth", { count: String(nextCount) });
    }
  };

  return (
    <AppScreen appBar={{ title: `Depth Push #${current}` }}>
      <section className="activity__header">
        <h1>Depth Push</h1>
        <p>Push repeatedly to grow the stack with a counter param.</p>
      </section>

      <div className="activity__content">
        <section className="activity__card">
          <h2>Push Controls</h2>
          <p>Current count: {current}</p>
          <div className="activity__actions">
            <button type="button" onClick={() => pushNext(1)}>
              Push next (+1)
            </button>
            <button type="button" onClick={() => pushNext(5)}>
              Push +5
            </button>
            <button type="button" onClick={() => pushNext(10)}>
              Push +10
            </button>
          </div>
        </section>
      </div>
    </AppScreen>
  );
};

export default DepthPushActivity;
