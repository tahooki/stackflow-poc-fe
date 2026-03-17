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
  const { getStack, push } = useStackActions();
  const heroMessage = useMemo(
    () => messages[Math.floor(Math.random() * messages.length)],
    []
  );
  const makeDetailPayload = (label: string) => ({
    id: String(Date.now()),
    title: `Home test: ${label}`,
  });

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
              onClick={() =>
                push("detail", { params: { id: String(Date.now()) } })
              }
            >
              Push detail screen (baseline)
            </button>
            <button
              type="button"
              onClick={() =>
                push("detail", {
                  params: makeDetailPayload("animate=false"),
                  animate: false,
                })
              }
            >
              Push detail screen (animate: false)
            </button>
            <button
              type="button"
              onClick={() =>
                push("detail", {
                  params: makeDetailPayload("CLEAR_STACK no-motion"),
                  flag: "CLEAR_STACK",
                })
              }
            >
              Push detail via CLEAR_STACK
            </button>
            <button
              type="button"
              onClick={() => {
                const payload = makeDetailPayload("dispatchEvent skipEnter");

                getStack().actions.dispatchEvent("Pushed", {
                  activityId: `home-skip-${payload.id}`,
                  activityName: "detail",
                  activityParams: payload,
                  skipEnterActiveState: true,
                });
              }}
            >
              DispatchEvent push (skipEnterActiveState)
            </button>
            <button
              type="button"
              onClick={() => push("depth", { params: { count: "1" } })}
            >
              Depth push demo (counter params)
            </button>
            <button
              type="button"
              onClick={() =>
                push("detail", {
                  params: { id: "42", title: "Reused via CLEAR_TOP" },
                  flag: "CLEAR_TOP",
                  flagTargetActivity: "detail",
                })
              }
            >
              Bring Detail 42 to front (CLEAR_TOP)
            </button>
            <button
              type="button"
              onClick={() =>
                push("orders", {
                  params: {},
                  flag: "SINGLE_TOP",
                })
              }
            >
              Try AG Grid card view
            </button>
            <button
              type="button"
              onClick={() =>
                push("orders", {
                  params: {},
                  stack: "orders",
                  flag: "SINGLE_TOP",
                })
              }
            >
              Switch to Orders stack + push Orders
            </button>
            <button type="button" onClick={() => push("modal", { params: {} })}>
              Modal.open() demo (full-screen)
            </button>
            <button
              type="button"
              onClick={() => push("snapshot", { params: {} })}
            >
              Screenshot lab with Scroll Stress
            </button>
            <button
              type="button"
              onClick={() => push("snapshot", { params: {}, stack: "snapshot" })}
            >
              Switch to Snapshot stack
            </button>
          </div>
        </section>

        <section className="activity__card">
          <h2>Helpful Hints</h2>
          <ul className="activity__list">
            <li>
              Compare the three Detail buttons above to see baseline vs skipped
              enter transitions.
            </li>
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
