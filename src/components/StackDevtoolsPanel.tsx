import { useEffect, useMemo, useState, memo } from "react";

import type { DevtoolsDataStore } from "@stackflow/plugin-devtools";

type StackActivity = DevtoolsDataStore["stack"]["activities"][number];

type StackEntry = {
  activity: StackActivity;
  depth: number;
  status: "enter" | "idle" | "exit";
};

const STACK_ANIMATION_MS = 320;

type StackDevtoolsPanelProps = {
  data: DevtoolsDataStore | null;
};

const StackDevtoolsPanelComponent = ({ data }: StackDevtoolsPanelProps) => {
  const activities = useMemo(
    () =>
      (data?.stack.activities ?? []).filter(
        (activity) => activity.exitedBy === undefined
      ),
    [data]
  );
  const [entries, setEntries] = useState<StackEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const orderMap = new Map(
      activities.map((activity, index) => [activity.id, index])
    );

    setEntries((prev) => {
      const next: StackEntry[] = [];
      const retained = new Set<string>();

      prev.forEach((entry) => {
        const nextIndex = orderMap.get(entry.activity.id);
        if (typeof nextIndex === "number") {
          retained.add(entry.activity.id);
          next.push({
            activity: activities[nextIndex],
            depth: nextIndex + 1,
            status: entry.status === "exit" ? "exit" : "idle",
          });
        } else if (entry.status !== "exit") {
          next.push({ ...entry, status: "exit" });
        } else {
          next.push(entry);
        }
      });

      activities.forEach((activity, index) => {
        if (retained.has(activity.id)) {
          return;
        }

        next.push({
          activity,
          depth: index + 1,
          status: "enter",
        });
      });

      return next.sort(
        (a, b) =>
          (a.depth ?? Number.MAX_SAFE_INTEGER) -
          (b.depth ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }, [activities]);

  useEffect(() => {
    const timers: number[] = [];

    entries.forEach((entry) => {
      if (entry.status === "enter") {
        timers.push(
          window.setTimeout(() => {
            setEntries((state) =>
              state.map((item) =>
                item.activity.id === entry.activity.id &&
                item.status === "enter"
                  ? { ...item, status: "idle" }
                  : item
              )
            );
          }, STACK_ANIMATION_MS)
        );
      }

      if (entry.status === "exit") {
        timers.push(
          window.setTimeout(() => {
            setEntries((state) =>
              state.filter((item) => item.activity.id !== entry.activity.id)
            );
          }, STACK_ANIMATION_MS)
        );
      }
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [entries]);

  useEffect(() => {
    const activeEntries = entries.filter((entry) => entry.status !== "exit");

    if (activeEntries.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((prev) => {
      if (prev && activeEntries.some((entry) => entry.activity.id === prev)) {
        return prev;
      }

      return activeEntries[activeEntries.length - 1].activity.id;
    });
  }, [entries]);

  const sortedEntries = useMemo(
    () => entries.slice().sort((a, b) => a.depth - b.depth),
    [entries]
  );
  const activeSelected = sortedEntries.find(
    (entry) => entry.activity.id === selectedId && entry.status !== "exit"
  );
  const liveDepth = entries.filter((entry) => entry.status !== "exit").length;

  return (
    <div className="panel stack-panel">
      <header className="panel__header">
        <h2>Stackflow Devtools</h2>
        <span className="panel__meta">Depth {liveDepth}</span>
      </header>
      <div className="stack-panel__list">
        {sortedEntries.map((entry) => {
          const { activity, depth, status } = entry;
          const isActive = activity.id === selectedId && status !== "exit";
          return (
            <button
              key={activity.id}
              type="button"
              className={[
                "stack-panel__item",
                `stack-panel__item--${status}`,
                isActive ? "stack-panel__item--active" : null,
                status === "exit" ? "stack-panel__item--inactive" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => status !== "exit" && setSelectedId(activity.id)}
              disabled={status === "exit"}
            >
              <span className="stack-panel__item-depth">{depth}</span>
              <div className="stack-panel__item-body">
                <strong>{activity.name}</strong>
                <span className="stack-panel__item-meta">
                  {activity.transitionState}
                </span>
                <span className="stack-panel__item-id">{activity.id}</span>
              </div>
            </button>
          );
        })}
        {sortedEntries.length === 0 && (
          <div className="stack-panel__empty">Stack is empty.</div>
        )}
      </div>

      {activeSelected ? (
        <div className="stack-panel__detail">
          <h3>{activeSelected.activity.name}</h3>
          <section>
            <h4>Params</h4>
            <pre>
              {JSON.stringify(activeSelected.activity.params ?? {}, null, 2)}
            </pre>
          </section>
          {activeSelected.activity.enteredBy.activityContext && (
            <section>
              <h4>Options</h4>
              <pre>
                {JSON.stringify(
                  activeSelected.activity.enteredBy.activityContext,
                  null,
                  2
                )}
              </pre>
            </section>
          )}
          <section>
            <h4>Entered</h4>
            <pre>
              {JSON.stringify(activeSelected.activity.enteredBy, null, 2)}
            </pre>
          </section>
        </div>
      ) : (
        <div className="stack-panel__detail stack-panel__detail--empty">
          Select an activity to inspect params.
        </div>
      )}
    </div>
  );
};

export const StackDevtoolsPanel = memo(StackDevtoolsPanelComponent);

export type { StackDevtoolsPanelProps };
