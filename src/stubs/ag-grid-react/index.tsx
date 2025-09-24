import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { ColDef } from "../ag-grid-community";

type SortDirection = "asc" | "desc" | null;

type AgGridReactProps<TData> = {
  rowData?: TData[];
  columnDefs?: Array<ColDef<TData>>;
  defaultColDef?: ColDef<TData>;
  pagination?: boolean;
  paginationPageSize?: number;
  className?: string;
  autoSizeStrategy?: unknown;
};

const DEFAULT_PAGE_SIZE = 10;

const getCellValue = <TData,>(row: TData, colDef: ColDef<TData>) => {
  if (typeof colDef.valueGetter === "function") {
    return colDef.valueGetter({ data: row });
  }

  if (colDef.field && typeof row === "object" && row !== null) {
    const key = colDef.field as keyof TData;
    const record = row as Record<string | number | symbol, unknown>;
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
};

const normalizeValue = (value: unknown): string | number => {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return typeof value === "number" ? value : String(value).toLowerCase();
};

const buildComparator = <TData,>(
  colDef: ColDef<TData>,
  direction: Exclude<SortDirection, null>,
) => {
  const factor = direction === "asc" ? 1 : -1;

  return (a: TData, b: TData) => {
    const valueA = getCellValue(a, colDef);
    const valueB = getCellValue(b, colDef);

    if (valueA === valueB) {
      return 0;
    }
    if (valueA === undefined || valueA === null) {
      return -1 * factor;
    }
    if (valueB === undefined || valueB === null) {
      return 1 * factor;
    }

    const normalizedA = normalizeValue(valueA);
    const normalizedB = normalizeValue(valueB);

    if (typeof normalizedA === "number" && typeof normalizedB === "number") {
      return (normalizedA - normalizedB) * factor;
    }

    if (normalizedA < normalizedB) {
      return -1 * factor;
    }
    if (normalizedA > normalizedB) {
      return 1 * factor;
    }
    return 0;
  };
};

const mergeColumnDefs = <TData,>(
  columns: Array<ColDef<TData>>,
  defaults?: ColDef<TData>,
) =>
  columns.map((col) => ({
    ...(defaults ?? {}),
    ...col,
  }));

function useFilters() {
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const filtered = useMemo(() => filters, [filters]);

  return { filters: filtered, handleFilterChange, clearFilters };
}

const applyFilters = <TData,>(
  rows: TData[],
  columns: Array<ColDef<TData>>,
  filters: Record<string, string>,
) => {
  if (Object.keys(filters).length === 0) {
    return rows;
  }

  return rows.filter((row) =>
    columns.every((col) => {
      if (!col.field) {
        return true;
      }
      const query = filters[col.field];
      if (!query) {
        return true;
      }
      const value = getCellValue(row, col);
      if (value === undefined || value === null) {
        return false;
      }
      return String(value).toLowerCase().includes(query.toLowerCase());
    }),
  );
};

const applySorting = <TData,>(
  rows: TData[],
  columns: Array<ColDef<TData>>,
  sortState: { field: string; direction: SortDirection } | null,
) => {
  if (!sortState || !sortState.direction) {
    return rows;
  }
  const targetColumn = columns.find((column) => column.field === sortState.field);
  if (!targetColumn) {
    return rows;
  }
  return [...rows].sort(buildComparator(targetColumn, sortState.direction));
};

const paginateRows = <TData,>(
  rows: TData[],
  enablePagination: boolean,
  page: number,
  pageSize: number,
) => {
  if (!enablePagination) {
    return rows;
  }
  const start = page * pageSize;
  return rows.slice(start, start + pageSize);
};

export const AgGridReact = <TData,>({
  rowData = [],
  columnDefs = [],
  defaultColDef,
  pagination = false,
  paginationPageSize = DEFAULT_PAGE_SIZE,
  className,
}: AgGridReactProps<TData>) => {
  const mergedColumnDefs = useMemo(
    () => mergeColumnDefs(columnDefs, defaultColDef),
    [columnDefs, defaultColDef],
  );

  const [sortState, setSortState] = useState<{
    field: string;
    direction: SortDirection;
  } | null>(null);
  const { filters, handleFilterChange, clearFilters } = useFilters();
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
    clearFilters();
    setSortState(null);
  }, [rowData, mergedColumnDefs, clearFilters]);

  const filteredRows = useMemo(
    () => applyFilters(rowData, mergedColumnDefs, filters),
    [filters, mergedColumnDefs, rowData],
  );

  const sortedRows = useMemo(
    () => applySorting(filteredRows, mergedColumnDefs, sortState),
    [filteredRows, mergedColumnDefs, sortState],
  );

  const pageSize = pagination ? paginationPageSize : sortedRows.length || 1;
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const visibleRows = useMemo(
    () => paginateRows(sortedRows, pagination, page, pageSize),
    [sortedRows, pagination, page, pageSize],
  );

  const handleSort = (
    field: string | undefined,
    sortable: boolean | undefined,
  ) => {
    if (!field || !sortable) {
      return;
    }

    setSortState((previous) => {
      if (!previous || previous.field !== field) {
        return { field, direction: "asc" };
      }

      if (previous.direction === "asc") {
        return { field, direction: "desc" };
      }

      if (previous.direction === "desc") {
        return { field, direction: null };
      }

      return { field, direction: "asc" };
    });
  };

  return (
    <div className={["ag-grid-stub", className ?? ""].filter(Boolean).join(" ")}>
      <div className="ag-grid-stub__viewport">
        <table className="ag-grid-stub__table">
          <thead>
            <tr>
              {mergedColumnDefs.map((column, index) => {
                const field = column.field ?? `col-${index}`;
                const sortable = column.sortable ?? false;
                const filterable = Boolean(column.filter) && Boolean(column.floatingFilter);
                const isSorted =
                  sortState && sortState.field === field ? sortState.direction : null;

                return (
                  <th
                    key={field}
                    className={sortable ? "ag-grid-stub__header--sortable" : undefined}
                    onClick={() => handleSort(field, sortable)}
                    scope="col"
                  >
                    <div className="ag-grid-stub__header-content">
                      <span>{column.headerName ?? field}</span>
                      {sortable ? (
                        <span className="ag-grid-stub__sort-indicator" aria-hidden>
                          {isSorted === "asc"
                            ? "▲"
                            : isSorted === "desc"
                            ? "▼"
                            : "▾"}
                        </span>
                      ) : null}
                    </div>
                    {filterable ? (
                      <div className="ag-grid-stub__filter">
                        <input
                          type="search"
                          value={filters[field] ?? ""}
                          onChange={(event) =>
                            handleFilterChange(field, event.target.value)
                          }
                          placeholder="검색"
                        />
                      </div>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {mergedColumnDefs.map((column, columnIndex) => {
                    const field = column.field ?? `col-${columnIndex}`;
                    const value = getCellValue(row, column);
                    let rendered: unknown = value;

                    if (column.valueFormatter) {
                      rendered = column.valueFormatter({ data: row, value });
                    } else if (column.cellRenderer) {
                      rendered = column.cellRenderer({ data: row, value });
                    }

                    return <td key={`${field}-${columnIndex}`}>{rendered as ReactNode}</td>;
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td className="ag-grid-stub__empty" colSpan={mergedColumnDefs.length}>
                  표시할 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <div className="ag-grid-stub__pagination">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
            disabled={page === 0}
          >
            이전
          </button>
          <span>
            {Math.min(page + 1, totalPages)} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(current + 1, totalPages - 1))
            }
            disabled={page >= totalPages - 1}
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  );
};

AgGridReact.displayName = "AgGridReactStub";

export type { AgGridReactProps };
export default AgGridReact;
