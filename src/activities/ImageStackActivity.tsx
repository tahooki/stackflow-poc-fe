import { useCallback, useEffect, useMemo, useRef } from "react";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useStack } from "@stackflow/react";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";

export type ImageStackActivityParams = Record<string, never>;

const IMAGE_PATHS = ["/images/3mg.jpg", "/images/5mg.jpg", "/images/7mg.jpg"];

const IMAGE_COUNT_PER_ACTIVITY = 10;
const PUSH_INTERVAL_MS = 100;

const ImageStackActivity: ActivityComponentType<
  ImageStackActivityParams
> = () => {
  const { push } = useNavActions();
  const stack = useStack();

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
    push("image-stack", {});

    if (pendingPushCountRef.current <= 0) {
      pushTimerRef.current = null;
      return;
    }

    pushTimerRef.current = window.setTimeout(processNextPush, PUSH_INTERVAL_MS);
  }, [push]);

  const enqueuePushes = useCallback(
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

  const imageSources = useMemo(
    () =>
      Array.from({ length: IMAGE_COUNT_PER_ACTIVITY }, (_, index) => ({
        id: `${index}`,
        src: IMAGE_PATHS[2],
        label: `Sample ${index + 1}`,
      })),
    []
  );

  const stackCount = useMemo(
    () =>
      stack.activities.reduce(
        (count, activity) =>
          activity.name === "image-stack" ? count + 1 : count,
        0
      ),
    [stack.activities]
  );

  return (
    <AppScreen appBar={{ title: "Image Stack Activity" }}>
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
