"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const invoices = [
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
};

const Billings = () => {
    const [search, setSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [projectFilter, setProjectFilter] = useState("");
    const router = useRouter();
    const filteredInvoices = invoices.filter((inv) => {
        const matchesSearch = inv.name.toLowerCase().includes(search.toLowerCase());
        const matchesProject = projectFilter === "" || inv.name === projectFilter;
        return matchesSearch && matchesProject;
    });

    const handleDownload = (number) => {
        // Example: window.open(`/api/invoice/download/${number}`);
        // router.push("/offtaker/billings/invoice");
    };
    // No custom event listeners needed. Use backdrop for outside click.
    const handleView = (number) => {
        // View logic here
        router.push("/offtaker/billings/invoice");
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                {/* Project Dropdown Filter */}
                <select
                    className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={projectFilter}
                    onChange={e => setProjectFilter(e.target.value)}
                >
                    <option value="">All Projects</option>
                    {[...new Set(invoices.map(inv => inv.name))].map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search Name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button className="theme-btn-blue-color px-4 py-2 rounded-md text-gray-700 border hover:bg-gray-200">Filter</button>
                </div>
            </div>

            <div className="rounded-lg border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">PROJECT NAME</th>
                            <th className="px-4 py-3 text-left font-semibold">INVOICE NAME</th>
                            <th className="px-2 py-3 text-left font-semibold">INVOICE DATE</th>
                            <th className="px-2 py-3 text-left font-semibold">DUE DATE</th>
                            <th className="px-2 py-3 text-left font-semibold">AMOUNT</th>
                            <th className="px-2 py-3 text-left font-semibold">STATUS</th>
                            <th className="px-2 py-3 text-left font-semibold">DOWNLOAD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map((inv, idx) => (
                            <tr key={inv.number} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-4 py-2 font-medium whitespace-nowrap">{inv.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap">INV - 2025{inv.number}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{inv.invoiceDate}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{inv.dueDate}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{inv.amount}</td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[inv.status]}`}>{inv.status}</span>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                    {inv.download ? (
                                        <div className="relative inline-block text-left">
                                            <button
                                                className="bg-transparent border-none cursor-pointer px-2 py-1 dropdown-action-btn"
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
                                                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-20 dropdown-action-menu">
                                                        <button
                                                            className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100"
                                                            onClick={() => { handleDownload(inv.number); setDropdownOpen(null); }}
                                                        >
                                                            Download
                                                        </button>
                                                        <button
                                                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                                            onClick={() => { handleView(inv.number); setDropdownOpen(null); }}
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
                    <button className="w-8 h-8 rounded bg-blue-600 text-white font-bold">1</button>
                    <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">2</button>
                    <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">3</button>
                    <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">4</button>
                    <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">5</button>
                </div>
            </div>
        </div>
    );
};

export default Billings;