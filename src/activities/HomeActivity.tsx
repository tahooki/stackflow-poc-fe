import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import { useMemo } from "react";

import { useStackActions } from "../hooks/useStackActions";

export type HomeActivityParams = {
  highlight?: string;
};

const messages = [
  "Stackflow brings mobile-style navigation directly to React.",
  "History Sync keeps the browser URL in lockstep with the activity stack.",
  "Start with the basic UI plugin to iterate quickly without custom chrome.",
];

const HomeActivity: ActivityComponentType<HomeActivityParams> = ({
  params,
}: {
  params: HomeActivityParams;
}) => {
  const { push } = useStackActions();
  const heroMessage = useMemo(
    () => messages[Math.floor(Math.random() * messages.length)],
    []
  );

  return (
    <AppScreen appBar={{ title: "Home" }}>
      <section className="activity__header">
        <h1>Stackflow Playground</h1>
        <p>{params.highlight ?? heroMessage}</p>
      </section>

      <div className="activity__content">
        <section className="activity__card">
          <h2>Quick Navigation Check</h2>
          <p>
            Use the actions below to grow the stack and observe transitions.
          </p>
          <div className="activity__actions">
            <button
              type="button"
              onClick={() => push("detail", { id: String(Date.now()) })}
            >
              Push detail screen (baseline)
            </button>
            <button type="button" onClick={() => push("depth", { count: "1" })}>
              Depth push demo (counter params)
            </button>
            <button
              type="button"
              onClick={() =>
                push(
                  "detail",
                  { id: "42", title: "Reused via CLEAR_TOP" },
                  {
                    stackFlag: { flag: "CLEAR_TOP", activity: "detail" },
                  }
                )
              }
            >
              Bring Detail 42 to front (CLEAR_TOP)
            </button>
            <button
              type="button"
              onClick={() =>
                push(
                  "detail",
                  { id: "99", title: "Jumped from notification" },
                  {
                    stackFlag: {
                      flag: "JUMP_TO_CLEAR_TOP",
                      activity: "detail",
                    },
                  }
                )
              }
            >
              Jump to Detail 99 (JUMP_TO_CLEAR_TOP)
            </button>
            <button
              type="button"
              onClick={() =>
                push("orders", {}, {
                  stackFlag: { flag: "SINGLE_TOP" },
                })
              }
            >
              Try AG Grid card view
            </button>
            <button
              type="button"
              onClick={() =>
                push("orders", {}, {
                  stack: "orders",
                  stackFlag: { flag: "SINGLE_TOP" },
                })
              }
            >
              Switch to Orders stack + push Orders
            </button>
            <button type="button" onClick={() => push("modal", {})}>
              Modal.open() demo (full-screen)
            </button>
            <button type="button" onClick={() => push("snapshot", {})}>
              Screenshot lab with Scroll Stress
            </button>
            <button
              type="button"
              onClick={() => push("snapshot", {}, { stack: "snapshot" })}
            >
              Switch to Snapshot stack
            </button>
          </div>
        </section>

        <section className="activity__card">
          <h2>Helpful Hints</h2>
          <ul className="activity__list">
            <li>Swipe from the left edge on mobile to pop the stack.</li>
            <li>
              Use the browser back button to confirm history synchronization.
            </li>
            <li>
              Activities can hold any stateful components you need to stress
              test.
            </li>
          </ul>
        </section>
      </div>
    </AppScreen>
  );
};

export default HomeActivity;
