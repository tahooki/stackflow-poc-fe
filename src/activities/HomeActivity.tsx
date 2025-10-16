import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";
import { useCallback, useEffect, useState } from "react";
import {
  performanceTracker,
  type PerformanceRecord,
} from "../lib/performanceTracker";
import { memoryUtils } from "../lib/memoryUtils";

export type HomeActivityParams = Record<string, never>;

const HomeActivity: ActivityComponentType<HomeActivityParams> = () => {
  const { push } = useNavActions();
  const [performanceRecords, setPerformanceRecords] = useState<
    PerformanceRecord[]
  >([]);
  const [memoryStats, setMemoryStats] = useState(
    performanceTracker.getMemoryStats()
  );
  const [stackStats, setStackStats] = useState(
    performanceTracker.getStackStats()
  );

  const handlerPush = useCallback(
    (activity: string) => {
      if (activity === "memory") {
        push(activity, {
          payloadMB: 5,
          label: "Default 5MB payload",
        });
      } else {
        push(activity, {});
      }
    },
    [push]
  );

  const refreshPerformanceData = useCallback(() => {
    const records = performanceTracker.getRecentRecords(100);
    setPerformanceRecords(records);
    setMemoryStats(performanceTracker.getMemoryStats());
    setStackStats(performanceTracker.getStackStats());
  }, []);

  const handleClearRecords = useCallback(() => {
    performanceTracker.clearAllRecords();
    refreshPerformanceData();
  }, [refreshPerformanceData]);

  useEffect(() => {
    refreshPerformanceData();

    // 주기적으로 데이터 새로고침
    const interval = setInterval(refreshPerformanceData, 2000);
    return () => clearInterval(interval);
  }, [refreshPerformanceData]);

  return (
    <AppScreen appBar={{ title: "Home" }}>
      <div className="activity">
        <div className="activity__content">
          <section className="activity__card">
            <h2>Performance Test Activities</h2>
            <div className="activity__actions">
              <button type="button" onClick={() => handlerPush("table")}>
                Open Table Activity
              </button>
              <button type="button" onClick={() => handlerPush("chart")}>
                Open Chart Activity
              </button>
              <button type="button" onClick={() => handlerPush("image-stack")}>
                Open Image Activity
              </button>
              <button type="button" onClick={() => handlerPush("text")}>
                Open Text Activity
              </button>
              <button type="button" onClick={() => handlerPush("memory")}>
                Open Memory Stress Activity
              </button>
            </div>
          </section>

          <section className="activity__card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2>Peak Performance Data</h2>
              <button
                type="button"
                onClick={handleClearRecords}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Clear All Records
              </button>
            </div>

            {performanceRecords.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <th
                        style={{
                          padding: "8px",
                          border: "1px solid #e2e8f0",
                          textAlign: "left",
                        }}
                      >
                        Time
                      </th>
                      <th
                        style={{
                          padding: "8px",
                          border: "1px solid #e2e8f0",
                          textAlign: "left",
                        }}
                      >
                        Activity
                      </th>
                      <th
                        style={{
                          padding: "8px",
                          border: "1px solid #e2e8f0",
                          textAlign: "right",
                        }}
                      >
                        Memory (MB)
                      </th>
                      <th
                        style={{
                          padding: "8px",
                          border: "1px solid #e2e8f0",
                          textAlign: "right",
                        }}
                      >
                        Stack Count
                      </th>
                      <th
                        style={{
                          padding: "8px",
                          border: "1px solid #e2e8f0",
                          textAlign: "right",
                        }}
                      >
                        Stack Depth
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {record.activityName}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #e2e8f0",
                            textAlign: "right",
                          }}
                        >
                          {record.memoryUsageMB.toFixed(1)}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #e2e8f0",
                            textAlign: "right",
                          }}
                        >
                          {record.stackCount}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: "1px solid #e2e8f0",
                            textAlign: "right",
                          }}
                        >
                          {record.stackDepth}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "#64748b", fontStyle: "italic" }}>
                No performance data yet. Start testing activities to see peak
                performance results here.
              </p>
            )}
          </section>

          <section className="activity__card">
            <h2>Performance Statistics (Peak Data)</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <h3 style={{ marginBottom: "8px", color: "#374151" }}>
                  Memory Usage
                </h3>
                <div style={{ fontSize: "14px", lineHeight: "1.5" }}>
                  <div>Average: {memoryStats.average.toFixed(1)} MB</div>
                  <div>Min: {memoryStats.min.toFixed(1)} MB</div>
                  <div>Max: {memoryStats.max.toFixed(1)} MB</div>
                  <div>Activities: {memoryStats.count}</div>
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: "8px", color: "#374151" }}>
                  Stack Count
                </h3>
                <div style={{ fontSize: "14px", lineHeight: "1.5" }}>
                  <div>Average: {stackStats.average.toFixed(1)}</div>
                  <div>Min: {stackStats.min}</div>
                  <div>Max: {stackStats.max}</div>
                  <div>Activities: {stackStats.count}</div>
                </div>
              </div>
            </div>
            {memoryUtils.isMemoryAvailable() ? (
              <div
                style={{
                  marginTop: "16px",
                  padding: "8px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                ✅ Memory tracking is available (Chrome DevTools)
              </div>
            ) : (
              <div
                style={{
                  marginTop: "16px",
                  padding: "8px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                ⚠️ Memory tracking not available (use Chrome for accurate
                measurements)
              </div>
            )}
          </section>
        </div>
      </div>
    </AppScreen>
  );
};

export default HomeActivity;
