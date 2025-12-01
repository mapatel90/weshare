'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Table from "@/components/shared/table/Table";
import { apiGet } from "@/lib/api";
import { useLanguage } from '@/contexts/LanguageContext';

const SavingReports = () => {

    const [projectFilter, setProjectFilter] = useState('');
    const [inverterFilter, setInverterFilter] = useState('');
    const [reportsData, setReportsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { lang } = useLanguage();

    // ------------------------------------
    //  Fetch Data
    // ------------------------------------
    useEffect(() => {
        let mounted = true;

        const fetchReports = async () => {
            setLoading(true);

            try {
                const res = await apiGet('/api/inverter-data');
                if (!mounted) return;

                const items = Array.isArray(res?.data) ? res.data : [];

                const mappedData = items.map(item => ({
                    id: item.id,
                    projectName:
                        item.project?.name ||
                        item.project?.project_name ||
                        item.project?.title ||
                        `Project ${item.projectId}`,

                    inverterName:
                        item.inverter?.name ||
                        item.inverter?.inverterName ||
                        `Inverter ${item.inverter_id ?? ''}`,

                    date: item.date,
                    time: item.time ?? "",
                    generatedKW:
                        item.generate_kw !== undefined && item.generate_kw !== null
                            ? (Number(item.generate_kw) / 1000).toFixed(3)
                            : '',
                }));

                setReportsData(mappedData);
            } catch (err) {
                if (!mounted) return;
                setError(err?.message || 'Failed to load reports');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();

        return () => { mounted = false };
    }, []);

    // ------------------------------------
    //  Filter Dropdown Options
    // ------------------------------------
    const projects = useMemo(
        () => Array.from(new Set(reportsData.map(d => d.projectName))).filter(Boolean),
        [reportsData]
    );

    const inverters = useMemo(
        () => Array.from(new Set(reportsData.map(d => d.inverterName))).filter(Boolean),
        [reportsData]
    );

    // ------------------------------------
    //  Filter Reports
    // ------------------------------------
    const filteredData = useMemo(() => {
        return reportsData.filter(d => {
            if (projectFilter && d.projectName !== projectFilter) return false;
            if (inverterFilter && d.inverterName !== inverterFilter) return false;
            return true;
        });
    }, [projectFilter, inverterFilter, reportsData]);

    // ------------------------------------
    //  CSV Download
    // ------------------------------------
    const handleDownloadCSV = () => {
        const header = ['Project Name', 'Inverter Name', 'Date', 'Time', 'Generated kW'];

        const rows = filteredData.map(row => [
            row.projectName,
            row.inverterName,
            row.date ? new Date(row.date).toLocaleDateString() : '',
            row.time ?? '',
            row.generatedKW ?? ''
        ]);

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [header, ...rows].map(e => e.join(",")).join("\n");

        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'saving_reports.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ------------------------------------
    //  Table Columns
    // ------------------------------------
    const columns = useMemo(() => [
        { accessorKey: 'projectName', header: () => lang("projects.projectName") },
        { accessorKey: 'inverterName', header: () => lang("inverter.inverterName") },
        {
            accessorKey: 'date',
            header: () => lang("common.date"),
            cell: ({ row }) => {
                const d = row.original.date ? new Date(row.original.date) : null;
                return d ? d.toLocaleDateString() : '';
            }
        },
        { accessorKey: 'time', header: () => lang("common.time") },
        { accessorKey: 'generatedKW', header: () => lang("common.generatedKW") },
    ], [lang]);

    // ------------------------------------
    //  UI Rendering
    // ------------------------------------
    return (
        <div className="p-6 bg-white rounded-3xl shadow-md">

            {/* Filters */}
            <div className="flex flex-row flex-wrap items-center justify-start md:justify-end gap-2 mb-4 mt-4">
                
                {/* Project Filter */}
                <select
                    id="projectFilter"
                    className="theme-btn-blue-color border rounded-md px-3 py-2 mx-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                >
                    <option value="">{lang("reports.allprojects")}</option>
                    {projects.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>

                {/* Inverter Filter */}
                <select
                    id="inverterFilter"
                    className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={inverterFilter}
                    onChange={(e) => setInverterFilter(e.target.value)}
                >
                    <option value="">{lang("reports.allinverters")}</option>
                    {inverters.map(i => (
                        <option key={i} value={i}>{i}</option>
                    ))}
                </select>

                {/* Download CSV */}
                <button
                    className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    onClick={handleDownloadCSV}
                >
                    {lang("reports.downloadcsv")}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div>Loading...</div>
                ) : error ? (
                    <div className="text-red-600">Error: {error}</div>
                ) : filteredData.length === 0 ? (
                    <div className="text-gray-600 text-center py-6">
                        {lang("common.noData")}
                    </div>
                ) : (
                    <Table data={filteredData} columns={columns} />
                )}
            </div>

        </div>
    );
};

export default SavingReports;
