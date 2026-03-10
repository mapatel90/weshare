'use client';

import React, { useMemo, useState } from 'react';
import Table from "@/components/shared/table/Table";

const initialCashFlowReportsData = [
    {
        id: 1,
        projectName: 'Project Alpha',
        inverterName: 'Inverter X',
        date: '2025-11-19',
        startTime: '09:05',
        endTime: '09:25',
        generatedKW: '1.6 kw',
    },
    {
        id: 2,
        projectName: 'Project Beta',
        inverterName: 'Inverter Y',
        date: '2025-11-18',
        startTime: '09:28',
        endTime: '09:33',
        generatedKW: '1.2 kw',
    },
    {
        id: 3,
        projectName: 'Project Gamma',
        inverterName: 'Inverter Z',
        date: '2025-11-17',
        startTime: '09:43',
        endTime: '10:03',
        generatedKW: '2.1 kw',
    },
];

const CashFlowReports = () => {
    const [projectFilter, setProjectFilter] = useState('');
    const [inverterFilter, setInverterFilter] = useState('');
    const [reportsData, setReportsData] = useState(initialCashFlowReportsData);

    const projects = useMemo(
        () => Array.from(new Set(initialCashFlowReportsData.map(d => d.projectName))),
        []
    );
    const inverters = useMemo(
        () => Array.from(new Set(initialCashFlowReportsData.map(d => d.inverterName))),
        []
    );

    const filteredData = useMemo(() => {
        return reportsData.filter(d => {
            if (projectFilter && d.projectName !== projectFilter) return false;
            if (inverterFilter && d.inverterName !== inverterFilter) return false;
            return true;
        });
    }, [projectFilter, inverterFilter, reportsData]);

    // Download CSV handler (uses filtered data)
    const handleDownloadCSV = () => {
        const header = ['Project Name', 'Inverter Name', 'Date', 'Start Time', 'End Time', 'Generated kW'];
        const rows = filteredData.map(row => [row.projectName, row.inverterName, row.date, row.startTime, row.endTime, row.generatedKW]);
        let csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'saving_reports.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEdit = (item) => {
        // placeholder - open edit modal or dispatch event if required
    };

    const handleDelete = (id) => {
        if (!confirm('Are you sure you want to delete this report?')) return;
        setReportsData((prev) => prev.filter(r => r.id !== id));
    };

    const columns = useMemo(() => [
        { accessorKey: 'projectName', header: () => 'PROJECT NAME' },
        { accessorKey: 'inverterName', header: () => 'INVERTER NAME' },
        {
            accessorKey: 'date',
            header: () => 'DATE',
            cell: ({ row }) => {
                const d = row.original.date ? new Date(row.original.date) : null;
                return d ? d.toLocaleDateString() : '';
            }
        },
        { accessorKey: 'startTime', header: () => 'START TIME' },
        { accessorKey: 'endTime', header: () => 'END TIME' },
        { accessorKey: 'generatedKW', header: () => 'GENERATED KW' },
    ], []);

    return (
        <div className="p-6 bg-white rounded-3xl shadow-md">
            {/* Filters - fully responsive */}
            <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
                <div className="filter-button d-flex items-center gap-2 w-full flex-wrap">
                    <select
                        id="projectFilter"
                        className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-100 w-sm-auto"
                        style={{ minWidth: 160 }}
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                    >
                        <option value="">All Projects</option>
                        {projects.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select
                        id="inverterFilter"
                        className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-100 w-sm-auto"
                        style={{ minWidth: 160 }}
                        value={inverterFilter}
                        onChange={(e) => setInverterFilter(e.target.value)}
                    >
                        <option value="">All Inverter</option>
                        {inverters.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </div>

                <button
                    className="common-grey-color border rounded-3 btn w-100 w-sm-auto"
                    onClick={handleDownloadCSV}
                >
                    Download CSV
                </button>
            </div>

            <div className="overflow-x-auto">
                <Table data={filteredData} columns={columns} />
            </div>
        </div>
    );
};

export default CashFlowReports;