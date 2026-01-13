'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Table from "@/components/shared/table/Table";
import { apiGet, apiPost } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatShort } from '@/utils/common';

const ProjectDayReport = () => {
    const PAGE_SIZE = 50;
    const { lang } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState([]);
    const [projectFilter, setProjectFilter] = useState('');
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
    const [endDate, setEndDate] = useState(""); // YYYY-MM-DD
    const [reportsData, setReportsData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        pages: 0,
    });
    const [pageIndex, setPageIndex] = useState(0);
    const fetch_project_list = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await apiPost(`/api/projects/dropdown/project`);
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

    const fetchReports = useCallback(async () => {
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

            // Add searchTerm for server-side search
            if (searchTerm) {
                params.append("search", searchTerm);
            }

            // Add date range filters (inclusive)
            if (startDate) {
                params.append("startDate", startDate);
            }
            if (endDate) {
                params.append("endDate", endDate);
            }

            const res = await apiGet(`/api/projects/report/project-day-data?${params.toString()}`);

            if (res && res.success) {
                setReportsData(res.data || []);
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
                setReportsData([]);
            }
        } catch (err) {
            console.error("Failed to fetch reports:", err);
            setError(err?.message || "Failed to load reports");
            setReportsData([]);
        } finally {
            setLoading(false);
        }
    }, [pageIndex, projectFilter, startDate, endDate, searchTerm]);

    const handleSearchChange = (value) => {
        setPageIndex(0);
        setSearchTerm(value);
    };

    const handlePaginationChange = (nextPagination) => {
        const updated = typeof nextPagination === "function"
            ? nextPagination({ pageIndex, pageSize: PAGE_SIZE })
            : nextPagination;
        setPageIndex(updated.pageIndex || 0);
    };

    const downloadCSV = async () => {
        try {
            setLoading(true);

            // Build params for CSV export (fetch all data, no pagination)
            const params = new URLSearchParams();

            if (projectFilter) {
                params.append("projectId", projectFilter);
            }

            if (searchTerm) {
                params.append("search", searchTerm);
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

            const res = await apiGet(`/api/projects/report/project-day-data?${params.toString()}`);

            if (res && res.success && res.data) {
                const data = res.data;

                // Define CSV headers matching table columns
                const headers = [
                    'Project Name',
                    'Date',
                    'Grid Purchased',
                    'Consume Energy',
                    'Full Hour',
                    'Battery Charge',
                    'Battery Discharge',
                    'Home Grid',
                    'Backup Energy',
                    'Energy',
                    'EvN Cost',
                    'Weshare Cost',
                    'Saving Cost'
                ];

                // Convert data to CSV rows
                const csvRows = [
                    headers.join(','), // Header row
                    ...data.map(row => {
                        const values = [
                            `"${(row.projects?.project_name || 'N/A').replace(/"/g, '""')}"`,
                            row.date ? `"${new Date(row.date).toLocaleDateString()}"` : '"N/A"',
                            formatShort(row.grid_purchased_energy) || 0,
                            formatShort(row.consume_energy) || 0,
                            formatShort(row.full_hour) || 0,
                            formatShort(row.battery_charge_energy) || 0,
                            formatShort(row.battery_discharge_energy) || 0,
                            formatShort(row.home_grid_energy) || 0,
                            formatShort(row.back_up_energy) || 0,
                            formatShort(row.energy) || 0,
                            formatShort(row.evn_amount) || 0,
                            formatShort(row.weshare_amount) || 0,
                            formatShort(row.saving_cost) || 0,
                        ];
                        return values.join(',');
                    })
                ];

                // Create CSV content
                const csvContent = csvRows.join('\n');

                // Create blob and download
                const blob = new Blob(
                    ["\uFEFF" + csvContent],
                    { type: 'text/csv;charset=utf-8;' }
                );
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);

                // Generate filename with date range if applicable
                let filename = 'project_day_report';
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

    // Define table columns
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
                return date ? new Date(date).toLocaleDateString() : 'N/A';
            },
        },
        {
            accessorKey: 'grid_purchased_energy',
            header: 'Grid Purchased',
            cell: ({ row }) => (formatShort(row.original.grid_purchased_energy) || 0),
        },
        {
            accessorKey: 'consume_energy',
            header: 'Consume Energy',
            cell: ({ row }) => (formatShort(row.original.consume_energy) || 0),
        },
        {
            accessorKey: 'full_hour',
            header: 'Full Hour',
            cell: ({ row }) => (formatShort(row.original.full_hour) || 0),
        },
        {
            accessorKey: 'battery_charge_energy',
            header: 'Battery Charge',
            cell: ({ row }) => (formatShort(row.original.battery_charge_energy) || 0),
        },
        {
            accessorKey: 'battery_discharge_energy',
            header: 'Battery Discharge',
            cell: ({ row }) => (formatShort(row.original.battery_discharge_energy) || 0),
        },
        {
            accessorKey: 'home_grid_energy',
            header: 'Home Grid',
            cell: ({ row }) => (formatShort(row.original.home_grid_energy) || 0),
        },
        {
            accessorKey: 'back_up_energy',
            header: 'Backup Energy',
            cell: ({ row }) => (formatShort(row.original.back_up_energy) || 0),
        },
        {
            accessorKey: 'energy',
            header: 'Energy',
            cell: ({ row }) => (formatShort(row.original.energy) || 0),
        },
        {
            accessorKey: 'evn cost',
            header: 'EvN Cost',
            cell: ({ row }) => (formatShort(row.original.evn_amount) || 0),
        },
        {
            accessorKey: 'weshare cost',
            header: 'Weshare Cost',
            cell: ({ row }) => (formatShort(row.original.weshare_amount) || 0),
        },
        {
            accessorKey: 'saving_cost',
            header: 'Saving Cost',
            cell: ({ row }) => (formatShort(row.original.saving_cost) || 0),
        },
    ], []);

    useEffect(() => {
        fetch_project_list();
    }, []);

    // Fetch reports when filters or pagination change
    useEffect(() => {
        fetchReports();
    }, [fetchReports, hasLoadedOnce]);

    return (
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
                            data={reportsData}
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
    );
};

export default ProjectDayReport;