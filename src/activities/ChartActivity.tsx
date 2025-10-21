import { useCallback, useEffect, useMemo, useRef } from "react";
import Chart from "chart.js/auto";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";
import { usePushQueue } from "../hooks/usePushQueue";
import { useStackCount } from "../hooks/useStackCount";
import { createWaferDatasetCopy, type WaferRecord } from "../lib/waferDataset";
import { performanceTracker } from "../lib/performanceTracker";
import { estimateJsonBytes, formatBytes } from "../lib/dataSize";

const CHART_MEASUREMENT_SNIPPET = String.raw`
// JSON 데이터 
// {
//   "wafer_id": "WFR-001",
//   "lot_id": "LOT-A1",
//   "timestamp": "2025-09-25T10:00:00Z",
//   "process_step": "Deposition",
//   "equipment_id": "DEP-03",
//   "parameters": {
//     "temperature_celsius": 450,
//     "pressure_pa": 120,
//     "gas_flow_sccm": 500,
//     "duration_seconds": 180,
//   },
//   "metrology": {
//     "film_thickness_nm": 30.5,
//     "uniformity_percentage": 99.2,
//   },
//   "defects": {
//     "particle_count": 15,
//     "defect_density": 0.021,
//   },
//   "yield": {
//     "estimated_yield_percentage": 98.5,
//   },
// }
// 이 데이터를 1350개 복제해서 사용


const rawDataset = useMemo(() => createWaferDatasetCopy(DATASET_LIMIT), []); // ~500KB 데이터 (451KB/1200 * 1350 ≈ 500KB)
const datasetBytes = useMemo(
  () => estimateJsonBytes(rawDataset),
  [rawDataset]
);
const estimatedStackBytes = datasetBytes * chartStackCount;

useEffect(() => {
  const dataMemoryMB = datasetBytes / (1024 * 1024);
  const totalMemoryMB = estimatedStackBytes / (1024 * 1024);

  performanceTracker.recordPerformance({
    activityName: "chart",
    memoryUsageMB: totalMemoryMB,
    stackDepth,
  });
}, [chartStackCount, stackDepth, datasetBytes, estimatedStackBytes]);
`.trim();

export type ChartActivityParams = Record<string, never>;

type TimelinePoint = {
  label: string;
  lotId: string;
  yieldValue: number | null;
};

const CHART_HEIGHT = 360;
const MIN_WIDTH = 960;
const PX_PER_POINT = 2;
const MAX_CANVAS_WIDTH = 32000;
const DATASET_LIMIT = 1350; // ~500KB 데이터 (451KB/1200 * 1350 ≈ 500KB)

