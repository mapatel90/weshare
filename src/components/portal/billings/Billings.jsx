"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";

const fallbackInvoices = [
    { name: "DCL Solutions", number: 1, invoiceDate: "21 Jul 2022", dueDate: "07 Oct 2022", amount: "$31.80", status: "Unfunded", download: true },
    { name: "Google Cloud Hosting", number: 2, invoiceDate: "16 May 2023", dueDate: "25 Jan 2023", amount: "$5.69", status: "Unfunded", download: true },
    { name: "Anna Clarke - Employer", number: 3, invoiceDate: "10 Aug 2022", dueDate: "19 Apr 2023", amount: "$20.87", status: "Pending", download: true },
    { name: "Google Cloud Hosting", number: 4, invoiceDate: "24 Jul 2022", dueDate: "08 Oct 2022", amount: "$4.11", status: "Pending", download: true },
    { name: "AWS Service", number: 5, invoiceDate: "03 Jun 2023", dueDate: "17 Apr 2023", amount: "$44.53", status: "Pending", download: true },
    { name: "Delta Tech", number: 6, invoiceDate: "15 Jun 2023", dueDate: "04 Nov 2022", amount: "$7.22", status: "Paid", download: true },
    { name: "Anna Clarke - Employer", number: 7, invoiceDate: "11 Feb 2023", dueDate: "23 Feb 2023", amount: "$12.01", status: "Paid", download: true },
    { name: "Delta Tech", number: 8, invoiceDate: "26 Apr 2023", dueDate: "16 Sep 2022", amount: "$18.48", status: "Paid", download: true },
    { name: "Domain Registration", number: 9, invoiceDate: "14 Mar 2023", dueDate: "19 Jun 2023", amount: "$23.34", status: "Unfunded", download: true },
    { name: "Anna Clarke - Employer", number: 10, invoiceDate: "13 Feb 2023", dueDate: "19 Feb 2023", amount: "$32.14", status: "Unfunded", download: true }
];

const statusColors = {
    Paid: "bg-green-100 text-green-700",
    Unfunded: "bg-orange-100 text-orange-700",
    Pending: "bg-gray-200 text-gray-700",
    Draft: "bg-gray-200 text-gray-700",
    Unpaid: "bg-orange-100 text-orange-700",
    PaidNumeric: "bg-green-100 text-green-700",
};

