import { useMemo } from "react";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useStack } from "@stackflow/react";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";
import { getWaferDatasetMeta } from "../lib/waferDataset";
import { useDatasetStore } from "../stores/datasetStore";

export type HomeActivityParams = Record<string, never>;

const HomeActivity: ActivityComponentType<HomeActivityParams> = () => {
  const { push } = useNavActions();
  const meta = getWaferDatasetMeta();
  const { recordCount, setRecordCount, maxRecords } = useDatasetStore();
  const stack = useStack();
  const activities = stack.activities;
  const { chartCount, tableCount } = useMemo(() => {
    const counts = activities.reduce<{ chart: number; table: number }>(
      (accumulator, activity) => {
        if (activity.name === "chart") {
          accumulator.chart += 1;
        } else if (activity.name === "table") {
          accumulator.table += 1;
        }
        return accumulator;
      },
      { chart: 0, table: 0 },
    );

    return { chartCount: counts.chart, tableCount: counts.table };
  }, [activities]);

  const presets = [100, 1000, 5000, maxRecords];

  return (
    <AppScreen appBar={{ title: "Home" }}>
      <div className="activity">
        <section className="activity__header">
          <h1>Stackflow Navigation Stress Bench</h1>
          <p>
            Dataset ready with {meta.size.toLocaleString()} records (base {meta.baseSize}
            x {meta.repeatCount} repeats).
          </p>
        </section>

        <div className="activity__content">
          <section className="activity__card">
            <h2>Dataset Controls</h2>
            <p>Currently loading {recordCount.toLocaleString()} records per activity.</p>
            <div className="activity__actions">
              <label htmlFor="record-slider">Record count</label>
              <input
                id="record-slider"
                type="range"
                min={1}
                max={maxRecords}
                value={recordCount}
                onChange={(event) => setRecordCount(Number(event.target.value))}
              />
              <input
                type="number"
                min={1}
                max={maxRecords}
                value={recordCount}
                onChange={(event) => setRecordCount(Number(event.target.value))}
              />
              <div className="preset-buttons">
                {presets.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRecordCount(value)}
                    className="preset-button"
                  >
                    {value.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="activity__card">
            <h2>Stack Status</h2>
            <ul>
              <li>Chart activities stacked: {chartCount.toLocaleString()}</li>
              <li>Table activities stacked: {tableCount.toLocaleString()}</li>
            </ul>
          </section>

          <section className="activity__card">
            <h2>Jump In</h2>
            <div className="activity__actions">
              <button type="button" onClick={() => push("table", {})}>
                Open Table Activity
              </button>
              <button type="button" onClick={() => push("chart", {})}>
                Open Chart Activity
              </button>
              <button type="button" onClick={() => push("text", {})}>
                Open Text Activity
              </button>
              <button
                type="button"
                onClick={() =>
                  push("memory", {
                    payloadMB: 5,
                    label: "Default 5MB payload",
                  })
                }
              >
                Open Memory Stress Activity
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppScreen>
  );
};

export default HomeActivity;
