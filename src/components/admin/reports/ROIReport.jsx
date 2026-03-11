"use client";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Table from "@/components/shared/table/Table";
import { formatShort } from "@/utils/common";
import { PROJECT_STATUS } from "@/constants/project_status";
import { Autocomplete, TextField, CircularProgress, Box } from "@mui/material";
import { showErrorToast } from "@/utils/topTost";

const ROIReports = () => {
    const PAGE_SIZE = 50;
    const { user } = useAuth();
    const { lang } = useLanguage();

    const [reportsData, setReportsData] = useState([]);
    const [projectFilter, setProjectFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [csvLoading, setCsvLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [error, setError] = useState(null);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        pages: 0,
    });
    const [projectList, setProjectList] = useState([]);
    const [appliedProjectFilter, setAppliedProjectFilter] = useState("");
    const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const isSubmitDisabled = !projectFilter;

    // Fetch Project List
    const fetchProjectList = async () => {
        try {
            const res = await apiPost("/api/projects/dropdown/project", {
                project_status_id: PROJECT_STATUS.RUNNING,
            });
            if (res && res.success) {
                setProjectList(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch projects:", err);
            setProjectList([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch ROI reports with server-side filters
    const fetchReports = async () => {
        if (!appliedProjectFilter) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: String(pageIndex + 1),
                limit: String(pageSize),
            });

            if (appliedProjectFilter) params.append("projectId", appliedProjectFilter);
            if (appliedSearchTerm) params.append("search", appliedSearchTerm);

            const res = await apiGet(`/api/projects/report/roi-data?${params.toString()}`);
            const items = Array.isArray(res?.data) ? res.data : [];

            const mappedData = items.map((item, idx) => ({
                id: item.id ?? idx,
                projectId: item.project_id ?? null,
                projectName: item.project_name || `Project ${item.project_id ?? ""}`,
                askingPrice: item.asking_price || "0",
                month_energy: item.month_energy || "0",
                revenue: item.revenue || "0",
                monthRevenue: item.month_revenue || "0",
                monthRoi: item.month_roi || "0",
                month: item.month || "",
                weshare_price: item.weshare_price || "0",
                capexValue: item.capexValue || "0",
            }));

            setReportsData(mappedData);

            if (res.pagination) {
                setPagination({
                    page: res.pagination.page || pageIndex + 1,
                    limit: res.pagination.limit || PAGE_SIZE,
                    total: res.pagination.total || mappedData.length,
                    pages: res.pagination.pages || Math.max(1, Math.ceil(mappedData.length / PAGE_SIZE)),
                });
            } else {
                setPagination({
                    page: pageIndex + 1,
                    limit: PAGE_SIZE,
                    total: mappedData.length,
                    pages: Math.max(1, Math.ceil(mappedData.length / PAGE_SIZE)),
                });
            }
        } catch (err) {
            setError(err?.message || "Failed to load reports");
            setReportsData([]);
        } finally {
            setLoading(false);
            setHasLoadedOnce(true);
        }
    };

    useEffect(() => {
        fetchProjectList();
    }, []);

    useEffect(() => {
        fetchReports();

        const interval = setInterval(() => {
            fetchReports();
        }, 120000);

        return () => clearInterval(interval);
    }, [appliedProjectFilter, appliedSearchTerm, pageIndex, pageSize]);

    // Handle submit to apply filters
    const handleSubmit = () => {
        if (!projectFilter) {
            alert(lang("response_messages.please_select_project", "Please select Project"));
            return;
        }
        setReportsData([]);
        setHasLoadedOnce(false);
        setLoading(true);
        setPageIndex(0);
        setSearchTerm("");
        setAppliedProjectFilter(projectFilter);
        setAppliedSearchTerm(searchTerm);
    };

    const handleSearchChange = (value) => {
        setPageIndex(0);
        setSearchTerm(value);
    };

    const handlePaginationChange = (nextPagination) => {
        const updated =
            typeof nextPagination === "function"
                ? nextPagination({ pageIndex, pageSize })
                : nextPagination;
        setPageIndex(updated.pageIndex ?? 0);
        if (updated.pageSize && updated.pageSize !== pageSize) {
            setPageSize(updated.pageSize);
            setPageIndex(0);
        }
    };

    // Format currency helper
    const formatCurrency = (value) => {
        if (!value || value === "0") return "0.00";
        const num = parseFloat(value);
        return isNaN(num) ? "0.00" : num.toFixed(2);
    };

    // Format percentage helper
    const formatPercentage = (value) => {
        if (!value || value === "0") return "0.00%";
        const num = parseFloat(value);
        return isNaN(num) ? "0.00%" : `${num.toFixed(2)}%`;
    };

    // Download CSV
    const handleDownloadCSV = async () => {
        try {
            if (!appliedProjectFilter) {
                showErrorToast(
                    lang("common.pleaseSelectProject", "Please select project before downloading CSV")
                );
                return;
            }

            setCsvLoading(true);

            const params = new URLSearchParams({
                page: "1",
                limit: "1000000",
            });

            if (appliedProjectFilter) params.append("projectId", appliedProjectFilter);
            if (appliedSearchTerm) params.append("search", appliedSearchTerm);

            const res = await apiGet(`/api/projects/report/roi-data?${params.toString()}`);
            const items = Array.isArray(res?.data) ? res.data : [];

            const csvData = items.map((item, idx) => ({
                projectName: item.project_name || `Project ${item.project_id ?? idx ?? ""}`,
                month: item.month || "",
                askingPrice: item.asking_price || "0",
                capexValue: item.capexValue ?? item.capex_value ?? "0",
                monthEnergy: item.month_energy || "0",
                wesharePrice: item.weshare_price || "0",
                monthRevenue: item.month_revenue || "0",
                monthRoi: item.month_roi || "0",
            }));

            const headers = [
                lang("projects.projectName", "Project Name"),
                lang("reports.month", "Month"),
                lang("projects.askingPrice", "Asking Price"),
                lang("projects.capexValue", "Capex Value"),
                lang("reports.monthEnergy", "Energy"),
                lang("projects.wesharePrice", "Weshare Price (kWh)"),
                lang("reports.monthRevenue", "Month Revenue"),
                lang("reports.monthRoi", "ROI"),
            ];

            const csvRows = [
                headers.join(","),
                ...csvData.map((row) => {
                    const values = [
                        `"${(row.projectName || "-").replace(/"/g, '""')}"`,
                        `"${(row.month || "-").replace(/"/g, '""')}"`,
                        row.askingPrice ?? "0",
                        row.capexValue ?? "0",
                        row.monthEnergy ?? "0",
                        row.wesharePrice ?? "0",
                        row.monthRevenue ?? "0",
                        `${parseFloat(row.monthRoi || 0).toFixed(2)}%`,
                    ];
                    return values.join(",");
                }),
            ];

            const csvContent = csvRows.join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            let filename = "roi_reports";
            const project = projectList.find(
                (p) => String(p.id ?? p.project_id) === String(appliedProjectFilter)
            );
            if (project) filename += `_${project.project_name || appliedProjectFilter}`;
            filename += `_${new Date().toISOString().split("T")[0]}.csv`;

            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("CSV download failed", err);
            setError(err?.message || "Failed to download CSV");
        } finally {
            setCsvLoading(false);
        }
    };

    // Columns definition
    const columns = useMemo(
        () => [
            {
                accessorKey: "projectName",
                header: lang("projects.projectName", "Project Name"),
            },
            {
                accessorKey: "month",
                header: lang("reports.month", "Month"),
            },
            {
                accessorKey: "askingPrice",
                header: lang("projects.askingPrice", "Asking Price"),
                cell: ({ row }) => formatCurrency(row.original.askingPrice),
            },
            {
                accessorKey: "capexValue",
                header: lang("projects.capexValue", "Capex Value"),
                cell: ({ row }) => {
                    const value = parseFloat(row.original.capexValue);
                    return isNaN(value) ? "0.00" : value.toFixed(2);
                },
            },
            {
                accessorKey: "month_energy",
                header: lang("reports.monthEnergy", "Energy"),
                cell: ({ row }) => formatShort(row.original.month_energy),
            },
            {
                accessorKey: "weshare_price",
                header: lang("projects.wesharePrice", "Weshare Price (kWh)"),
                cell: ({ row }) => row.original.weshare_price,
            },
            {
                accessorKey: "monthRevenue",
                header: lang("reports.monthRevenue", "Revenue"),
                cell: ({ row }) => row.original.monthRevenue,
            },
            {
                accessorKey: "monthRoi",
                header: lang("reports.monthRoi", "ROI"),
                cell: ({ row }) => formatPercentage(row.original.monthRoi),
            },
        ],
        [lang]
    );

    return (
        <div className="p-6 bg-white rounded-3xl shadow-md">
            {csvLoading && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 9999,
                    }}
                >
                    <CircularProgress size={60} sx={{ color: "#fff" }} />
                </Box>
            )}

            {/* Filter Section */}
            <div className="d-flex items-start lg:items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
                <div className="filter-button d-flex items-center gap-2 w-full flex-wrap lg:flex-nowrap lg:w-auto">
                    <Autocomplete
                        size="small"
                        options={projectList}
                        value={
                            projectList.find(
                                (p) => (p.id ?? p.project_id) === projectFilter
                            ) || null
                        }
                        onChange={(e, newValue) => {
                            setProjectFilter(
                                newValue ? (newValue.id ?? newValue.project_id) : ""
                            );
                        }}
                        getOptionLabel={(option) =>
                            option.project_name ||
                            option.projectName ||
                            `Project ${option.id ?? option.project_id ?? ""}`
                        }
                        isOptionEqualToValue={(option, value) =>
                            (option.id ?? option.project_id) ===
                            (value.id ?? value.project_id)
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={lang("reports.allprojects")}
                                placeholder={lang("reports.allprojects")}
                            />
                        )}
                        sx={{ width: { xs: "100%", sm: 260 } }}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className={`theme-btn-blue-color border rounded-md px-5 py-2 text-sm whitespace-nowrap w-full sm:w-auto ${isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        {lang("common.submit", "Submit")}
                    </button>
                </div>

                <button
                    onClick={handleDownloadCSV}
                    disabled={csvLoading}
                    className="common-grey-color border rounded-3 btn w-full sm:w-auto"
                >
                    {lang("reports.downloadcsv")}
                </button>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto relative">
                {!hasLoadedOnce && loading && (
                    <div className="text-center py-6 text-gray-600">
                        {lang("common.loading", "Loading...")}
                    </div>
                )}

                {error && <div className="text-red-600">Error: {error}</div>}

                {/* {hasLoadedOnce && ( */}
                {/* <> */}
                <Table
                    data={reportsData}
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
                        {lang("common.refreshing", "Refreshing...")}
                    </div>
                )}
                {/* </> */}
                {/* )} */}
            </div>
        </div>
    );
};

export default ROIReports;
