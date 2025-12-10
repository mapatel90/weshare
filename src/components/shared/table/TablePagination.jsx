import React from 'react'

const TablePagination = ({table, serverSideTotal = null}) => {
    const pagination = table.getState().pagination;
    const pageIndex = pagination.pageIndex;
    const pageSize = pagination.pageSize;
    const rowCount = table.getRowCount();
    
    // Use server-side total if provided, otherwise use client-side row count
    const total = serverSideTotal !== null ? serverSideTotal : rowCount;
    const start = total === 0 ? 0 : pageIndex * pageSize + 1;
    const end = total === 0 ? 0 : Math.min((pageIndex + 1) * pageSize, total);

    const handlePrevious = () => {
        if (!table.getCanPreviousPage()) return;
        table.previousPage();
    };

    const handleNext = () => {
        if (!table.getCanNextPage()) return;
        table.nextPage();
    };
    
    return (
        <div className="row gy-2">
            <div className="col-sm-12 col-md-5 p-0">
                <div className="dataTables_info text-lg-start text-center" id="proposalList_info" role="status" aria-live="polite">
                    Showing {start} to {end} of {total} entries
                </div>
            </div>
            <div className="col-sm-12 col-md-7 p-0">
                <div className="dataTables_paginate paging_simple_numbers" id="proposalList_paginate">
                    <ul className="pagination mb-0 justify-content-md-end justify-content-center">
                        <li className={`paginate_button page-item previous ${!table.getCanPreviousPage() ? "disabled" : ""} `}
                            onClick={handlePrevious}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <a href="#" className="page-link">Previous</a></li>
                        <li className="paginate_button page-item active">
                            <a href="#" aria-controls="proposalList" data-dt-idx="0" tabIndex="0" className="page-link">
                                {table.getState().pagination.pageIndex + 1}
                                {serverSideTotal !== null && ` / ${Math.ceil(total / pageSize)}`}
                            </a>
                        </li>
                        <li className={`paginate_button page-item next ${!table.getCanNextPage() ? "disabled" : ""}`}
                            onClick={handleNext}
                            disabled={!table.getCanNextPage()}
                        >
                            <a href="#" className="page-link">Next</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default TablePagination