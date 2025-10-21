import { useMemo } from "react";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";
import { usePushQueue } from "../hooks/usePushQueue";
import { useStackCount } from "../hooks/useStackCount";
import { performanceTracker } from "../lib/performanceTracker";
import { useEffect } from "react";
import { formatBytes } from "../lib/dataSize";

export type ImageStackActivityParams = Record<string, never>;

const IMAGE_PATHS = ["/images/3mg.jpg", "/images/5mg.jpg", "/images/7mg.jpg"];
const IMAGE_SIZE_BYTES: Record<string, number> = {
  "/images/3mg.jpg": 3_348_824,
  "/images/5mg.jpg": 5_358_412,
  "/images/7mg.jpg": 7_216_767,
};
const SELECTED_IMAGE = IMAGE_PATHS[2];

const IMAGE_COUNT_PER_ACTIVITY = 10;

const IMAGE_MEASUREMENT_SNIPPET = String.raw`
// 이미지 스택 활동은 선택한 이미지의 파일 크기와 스택 개수를 곱해 예상 메모리 사용량을 산출합니다.
const imageSources = useMemo(
  () =>
    Array.from({ length: IMAGE_COUNT_PER_ACTIVITY }, (_, index) => ({
      id: \`\${index}\`,
      src: SELECTED_IMAGE,
      label: \`Sample \${index + 1}\`,
    })),
  []
);
// 선택한 이미지의 파일 크기
const imageBytesPerActivity = 7216767; // 7.21MB
const estimatedStackBytes = imageBytesPerActivity * stackCount; // 7.21MB * 10 = 72.1MB

useEffect(() => {
  const dataMemoryMB = imageBytesPerActivity / (1024 * 1024); // 현재 화면에서 로컬로 생성한 이미지의 메모리 사용량
  const totalMemoryMB = estimatedStackBytes / (1024 * 1024); // 스택에 있는 모든 이미지의 총 메모리 사용량

  performanceTracker.recordPerformance({
    activityName: "image-stack",
    memoryUsageMB: totalMemoryMB,
    stackDepth,
  });
}, [stackDepth, imageBytesPerActivity, estimatedStackBytes]);
`.trim();

const ImageStackActivity: ActivityComponentType<
  ImageStackActivityParams
> = () => {
  const { push } = useNavActions();
  const { stackCount, stackDepth } = useStackCount({
    activityName: "image-stack",
  });
  const { queueStatus, enqueuePushes } = usePushQueue({
    activityName: "image-stack",
  });

  const imageSources = useMemo(
    () =>
      Array.from({ length: IMAGE_COUNT_PER_ACTIVITY }, (_, index) => ({
        id: `${index}`,
        src: SELECTED_IMAGE,
        label: `Sample ${index + 1}`,
      })),
    []
  );
  const imageBytesPerActivity = IMAGE_SIZE_BYTES[SELECTED_IMAGE] ?? 0;
  const estimatedStackBytes = imageBytesPerActivity * stackCount;

  // 성능 데이터 기록
  useEffect(() => {
    const dataMemoryMB = imageBytesPerActivity / (1024 * 1024);
    const totalMemoryMB = estimatedStackBytes / (1024 * 1024);

    // 로컬스토리지에 저장
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "image-stack-activity-memory",
        JSON.stringify({
          dataMemoryMB,
          totalMemoryMB,
          stackCount,
          stackDepth,
          timestamp: Date.now(),
        })
      );
    }

    performanceTracker.recordPerformance({
      activityName: "image-stack",
      memoryUsageMB: totalMemoryMB,
      stackCount,
      stackDepth,
    });
  }, [stackCount, stackDepth, imageBytesPerActivity, estimatedStackBytes]);

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
          <p
            style={{
              marginTop: 8,
              color: "#475569",
            }}
          >
            활동당 이미지 용량: {formatBytes(imageBytesPerActivity)} · 이미지
            활동 총 예상 용량: {formatBytes(estimatedStackBytes)} · 전체 스택
            깊이: {stackDepth.toLocaleString()}
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

        <section className="activity__card" style={{ marginTop: 24 }}>
          <h2>측정 데이터 코드 참고</h2>
          <p>
            Image Stack 활동은 선택한 이미지의 파일 크기와 스택 개수를 곱해 예상
            메모리 사용량을 산출합니다. 아래 코드는 해당 계산과{" "}
            <code>performanceTracker</code> 로그 기록 흐름을 발췌한 부분입니다.
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
            <code>{IMAGE_MEASUREMENT_SNIPPET}</code>
          </pre>
        </section>
      </div>
    </AppScreen>
  );
};

export default ImageStackActivity;
