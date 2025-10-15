import { useCallback, useEffect, useMemo, useRef } from "react";
import Chart from "chart.js/auto";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useStack } from "@stackflow/react";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";
import { createWaferDatasetCopy } from "../lib/waferDataset";

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

const buildTimeline = (limit: number) => {
  const dataset = createWaferDatasetCopy(limit);
  return dataset
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
};

const ChartActivity: ActivityComponentType<ChartActivityParams> = () => {
  const { push } = useNavActions();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stack = useStack();
  const chartStackCount = stack.activities.length;
  const pendingPushCountRef = useRef(0);
  const pushTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (pushTimerRef.current !== null) {
        window.clearTimeout(pushTimerRef.current);
      }
      pushTimerRef.current = null;
      pendingPushCountRef.current = 0;
    },
    []
  );

  const processNextPush = useCallback(() => {
    if (pendingPushCountRef.current <= 0) {
      pushTimerRef.current = null;
      return;
    }

    pendingPushCountRef.current -= 1;
    push("chart", {});

    if (pendingPushCountRef.current <= 0) {
      pushTimerRef.current = null;
      return;
    }

    pushTimerRef.current = window.setTimeout(processNextPush, 100);
  }, [push]);

  const enqueueChartPushes = useCallback(
    (count: number) => {
      if (count <= 0) {
        return;
      }

      pendingPushCountRef.current += count;

      if (pushTimerRef.current === null) {
        processNextPush();
      }
    },
    [processNextPush]
  );

  const { timeline, sampleStep, sourceLength } = useMemo<{
    timeline: TimelinePoint[];
    sampleStep: number;
    sourceLength: number;
  }>(() => {
    const raw = buildTimeline(1000);
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
  }, []);

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
    enqueueChartPushes(1);
  }, [enqueueChartPushes]);

  const pushCharts = useCallback(
    (times: number) => {
      enqueueChartPushes(times);
    },
    [enqueueChartPushes]
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
            <span style={{ fontWeight: 600 }}>
              현재 Chart 스택: {chartStackCount.toLocaleString()}
            </span>
          </div>
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
      </div>
    </AppScreen>
  );
};

export default ChartActivity;
