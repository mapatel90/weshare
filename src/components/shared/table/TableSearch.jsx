import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react'

const TableSearch = ({table, setGlobalFilter, globalFilter}) => {
    const { lang } = useLanguage();
    return (
        <div className='row gy-2 mb-2'>
            <div className='col-6 col-md-6 ps-0 m-0 pb-10'>
                <div className='dataTables_length d-flex justify-content-start align-items-center'>
                    <label className='d-flex align-items-center gap-1' style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                        {lang("common.show", "Show")}
                        <select
                            className='form-select form-select-sm w-auto pe-4'
                            value={table.getState().pagination.pageSize}
                            onChange={e => {
                                table.setPageSize(Number(e.target.value))
                            }}
                        >
                            {[10, 20, 30, 40, 50].map(pageSize => (
                                <option key={pageSize} value={pageSize}>
                                    {pageSize}
                                </option>
                            ))}
                        </select>
                        <span className='d-none d-sm-inline'>{lang("common.entries", "entries")}</span>
                    </label>
                </div>
            </div>
            <div className='col-6 col-md-6 ps-0 m-0 pb-10'>
                <div className='dataTables_filter d-flex justify-content-end align-items-center'>
                    <label className='d-inline-flex align-items-center gap-1' style={{ fontSize: "13px" }}>
                        <span className='d-none d-sm-inline'>{lang("common.search", "Search")}:</span>
                        <input
                            type="text"
                            value={globalFilter ?? ""}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder={lang("common.search", "Search")}
                            className="form-control form-control-sm"
                            style={{ maxWidth: "160px" }}
                        />
                    </label>
                </div>
            </div>
        </div>
    )
}

export default TableSearch