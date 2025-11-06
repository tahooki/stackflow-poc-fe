import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useMemo, useState } from "react";

import "../assets/agGridActivity.css";
import CardFieldRenderer from "../components/ag-grid/CardFieldRenderer";
import {
  createCardFieldBuilder,
  type CardColumnDef,
} from "../lib/agGridCardFields";

ModuleRegistry.registerModules([AllCommunityModule]);

type FulfillmentStatus = "Pending" | "Processing" | "Delayed" | "Shipped";

type OrderSummary = {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: FulfillmentStatus;
  createdAt: string;
  notes: string;
  eta: string;
};

type ViewMode = "table" | "card";

const statusBadgeTone: Record<FulfillmentStatus, string> = {
  Pending: "neutral",
  Processing: "info",
  Delayed: "warning",
  Shipped: "success",
};

const buildDataset = (): OrderSummary[] => [
  {
    id: "A-1042",
    customer: "Alice Kim",
    items: 3,
    total: 186000,
    status: "Processing",
    createdAt: "2025-02-01",
    eta: "2025-02-06",
    notes:
      "Customer requested split shipment for urgent items. Gift wrapping required for SKU H-882.",
  },
  {
    id: "B-2330",
    customer: "Minho Park",
    items: 8,
    total: 742500,
    status: "Pending",
    createdAt: "2025-02-03",
    eta: "2025-02-10",
    notes:
      "Awaiting payment confirmation from corporate finance team. Hold inventory for 48 hours.",
  },
  {
    id: "C-3208",
    customer: "Emma Lee",
    items: 1,
    total: 58000,
    status: "Shipped",
    createdAt: "2025-01-28",
    eta: "2025-02-02",
    notes: "Shipped via express courier. Tracking #SF10293847. Send satisfaction survey.",
  },
  {
    id: "D-9912",
    customer: "Jiwon Choi",
    items: 5,
    total: 324500,
    status: "Delayed",
    createdAt: "2025-01-25",
    eta: "2025-02-15",
    notes:
      "Upstream supplier reported shortage on component 44AC. Provide daily status update to operations.",
  },
  {
    id: "E-4511",
    customer: "Julian Park",
    items: 12,
    total: 1124500,
    status: "Processing",
    createdAt: "2025-02-05",
    eta: "2025-02-12",
    notes: "High priority B2B customer. Bundle marketing inserts with package.",
  },
  {
    id: "F-6804",
    customer: "Sujin Han",
    items: 2,
    total: 94500,
    status: "Pending",
    createdAt: "2025-02-04",
    eta: "2025-02-08",
    notes: "Confirm color variant availability before fulfilling.",
  },
];

const AgGridActivity: ActivityComponentType = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [gridApi, setGridApi] = useState<GridApi<OrderSummary> | null>(null);
  const rowData = useMemo(() => buildDataset(), []);
  const baseColumnDefs = useMemo<CardColumnDef<OrderSummary>[]>(
    () => [
      {
        headerName: "Customer",
        field: "customer",
        flex: 1,
        minWidth: 180,
        card: {
          order: 0,
        },
      },
      {
        headerName: "Status",
        field: "status",
        width: 140,
        card: {
          order: 1,
          render: ({ value }) => {
            const status = (value as FulfillmentStatus) ?? "Pending";
            const tone = statusBadgeTone[status] ?? "neutral";

            return (
              <span className={`order-card__badge order-card__badge--${tone}`}>
                {status}
              </span>
            );
          },
        },
      },
      {
        headerName: "Order #",
        field: "id",
        minWidth: 140,
        pinned: "left",
        card: {
          label: "Order #",
          order: 2,
        },
      },
      {
        headerName: "Items",
        field: "items",
        width: 110,
        card: {
          order: 3,
        },
      },
      {
        headerName: "Total (₩)",
        field: "total",
        flex: 0.6,
        valueFormatter: ({ value }) =>
          typeof value === "number" ? value.toLocaleString() : value,
        card: {
          label: "Total",
          order: 4,
          render: ({ formattedValue }) => `₩${String(formattedValue ?? "")}`,
        },
      },
      {
        headerName: "Created",
        field: "createdAt",
        width: 150,
        card: {
          label: "Created",
          order: 5,
        },
      },
      {
        headerName: "ETA",
        field: "eta",
        width: 150,
        card: {
          label: "ETA",
          order: 6,
        },
      },
      {
        headerName: "Notes",
        field: "notes",
        hide: true,
        card: {
          label: "Notes",
          order: 7,
          render: ({ value }) => (
            <p className="order-card__notes">{String(value ?? "")}</p>
          ),
        },
      },
    ],
    [],
  );

  const cardColumns = useMemo(
    () => baseColumnDefs.filter((column) => column.card?.hidden !== true),
    [baseColumnDefs],
  );

  const cardValueGetter = useMemo(
    () => createCardFieldBuilder(cardColumns),
    [cardColumns],
  );

  const columnDefs = useMemo<ColDef<OrderSummary>[]>(
    () =>
      viewMode === "table"
        ? baseColumnDefs
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
    [baseColumnDefs, cardValueGetter, viewMode],
  );

  useEffect(() => {
    if (!gridApi) {
      return;
    }

    gridApi.resetRowHeights();
  }, [gridApi, viewMode]);

  const defaultColDef = useMemo<ColDef<OrderSummary>>(
    () =>
      viewMode === "table"
        ? {
            sortable: true,
            resizable: true,
            filter: true,
          }
        : {
            sortable: false,
            resizable: false,
            filter: false,
          },
    [viewMode],
  );

  return (
    <AppScreen appBar={{ title: "AG Grid Experiment", border: true }}>
      <section className="grid-activity">
        <header className="grid-activity__toolbar">
          <div>
            <h2>Order fulfillment board</h2>
            <p>
              Toggle between the classic AG Grid table and an inline card canvas using the same
              dataset.
            </p>
          </div>
          <div className="grid-activity__actions">
            <button
              type="button"
              className={viewMode === "table" ? "is-active" : ""}
              onClick={() => setViewMode("table")}
            >
              Table view
            </button>
            <button
              type="button"
              className={viewMode === "card" ? "is-active" : ""}
              onClick={() => setViewMode("card")}
            >
              Card view
            </button>
          </div>
        </header>

        <div
          className={`ag-theme-quartz grid-activity__grid${
            viewMode === "card" ? " grid-activity__grid--card" : ""
          }`}
          style={{ height: viewMode === "table" ? "520px" : "auto" }}
        >
          <AgGridReact<OrderSummary>
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowData={rowData}
            animateRows
            pagination={viewMode === "table"}
            paginationPageSize={6}
            suppressCellFocus
            onGridReady={({ api }: GridReadyEvent<OrderSummary>) => {
              setGridApi(api);
            }}
            rowHeight={viewMode === "table" ? 56 : undefined}
            domLayout={viewMode === "card" ? "autoHeight" : "normal"}
            headerHeight={viewMode === "card" ? 0 : undefined}
            overlayNoRowsTemplate="No orders available"
          />
        </div>
      </section>
    </AppScreen>
  );
};

export default AgGridActivity;