const buildTimeline = (dataset: WaferRecord[]) =>
  dataset
    .map((entry) => ({
      label: new Date(entry.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      lotId: entry.lot_id,
      yieldValue:
        typeof entry.yield?.estimated_yield_percentage === "number"
          ? entry.yield.estimated_yield_percentage
          : typeof entry.yield?.final_yield_percentage === "number"
          ? entry.yield.final_yield_percentage
          : null,
    }))
    .filter((point) => point.yieldValue !== null);

const ChartActivity: ActivityComponentType<ChartActivityParams> = () => {
  const { push } = useNavActions();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { stackCount: chartStackCount, stackDepth } = useStackCount({
    activityName: "chart",
  });
  const { queueStatus, enqueuePushes } = usePushQueue({
    activityName: "chart",
  });

  const rawDataset = useMemo(() => createWaferDatasetCopy(DATASET_LIMIT), []);
  const datasetBytes = useMemo(
    () => estimateJsonBytes(rawDataset),
    [rawDataset]
  );
  const estimatedStackBytes = datasetBytes * chartStackCount;

  // 성능 데이터 기록
  useEffect(() => {
    const dataMemoryMB = datasetBytes / (1024 * 1024);
    const totalMemoryMB = estimatedStackBytes / (1024 * 1024);

    // 로컬스토리지에 저장
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "chart-activity-memory",
        JSON.stringify({
          dataMemoryMB,
          totalMemoryMB,
          stackCount: chartStackCount,
          stackDepth,
          timestamp: Date.now(),
        })
      );
    }

    performanceTracker.recordPerformance({
      activityName: "chart",
      memoryUsageMB: totalMemoryMB,
      stackCount: chartStackCount,
      stackDepth,
    });
  }, [chartStackCount, stackDepth, datasetBytes, estimatedStackBytes]);
  const timelineSource = useMemo(() => buildTimeline(rawDataset), [rawDataset]);

  const { timeline, sampleStep, sourceLength } = useMemo<{
    timeline: TimelinePoint[];
    sampleStep: number;
    sourceLength: number;
  }>(() => {
    const raw = timelineSource;
    if (raw.length === 0) {
      return { timeline: raw, sampleStep: 1, sourceLength: raw.length };
    }

    const maxPoints = Math.max(Math.floor(MAX_CANVAS_WIDTH / PX_PER_POINT), 1);

    if (raw.length <= maxPoints) {
      return { timeline: raw, sampleStep: 1, sourceLength: raw.length };
    }

    const step = Math.ceil(raw.length / maxPoints);
    const sampled = raw.filter((_, index) => index % step === 0);
    return { timeline: sampled, sampleStep: step, sourceLength: raw.length };
  }, [timelineSource]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const width = Math.max(
      Math.min(timeline.length * PX_PER_POINT, MAX_CANVAS_WIDTH),
      MIN_WIDTH
    );
    canvas.width = width;
    canvas.height = CHART_HEIGHT;

    const chartInstance = new Chart(context, {
      type: "line",
      data: {
        labels: timeline.map((point) => `${point.label} · ${point.lotId}`),
        datasets: [
          {
            label: "Yield (%)",
            data: timeline.map((point) => point.yieldValue as number),
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            tension: 0.25,
            fill: true,
            borderWidth: 1,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y.toFixed(2)}%`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Time · Lot" },
          },
          y: {
            title: { display: true, text: "Yield (%)" },
          },
        },
      },
    });

    return () => {
      chartInstance.destroy();
    };
  }, [timeline]);

  const pushChart = useCallback(() => {
    enqueuePushes(1);
  }, [enqueuePushes]);

  const pushCharts = useCallback(
    (times: number) => {
      enqueuePushes(times);
    },
    [enqueuePushes]
  );

  return (
    <AppScreen
      appBar={{
        title: "Chart Activity",
        renderRight: () => (
          // 홈으로
          <button type="button" onClick={() => push("home", {})}>
            홈으로
          </button>
        ),
      }}
    >
      <div className="activity">
        <section className="activity__header">
          <h1>Yield Trend</h1>
          <p>
            {sourceLength.toLocaleString()} records selected · rendering{" "}
            {timeline.length.toLocaleString()} points
            {sampleStep > 1 ? ` (sampled every ${sampleStep} points).` : "."}
          </p>
          <p
            style={{
              marginTop: 8,
              color: "#475569",
            }}
          >
            데이터 용량: {formatBytes(datasetBytes)} · Chart 활동 총 예상 용량:{" "}
            {formatBytes(estimatedStackBytes)} · 전체 스택 깊이:{" "}
            {stackDepth.toLocaleString()}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <button type="button" onClick={pushChart}>
              페이지 추가
            </button>
            <button type="button" onClick={() => pushCharts(5)}>
              5개 쌓기
            </button>
            <button type="button" onClick={() => pushCharts(10)}>
              10개 쌓기
            </button>
            <button type="button" onClick={() => pushCharts(100)}>
              100개 쌓기
            </button>
          </div>
          {queueStatus ? (
            <p
              style={{
                marginTop: 8,
                color: "#475569",
              }}
            >
              배치 {queueStatus.batchId} • 완료 {queueStatus.dispatched}/
              {queueStatus.total}
              {queueStatus.remaining > 0
                ? ` • 대기 ${queueStatus.remaining}`
                : queueStatus.canceled
                ? " • 중단됨"
                : queueStatus.completed
                ? " • 완료됨"
                : null}
            </p>
          ) : null}
        </section>

        <div className="activity__content">
          <section className="activity__card" style={{ minHeight: 420 }}>
            {timeline.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    display: "block",
                    width: `${Math.max(
                      Math.min(
                        timeline.length * PX_PER_POINT,
                        MAX_CANVAS_WIDTH
                      ),
                      MIN_WIDTH
                    )}px`,
                    height: `${CHART_HEIGHT}px`,
                    minWidth: "100%",
                  }}
                />
              </div>
            ) : (
              <p>No yield data available.</p>
            )}
          </section>
        </div>

        <section className="activity__card" style={{ marginTop: 24 }}>
          <h2>측정 데이터 코드 참고</h2>
          <p>
            Chart 활동은 웨이퍼 데이터셋 크기를 기반으로 스택에 쌓인 예상 메모리
            용량을 기록합니다. 아래 코드는 로컬 메모리 계산과{" "}
            <code>performanceTracker</code>로 전달하는 경로를 보여줍니다.
          </p>
          <pre
            style={{
              backgroundColor: "#0f172a",
              color: "#e2e8f0",
              padding: 16,
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.5,
              overflowX: "auto",
            }}
          >
            <code>{CHART_MEASUREMENT_SNIPPET}</code>
          </pre>
        </section>
      </div>
    </AppScreen>
  );
};

export default ChartActivity;
