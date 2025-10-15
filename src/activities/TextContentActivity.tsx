import { useCallback, useEffect, useRef, useState } from "react";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useNavActions } from "../hooks/useNavActions";

export type TextContentActivityParams = Record<string, never>;

const TEXT_DISPATCH_COUNT_KEY = "text-activity-dispatched-count";

const parseStoredCount = (raw: string | null) => {
  if (!raw) {
    return 0;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

const readStoredCount = () => {
  if (typeof window === "undefined") {
    return 0;
  }
  return parseStoredCount(window.localStorage.getItem(TEXT_DISPATCH_COUNT_KEY));
};

const TextContentActivity: ActivityComponentType<
  TextContentActivityParams
> = () => {
  const { push } = useNavActions();
  const pendingPushCountRef = useRef(0);
  const pushTimerRef = useRef<number | null>(null);
  const [dispatchedCount, setDispatchedCount] = useState<number>(() =>
    readStoredCount()
  );

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

  const updateDispatchedCount = useCallback((increment: number) => {
    if (increment === 0) {
      return;
    }
    setDispatchedCount((prev) => {
      const next = Math.max(prev + increment, 0);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TEXT_DISPATCH_COUNT_KEY, next.toString(10));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TEXT_DISPATCH_COUNT_KEY) {
        setDispatchedCount(parseStoredCount(event.newValue));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const processNextPush = useCallback(() => {
    if (pendingPushCountRef.current <= 0) {
      pushTimerRef.current = null;
      return;
    }

    pendingPushCountRef.current -= 1;
    push("text", {});
    updateDispatchedCount(1);

    if (pendingPushCountRef.current <= 0) {
      pushTimerRef.current = null;
      return;
    }

    pushTimerRef.current = window.setTimeout(processNextPush, 100);
  }, [push, updateDispatchedCount]);

  const pushCopies = useCallback(
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

  return (
    <AppScreen appBar={{ title: "Article" }}>
      <div className="activity">
        <section className="activity__header">
          <h1>일반 콘텐츠 페이지</h1>
          <p>
            무거운 메모리 스택 위에 올려서 전환 애니메이션과 스크롤 유지 동작을
            검증하기 위한 간단한 텍스트 화면입니다.
          </p>
          <p
            style={{
              marginTop: 16,
              fontWeight: 600,
              color: "#334155",
            }}
          >
            현재 텍스트 스택 수: {dispatchedCount.toLocaleString()}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <button type="button" onClick={() => pushCopies(1)}>
              +1 Stack
            </button>
            <button type="button" onClick={() => pushCopies(10)}>
              +10 Stack
            </button>
            <button type="button" onClick={() => pushCopies(100)}>
              +100 Stack
            </button>
            <button type="button" onClick={() => pushCopies(1000)}>
              +1000 Stack
            </button>
          </div>
        </section>

        <div className="activity__content">
          <section className="activity__card">
            <h2>개요</h2>
            <p>
              이 페이지는 가벼운 UI 구성 요소만 포함하여 렌더링 자체에 큰 부담이
              없습니다. 대신 전형적인 기사 레이아웃과 유사한 구조를 담고 있어
              실제 사용자 흐름과 가까운 조건을 재현합니다.
            </p>
          </section>

          <section className="activity__card">
            <h2>본문</h2>
            <p>
              스택에 다수의 메모리 집중 활동이 존재하는 상태에서 이 화면으로
              전환해 애니메이션이 얼마나 부드러운지 확인해 보세요.
            </p>
            <p>
              동시에 스크롤을 여러 위치로 이동한 뒤 뒤로 가기와 앞으로 가기를
              반복하면 Stackflow가 기본적으로 제공하는 스크롤 복구 기능이
              유지되는지도 쉽게 관찰할 수 있습니다.
            </p>
            <p>
              실제 서비스 상황처럼 다양한 길이의 문단을 배치하고 텍스트 스타일만
              적용했기 때문에 DOM 노드 수가 최소화되어 있으며, 레이아웃 계산
              역시 간단하게 끝납니다.
            </p>
          </section>

          <section className="activity__card">
            <h2>체크 포인트</h2>
            <ul>
              <li>전환 애니메이션이 heavy 스택 위에서도 일정한지</li>
              <li>뒤로가기/앞으로가기 시 스크롤 위치가 정확히 복구되는지</li>
              <li>메모리 모니터링 툴에서 누수가 발생하지 않는지</li>
            </ul>
          </section>

          <section className="activity__card">
            <h2>추가 메모</h2>
            <p>
              필요하다면 이 화면을 복제하여 다양한 길이나 구성의 텍스트 페이지를
              비교 실험에 사용할 수 있습니다. 예를 들어 헤더 이미지를
              추가하거나, 리스트 길이를 늘려서 레이아웃 확장을 재현할 수
              있습니다.
            </p>
          </section>
        </div>
      </div>
    </AppScreen>
  );
};

export default TextContentActivity;
