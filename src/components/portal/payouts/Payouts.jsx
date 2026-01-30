"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { PROJECT_STATUS } from "@/constants/project_status";
import Table from "@/components/shared/table/Table";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";
import { FiDownload, FiEye } from "react-icons/fi";
import { Autocomplete, IconButton, Stack, TextField } from "@mui/material";
import Link from "next/link";
import { ROLES } from "@/constants/roles";
import { downloadPayoutPDF } from "./PayoutPdf";


const PayoutsPage = () => {
    const PAGE_SIZE = 50;
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [pageIndex, setPageIndex] = useState(0); // 0-based index for Table
    const { lang } = useLanguage();
    const { user } = useAuth();
    const [projectList, setProjectList] = useState([]);
    const [projectFilter, setProjectFilter] = useState("");
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pageSize: pageSize, totalCount: 0, totalPages: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const priceWithCurrency = usePriceWithCurrency();


    const fetchProjects = async () => {
        try {
            const response = await apiPost("/api/projects/dropdown/project", {
                investor_id: user?.id || undefined,
                project_status_id: PROJECT_STATUS.RUNNING,
            });

            if (response?.success && Array.isArray(response?.data)) {
                setProjectList(response.data);
            } else {
                setProjectList([]);
            }
        } catch (e) {
            console.error("Error fetching projects:", e);
            setProjectList([]);
        }
    };

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(pageIndex + 1),
                pageSize: String(pageSize),
            });

            if (projectFilter) {
                params.append("projectId", projectFilter);
            }

            if (searchTerm) {
                params.append("search", searchTerm);
            }
            if (user?.role === ROLES.INVESTOR) {
                params.append("investorId", user?.id);
            }


            const response = await apiGet(`/api/payouts?${params.toString()}`);

            if (response?.success) {
                setPayouts(response.data);
                setPagination(response.pagination);
            }
        } catch (e) {
            console.error("Error fetching payouts:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (value) => {
        setPageIndex(0);
        setSearchTerm(value);
    };

    const handlePaginationChange = (nextPagination) => {
        const current = { pageIndex, pageSize };
        const updated =
            typeof nextPagination === "function"
                ? nextPagination(current)
                : nextPagination || {};
        let newPageIndex = typeof updated.pageIndex === "number" ? updated.pageIndex : 0;
        let newPageSize = typeof updated.pageSize === "number" ? updated.pageSize : pageSize;
        setPageIndex(newPageIndex);
        setPageSize(newPageSize);
        // fetch payouts for new page (pageIndex is 0-based, API expects 1-based)
        fetchPayouts(newPageIndex + 1, newPageSize);
    };

    useEffect(() => {
        fetchProjects();
        fetchPayouts();
    }, []);

    useEffect(() => {
        fetchPayouts();
    }, [projectFilter, searchTerm, pageIndex, pageSize]);


    useEffect(() => {
        // fetch payouts when pageIndex or pageSize changes (but not on filter/search change)
        if (user) {
            fetchPayouts(pageIndex + 1, pageSize);
        }
    }, [pageIndex, pageSize]);

    // -----------------------------
    // Table Columns
    // -----------------------------
    const columns = useMemo(
        () => [
            {
                accessorKey: "projects.project_name",
                header: () => lang("projects.projectName", "Project Name"),
                cell: (info) => info.getValue() || "N/A",
            },
            {
                id: "investor",
                header: () => lang("payouts.investor_name", "Investor Name"),
                accessorFn: (row) => {
                    return row.users?.full_name || "N/A";
                },
            },
            {
                id: "invoices",
                header: () => lang("invoice.invoiceNumber", "Invoice Number"),
                accessorFn: (row) => {
                    const prefix = row.invoices?.invoice_prefix || "";
                    const number = row.invoices?.invoice_number || "";
                    return prefix && number ? `${prefix}-${number}` : "N/A";
                },
            },
            {
                accessorKey: "invoice_amount",
                header: () => lang("payouts.invoice_amount", "Amount"),
                cell: ({ getValue }) => priceWithCurrency(getValue()),
            },
            {
                accessorKey: "payout_amount",
                header: () => lang("payouts.payout_amount", "Amount"),
                cell: ({ getValue }) => priceWithCurrency(getValue()),
            },
            {
                accessorKey: "investor_percent",
                header: () => lang("payouts.investor_percentage", "Investor %"),
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined || value === "")
                        return "N/A";
                    return `${value}%`;
                },
            },
            {
                accessorKey: "actions",
                header: () => lang("invoice.actions"),
                cell: ({ row }) => (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
                        <Link
                            href={`/investor/payouts/view/${row.original.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <IconButton
                                size="small"
                                sx={{
                                    color: "#1976d2",
                                    transition: "transform 0.2s ease",
                                    "&:hover": {
                                        backgroundColor: "rgba(25, 118, 210, 0.08)",
                                        transform: "scale(1.1)",
                                    },
                                }}
                            >
                                <FiEye size={18} />
                            </IconButton>
                        </Link>
                        <IconButton
                            size="small"
                            onClick={() => downloadPayoutPDF(row.original.id, priceWithCurrency)}
                            sx={{
                                color: "#2e7d32",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                    backgroundColor: "rgba(46, 125, 50, 0.08)",
                                    transform: "scale(1.1)",
                                },
                            }}
                        >
                            <FiDownload size={18} />
                        </IconButton>
                    </Stack>
                ),
                meta: {
                    disableSort: true,
                },
            },
        ]
        , [lang]);

    return (
        <>
            <div className="p-6 bg-white rounded-3xl shadow-md">
                <div className="d-flex items-center justify-content-between gap-2 mb-4 mt-4 w-full flex-wrap">
                    <div style={{ display: "flex", gap: "2%" }}>
                        <Autocomplete
                            size="small"
                            options={projectList}
                            value={
                                projectList.find(
                                    (p) => (p.id ?? p.project_id) === projectFilter
                                ) || null
                            }
                            onChange={(e, newValue) => {
                                setPageIndex(0);
                                setProjectFilter(newValue ? (newValue.id ?? newValue.project_id) : "");
                            }}
                            getOptionLabel={(option) =>
                                option.project_name ||
                                option.projectName ||
                                `Project ${option.id ?? option.project_id ?? ""}`
                            }
                            isOptionEqualToValue={(option, value) =>
                                (option.id ?? option.project_id) === (value.id ?? value.project_id)
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={lang("reports.allprojects")}
                                    placeholder="Search project..."
                                />
                            )}
                            sx={{ minWidth: 260 }}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto relative">
                    {/* {!hasLoadedOnce && loading && (
                        <div className="text-center py-6 text-gray-600">Loading...</div>
                    )} */}

                    {/* {error && <div className="text-red-600">Error: {error}</div>} */}
                    <>
                        {/* Keep the table mounted so search input state is retained */}
                        <Table
                            data={payouts}
                            columns={columns}
                            disablePagination={false}
                            onSearchChange={handleSearchChange}
                            onPaginationChange={handlePaginationChange}
                            pageIndex={pageIndex}
                            pageSize={pageSize}
                            serverSideTotal={pagination.totalCount}
                            initialPageSize={PAGE_SIZE}
                        />
                    </>
                </div>
            </div>
        </>
    );
};

export default PayoutsPage;
