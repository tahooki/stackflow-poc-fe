import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useMemo } from "react";

import { useStackActions } from "../hooks/useStackActions";

export type DetailActivityParams = {
  id: string;
  title?: string;
};

const fallbackTips = [
  "Use CLEAR_TOP to reuse Detail screens and keep state intact.",
  "SINGLE_TOP helps keep duplicate Detail screens from stacking up.",
  "CLEAR_STACK is useful when you want to restart a flow from a clean entry point.",
];

const DetailActivity: ActivityComponentType<DetailActivityParams> = ({
  params,
}: {
  params: DetailActivityParams;
}) => {
  const { push } = useStackActions();
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
                push("home", {
                  params: { highlight: "Returned from Detail via CLEAR_STACK" },
                  flag: "CLEAR_STACK",
                })
              }
            >
              Clear stack and go Home
            </button>
            <button
              type="button"
              onClick={() =>
                push("detail", {
                  params: { id: params.id, title: "Prevent duplicates" },
                  flag: "SINGLE_TOP",
                })
              }
            >
              Refresh detail (SINGLE_TOP)
            </button>
            <button
              type="button"
              onClick={() => push("snapshot", { params: {} })}
            >
              Snapshot
            </button>
          </div>
        </section>
      </div>
    </AppScreen>
  );
};

export default DetailActivity;
