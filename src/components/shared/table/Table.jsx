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

const Table = ({
  data,
  columns,
  disablePagination = false,
  onPaginationChange,
  onSearchChange = null,
  serverSideTotal = null,
  pageIndex: controlledPageIndex = null,
  pageSize: controlledPageSize = null,
}) => {
  // const [data] = useState([...Data])
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: disablePagination ? Math.max(data?.length || 10, 10) : 10,
  });
  
  // Use controlled pagination if provided, otherwise use internal state
  const pagination = controlledPageIndex !== null && controlledPageSize !== null
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
      enableSorting: col.meta?.disableSort ? false : true, // ✅ sorting control
    })),
    state: {
      globalFilter,
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: handleGlobalFilterChange,
    manualPagination: disablePagination || (controlledPageIndex !== null),
    pageCount: serverSideTotal !== null ? Math.ceil(serverSideTotal / pagination.pageSize) : undefined,
    ...(disablePagination ? {} : {
      ...(controlledPageIndex !== null ? {} : {
        getPaginationRowModel: getPaginationRowModel(),
      }),
      onPaginationChange: (updater) => {
        const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
        if (onPaginationChange) {
          // Call parent callback with new pagination
          onPaginationChange(newPagination);
        } else {
          // Use internal state if no callback provided
          setInternalPagination(newPagination);
        }
      },
    }),
  });

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

              <div className="row dt-row">
                <div className="col-sm-12 px-0">
                  <table
                    className="table table-hover dataTable no-footer"
                    id="projectList"
                  >
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
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
                            );
                          })}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="single-item chat-single-item"
                        >
                          {row.getVisibleCells().map((cell) => {
                            return (
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
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!disablePagination && <TablePagination table={table} serverSideTotal={serverSideTotal} />}
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
            <FaSortDown size={13} opacity={position === "desc" ? 1 : 0.125} />
          ),
        }[position]
      }
      {header.column.getCanSort() && !position ? (
        <FaSort size={13} opacity={0.125} />
      ) : null}
    </div>
  );
};
