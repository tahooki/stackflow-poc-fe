import { useEffect, useMemo, useRef } from "react";
import {
  type ColDef,
  type GridApi,
  type GridReadyEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import type { AgGridReactProps } from "ag-grid-react";

import CardFieldRenderer from "./CardFieldRenderer";
import { createCardFieldBuilder, type CardColumnDef } from "../../lib/agGridCardFields";

export type ViewMode = "table" | "card";

type BaseAgGridProps<TData> = Omit<
  AgGridReactProps<TData>,
  "columnDefs" | "rowData" | "defaultColDef"
>;

export type StackflowAgGridProps<TData> = {
  columnDefs: CardColumnDef<TData>[];
  rowData: TData[];
  viewMode: ViewMode;
  defaultColDef?: ColDef<TData>;
  cardDefaultColDef?: ColDef<TData>;
  tableProps?: BaseAgGridProps<TData>;
  cardProps?: BaseAgGridProps<TData>;
  className?: string;
  height?: number | string;
};

const DEFAULT_TABLE_COL_DEF: ColDef = {
  sortable: true,
  resizable: true,
  filter: true,
};

const DEFAULT_CARD_COL_DEF: ColDef = {
  sortable: false,
  resizable: false,
  filter: false,
};

const StackflowAgGrid = <TData,>({
  columnDefs,
  rowData,
  viewMode,
  defaultColDef,
  cardDefaultColDef,
  tableProps,
  cardProps,
  className,
  height = 520,
}: StackflowAgGridProps<TData>) => {
  const gridApiRef = useRef<GridApi<TData> | null>(null);

  const cardColumns = useMemo(
    () => columnDefs.filter((column) => column.card?.hidden !== true),
    [columnDefs],
  );

  const cardValueGetter = useMemo(
    () => createCardFieldBuilder(cardColumns),
    [cardColumns],
  );

  const computedColumnDefs = useMemo<ColDef<TData>[]>(
    () =>
      viewMode === "table"
        ? columnDefs
        : [
            {
              headerName: "",
              colId: "__card",
              flex: 1,
              autoHeight: true,
              valueGetter: cardValueGetter,
              cellRenderer: CardFieldRenderer,
              suppressHeaderMenuButton: true,
              suppressHeaderFilterButton: true,
              suppressMovable: true,
            },
          ],
    [columnDefs, viewMode, cardValueGetter],
  );

  const mergedTableProps: BaseAgGridProps<TData> = {
    animateRows: true,
    suppressCellFocus: true,
    rowHeight: 56,
    pagination: true,
    paginationPageSize: 6,
    ...tableProps,
  };

  const mergedCardProps: BaseAgGridProps<TData> = {
    suppressCellFocus: true,
    domLayout: "autoHeight",
    headerHeight: 0,
    ...cardProps,
  };

  const {
    onGridReady: userTableGridReady,
    ...tableRuntimeProps
  } = mergedTableProps;

  const {
    onGridReady: userCardGridReady,
    ...cardRuntimeProps
  } = mergedCardProps;

  const mergedDefaultColDef =
    viewMode === "table"
      ? { ...DEFAULT_TABLE_COL_DEF, ...defaultColDef }
      : { ...DEFAULT_CARD_COL_DEF, ...cardDefaultColDef };

  const handleGridReady = (event: GridReadyEvent<TData>) => {
    gridApiRef.current = event.api;

    const userHandler =
      viewMode === "table"
        ? userTableGridReady
        : userCardGridReady;

    if (userHandler) {
      userHandler(event);
    }
  };

  useEffect(() => {
    if (!gridApiRef.current) {
      return;
    }

    gridApiRef.current.resetRowHeights();
  }, [viewMode]);

  const viewSpecificProps =
    viewMode === "table" ? tableRuntimeProps : cardRuntimeProps;

  return (
    <div
      className={`stackflow-grid${
        viewMode === "card" ? " stackflow-grid--card" : ""
      }${className ? ` ${className}` : ""}`}
    >
      <div
        className={`ag-theme-quartz stackflow-grid__surface${
          viewMode === "card" ? " stackflow-grid__surface--card" : ""
        }`}
        style={{ height: viewMode === "table" ? height : "auto" }}
      >
        <AgGridReact<TData>
          rowData={rowData}
          columnDefs={computedColumnDefs}
          defaultColDef={mergedDefaultColDef}
          {...viewSpecificProps}
          onGridReady={handleGridReady}
        />
      </div>
    </div>
  );
};

export default StackflowAgGrid;
