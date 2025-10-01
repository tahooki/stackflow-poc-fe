/**
 * StateSnapshotPanel은 라우트, 로컬 스토리지 등 브라우저 상태를 캡처해 목록으로 보여주고,
 * 필요 시 복원 루틴을 연결할 수 있도록 안내하는 좌측 하단 패널입니다.
 * 아직 전역 상태 스토어에 직접 접근하지는 않으므로, 복원은 사용자가 연결해야 합니다.
 */
import React, { useState } from "react";

type Snap = { id: string; at: number; route?: string; data: any };

/**
 * `max` 개수만큼 최근 스냅샷을 보관하면서 브라우저 컨텍스트 정보를 캡처합니다.
 */
export function StateSnapshotPanel({
  max = 10,
}: {
  max?: number;
}) {
  const [snaps, setSnaps] = useState<Snap[]>([]);

  /**
   * 현재 시각, 경로, 로컬 스토리지 스냅샷을 수집해 배열 앞쪽에 추가합니다.
   */
  const capture = () => {
    const data = { 
      timestamp: Date.now(),
      pathname: location.pathname,
      localStorage: { ...localStorage },
    };
    const snap: Snap = {
      id: Math.random().toString(36).slice(2),
      at: Date.now(),
      route: location.pathname,
      data,
    };
    setSnaps((arr) => [snap, ...arr].slice(0, max));
  };

  /**
   * 실제 복원은 애플리케이션 상태 관리 라이브러리와 연동해야 하므로,
   * 현재는 가이드 메시지를 보여주고 콘솔에 스냅샷을 출력합니다.
   */
  const restore = (snap: Snap) => {
    console.info(
      "[Snapshot] restore needed → wire into redux/zustand setters",
      snap
    );
    alert("복원 훅에 연결 필요: 콘솔 참고");
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
      <ul style={{ maxHeight: 160, overflow: "auto", marginTop: 6, listStyle: "none", padding: 0 }}>
        {snaps.map((s) => (
          <li key={s.id} style={{ marginBottom: 6 }}>
            <code style={{ fontSize: 10 }}>
              {new Date(s.at).toLocaleTimeString()} · {s.route}
            </code>
            <button onClick={() => restore(s)} style={{ marginLeft: 6, fontSize: 10 }}>
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
