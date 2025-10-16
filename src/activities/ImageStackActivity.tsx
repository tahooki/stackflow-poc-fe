import { useMemo } from "react";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";
import { usePushQueue } from "../hooks/usePushQueue";
import { useStackCount } from "../hooks/useStackCount";
import { performanceTracker } from "../lib/performanceTracker";
import { memoryUtils } from "../lib/memoryUtils";
import { useStack } from "@stackflow/react";
import { useEffect } from "react";

export type ImageStackActivityParams = Record<string, never>;

const IMAGE_PATHS = ["/images/3mg.jpg", "/images/5mg.jpg", "/images/7mg.jpg"];

const IMAGE_COUNT_PER_ACTIVITY = 10;

const ImageStackActivity: ActivityComponentType<
  ImageStackActivityParams
> = () => {
  const { push } = useNavActions();
  const stack = useStack();
  const { stackCount } = useStackCount({
    activityName: "image-stack",
  });
  const { queueStatus, enqueuePushes } = usePushQueue({
    activityName: "image-stack",
  });

  // 성능 데이터 기록
  useEffect(() => {
    const memoryUsageMB = memoryUtils.getCurrentMemoryUsage();
    performanceTracker.recordPerformance({
      activityName: "image-stack",
      memoryUsageMB,
      stackCount,
      stackDepth: stack.activities.length,
    });
  }, [stackCount, stack.activities.length]);

  const imageSources = useMemo(
    () =>
      Array.from({ length: IMAGE_COUNT_PER_ACTIVITY }, (_, index) => ({
        id: `${index}`,
        src: IMAGE_PATHS[2],
        label: `Sample ${index + 1}`,
      })),
    []
  );

  return (
    <AppScreen
      appBar={{
        title: "Image Stack Activity",
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
          <h1>Image Gallery Slice</h1>
          <p>
            Each activity renders {IMAGE_COUNT_PER_ACTIVITY} images from
            `/public/images`.
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
            <button type="button" onClick={() => enqueuePushes(1)}>
              페이지 추가
            </button>
            <button type="button" onClick={() => enqueuePushes(5)}>
              5개 쌓기
            </button>
            <button type="button" onClick={() => enqueuePushes(10)}>
              10개 쌓기
            </button>
            <button type="button" onClick={() => enqueuePushes(100)}>
              100개 쌓기
            </button>
            <button type="button" onClick={() => enqueuePushes(1000)}>
              1000개 쌓기
            </button>
            <span style={{ fontWeight: 600 }}>
              현재 Image 스택: {stackCount.toLocaleString()}
            </span>
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
          <section className="activity__card">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 40,
              }}
            >
              {imageSources.map((item) => (
                <figure
                  key={item.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    margin: 0,
                  }}
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    style={{
                      width: "100%",
                      objectFit: "cover",
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    }}
                    loading="lazy"
                  />
                  <figcaption style={{ fontSize: 14, color: "#555" }}>
                    {item.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppScreen>
  );
};

export default ImageStackActivity;
