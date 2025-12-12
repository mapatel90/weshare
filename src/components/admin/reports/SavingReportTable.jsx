'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Table from "@/components/shared/table/Table";
import { apiGet } from "@/lib/api";
import { useLanguage } from '@/contexts/LanguageContext';

const SavingReports = () => {

    const PAGE_SIZE = 50;   // show 50 rows per table page

    const [projectFilter, setProjectFilter] = useState(''); // store projectId (string)
    const [inverterFilter, setInverterFilter] = useState(''); // store inverterId (string)
    const [searchTerm, setSearchTerm] = useState(''); // global search value from Table
    const [startDate, setStartDate] = useState('');   // YYYY-MM-DD
    const [endDate, setEndDate] = useState('');       // YYYY-MM-DD
    const [reportsData, setReportsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        pages: 0
    });

    const { lang } = useLanguage();

     // Dropdown lists (populated from single API)
    const [projectList, setProjectList] = useState([]);
    const [inverterList, setInverterList] = useState([]);

    // -----------------------------
    // Fetch Reports Function (always fetch latest 50)
    // -----------------------------
    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);

            // basic client-side validation to avoid inverted ranges
            if (startDate && endDate) {
                const startTs = new Date(`${startDate}T00:00:00`);
                const endTs = new Date(`${endDate}T23:59:59`);
                if (startTs > endTs) {
                    setError("Start date cannot be after end date.");
                    setLoading(false);
                    setHasLoadedOnce(true);
                    return;
                }
            }

            const params = new URLSearchParams({
                page: '1',
                downloadAll: '1',
            });

            // Add projectId if selected
            if (projectFilter) {
                params.append('projectId', projectFilter);
            }

            // Add inverterId if selected
            if (inverterFilter) {
                params.append('inverterId', inverterFilter);
            }

            // Add searchTerm for server-side search
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            // Add date range filters (inclusive)
            if (startDate) {
                params.append('startDate', startDate);
            }
            if (endDate) {
                params.append('endDate', endDate);
            }

            const res = await apiGet(`/api/inverter-data?${params.toString()}`);

            const items = Array.isArray(res?.data) ? res.data : [];

            const mappedData = items.map(item => ({
                id: item.id,
                projectId: (item.projectId ?? item.project_id) ?? null,
                inverterId: (item.inverterId ?? item.inverter_id) ?? null,
                projectName: item.project?.project_name || `Project ${item.projectId ?? item.project_id ?? ''}`,
                inverterName: item.inverter?.inverterName || `Inverter ${item.inverterId ?? item.inverter_id ?? ''}`,
                date: item.date,
                time: item.time ?? "",
                generatedKW:
                    item.generate_kw !== undefined && item.generate_kw !== null
                        ? (Number(item.generate_kw) / 1000).toFixed(2) + ' kwh'
                        : '',
                Acfrequency: item.ac_frequency ?? '',
                DailyYield: item.daily_yield !== undefined && item.daily_yield !== null
                    ? item.daily_yield + ' kwh'
                    : '',
                AnnualYield: item.annual_yield !== undefined && item.annual_yield !== null
                    ? item.annual_yield + ' kwh'
                    : '',
                TotalYield: item.total_yield !== undefined && item.total_yield !== null
                    ? item.total_yield + ' kwh'
                    : '',
            }));
            setReportsData(mappedData);

             // set dropdown lists from response (projectList/inverterList)
            setProjectList(Array.isArray(res?.projectList) ? res.projectList : []);
            // inverterList from backend comes as [{id, name, projectId?}]
            setInverterList(Array.isArray(res?.inverterList) ? res.inverterList : []);
            
            const apiTotal = res?.pagination?.total ?? mappedData.length;
            const total = apiTotal;

            setPagination({
                page: 1,
                limit: PAGE_SIZE,
                total,
                pages: Math.max(1, Math.ceil(total / PAGE_SIZE))
            });

            setError(null);
        } catch (err) {
            setError(err?.message || "Failed to load reports");
        } finally {
            setLoading(false);
            setHasLoadedOnce(true);
        }
    };

    // Fetch + refresh when filters/search change
    useEffect(() => {
        fetchReports();

        const interval = setInterval(() => {
            fetchReports();
        }, 120000); // 2 minutes

        return () => clearInterval(interval);
    }, [projectFilter, inverterFilter, searchTerm, startDate, endDate]);

    // When projectFilter changes: if the currently selected inverter is not in returned inverterList => reset inverterFilter
    useEffect(() => {
        if (!inverterFilter) return;

        const available = new Set((inverterList || []).map(i => String(i.id)));
        if (!available.has(inverterFilter)) {
            setInverterFilter('');
        }
    }, [projectFilter, inverterList, inverterFilter]);

    // -----------------------------
    // Dropdown Options (from fetched 50)
    // -----------------------------
    // const projects = useMemo(() => {
    //     const map = new Map();
    //     reportsData.forEach(d => {
    //         if (d.projectId) map.set(String(d.projectId), d.projectName);
    //     });
    //     return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    // }, [reportsData]);

    // const inverters = useMemo(() => {
    //     const map = new Map();
    //     reportsData
    //         .filter(d => !projectFilter || String(d.projectId) === projectFilter)
    //         .forEach(d => {
    //             if (d.inverterId) map.set(String(d.inverterId), d.inverterName);
    //         });
    //     return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    // }, [reportsData, projectFilter]);

    // Reset inverter if not valid for selected project
    // useEffect(() => {
    //     const available = new Set(
    //         reportsData
    //             .filter(d => !projectFilter || String(d.projectId) === projectFilter)
    //             .map(d => String(d.inverterId))
    //     );
    //     if (inverterFilter && !available.has(inverterFilter)) {
    //         setInverterFilter('');
    //     }
    // }, [projectFilter, reportsData, inverterFilter]);

    // -----------------------------
    // Filtered Data (client-side filtering on fetched 50)
    // -----------------------------
    const filteredData = useMemo(() => {
        return reportsData.filter(d => {
            if (projectFilter && String(d.projectId) !== projectFilter) return false;
            if (inverterFilter && String(d.inverterId) !== inverterFilter) return false;
            return true;
        });
    }, [projectFilter, inverterFilter, reportsData]);

    // -----------------------------
    // CSV Download (exports filtered set from the 50)
    // -----------------------------
    const handleDownloadCSV = async () => {
        try {
            const params = new URLSearchParams();
            if (projectFilter) params.append('projectId', projectFilter);
            if (inverterFilter) params.append('inverterId', inverterFilter);
            if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
            params.append('downloadAll', '1');

            const res = await apiGet(`/api/inverter-data?${params.toString()}`);
            const items = Array.isArray(res?.data) ? res.data : [];

            const rows = items.map(item => ({
                projectName: item.project?.project_name || `Project ${item.projectId ?? item.project_id ?? ''}`,
                inverterName: item.inverter?.inverterName || `Inverter ${item.inverterId ?? item.inverter_id ?? ''}`,
                date: item.date,
                time: item.time ?? "",
                generatedKW:
                    item.generate_kw !== undefined && item.generate_kw !== null
                        ? (Number(item.generate_kw) / 1000).toFixed(2) + ' kwh'
                        : '',
                Acfrequency: item.ac_frequency ?? '',
                DailyYield: item.daily_yield !== undefined && item.daily_yield !== null
                    ? item.daily_yield + ' kwh'
                    : '',
                AnnualYield: item.annual_yield !== undefined && item.annual_yield !== null
                    ? item.annual_yield + ' kwh'
                    : '',
                TotalYield: item.total_yield !== undefined && item.total_yield !== null
                    ? item.total_yield + ' kwh'
                    : '',
            }));

            const header = [
                lang("projects.projectName"),
                lang("inverter.inverterName"),
                lang("common.date"),
                lang("common.time"),
                lang("common.generatedKW"),
                lang("common.acFrequency"),
                lang("reports.dailyYield"),
                lang("reports.annualYield"),
                lang("reports.totalYield")
            ];

            const csvRows = rows.map(row => [
                row.projectName,
                row.inverterName,
                formatDateDDMMYYYY(row.date),
                row.time ?? '',
                row.generatedKW ?? '',
                row.Acfrequency ?? '',
                row.DailyYield ?? '',
                row.AnnualYield ?? '',
                row.TotalYield ?? ''
            ]);

            const csvContent =
                'data:text/csv;charset=utf-8,' +
                [header, ...csvRows].map(e => e.join(",")).join("\n");

            const link = document.createElement('a');
            link.setAttribute('href', encodeURI(csvContent));
            link.setAttribute('download', 'saving_reports.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('CSV download failed', err);
        }
    };

    // helper to show date without timezone shift (dd/mm/yyyy)
    const formatDateDDMMYYYY = (raw) => {
        if (!raw) return '';
        // take only date part (works for "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss")
        const datePart = String(raw).trim().split(/[ T]/)[0];
        const [y, m, d] = datePart.split('-');
        if (y && m && d) return `${d}/${m}/${y}`;
        return '';
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
            cell: ({ row }) => formatDateDDMMYYYY(row.original.date)
        },
        { accessorKey: 'time', header: () => lang("common.time") },
        { accessorKey: 'generatedKW', header: () => lang("common.generatedKW") },
        { accessorKey: 'Acfrequency', header: () => lang("common.acFrequency") },
        { accessorKey: 'DailyYield', header: () => lang("reports.dailyYield") },
        { accessorKey: 'AnnualYield', header: () => lang("reports.annualYield") },
        { accessorKey: 'TotalYield', header: () => lang("reports.totalYield"), meta: { disableSort: true } }
    ], [lang]);

    // -----------------------------
    // UI Rendering
    // -----------------------------
    return (
        <div className="p-6 bg-white rounded-3xl shadow-md">

            <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
                <div className="filter-button">
                <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="theme-btn-blue-color border rounded-md px-3 py-2 mx-2 text-sm"
                >
                    <option value="">{lang("reports.allprojects")}</option>
                    {projectList.map(p => (
                        <option key={p.id ?? p.project_id ?? p.id} value={p.id ?? p.project_id ?? p.id}>
                            {p.project_name ?? p.projectName ?? `Project ${p.id ?? p.project_id ?? ''}`}
                        </option>
                    ))}
                </select>

                <select
                    value={inverterFilter}
                    onChange={(e) => setInverterFilter(e.target.value)}
                    className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
                >
                    <option value="">{lang("reports.allinverters")}</option>
                   {inverterList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>

                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
                    placeholder={lang("common.startDate") || "Start Date"}
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className="theme-btn-blue-color border rounded-md px-3 py-2 me-2 text-sm"
                    placeholder={lang("common.endDate") || "End Date"}
                />
                </div>

                <button
                    onClick={handleDownloadCSV}
                    className="common-grey-color border rounded-3 btn"
                >
                    {lang("reports.downloadcsv")}
                </button>
            </div>

            <div className="overflow-x-auto relative">
                {!hasLoadedOnce && loading && (
                    <div className="text-center py-6 text-gray-600">Loading...</div>
                )}

                {error && (
                    <div className="text-red-600">Error: {error}</div>
                )}

                {hasLoadedOnce && filteredData.length === 0 && !error && !loading && (
                    <div className="text-center py-6 text-gray-600">{lang("common.noData")}</div>
                )}

                {hasLoadedOnce && (
                    <>
                        {/* Keep the table mounted so search input state is retained */}
                        <Table 
                            data={filteredData} 
                            columns={columns} 
                            disablePagination={false}
                            onSearchChange={setSearchTerm}
                            serverSideTotal={pagination.total} // total rows from server
                            initialPageSize={PAGE_SIZE}
                        />
                        {loading && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600">
                                Refreshing...
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};

export default SavingReports;
