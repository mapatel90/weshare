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

    // -----------------------------
    // Fetch Reports Function
    // -----------------------------
    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await apiGet('/api/inverter-data');

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
            setError(null);
        } catch (err) {
            setError(err?.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // Initial fetch + every 2 min refresh
    // -----------------------------
    useEffect(() => {
        fetchReports(); // first time load

        const interval = setInterval(() => {
            fetchReports();  // auto refresh every 2 min
        }, 120000); // 120000 = 2 minutes

        return () => clearInterval(interval); // cleanup
    }, []);

    // -----------------------------
    // Dropdown Options
    // -----------------------------
    const projects = useMemo(
        () => Array.from(new Set(reportsData.map(d => d.projectName))).filter(Boolean),
        [reportsData]
    );

    const inverters = useMemo(() => {
        const list = reportsData
            .filter(d => !projectFilter || d.projectName === projectFilter)
            .map(d => d.inverterName);
        return Array.from(new Set(list)).filter(Boolean);
    }, [reportsData, projectFilter]);

    // Reset inverter if not valid for selected project
    useEffect(() => {
        const available = new Set(
            reportsData
                .filter(d => !projectFilter || d.projectName === projectFilter)
                .map(d => d.inverterName)
        );
        if (inverterFilter && !available.has(inverterFilter)) {
            setInverterFilter('');
        }
    }, [projectFilter, reportsData, inverterFilter]);

    // -----------------------------
    // Filtered Data
    // -----------------------------
    const filteredData = useMemo(() => {
        return reportsData.filter(d => {
            if (projectFilter && d.projectName !== projectFilter) return false;
            if (inverterFilter && d.inverterName !== inverterFilter) return false;
            return true;
        });
    }, [projectFilter, inverterFilter, reportsData]);

    // -----------------------------
    // CSV Download
    // -----------------------------
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

    // -----------------------------
    // Table Columns
    // -----------------------------
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
        { accessorKey: 'generatedKW', header: () => lang("common.generatedKW") }
    ], [lang]);

    // -----------------------------
    // UI Rendering
    // -----------------------------
    return (
        <div className="p-6 bg-white rounded-3xl shadow-md">

            <div className="flex flex-row flex-wrap items-center justify-start md:justify-end gap-2 mb-4 mt-4">
                <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="theme-btn-blue-color border rounded-md px-3 py-2 mx-2 text-sm"
                >
                    <option value="">{lang("reports.allprojects")}</option>
                    {projects.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select
                    value={inverterFilter}
                    onChange={(e) => setInverterFilter(e.target.value)}
                    className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
                >
                    <option value="">{lang("reports.allinverters")}</option>
                    {inverters.map(i => <option key={i} value={i}>{i}</option>)}
                </select>

                <button
                    onClick={handleDownloadCSV}
                    className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm"
                >
                    {lang("reports.downloadcsv")}
                </button>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div>Loading...</div>
                ) : error ? (
                    <div className="text-red-600">Error: {error}</div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-6 text-gray-600">{lang("common.noData")}</div>
                ) : (
                    <Table data={filteredData} columns={columns} />
                )}
            </div>

        </div>
    );
};

export default SavingReports;
