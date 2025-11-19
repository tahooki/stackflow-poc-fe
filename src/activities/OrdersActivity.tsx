import type {
  CellClickedEvent,
  CellMouseDownEvent,
  CellMouseOutEvent,
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "../assets/agGridActivity.css";

ModuleRegistry.registerModules([AllCommunityModule]);

type OrderStatus =
  | "prepping"
  | "staging"
  | "enroute"
  | "exception"
  | "delivered";
type OrderPriority = "standard" | "rush" | "critical";

type OrderRow = {
  orderId: string;
  segment: string;
  customer: string;
  destination: string;
  status: OrderStatus;
  priority: OrderPriority;
  eta: string;
  items: number;
  amount: number;
  courier: string;
  lastTouch: string;
};

type LongPressPayload = {
  columnLabel: string;
  rawValue: unknown;
  row: OrderRow;
};

type LongPressState = {
  columnLabel: string;
  value: string;
  row: OrderRow;
  triggeredAt: string;
};

type LongPressCandidate = {
  payload: LongPressPayload;
  startedAt: number;
};

const LONG_PRESS_DELAY = 650;

const statusTokens: Record<OrderStatus, { label: string; className: string }> =
  {
    prepping: { label: "Prepping", className: "grid-pill grid-pill--info" },
    staging: { label: "Staging", className: "grid-pill grid-pill--neutral" },
    enroute: { label: "In transit", className: "grid-pill grid-pill--success" },
    exception: {
      label: "Exception",
      className: "grid-pill grid-pill--warning",
    },
    delivered: {
      label: "Delivered",
      className: "grid-pill grid-pill--success",
    },
  };

const priorityTokens: Record<
  OrderPriority,
  { label: string; className: string }
> = {
  standard: { label: "Standard", className: "grid-pill grid-pill--neutral" },
  rush: { label: "Rush", className: "grid-pill grid-pill--info" },
  critical: { label: "Critical", className: "grid-pill grid-pill--warning" },
};

const OrdersActivity: ActivityComponentType = () => {
  const [longPress, setLongPress] = useState<LongPressState | null>(null);
  const longPressCandidateRef = useRef<LongPressCandidate | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    []
  );

  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    []
  );

  const orders = useMemo<OrderRow[]>(
    () => [
      {
        orderId: "OPS-4812",
        segment: "Express replenishment",
        customer: "NFX Studio",
        destination: "Seoul, KR",
        status: "prepping",
        priority: "rush",
        eta: "11:28",
        items: 42,
        amount: 12850,
        courier: "Blue Arrow",
        lastTouch: "09:32 · Jina",
      },
      {
        orderId: "OPS-4813",
        segment: "Launch kit",
        customer: "Stackflow Lab",
        destination: "Busan, KR",
        status: "enroute",
        priority: "standard",
        eta: "13:05",
        items: 18,
        amount: 9400,
        courier: "Northwind",
        lastTouch: "09:12 · Park",
      },
      {
        orderId: "OPS-4814",
        segment: "Store relaunch",
        customer: "Grove Market",
        destination: "Daegu, KR",
        status: "staging",
        priority: "rush",
        eta: "12:40",
        items: 57,
        amount: 17230,
        courier: "Blue Arrow",
        lastTouch: "08:55 · Yuna",
      },
      {
        orderId: "OPS-4815",
        segment: "Bulk subscription",
        customer: "Radar Logistics",
        destination: "Seoul, KR",
        status: "exception",
        priority: "critical",
        eta: "Manual",
        items: 76,
        amount: 21870,
        courier: "Swift Air",
        lastTouch: "09:41 · Alert",
      },
      {
        orderId: "OPS-4816",
        segment: "Ops tooling",
        customer: "Local Fleet",
        destination: "Gwangju, KR",
        status: "delivered",
        priority: "standard",
        eta: "08:12",
        items: 24,
        amount: 6100,
        courier: "Northwind",
        lastTouch: "08:22 · Ryder",
      },
      {
        orderId: "OPS-4817",
        segment: "Ambient pilot",
        customer: "NEK Foods",
        destination: "Daejeon, KR",
        status: "enroute",
        priority: "rush",
        eta: "12:02",
        items: 36,
        amount: 10920,
        courier: "Swift Air",
        lastTouch: "09:18 · Melo",
      },
      {
        orderId: "OPS-4818",
        segment: "Ops sampler",
        customer: "UX Ops",
        destination: "Seoul, KR",
        status: "prepping",
        priority: "standard",
        eta: "11:48",
        items: 15,
        amount: 4820,
        courier: "Blue Arrow",
        lastTouch: "09:33 · Ana",
      },
      {
        orderId: "OPS-4819",
        segment: "Stackflow swag",
        customer: "Playground HQ",
        destination: "Incheon, KR",
        status: "exception",
        priority: "critical",
        eta: "Investigation",
        items: 63,
        amount: 15890,
        courier: "Northwind",
        lastTouch: "09:45 · Alert",
      },
    ],
    []
  );

  const gridMetrics = useMemo(
    () => [
      { label: "Stack depth", value: "03 activities" },
      { label: "Pinned rows", value: "8 monitored" },
      { label: "Average SLA", value: "92%" },
      { label: "Grid fps", value: "58-60" },
    ],
    []
  );

  const describeValue = useCallback(
    (rawValue: unknown, columnLabel: string) => {
      if (rawValue == null) {
        return "—";
      }

      if (typeof rawValue === "number") {
        return columnLabel.toLowerCase().includes("value")
          ? currencyFormatter.format(rawValue)
          : rawValue.toLocaleString();
      }

      if (typeof rawValue === "string") {
        return rawValue;
      }

      return JSON.stringify(rawValue);
    },
    [currencyFormatter]
  );

  const clearLongPressCandidate = useCallback(() => {
    longPressCandidateRef.current = null;
  }, []);

  const recordLongPress = useCallback(
    (payload: LongPressPayload) => {
      setLongPress({
        columnLabel: payload.columnLabel,
        row: payload.row,
        value: describeValue(payload.rawValue, payload.columnLabel),
        triggeredAt: timestampFormatter.format(new Date()),
      });
    },
    [describeValue, timestampFormatter]
  );

  const handleCellMouseDown = useCallback(
    (event: CellMouseDownEvent<OrderRow>) => {
      if (!event.data) {
        clearLongPressCandidate();
        return;
      }

      longPressCandidateRef.current = {
        startedAt: Date.now(),
        payload: {
          columnLabel: event.colDef.headerName ?? event.colDef.field ?? "Cell",
          rawValue: event.value,
          row: event.data,
        },
      };
    },
    [clearLongPressCandidate]
  );

  const handleCellClicked = useCallback(
    (event: CellClickedEvent<OrderRow>) => {
      const candidate = longPressCandidateRef.current;
      longPressCandidateRef.current = null;

      if (!candidate) {
        return;
      }

      const pressedFor = Date.now() - candidate.startedAt;
      if (pressedFor < LONG_PRESS_DELAY) {
        return;
      }

      event.event?.preventDefault?.();
      event.event?.stopPropagation?.();
      recordLongPress(candidate.payload);
    },
    [recordLongPress]
  );

  const handleCellMouseOut = useCallback(
    (_: CellMouseOutEvent<OrderRow>) => {
      clearLongPressCandidate();
    },
    [clearLongPressCandidate]
  );

  const columnDefs = useMemo<ColDef<OrderRow>[]>(
    () => [
      {
        headerName: "Order",
        field: "orderId",
        pinned: "left",
        width: 150,
        cellRenderer: (
          params: ICellRendererParams<OrderRow, string, OrderRow>
        ) => (
          <div className="grid-dual-line">
            <strong>{params.data?.orderId}</strong>
            <span>{params.data?.segment}</span>
          </div>
        ),
      },
      {
        headerName: "Customer",
        field: "customer",
        width: 190,
        cellRenderer: (
          params: ICellRendererParams<OrderRow, string, OrderRow>
        ) => (
          <div className="grid-dual-line">
            <strong>{params.data?.customer}</strong>
            <span>{params.data?.destination}</span>
          </div>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 150,
        cellRenderer: (params: ICellRendererParams<OrderRow, OrderStatus>) => {
          const token = params.value ? statusTokens[params.value] : null;
          return token ? (
            <span className={token.className}>{token.label}</span>
          ) : (
            <span>{params.value}</span>
          );
        },
      },
      {
        headerName: "Priority",
        field: "priority",
        width: 150,
        cellRenderer: (
          params: ICellRendererParams<OrderRow, OrderPriority>
        ) => {
          const token = params.value ? priorityTokens[params.value] : null;
          return token ? (
            <span className={token.className}>{token.label}</span>
          ) : (
            <span>{params.value}</span>
          );
        },
      },
      {
        headerName: "ETA",
        field: "eta",
        width: 120,
      },
      {
        headerName: "Items",
        field: "items",
        width: 120,
        valueFormatter: (
          params: ValueFormatterParams<OrderRow, number | null>
        ) =>
          typeof params.value === "number"
            ? `${params.value.toLocaleString()} sku`
            : params.value ?? "—",
      },
      {
        headerName: "Value",
        field: "amount",
        width: 150,
        valueFormatter: (
          params: ValueFormatterParams<OrderRow, number | null>
        ) =>
          typeof params.value === "number"
            ? currencyFormatter.format(params.value)
            : params.value ?? "—",
      },
      {
        headerName: "Courier",
        field: "courier",
        width: 150,
      },
      {
        headerName: "Last touch",
        field: "lastTouch",
        width: 160,
      },
    ],
    [currencyFormatter]
  );

  const defaultColDef = useMemo<ColDef<OrderRow>>(
    () => ({
      resizable: true,
      sortable: true,
      suppressMenu: true,
      flex: 1,
      minWidth: 140,
    }),
    []
  );

  return (
    <AppScreen appBar={{ title: "Orders" }}>
      <div className="activity">
        <section className="activity__header">
          <h1>Operations Control Board</h1>
          <p>
            Stress test the stack by embedding AG Grid. Long-press any cell to
            capture its context without leaving the activity.
          </p>
        </section>

        <div className="activity__content">
          <section className="grid-activity__panel">
            <div className="grid-activity__hero">
              <div>
                <h2>Live fulfilment snapshot</h2>
                <p>
                  AG Grid renders multi-line cells and pinned columns while
                  Stackflow handles transitions and scroll retention.
                </p>
              </div>
              <span className="grid-pill grid-pill--info">Hold to capture</span>
            </div>

            <div className="grid-metrics">
              {gridMetrics.map((metric) => (
                <div key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>

            <div className="stackflow-grid__surface">
              <div
                className="ag-theme-quartz stackflow-grid"
                style={{ width: "100%", height: "460px" }}
              >
                <AgGridReact<OrderRow>
                  rowData={orders}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  onCellMouseDown={handleCellMouseDown}
                  onCellMouseOut={handleCellMouseOut}
                  onCellClicked={handleCellClicked}
                />
              </div>
            </div>
          </section>

          <section className="grid-activity__panel">
            <div className="grid-activity__panel-header">
              <h3>Long-press console</h3>
              <p>
                Because AG Grid has no built-in long press events, the activity
                watches the mouse-down duration and emits a synthetic capture
                when the threshold is reached.
              </p>
            </div>

            {longPress ? (
              <div className="grid-activity__longpress">
                <div>
                  <span className="grid-multiline__label">Captured column</span>
                  <strong>{longPress.columnLabel}</strong>
                </div>
                <dl className="order-card__list">
                  <div className="order-card__list-row order-card__list-row--full">
                    <dt>Order</dt>
                    <dd>{longPress.row.orderId}</dd>
                  </div>
                  <div className="order-card__list-row">
                    <dt>Value</dt>
                    <dd>{longPress.value}</dd>
                  </div>
                  <div className="order-card__list-row">
                    <dt>Captured at</dt>
                    <dd>{longPress.triggeredAt}</dd>
                  </div>
                </dl>
                <button type="button" onClick={() => setLongPress(null)}>
                  Clear selection
                </button>
              </div>
            ) : (
              <p className="grid-activity__hint">
                Press and hold any cell for ~650ms to mirror a native long press
                gesture. The captured payload appears here so other activities
                can subscribe to it later.
              </p>
            )}
          </section>
        </div>
      </div>
    </AppScreen>
  );
};

export default OrdersActivity;
