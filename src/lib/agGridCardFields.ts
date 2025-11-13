import type {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
} from "ag-grid-community";
import type { ReactNode } from "react";

export type CardField<TData> = {
  key: string;
  label?: string;
  content: ReactNode;
};

export type CardFieldRenderContext<TData> = {
  data: TData;
  value: unknown;
  formattedValue: unknown;
  label: string;
  column: CardColumnDef<TData>;
};

export type CardColumnConfig<TData> = {
  hidden?: boolean;
  label?: string;
  order?: number;
  render?: (context: CardFieldRenderContext<TData>) => ReactNode;
  spans?: number;
  hideLabel?: boolean;
};

export type CardColumnDef<TData> = ColDef<TData> & {
  card?: CardColumnConfig<TData>;
};

export type CardFieldBuilder<TData> = (
  params: ValueGetterParams<TData, CardField<TData>[]>,
) => CardField<TData>[];

const PLACEHOLDER = "—";

export const inferCardLabel = <TData,>(column: CardColumnDef<TData>): string => {
  if (column.card?.label) {
    return column.card.label;
  }

  if (column.headerName) {
    return column.headerName;
  }

  if (typeof column.field === "string") {
    return column.field
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/^\w/, (match) => match.toUpperCase());
  }

  return "Value";
};

export const createCardFieldBuilder = <TData,>(
  columns: CardColumnDef<TData>[],
): CardFieldBuilder<TData> => {
  return (params) => {
    const { data } = params;

    if (!data) {
      return [];
    }

    type Intermediate = CardField<TData> & { order: number };

    const fields: Intermediate[] = columns
      .map((column, index) => {
        if (column.card?.hidden) {
          return null;
        }

        const rawValue =
          typeof column.valueGetter === "function"
            ? column.valueGetter({
                data,
                node: params.node,
                api: params.api,
                columnApi: params.columnApi,
                context: params.context,
                colDef: column,
                column: undefined as never,
                getValue: (field: string) =>
                  (data as Record<string, unknown>)[field],
              } as ValueGetterParams<TData>)
            : typeof column.field === "string"
              ? (data as Record<string, unknown>)[column.field]
              : undefined;

        const formatter = column.valueFormatter;
        const formattedValue =
          formatter != null
            ? formatter({
                value: rawValue,
                data,
                node: params.node,
                api: params.api,
                columnApi: params.columnApi,
                context: params.context,
                colDef: column,
                column: undefined as never,
              } as ValueFormatterParams<TData>)
            : rawValue;

        const label = inferCardLabel(column);
        const context: CardFieldRenderContext<TData> = {
          data,
          value: rawValue,
          formattedValue,
          label: column.card?.hideLabel ? undefined : label,
          column,
        };

        const content =
          column.card?.render?.(context) ??
          (formattedValue != null && formattedValue !== ""
            ? (formattedValue as ReactNode)
            : rawValue == null || rawValue === ""
              ? PLACEHOLDER
              : (rawValue as ReactNode));

        return {
          key:
            column.field != null
              ? String(column.field)
              : column.headerName ?? `col-${index.toString(36)}`,
          label,
          content,
          order: column.card?.order ?? index,
        };
      })
      .filter((field): field is Intermediate => field != null)
      .sort((a, b) => a.order - b.order);

    return fields.map(({ order: _order, ...field }) => field);
  };
};
