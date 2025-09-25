import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

import { useNavActions } from "../hooks/useNavActions";
import { createWaferDatasetCopy } from "../lib/waferDataset";
import { useDatasetStore } from "../stores/datasetStore";
import type { DatasetState } from "../stores/datasetStore";
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
  const recordCount = useDatasetStore((state: DatasetState) => state.recordCount);
  const dataset = useMemo(() => createWaferDatasetCopy(recordCount), [recordCount]);

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
      { headerName: "Process Step", field: "processStep", minWidth: 160, flex: 1 },
      { headerName: "Equipment", field: "equipmentId", minWidth: 140 },
      { headerName: "Timestamp", field: "timestamp", minWidth: 200 },
      {
        headerName: "Yield (%)",
        field: "yieldPercent",
        type: "numericColumn",
        valueFormatter: ({ value }) => (typeof value === "number" ? value.toFixed(2) : "N/A"),
        filter: "agNumberColumnFilter",
        minWidth: 140,
      },
      {
        headerName: "Defect Density",
        field: "defectDensity",
        type: "numericColumn",
        valueFormatter: ({ value }) => (typeof value === "number" ? value.toFixed(3) : "N/A"),
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

  return (
    <AppScreen
      appBar={{
        title: "Table Activity",
        renderRight: () => (
          <button type="button" className="app-bar__action" onClick={() => push("table", {})}>
            페이지 추가
          </button>
        ),
      }}
    >
      <div className="activity">
        <section className="activity__header">
          <h1>Wafer Dataset Table</h1>
          <p>{rowData.length.toLocaleString()} records loaded into this activity.</p>
        </section>

        <div className="activity__content">
          <section className="activity__card">
            <div className="ag-theme-quartz" style={{ height: 560, width: "100%" }}>
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
