import type { ReactNode } from "react";

type Primitive = string | number | boolean | null | undefined | Date;

type ValueAccessorParams<TData> = {
  data: TData;
};

type FormatterParams<TData> = ValueAccessorParams<TData> & {
  value: unknown;
};

type RendererParams<TData> = FormatterParams<TData>;

export type ColDef<TData = unknown> = {
  field?: string;
  headerName?: string;
  minWidth?: number;
  flex?: number;
  filter?: boolean | string;
  floatingFilter?: boolean;
  sortable?: boolean;
  resizable?: boolean;
  wrapHeaderText?: boolean;
  autoHeaderHeight?: boolean;
  tooltipField?: string;
  cellDataType?: "text" | "number" | "date" | string;
  valueGetter?: (params: ValueAccessorParams<TData>) => unknown;
  valueFormatter?: (params: FormatterParams<TData>) => string;
  cellRenderer?: (params: RendererParams<TData>) => ReactNode;
} & Record<string, unknown>;

export type ColGroupDef<TData = unknown> = {
  headerName?: string;
  children: Array<ColDef<TData>>;
};

export type ColumnAutoSizeStrategy = {
  type: "fitGridWidth" | "fitAllColumnsToBounds";
};

export type GridApi = {
  setFilterModel: (model: Record<string, Primitive>) => void;
  refreshCells: () => void;
};

export type GridReadyEvent = {
  api: GridApi;
};

export type ValueGetterParams<TData = unknown> = ValueAccessorParams<TData>;
export type ValueFormatterParams<TData = unknown> = FormatterParams<TData>;
export type ICellRendererParams<TData = unknown> = RendererParams<TData>;
export type SizeColumnsToFitGridStrategy = ColumnAutoSizeStrategy;

export type { Primitive };
