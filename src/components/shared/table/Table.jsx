import React, { useState } from "react";
import TableSearch from "./TableSearch";
import TablePagination from "./TablePagination";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDarkMode } from "@/utils/common";

const Table = ({
  data,
  columns,
  disablePagination = false,
  onPaginationChange,
  onSearchChange = null,
  serverSideTotal = null,
  pageIndex: controlledPageIndex = null,
  pageSize: controlledPageSize = null,
  initialPageSize = 10,
  emptyMessage = "No data available",
}) => {
  const { lang } = useLanguage();
  const isDark = useDarkMode();

  // Dark-mode aware card colors
  const cardBg      = isDark ? "#1a2236" : "#ffffff";
  const cardBorder  = isDark ? "#2a3550" : "#e5e7eb";
  const cardShadow  = isDark ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.07)";
  const labelColor  = isDark ? "#94a3b8" : "#6b7280";
  const valueColor  = isDark ? "#e2e8f0" : "#111827";
  const dividerColor= isDark ? "#2a3550" : "#f3f4f6";

  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: disablePagination
      ? Math.max(data?.length || initialPageSize, initialPageSize)
      : (controlledPageSize ?? initialPageSize ?? 10),
  });

  // Use controlled pagination if provided, otherwise use internal state
  const pagination =
    controlledPageIndex !== null && controlledPageSize !== null
      ? { pageIndex: controlledPageIndex, pageSize: controlledPageSize }
      : internalPagination;

  const handleGlobalFilterChange = (value) => {
    setGlobalFilter(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const table = useReactTable({
    data,
    columns: columns.map((col) => ({
      ...col,
      enableSorting: col.meta?.disableSort ? false : true,
    })),
    state: {
      globalFilter,
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: handleGlobalFilterChange,
    manualPagination:
      disablePagination || controlledPageIndex !== null,
    pageCount:
      serverSideTotal !== null
        ? Math.ceil(serverSideTotal / pagination.pageSize)
        : undefined,
    ...(disablePagination
      ? {}
      : {
          ...(controlledPageIndex !== null
            ? {}
            : {
                getPaginationRowModel: getPaginationRowModel(),
              }),
          onPaginationChange: (updater) => {
            const newPagination =
              typeof updater === "function" ? updater(pagination) : updater;
            if (onPaginationChange) {
              onPaginationChange(newPagination);
            } else {
              setInternalPagination(newPagination);
            }
          },
        }),
  });

  const rows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();

  // Flatten all leaf headers for card view labels
  const leafHeaders = headerGroups.length
    ? headerGroups[headerGroups.length - 1].headers
    : [];

  return (
    <div className="col-lg-12">
      <div className="card stretch stretch-full function-table">
        <div className="card-body p-0">
          <div className="table-responsive">
            <div className="dataTables_wrapper dt-bootstrap5 no-footer">
              <TableSearch
                table={table}
                setGlobalFilter={handleGlobalFilterChange}
                globalFilter={globalFilter}
              />

              {/* ── DESKTOP TABLE (hidden on mobile) ── */}
              <div className="row dt-row d-none d-md-block">
                <div className="col-sm-12 px-0">
                  <table
                    className="table table-hover dataTable no-footer"
                    id="projectList"
                  >
                    <thead>
                      {headerGroups.map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className={
                                header.column.columnDef.meta?.headerClassName
                              }
                            >
                              {header.id === "id" ? (
                                <div className="d-flex gap-2">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  <ArrowToggle header={header} />
                                </div>
                              ) : (
                                <ArrowToggle header={header}>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </ArrowToggle>
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={
                              table.getVisibleLeafColumns().length || 1
                            }
                            className="text-center py-4 text-muted"
                          >
                            {lang("common.noData", "No Data")}
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr
                            key={row.id}
                            className="single-item chat-single-item"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={cell.id}
                                className={
                                  cell.column.columnDef.meta?.className
                                }
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── MOBILE CARD VIEW (hidden on desktop) ── */}
              <div className="d-block d-md-none">
                {rows.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    {lang("common.noData", "No Data")}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "8px 0",
                    }}
                  >
                    {rows.map((row) => (
                      <div
                        key={row.id}
                        className="single-item chat-single-item"
                        style={{
                          background: cardBg,
                          border: `1px solid ${cardBorder}`,
                          borderRadius: "12px",
                          padding: "14px 16px",
                          boxShadow: cardShadow,
                          transition: "background 0.2s, border-color 0.2s",
                        }}
                      >
                        {row.getVisibleCells().map((cell, idx) => {
                          const headerContent = flexRender(
                            cell.column.columnDef.header,
                            cell.getContext()
                          );
                          const cellContent = flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          );

                          const isMobileFullWidth = cell.column.columnDef.meta?.mobileFullWidth;

                          return (
                            <div
                              key={cell.id}
                              style={{
                                display: "flex",
                                flexDirection: isMobileFullWidth ? "column" : "row",
                                justifyContent: isMobileFullWidth ? "flex-start" : "space-between",
                                alignItems: isMobileFullWidth ? "flex-start" : "flex-start",
                                padding: "5px 0",
                                borderBottom:
                                  idx < row.getVisibleCells().length - 1
                                    ? `1px solid ${dividerColor}`
                                    : "none",
                                gap: isMobileFullWidth ? "4px" : "8px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: labelColor,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                  maxWidth: isMobileFullWidth ? "100%" : "45%",
                                }}
                              >
                                {headerContent}
                              </span>
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: valueColor,
                                  fontWeight: 500,
                                  textAlign: "left",
                                  wordBreak: "break-word",
                                }}
                              >
                                {cellContent}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── PAGINATION (shared for both views) ── */}
              {!disablePagination && (
                <TablePagination
                  table={table}
                  serverSideTotal={serverSideTotal}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;

const ArrowToggle = ({ header, children }) => {
  const position = header.column.getIsSorted();
  return (
    <div
      className="table-head"
      style={{
        cursor: header.column.getCanSort() ? "pointer" : "default",
      }}
      onClick={header.column.getToggleSortingHandler()}
    >
      {children}
      {
        {
          asc: <FaSortUp size={13} opacity={position === "asc" ? 1 : 0.125} />,
          desc: (
            <FaSortDown
              size={13}
              opacity={position === "desc" ? 1 : 0.125}
            />
          ),
        }[position]
      }
      {header.column.getCanSort() && !position ? (
        <FaSort size={13} opacity={0.125} />
      ) : null}
    </div>
  );
};
