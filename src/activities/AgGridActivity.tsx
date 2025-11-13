import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useMemo, useState, type ReactNode } from "react";

import "../assets/agGridActivity.css";
import StackflowAgGrid, {
  type StackflowAgGridProps,
  type ViewMode,
} from "../components/ag-grid/StackflowAgGrid";
import type { CardColumnDef } from "../lib/agGridCardFields";

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

type GridShowcase = {
  id: string;
  title: string;
  description: string;
  columns: CardColumnDef<OrderSummary>[];
  tableProps?: StackflowAgGridProps<OrderSummary>["tableProps"];
  cardProps?: StackflowAgGridProps<OrderSummary>["cardProps"];
};

const statusTone: Record<FulfillmentStatus, "neutral" | "info" | "warning" | "success"> = {
  Pending: "neutral",
  Processing: "info",
  Delayed: "warning",
  Shipped: "success",
};

const formatCurrencyValue = (value: unknown) => {
  if (typeof value === "number") {
    return `₩${value.toLocaleString()}`;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return "₩0";
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

const priorityValueGetter = ({ data }: { data?: OrderSummary | null }) => {
  if (!data) {
    return "Normal";
  }
  if (data.status === "Delayed") {
    return "Urgent";
  }
  if (data.status === "Pending" && data.items >= 8) {
    return "Monitor";
  }
  if (data.total >= 800000) {
    return "Monitor";
  }
  return "Normal";
};

const avgPerItemValueGetter = ({ data }: { data?: OrderSummary | null }) => {
  if (!data || data.items === 0) {
    return null;
  }
  return Math.round(data.total / data.items);
};

const StatusPillRenderer = ({
  value,
}: ICellRendererParams<OrderSummary, FulfillmentStatus>) => {
  const status = value ?? "Pending";
  const tone = statusTone[status] ?? "neutral";
  return <span className={`grid-pill grid-pill--${tone}`}>{status}</span>;
};

const ActionButtonRenderer = ({ data }: ICellRendererParams<OrderSummary>) => {
  if (!data) {
    return null;
  }

  return (
    <button
      type="button"
      className="grid-action-button"
      onClick={() => {
        console.info(`Inspecting order ${data.id}`);
      }}
    >
      View {data.id}
    </button>
  );
};

const renderStatusPill = (status?: FulfillmentStatus | null) => {
  const resolved = status ?? "Pending";
  const tone = statusTone[resolved] ?? "neutral";
  return <span className={`grid-pill grid-pill--${tone}`}>{resolved}</span>;
};

const logInspectAction = (orderId: string) => {
  console.info(`Inspecting order ${orderId}`);
};

const renderActionButton = (order?: OrderSummary | null) => {
  if (!order) {
    return null;
  }

  return (
    <button
      type="button"
      className="grid-action-button"
      onClick={() => logInspectAction(order.id)}
    >
      View {order.id}
    </button>
  );
};

const renderDualLine = (primary: ReactNode, secondary: ReactNode) => (
  <div className="grid-dual-line">
    <strong>{primary}</strong>
    <span>{secondary}</span>
  </div>
);

const renderTimelineContent = (order?: OrderSummary | null) => {
  if (!order) {
    return null;
  }
  return (
    <div className="grid-multiline">
      <div>
        <span className="grid-multiline__label">Created</span>
        <strong>{order.createdAt}</strong>
      </div>
      <div>
        <span className="grid-multiline__label">ETA</span>
        <strong>{order.eta}</strong>
      </div>
    </div>
  );
};

const renderFinancialSummary = (order?: OrderSummary | null) => {
  if (!order) {
    return null;
  }

  const avg = order.items === 0 ? 0 : Math.round(order.total / order.items);

  return (
    <div className="grid-metrics">
      <div>
        <span>Total</span>
        <strong>{formatCurrencyValue(order.total)}</strong>
      </div>
      <div>
        <span>Avg / item</span>
        <strong>{formatCurrencyValue(avg)}</strong>
      </div>
      <div>
        <span>Items</span>
        <strong>{order.items}</strong>
      </div>
    </div>
  );
};

const buildColumns = ({
  priority = true,
  avgPerItem = true,
  actionLabel = "View",
  additionalColumns = [] as CardColumnDef<OrderSummary>[],
}: {
  priority?: boolean;
  avgPerItem?: boolean;
  actionLabel?: string;
  additionalColumns?: CardColumnDef<OrderSummary>[];
}): CardColumnDef<OrderSummary>[] => {
  const columns: CardColumnDef<OrderSummary>[] = [
    {
      headerName: "Order #",
      field: "id",
      minWidth: 140,
      pinned: "left",
      card: { order: 0 },
    },
    {
      headerName: "Customer",
      field: "customer",
      flex: 1,
      minWidth: 200,
      card: { order: 1 },
    },
    {
      headerName: "Status",
      field: "status",
      width: 140,
      cellRenderer: StatusPillRenderer,
      card: {
        order: 2,
        render: ({ value }) => renderStatusPill(value as FulfillmentStatus),
      },
    },
    {
      headerName: "ETA",
      field: "eta",
      width: 150,
      card: { order: 3 },
    },
    priority
      ? {
          headerName: "Priority",
          colId: "priority",
          valueGetter: priorityValueGetter,
          width: 130,
          card: { order: 4 },
        }
      : null,
    {
      headerName: "Items",
      field: "items",
      width: 110,
      card: { order: 5 },
    },
    {
      headerName: "Total (₩)",
      field: "total",
      flex: 0.8,
      valueFormatter: ({ value }) => formatCurrencyValue(value),
      card: { order: 6 },
    },
    avgPerItem
      ? {
          headerName: "Avg / Item",
          colId: "avgPerItem",
          valueGetter: avgPerItemValueGetter,
          valueFormatter: ({ value }) => formatCurrencyValue(value),
          width: 150,
          card: { order: 7 },
        }
      : null,
    {
      headerName: "Created",
      field: "createdAt",
      width: 150,
      card: { order: 8 },
    },
    {
      headerName: "Notes",
      field: "notes",
      flex: 1.5,
      minWidth: 260,
      wrapText: true,
      autoHeight: true,
      card: { order: 9, hideLabel: true },
    },
    {
      headerName: "Actions",
      colId: "actions",
      width: 160,
      suppressMenu: true,
      sortable: false,
      filter: false,
      cellRenderer: ActionButtonRenderer,
      card: {
        label: actionLabel,
        order: 10,
        render: ({ data }) => renderActionButton(data),
      },
    },
  ]
    .filter((column): column is CardColumnDef<OrderSummary> => column != null)
    .map((column, index) => ({
      ...column,
      card: column.card
        ? {
            ...column.card,
            order: column.card.order ?? index,
          }
        : undefined,
    }));

  return [...columns, ...additionalColumns];
};

const createFulfillmentColumns = () => buildColumns({});

const createSlaColumns = (): CardColumnDef<OrderSummary>[] => [
  {
    headerName: "Order · Customer",
    colId: "orderCustomer",
    flex: 1.3,
    autoHeight: true,
    wrapText: true,
    cellRenderer: ({ data }) =>
      renderDualLine(data?.id ?? "—", data?.customer ?? "—"),
    card: {
      order: 0,
      hideLabel: true,
      render: ({ data }) => renderDualLine(data?.id ?? "—", data?.customer ?? "—"),
    },
  },
  {
    headerName: "Status · ETA",
    colId: "statusEta",
    width: 210,
    autoHeight: true,
    wrapText: true,
    cellRenderer: ({ data }) =>
      renderDualLine(
        renderStatusPill(data?.status),
        `ETA ${data?.eta ?? "—"}`,
      ),
    card: {
      order: 1,
      hideLabel: true,
      render: ({ data }) =>
        renderDualLine(renderStatusPill(data?.status), `ETA ${data?.eta ?? "—"}`),
    },
  },
  {
    headerName: "Priority · Items",
    colId: "priorityItems",
    width: 170,
    autoHeight: true,
    wrapText: true,
    cellRenderer: ({ data }) =>
      renderDualLine(priorityValueGetter({ data }), `${data?.items ?? 0} items`),
    card: {
      order: 2,
      hideLabel: true,
      render: ({ data }) =>
        renderDualLine(priorityValueGetter({ data }), `${data?.items ?? 0} items`),
    },
  },
  {
    headerName: "Timeline",
    colId: "timeline",
    flex: 0.9,
    cellRenderer: ({ data }: ICellRendererParams<OrderSummary>) =>
      renderTimelineContent(data),
    wrapText: true,
    autoHeight: true,
    card: {
      order: 3,
      label: "Timeline",
      render: ({ data }) => renderTimelineContent(data),
    },
  },
  {
    headerName: "Notes",
    field: "notes",
    flex: 1.6,
    wrapText: true,
    autoHeight: true,
    card: { order: 4, hideLabel: true },
  },
  {
    headerName: "Actions",
    colId: "actions",
    width: 160,
    suppressMenu: true,
    sortable: false,
    filter: false,
    cellRenderer: ActionButtonRenderer,
    card: {
      label: "Open SLA",
      order: 5,
      render: ({ data }) => renderActionButton(data),
    },
  },
];

const createFinanceColumns = (): CardColumnDef<OrderSummary>[] => [
  {
    headerName: "Order · Customer",
    colId: "orderCustomer",
    flex: 1.1,
    autoHeight: true,
    wrapText: true,
    cellRenderer: ({ data }) =>
      renderDualLine(data?.id ?? "—", data?.customer ?? "—"),
    card: {
      order: 0,
      hideLabel: true,
      render: ({ data }) => renderDualLine(data?.id ?? "—", data?.customer ?? "—"),
    },
  },
  {
    headerName: "Financial summary",
    colId: "financialSummary",
    flex: 1.5,
    colSpan: () => 2,
    cellRenderer: ({ data }: ICellRendererParams<OrderSummary>) =>
      renderFinancialSummary(data),
    wrapText: true,
    autoHeight: true,
    card: {
      order: 1,
      hideLabel: true,
      render: ({ data }) => renderFinancialSummary(data),
    },
  },
  {
    headerName: "",
    colId: "financialSpacer",
    width: 1,
    suppressSizeToFit: true,
    resizable: false,
    lockVisible: true,
    cellRenderer: () => null,
    card: {
      hidden: true,
      order: 2,
    },
  },
  {
    headerName: "Notes",
    field: "notes",
    flex: 1.5,
    wrapText: true,
    autoHeight: true,
    card: {
      order: 3,
      hideLabel: true,
    },
  },
  {
    headerName: "Actions",
    colId: "actions",
    width: 160,
    suppressMenu: true,
    sortable: false,
    filter: false,
    cellRenderer: ActionButtonRenderer,
    card: {
      label: "Inspect",
      order: 4,
      render: ({ data }) => renderActionButton(data),
    },
  },
];

const createGridShowcases = (): GridShowcase[] => [
  {
    id: "fulfillment",
    title: "Order fulfillment board",
    description:
      "Baseline layout showcasing every column rendered in a table row or stacked card without diverging values.",
    columns: createFulfillmentColumns(),
    tableProps: {
      rowHeight: 56,
    },
  },
  {
    id: "sla",
    title: "SLA monitor",
    description:
      "Highlights SLA risk, ETA, and timeline details with multi-line rows so operations teams can scan both lines in either layout.",
    columns: createSlaColumns(),
    tableProps: {
      rowHeight: 96,
      suppressRowTransform: true,
    },
  },
  {
    id: "finance",
    title: "Finance snapshot",
    description:
      "Demonstrates multi-column summary cells that span across metrics and keep parity with the card layout.",
    columns: createFinanceColumns(),
    tableProps: {
      rowHeight: 88,
    },
  },
];

const AgGridActivity: ActivityComponentType = () => {
  const rowData = useMemo(() => buildDataset(), []);
  const gridShowcases = useMemo(() => createGridShowcases(), []);
  const [viewModes, setViewModes] = useState<Record<string, ViewMode>>(() =>
    gridShowcases.reduce<Record<string, ViewMode>>((acc, showcase) => {
      acc[showcase.id] = "table";
      return acc;
    }, {}),
  );

  const tableDefaultColDef = useMemo<ColDef<OrderSummary>>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
    }),
    [],
  );

  const cardDefaultColDef = useMemo<ColDef<OrderSummary>>(
    () => ({
      sortable: false,
      resizable: false,
      filter: false,
    }),
    [],
  );

  const sharedTableProps = useMemo(
    () => ({
      overlayNoRowsTemplate: "No orders available",
    }),
    [],
  );

  const sharedCardProps = useMemo(
    () => ({
      overlayNoRowsTemplate: "No orders available",
    }),
    [],
  );

  const handleViewModeChange = (id: string, mode: ViewMode) => {
    setViewModes((prev) => {
      if (prev[id] === mode) {
        return prev;
      }
      return { ...prev, [id]: mode };
    });
  };

  return (
    <AppScreen appBar={{ title: "AG Grid Experiment", border: true }}>
      <section className="grid-activity">
        <header className="grid-activity__hero">
          <div>
            <h2>Stackflow AG Grid gallery</h2>
            <p>
              Each panel below reuses the same StackflowAgGrid wrapper while proving that the
              column definitions drive both the table and card experience without duplicating data.
            </p>
          </div>
        </header>

        {gridShowcases.map((showcase) => {
          const mode = viewModes[showcase.id] ?? "table";
          return (
            <article key={showcase.id} className="grid-activity__panel">
              <header className="grid-activity__panel-header">
                <div>
                  <h3>{showcase.title}</h3>
                  <p>{showcase.description}</p>
                </div>
                <div className="grid-activity__actions">
                  <button
                    type="button"
                    className={mode === "table" ? "is-active" : ""}
                    onClick={() => handleViewModeChange(showcase.id, "table")}
                  >
                    Table view
                  </button>
                  <button
                    type="button"
                    className={mode === "card" ? "is-active" : ""}
                    onClick={() => handleViewModeChange(showcase.id, "card")}
                  >
                    Card view
                  </button>
                </div>
              </header>

              <StackflowAgGrid<OrderSummary>
                columnDefs={showcase.columns}
                rowData={rowData}
                viewMode={mode}
                defaultColDef={tableDefaultColDef}
                cardDefaultColDef={cardDefaultColDef}
                className="grid-activity__grid"
                tableProps={{
                  ...sharedTableProps,
                  ...(showcase.tableProps ?? {}),
                }}
                cardProps={{
                  ...sharedCardProps,
                  ...(showcase.cardProps ?? {}),
                }}
              />
            </article>
          );
        })}
      </section>
    </AppScreen>
  );
};

export default AgGridActivity;