const Billings = () => {
    const [search, setSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [projectFilter, setProjectFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [projectsError, setProjectsError] = useState("");
    const [invoices, setInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [invoicesError, setInvoicesError] = useState("");
    const { user } = useAuth();
    const router = useRouter();
    const priceWithCurrency = usePriceWithCurrency();

    const formatDate = (value) => {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toLocaleDateString("en-GB");
    };

    const formatCurrency = (value) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return value ?? "—";
        return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
    };

    const statusLabel = (value) => {
        if (typeof value === "string") return value;
        const map = {
            0: "Unpaid",
            1: "Paid",
        };
        return map[value] ?? "Pending";
    };

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user?.id) {
                setProjects([]);
                return;
            }

            setProjectsLoading(true);
            setProjectsError("");

            try {
                let apiUrl = "/api/projects?page=1&limit=100";
                if (user.role === 3) {
                    apiUrl += `&offtaker_id=${user.id}`;
                }

                const response = await apiGet(apiUrl, { includeAuth: true });

                if (response?.success && Array.isArray(response?.data)) {
                    const normalized = response.data
                        .map((project) => ({
                            id: project?.id ?? null,
                            name: project?.project_name || "Untitled Project",
                        }))
                        .filter((p) => p.name);

                    const uniqueByName = Array.from(
                        new Map(normalized.map((p) => [p.name, p])).values()
                    );
                    setProjects(uniqueByName);
                } else {
                    setProjects([]);
                }
            } catch (error) {
                console.error("Failed to fetch projects for billing dropdown", error);
                setProjects([]);
                setProjectsError("Unable to load projects.");
            } finally {
                setProjectsLoading(false);
            }
        };

        fetchProjects();
    }, [user?.id, user?.role]);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!user?.id) {
                setInvoices(fallbackInvoices);
                return;
            }

            setInvoicesLoading(true);
            setInvoicesError("");

            try {
                let apiUrl = "/api/invoice?page=1&limit=100";
                if (user.role === 3) {
                    apiUrl += `&offtaker_id=${user.id}`;
                }

                const response = await apiGet(apiUrl, { includeAuth: true });

                const list = response?.data?.invoices;

                if (response?.success && Array.isArray(list)) {
                    const normalized = list.map((inv, idx) => {
                        return {
                            id: inv?.id ?? idx,
                            projectName: inv?.projects?.project_name || "—",
                            invoiceName: inv?.invoice_number
                                ? `${inv?.invoice_prefix || ""}-${inv.invoice_number}`.trim()
                                : "—",
                            invoiceDate: formatDate(inv?.invoice_date),
                            dueDate: formatDate(inv?.due_date),
                            amount: inv?.total_amount ?? inv?.amount ?? 0,
                            status: statusLabel(inv?.status),
                            download: true,
                        };
                    });

                    setInvoices(normalized);
                } else {
                    setInvoices(fallbackInvoices);
                }
            } catch (error) {
                console.error("Failed to fetch invoices", error);
                setInvoices(fallbackInvoices);
                setInvoicesError("Unable to load invoices.");
            } finally {
                setInvoicesLoading(false);
            }
        };

        fetchInvoices();
    }, [user?.id, user?.role]);

    const dropdownProjects = useMemo(() => {
        if (projects.length) return projects;
        const fallback = [...new Set(invoices.map((inv) => inv.name))];
        return fallback.map((name) => ({ id: name, name }));
    }, [projects]);

    const filteredInvoices = invoices.filter((inv) => {
        const projectName = inv.projectName || "";
        const matchesSearch = projectName.toLowerCase().includes(search.toLowerCase())
            || (inv.invoiceName || "").toLowerCase().includes(search.toLowerCase());
        const matchesProject = projectFilter === "" || projectName === projectFilter;
        const matchesStatus = statusFilter === "" || inv.status === statusFilter;
        return matchesSearch && matchesProject && matchesStatus;
    });

    const handleDownload = (number) => {
        // Example: window.open(`/api/invoice/download/${number}`);
        // router.push("/offtaker/billings/invoice");
    };

    const handleView = (invoiceId) => {
        router.push(`/offtaker/billings/invoice/${invoiceId}`);
    };

    return (
        <div className="p-6 bg-white shadow-md rounded-xl">
            <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
                {/* Project Dropdown Filter */}
                <div className="flex flex-col gap-1">
                    <select
                        className="px-3 py-2 text-sm border rounded-md theme-btn-blue-color focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={projectFilter}
                        onChange={e => setProjectFilter(e.target.value)}
                        disabled={projectsLoading}
                    >
                        <option value="">All Projects</option>
                        {dropdownProjects.map((project) => (
                            <option key={project.id} value={project.name}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                    {projectsError && (
                        <p className="text-xs text-red-600">{projectsError}</p>
                    )}
                </div>

                <div className="relative">
                    
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search project or invoice..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <select
                        className="px-3 py-2 text-sm border rounded-md theme-btn-blue-color focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                    </select>
                </div>
            </div>

            <div className="border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-left">PROJECT NAME</th>
                            <th className="px-4 py-3 font-semibold text-left">INVOICE NAME</th>
                            <th className="px-2 py-3 font-semibold text-left">INVOICE DATE</th>
                            <th className="px-2 py-3 font-semibold text-left">DUE DATE</th>
                            <th className="px-2 py-3 font-semibold text-left">AMOUNT</th>
                            <th className="px-2 py-3 font-semibold text-left">STATUS</th>
                            <th className="px-2 py-3 font-semibold text-left">DOWNLOAD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map((inv, idx) => (
                            <tr key={inv.id} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-4 py-2 font-medium whitespace-nowrap">{inv.projectName}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <Link
                                        href={`/offtaker/billings/invoice/${inv.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
                                    >
                                        {inv.invoiceName}
                                    </Link>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">{inv.invoiceDate}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{inv.dueDate}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{priceWithCurrency(inv.amount)}</td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[inv.status]}`}>{inv.status}</span>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                    {inv.download ? (
                                        <div className="relative inline-block text-left">
                                            <button
                                                className="px-2 py-1 bg-transparent border-none cursor-pointer dropdown-action-btn"
                                                onClick={() => setDropdownOpen(idx)}
                                            >
                                                <span className="text-2xl">&#8942;</span>
                                            </button>
                                            {dropdownOpen === idx && (
                                                <>
                                                    {/* Backdrop for outside click */}
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        style={{ background: 'transparent' }}
                                                        onClick={() => setDropdownOpen(null)}
                                                    />
                                                    <div className="absolute right-0 z-20 w-32 mt-2 bg-white border rounded shadow-lg dropdown-action-menu">
                                                        <button
                                                            className="block w-full px-4 py-2 text-left text-blue-600 hover:bg-gray-100"
                                                            onClick={() => { handleDownload(inv.number); setDropdownOpen(null); }}
                                                        >
                                                            Download
                                                        </button>
                                                        <button
                                                            className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                                                            onClick={() => { handleView(inv.id); setDropdownOpen(null); }}
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Download</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">1 - {filteredInvoices.length} of {invoices.length} entries</div>
                <div className="flex gap-1">
                    <button className="w-8 h-8 font-bold text-white bg-blue-600 rounded">1</button>
                    <button className="w-8 h-8 text-gray-700 bg-gray-100 rounded">2</button>
                    <button className="w-8 h-8 text-gray-700 bg-gray-100 rounded">3</button>
                    <button className="w-8 h-8 text-gray-700 bg-gray-100 rounded">4</button>
                    <button className="w-8 h-8 text-gray-700 bg-gray-100 rounded">5</button>
                </div>
            </div>
        </div>
    );
};

export default Billings;