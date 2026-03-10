import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react'

const TablePagination = ({table, serverSideTotal = null}) => {
    const { lang } = useLanguage();
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
        <div className="row gy-2 align-items-center mt-1">
            <div className="col-12 col-md-5 p-0 text-center text-md-start">
                <div className="dataTables_info" id="proposalList_info" role="status" aria-live="polite"
                    style={{ fontSize: "13px", color: "#6b7280", padding: "4px 0" }}
                >
                    {lang("common.showing", "Showing")} {start} {lang("common.to", "to")} {end} {lang("common.of", "of")} {total} {lang("common.entries", "entries")}
                </div>
            </div>
            <div className="col-12 col-md-7 p-0">
                <div className="dataTables_paginate paging_simple_numbers" id="proposalList_paginate">
                    <ul className="pagination mb-0 justify-content-md-end justify-content-center flex-wrap gap-1">
                        <li
                            className={`paginate_button page-item previous ${!table.getCanPreviousPage() ? "disabled" : ""}`}
                            onClick={handlePrevious}
                        >
                            <a href="#" className="page-link" style={{ borderRadius: "8px" }}>
                                {lang("common.previous", "Previous")}
                            </a>
                        </li>
                        <li className="paginate_button page-item active">
                            <a href="#" aria-controls="proposalList" data-dt-idx="0" tabIndex="0" className="page-link"
                                style={{ borderRadius: "8px", minWidth: "48px", textAlign: "center" }}
                            >
                                {table.getState().pagination.pageIndex + 1}
                                {serverSideTotal !== null && ` / ${Math.ceil(total / pageSize)}`}
                            </a>
                        </li>
                        <li
                            className={`paginate_button page-item next ${!table.getCanNextPage() ? "disabled" : ""}`}
                            onClick={handleNext}
                        >
                            <a href="#" className="page-link" style={{ borderRadius: "8px" }}>
                                {lang("common.next", "Next")}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default TablePagination