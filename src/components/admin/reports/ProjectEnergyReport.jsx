'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Table from "@/components/shared/table/Table";
import { apiGet, apiPost } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const ProjectEnergyReport = () => {
    const PAGE_SIZE = 50;
    const { lang } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        pages: 0,
    });
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState([]);
    const [projectFilter, setProjectFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [projectEnergyData, setProjectEnergyData] = useState([]);

    const fetch_project_list = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await apiGet(`/api/projects/dropdown/project`);
            console.log("API Response:", res); // Check the structure

            // FIX HERE: Check the actual response structure
            if (res && res.data) {
                // If API returns { data: [...] }
                setProjects(res.data);
            } else if (Array.isArray(res)) {
                // If API directly returns array
                setProjects(res);
            } else {
                console.error("Unexpected response format:", res);
                setProjects([]);
            }
        } catch (err) {
            console.error("Failed to fetch projects:", err);
            setError(err?.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const fetch_project_energy_data = async () => {
        try {
            setLoading(true);
            setError(null);

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
                page: String(pageIndex + 1),
                limit: String(PAGE_SIZE),
            });
            if (projectFilter) {
                params.append("projectId", projectFilter);
            }
            if (search) {
                params.append("search", search);
            }
            if (startDate) {
                params.append("startDate", startDate);
            }
            if (endDate) {
                params.append("endDate", endDate);
            }

            const res = await apiPost(`/api/projects/report/project-energy-data?${params.toString()}`);

            if (res && res.success) {
                setProjectEnergyData(res.data || []);
                if (res.pagination) {
                    setPagination({
                        page: res.pagination.page,
                        limit: res.pagination.limit,
                        total: res.pagination.total,
                        pages: res.pagination.pages,
                    });
                }
                setHasLoadedOnce(true);
            } else {
                setError("Failed to load reports data");
                setProjectEnergyData([]);
            }
        } catch (err) {
            console.error("Failed to fetch project energy data:", err);
            setError(err?.message || "Failed to load project energy data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch_project_energy_data();
    }, [projectFilter, startDate, endDate, search, pagination.limit, pageIndex]);

    useEffect(() => {
        fetch_project_list();
    }, []);

    const handleSearchChange = (value) => {
        setPageIndex(0);
        setSearch(value);
    };

    const handlePaginationChange = (nextPagination) => {
        setPageIndex(nextPagination.pageIndex);
        setPagination(nextPagination);
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'projects.project_name',
            header: 'Project Name',
            cell: ({ row }) => row.original.projects?.project_name || 'N/A',
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => {
                const date = row.original.date;
                if (!date) return 'N/A';
                try {
                    return new Date(date).toLocaleDateString();
                } catch (e) {
                    return date;
                }
            },
        },
        {
            accessorKey: 'time',
            header: 'Time',
            cell: ({ row }) => row.original.time || 'N/A',
        },
        {
            accessorKey: 'pv',
            header: 'PV',
            cell: ({ row }) => row.original.pv || 'N/A',
        },
        {
            accessorKey: 'grid',
            header: 'Grid',
            cell: ({ row }) => row.original.grid || '0',
        },
        {
            accessorKey: 'load',
            header: 'Load',
            cell: ({ row }) => row.original.load || 'N/A',
        },
    ], []);

    const downloadCSV = async () => {
        try {
            setLoading(true);

            // Build params for CSV export (fetch all data, no pagination)
            const params = new URLSearchParams();

            if (projectFilter) {
                params.append("projectId", projectFilter);
            }

            if (search) {
                params.append("search", search);
            }

            if (startDate) {
                params.append("startDate", startDate);
            }
            if (endDate) {
                params.append("endDate", endDate);
            }

            // Fetch all data for CSV (set a high limit or fetch without pagination)
            params.append("page", "1");
            params.append("limit", "10000"); // Large limit to get all data

            const res = await apiGet(`/api/projects/report/project-energy-data?${params.toString()}`);

            if (res && res.success && res.data) {
                const data = res.data;

                // Define CSV headers matching table columns
                const headers = [
                    'Project Name',
                    'Date',
                    'Time',
                    'PV',
                    'Grid',
                    'Load',
                ];

                // Convert data to CSV rows
                const csvRows = [
                    headers.join(','), // Header row
                    ...data.map(row => {
                        const values = [`"${(row.projects?.project_name || '-').replace(/"/g, '""')}"`,
                            row.date ? `"${new Date(row.date).toLocaleDateString()}"` : '"-"',
                            row.time ? `"${row.time}"` : '"-"',
                            row.pv ? `"${row.pv}"` : '"0"',
                            row.grid ? `"${row.grid}"` : '"0"',
                            row.load ? `"${row.load}"` : '"0"',
                        ];
                        return values.join(',');
                    })
                ];

                // Create CSV content
                const csvContent = csvRows.join('\n');

                // Create blob and download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);

                // Generate filename with date range if applicable
                let filename = 'project_energy_report';
                if (startDate && endDate) {
                    filename += `_${startDate}_to_${endDate}`;
                } else if (startDate) {
                    filename += `_from_${startDate}`;
                } else if (endDate) {
                    filename += `_until_${endDate}`;
                }
                filename += `_${new Date().toISOString().split('T')[0]}.csv`;

                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                setError("Failed to fetch data for CSV export");
            }
        } catch (err) {
            console.error("Failed to export CSV:", err);
            setError(err?.message || "Failed to export CSV");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="p-6 bg-white rounded-xl shadow-md">
                <div className="flex flex-row flex-wrap items-center justify-start md:justify-end gap-2 mb-4 mt-4">
                    <select
                        id="projectFilter"
                        className="theme-btn-blue-color border rounded-md px-3 me-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                    >
                        <option value="">All Projects</option>
                        {projects.map((p, index) => (
                            <option key={p?.id ?? index} value={p?.id}>
                                {p?.project_name}
                            </option>
                        ))}
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

                    <button
                        onClick={downloadCSV}
                        disabled={loading || !hasLoadedOnce}
                        className="theme-btn-blue-color border rounded-md px-3 me-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        style={{ display: "inline", float: "right" }}
                    >
                        {lang("reports.downloadcsv")}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {!hasLoadedOnce && loading && (
                        <div className="text-center py-6 text-gray-600">Loading...</div>
                    )}

                    {error && <div className="text-red-600">Error: {error}</div>}
                    {hasLoadedOnce && (
                        <>
                            {/* Keep the table mounted so search input state is retained */}
                            <Table
                                data={projectEnergyData}
                                columns={columns}
                                disablePagination={false}
                                onSearchChange={handleSearchChange}
                                onPaginationChange={handlePaginationChange}
                                pageIndex={pageIndex}
                                pageSize={PAGE_SIZE}
                                serverSideTotal={pagination.total}
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
        </>
    );
};

export default ProjectEnergyReport;