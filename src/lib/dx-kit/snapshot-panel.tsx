/**
 * StateSnapshotPanel은 라우트, 로컬 스토리지 등 브라우저 상태를 캡처해 목록으로 보여주고,
 * 필요 시 복원 루틴을 연결할 수 있도록 안내하는 좌측 하단 패널입니다.
 * 아직 전역 상태 스토어에 직접 접근하지는 않으므로, 복원은 사용자가 연결해야 합니다.
 */
import { useState } from "react";

import { useDatasetStore } from "../../stores/datasetStore";

type SnapshotPayload = {
  timestamp: number;
  pathname: string;
  localStorage: Record<string, string>;
  zustand?: {
    dataset?: {
      recordCount: number;
    };
  };
};

type Snap = { id: string; at: number; route?: string; data: SnapshotPayload };

/**
 * `max` 개수만큼 최근 스냅샷을 보관하면서 브라우저 컨텍스트 정보를 캡처합니다.
 */
export function StateSnapshotPanel({
  max = 10,
}: {
  max?: number;
}) {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [lastRestoredId, setLastRestoredId] = useState<string | null>(null);

  const datasetSnapshot = useDatasetStore((state) => ({
    recordCount: state.recordCount,
  }));

  const hasZustandBindings = datasetSnapshot !== undefined;

  const readLocalStorage = () => {
    const snapshot: Record<string, string> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      const value = localStorage.getItem(key);
      if (value !== null) {
        snapshot[key] = value;
      }
    }
    return snapshot;
  };

  const restoreLocalStorage = (data: Record<string, string>) => {
    const existingKeys = new Set<string>();
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key) {
        existingKeys.add(key);
      }
    }

    existingKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  };

  /**
   * 현재 시각, 경로, 로컬 스토리지 스냅샷을 수집해 배열 앞쪽에 추가합니다.
   */
  const capture = () => {
    const zustand: SnapshotPayload["zustand"] = {};

    if (hasZustandBindings) {
      const { recordCount } = useDatasetStore.getState();
      zustand.dataset = { recordCount };
    }

    const data: SnapshotPayload = {
      timestamp: Date.now(),
      pathname: location.pathname,
      localStorage: readLocalStorage(),
      ...(Object.keys(zustand).length > 0 ? { zustand } : {}),
    };
    const snap: Snap = {
      id: Math.random().toString(36).slice(2),
      at: Date.now(),
      route: location.pathname,
      data,
    };
    setSnaps((arr) => [snap, ...arr].slice(0, max));
    setLastRestoredId(null);
  };

  /**
   * 실제 복원은 애플리케이션 상태 관리 라이브러리와 연동해야 하므로,
   * 현재는 가이드 메시지를 보여주고 콘솔에 스냅샷을 출력합니다.
   */
  const restore = (snap: Snap) => {
    if (snap.data.localStorage) {
      restoreLocalStorage(snap.data.localStorage);
    }

    if (snap.data.zustand?.dataset) {
      const { recordCount } = snap.data.zustand.dataset;
      const { setRecordCount } = useDatasetStore.getState();
      setRecordCount(recordCount);
    }

    setLastRestoredId(snap.id);
  };

  /**
   * 저장된 모든 스냅샷을 삭제합니다.
   */
  const clearAll = () => {
    setSnaps([]);
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 10,
        bottom: 10,
        background: "rgba(0,0,0,.7)",
        color: "#fff",
        padding: 8,
        borderRadius: 8,
        font: "12px ui-monospace,monospace",
        zIndex: 2147483647,
        maxWidth: 300,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Snapshots</div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={capture}>Save</button>
        {snaps.length > 0 && <button onClick={clearAll}>Clear All</button>}
      </div>
      {hasZustandBindings && (
        <div
          style={{
            marginTop: 6,
            fontSize: 10,
            opacity: 0.8,
          }}
        >
          dataset.recordCount: <strong>{datasetSnapshot.recordCount}</strong>
        </div>
      )}
      <ul style={{ maxHeight: 160, overflow: "auto", marginTop: 6, listStyle: "none", padding: 0 }}>
        {snaps.map((s) => (
          <li
            key={s.id}
            style={{
              marginBottom: 6,
              background: s.id === lastRestoredId ? "rgba(59, 130, 246, 0.25)" : undefined,
              borderRadius: 4,
              padding: 4,
            }}
          >
            <code style={{ fontSize: 10 }}>
              {new Date(s.at).toLocaleTimeString()} · {s.route}
            </code>
            {s.data.zustand?.dataset && (
              <div style={{ fontSize: 10, marginTop: 2 }}>
                dataset.recordCount ➜ {s.data.zustand.dataset.recordCount}
              </div>
            )}
            <button onClick={() => restore(s)} style={{ marginLeft: 6, fontSize: 10 }}>
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
