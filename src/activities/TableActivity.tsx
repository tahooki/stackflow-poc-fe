import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useCallback, useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

import { useNavActions } from "../hooks/useNavActions";
import { usePushQueue } from "../hooks/usePushQueue";
import { useStackCount } from "../hooks/useStackCount";
import { createWaferDatasetCopy } from "../lib/waferDataset";
import { ensureAgGridModules } from "../lib/agGridModules";

export type TableActivityParams = Record<string, never>;

type WaferSummaryRow = {
  waferId: string;
  lotId: string;
  processStep: string;
  equipmentId: string;
  timestamp: string;
  yieldPercent: number | null;
  defectDensity: number | null;
};

ensureAgGridModules();

const TableActivity: ActivityComponentType<TableActivityParams> = () => {
  const { push } = useNavActions();
  const recordCount = 1000;
  const { stackCount: tableStackCount } = useStackCount({
    activityName: "table",
  });
  const { queueStatus, enqueuePushes, cancelQueue, canCancelQueue } =
    usePushQueue({
      activityName: "table",
    });
  const dataset = useMemo(() => createWaferDatasetCopy(1000), [recordCount]);

  const rowData = useMemo<WaferSummaryRow[]>(
    () =>
      dataset.map((entry) => ({
        waferId: entry.wafer_id,
        lotId: entry.lot_id,
        processStep: entry.process_step,
        equipmentId: entry.equipment_id,
        timestamp: new Date(entry.timestamp).toLocaleString(),
        yieldPercent:
          typeof entry.yield?.estimated_yield_percentage === "number"
            ? entry.yield.estimated_yield_percentage
            : typeof entry.yield?.final_yield_percentage === "number"
            ? entry.yield.final_yield_percentage
            : null,
        defectDensity:
          typeof entry.defects?.defect_density === "number"
            ? entry.defects.defect_density
            : null,
      })),
    [dataset]
  );

  const columnDefs = useMemo<ColDef<WaferSummaryRow>[]>(
    () => [
      { headerName: "Wafer", field: "waferId", minWidth: 140, sortable: true },
      { headerName: "Lot", field: "lotId", minWidth: 100, sortable: true },
      {
        headerName: "Process Step",
        field: "processStep",
        minWidth: 160,
        flex: 1,
      },
      { headerName: "Equipment", field: "equipmentId", minWidth: 140 },
      { headerName: "Timestamp", field: "timestamp", minWidth: 200 },
      {
        headerName: "Yield (%)",
        field: "yieldPercent",
        type: "numericColumn",
        valueFormatter: ({ value }) =>
          typeof value === "number" ? value.toFixed(2) : "N/A",
        filter: "agNumberColumnFilter",
        minWidth: 140,
      },
      {
        headerName: "Defect Density",
        field: "defectDensity",
        type: "numericColumn",
        valueFormatter: ({ value }) =>
          typeof value === "number" ? value.toFixed(3) : "N/A",
        filter: "agNumberColumnFilter",
        minWidth: 160,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<WaferSummaryRow>>(
    () => ({ resizable: true, filter: true }),
    []
  );
  const pushTable = useCallback(() => {
    enqueuePushes(1);
  }, [enqueuePushes]);

  const pushTables = useCallback(
    (times: number) => {
      enqueuePushes(times);
    },
    [enqueuePushes]
  );

  return (
    <AppScreen
      appBar={{
        title: "Table Activity",
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
          <h1>Wafer Dataset Table</h1>
          <p>
            {rowData.length.toLocaleString()} records loaded into this activity.
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
            <button type="button" onClick={pushTable}>
              페이지 추가
            </button>
            <button type="button" onClick={() => pushTables(5)}>
              5개 쌓기
            </button>
            <button type="button" onClick={() => pushTables(10)}>
              10개 쌓기
            </button>
            <button type="button" onClick={() => pushTables(100)}>
              100개 쌓기
            </button>
            <span style={{ fontWeight: 600 }}>
              현재 Table 스택: {tableStackCount.toLocaleString()}
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
              className="ag-theme-quartz"
              style={{ height: 560, width: "100%" }}
            >
              <AgGridReact<WaferSummaryRow>
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
              />
            </div>
          </section>
        </div>
      </div>
    </AppScreen>
  );
};

export default TableActivity;
