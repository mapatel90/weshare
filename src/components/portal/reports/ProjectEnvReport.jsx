'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Table from "@/components/shared/table/Table";
import { apiGet, apiPost } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PROJECT_STATUS } from '@/constants/project_status';
import { Autocomplete, TextField } from "@mui/material";

const ProjectEnvReport = () => {
    const PAGE_SIZE = 50;
    const { lang } = useLanguage();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
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
    const [appliedProject, setAppliedProject] = useState("");
    const [appliedStartDate, setAppliedStartDate] = useState("");
    const [appliedEndDate, setAppliedEndDate] = useState("");
    const isSubmitDisabled = !projectFilter;

    const fetch_project_list = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await apiPost("/api/projects/dropdown/project", { offtaker_id: user?.id, project_status_id: PROJECT_STATUS.RUNNING });

            if (res && res.data) {
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

            if (appliedStartDate && appliedEndDate) {
                const startTs = new Date(`${appliedStartDate}T00:00:00`);
                const endTs = new Date(`${appliedEndDate}T23:59:59`);
                if (startTs > endTs) {
                    setError("Start date cannot be after end date.");
                    setLoading(false);
                    setHasLoadedOnce(true);
                    return;
                }
            }
            const params = new URLSearchParams({
                page: String(pageIndex + 1),
                limit: String(pageSize),
            });
            if (appliedProject) {
                params.append("projectId", appliedProject);
            }
            if (search) {
                params.append("search", search);
            }
            if (appliedStartDate) {
                params.append("startDate", appliedStartDate);
            }
            if (appliedEndDate) {
                params.append("endDate", appliedEndDate);
            }

            params.append("offtaker_id", user?.id);

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
                setError(lang("response_messages.failed_to_load_reports_data", "Failed to load reports data"));
                setProjectEnergyData([]);
            }
        } catch (err) {
            console.error("Failed to fetch project energy data:", err);
            setError(err?.message || "Failed to load project energy data");
        } finally {
            setLoading(false);
        }
    };


    const handleSubmit = () => {
        if (!projectFilter) {
            alert(lang("response_messages.please_select_project", "Please select Project"));
            return;
        }

        // Clear old data and reset loading state when submitting new filters
        setProjectEnergyData([]);
        setHasLoadedOnce(false);
        setLoading(true);
        setPageIndex(0);
        setSearch('');
        setAppliedProject(projectFilter);
        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);
    };

    useEffect(() => {
        if (!appliedProject) return;
        fetch_project_energy_data();
    }, [appliedProject, appliedStartDate, appliedEndDate, search, pageIndex, pageSize]);

    useEffect(() => {
        fetch_project_list();
    }, []);

    const handleSearchChange = (value) => {
        setPageIndex(0);
        setSearch(value);
    };

    const handlePaginationChange = (nextPagination) => {
        const updated = typeof nextPagination === "function"
          ? nextPagination({ pageIndex, pageSize })
          : nextPagination;
        setPageIndex(updated.pageIndex ?? 0);
        if (updated.pageSize && updated.pageSize !== pageSize) {
          setPageSize(updated.pageSize);
          setPageIndex(0);
        }
        setPagination(updated);
    };

    const columns = useMemo(() => [
        {
            accessorKey: 'projects.project_name',
            header: lang("projects.projectName"),
            cell: ({ row }) => row.original.projects?.project_name || 'N/A',
        },
        {
            accessorKey: 'date',
            header: lang("common.date"),
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
            header: lang("common.time"),
            cell: ({ row }) => row.original.time || 'N/A',
        },
        {
            accessorKey: 'pv',
            header: "PV",
            cell: ({ row }) => row.original.pv || '0',
        },
        {
            accessorKey: 'grid',
            header: lang("animated.grid"),
            cell: ({ row }) => row.original.grid || '0',
        },
        {
            accessorKey: 'load',
            header: lang("animated.load"),
            cell: ({ row }) => row.original.load || '0',
        },
    ], []);

    const downloadCSV = async () => {
        try {
            setLoading(true);

            // Build params for CSV export (fetch all data, no pagination)
            const params = new URLSearchParams();

            if (appliedProject) {
                params.append("projectId", appliedProject);
            }

            if (search) {
                params.append("search", search);
            }

            if (appliedStartDate) {
                params.append("startDate", appliedStartDate);
            }
            if (appliedEndDate) {
                params.append("endDate", appliedEndDate);
            }

            params.append("offtaker_id", user?.id);

            // Fetch all data for CSV (set a high limit or fetch without pagination)
            params.append("page", "1");
            params.append("limit", "1000000"); // Large limit to get all data

            const res = await apiPost(`/api/projects/report/project-energy-data?${params.toString()}`);

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
                const blob = new Blob(
                    ["\uFEFF" + csvContent],
                    { type: 'text/csv;charset=utf-8;' }
                );
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);

                // Generate filename with date range if applicable
                let filename = 'project_energy_report';
                if (appliedStartDate && appliedEndDate) {
                    filename += `_${appliedStartDate}_to_${appliedEndDate}`;
                } else if (appliedStartDate) {
                    filename += `_from_${appliedStartDate}`;
                } else if (appliedEndDate) {
                    filename += `_until_${appliedEndDate}`;
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
            <div className="p-6 bg-white rounded-3xl shadow-md">
                <div className="flex flex-wrap gap-2 mb-4 mt-4 w-full">
                    <Autocomplete
                        size="small"
                        options={projects}
                        value={projects.find((p) => String(p?.id) === projectFilter) || null}
                        onChange={(e, newValue) =>
                            setProjectFilter(newValue ? String(newValue.id) : "")
                        }
                        getOptionLabel={(option) => option.project_name || ""}
                        isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                        renderOption={(props, option, { selected }) => (
                            <li
                                {...props}
                                style={{
                                    padding: "10px 16px",
                                    cursor: "pointer",
                                    background: selected ? "#F6A623" : "#fff9f0",
                                    fontWeight: selected ? 600 : 400,
                                    color: selected ? "#fff" : "#b26800",
                                    borderLeft: selected ? "4px solid #e8920a" : "4px solid transparent",
                                    transition: "background 0.15s",
                                }}
                            >
                                {option.project_name}
                            </li>
                        )}
                        componentsProps={{
                            paper: {
                                sx: {
                                    border: "2px solid rgba(246,166,35,0.2)",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 16px rgba(246,166,35,0.2)",
                                    mt: 0.5,
                                },
                            },
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={lang("dashboard.all_project", "All Projects")}
                                placeholder={lang("common.searchProject", "Select project...")}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        "&:hover fieldset": { borderColor: "#F6A623" },
                                        "&.Mui-focused fieldset": { borderColor: "#F6A623" },
                                    },
                                    "& label.Mui-focused": { color: "#b26800" },
                                }}
                            />
                        )}
                        sx={{ width: { xs: "100%", sm: 260 } }}
                    />

                    <TextField
                        size="small"
                        type="date"
                        label={lang("projects.startDate", "Start Date")}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                            width: { xs: "100%", sm: 200 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                backgroundColor: "#fff",
                                "&:hover fieldset": { borderColor: "#F6A623" },
                                "&.Mui-focused fieldset": { borderColor: "#F6A623" },
                            },
                            "& label.Mui-focused": { color: "#b26800" },
                        }}
                    />

                    <TextField
                        size="small"
                        type="date"
                        label={lang("projects.endDate", "End Date")}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        inputProps={{ min: startDate || undefined }}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                            width: { xs: "100%", sm: 200 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                backgroundColor: "#fff",
                                "&:hover fieldset": { borderColor: "#F6A623" },
                                "&.Mui-focused fieldset": { borderColor: "#F6A623" },
                            },
                            "& label.Mui-focused": { color: "#b26800" },
                        }}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className={`theme-btn-blue-color border rounded-md px-4 py-2 text-sm w-full sm:w-auto ${isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {lang("common.submit", "Submit")}
                    </button>

                    <button
                        onClick={downloadCSV}
                        disabled={loading || !hasLoadedOnce}
                        className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        {lang("reports.downloadcsv")}
                    </button>
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    {!hasLoadedOnce && loading && (
                        <div className="text-center py-6 text-gray-600">Loading...</div>
                    )}

                    {error && <div className="text-red-600">Error: {error}</div>}
                    <>
                        <Table
                            data={projectEnergyData}
                            columns={columns}
                            disablePagination={false}
                            onSearchChange={handleSearchChange}
                            onPaginationChange={handlePaginationChange}
                            pageIndex={pageIndex}
                            pageSize={pageSize}
                            serverSideTotal={pagination.total}
                            initialPageSize={pageSize}
                        />
                        {loading && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600">
                                Refreshing...
                            </div>
                        )}
                    </>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3 mt-3">
                    {/* Top Page Size Selector */}
                    <div className="flex items-center justify-end gap-2 pb-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500">{lang("common.rowsPerPage", "Rows per page")}:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
                            className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                            {[10, 30, 50, 70, 100].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    {!hasLoadedOnce && loading && (
                        <div className="text-center text-sm text-gray-500 py-8">Loading...</div>
                    )}
                    {error && <div className="text-red-600 text-sm">Error: {error}</div>}
                    {hasLoadedOnce && projectEnergyData.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-8">
                            {lang("common.noData", "No data found")}
                        </div>
                    ) : (
                        projectEnergyData.map((item, idx) => (
                            <div
                                key={item.id ?? idx}
                                className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">
                                        {item.projects?.project_name || 'N/A'}
                                    </h3>
                                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">{lang("common.time", "Time")}:</span>
                                        <span className="font-medium text-gray-900">{item.time || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">PV:</span>
                                        <span className="font-medium text-gray-900">{item.pv || '0'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">{lang("animated.grid", "Grid")}:</span>
                                        <span className="font-medium text-gray-900">{item.grid || '0'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">{lang("animated.load", "Load")}:</span>
                                        <span className="font-medium text-gray-900">{item.load || '0'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {/* Mobile Pagination */}
                    {pagination.total > 0 && (
                        <div className="space-y-2 pt-3 border-t border-gray-200 mt-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, pagination.total)} {lang("common.of", "of")} {pagination.total}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={pageIndex === 0}
                                        onClick={() => setPageIndex(pageIndex - 1)}
                                        className="px-3 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                    >
                                        ← {lang("common.prev", "Prev")}
                                    </button>
                                    <button
                                        disabled={(pageIndex + 1) >= pagination.pages}
                                        onClick={() => setPageIndex(pageIndex + 1)}
                                        className="px-3 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                    >
                                        {lang("common.next", "Next")} →
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{lang("common.rowsPerPage", "Rows per page")}:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
                                    className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                >
                                    {[10, 30, 50, 70, 100].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProjectEnvReport;