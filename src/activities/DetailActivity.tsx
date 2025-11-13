import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useMemo } from "react";

import { useNavActions } from "../hooks/useNavActions";

export type DetailActivityParams = {
  id: string;
  title?: string;
};

const fallbackTips = [
  "Use CLEAR_TOP to reuse Detail screens and keep state intact.",
  "Combine SINGLE_TOP with CLEAR_TOP to emulate FLAG_ACTIVITY_CLEAR_TOP_SINGLE_TOP.",
  "JUMP_TO can redirect deep links to the right activity without duplicating routes.",
];

const DetailActivity: ActivityComponentType<DetailActivityParams> = ({
  params,
}: {
  params: DetailActivityParams;
}) => {
  const { push } = useNavActions();
  const randomTip = useMemo(
    () => fallbackTips[Math.floor(Math.random() * fallbackTips.length)],
    []
  );

  return (
    <AppScreen appBar={{ border: false, title: <div>Detail {params.id}</div> }}>
      <section className="activity__header">
        <h1>{params.title ?? `Item #${params.id}`}</h1>
        <p>{randomTip}</p>
      </section>

      <div className="activity__content">
        <section className="activity__card">
          <h2>Navigation Experiments</h2>
          <p>
            Trigger a notification-style jump that clears intermediate screens.
          </p>
          <div className="activity__actions">
            <button
              type="button"
              onClick={() =>
                push(
                  "home",
                  { highlight: "Returned from Detail via CLEAR_STACK" },
                  {
                    navFlag: { flag: "CLEAR_STACK" },
                  }
                )
              }
            >
              Clear stack and go Home
            </button>
            <button
              type="button"
              onClick={() =>
                push(
                  "detail",
                  { id: params.id, title: "Prevent duplicates" },
                  {
                    navFlag: { flag: "SINGLE_TOP" },
                  }
                )
              }
            >
              Refresh detail (SINGLE_TOP)
            </button>
            <button type="button" onClick={() => push("snapshot", undefined)}>
              Snapshot
            </button>
          </div>
        </section>
      </div>
    </AppScreen>
  );
};

export default DetailActivity;
