"use client";

import React, { useState } from "react";
import PaymentModal from "../billings/PaymentModal";
import { useRouter } from "next/navigation";


const statusColors = {
    Paid: "bg-green-100 text-green-700",
    Pending: "bg-gray-200 text-gray-700",
    Unfunded: "bg-orange-100 text-orange-700",
};

const Payments = () => {
    const [payments] = useState([
        {
            invoiceId: 'INV001',
            number: '1001',
            userName: 'John Doe',
            paymentDate: '2025-11-01',
            dueDate: '2025-11-10',
            updateDate: '2025-11-15',
            amount: '$100.00',
            status: 'Paid',
            download: true,
        },
        {
            invoiceId: 'INV002',
            number: '1002',
            userName: 'Jane Smith',
            paymentDate: '2025-11-05',
            dueDate: '2025-11-12',
            updateDate: '2025-11-16',
            amount: '$200.00',
            status: 'Pending',
            download: true,
        },
    ]);

    const [search, setSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const router = useRouter();

    const filteredPayments = payments.filter((p) =>
        p.userName.toLowerCase().includes(search.toLowerCase()) ||
        p.invoiceId.toLowerCase().includes(search.toLowerCase())
    );

    const handleDownload = (number) => {
        // Example: window.open(`/api/payment/download/${number}`);
        router.push("/portal/payments/invoice");
    };

    const handleView = (number) => {
        router.push("/portal/payments/invoice");
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-1">Payments</h2>
            <p className="text-gray-500 mb-6">List of payments. You can view and download them from here.</p>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search User or Invoice..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button className="bg-gray-100 px-4 py-2 rounded-md text-gray-700 border hover:bg-gray-200">Filter</button>
                </div>
                <button
                    className="theme-btn-org-color text-white px-4 py-2 rounded shadow hover:bg-orange-500"
                    onClick={() => setModalOpen(true)}
                >
                    Add Payment
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">INVOICE ID</th>
                            <th className="px-2 py-3 text-left font-semibold">NUMBER</th>
                            <th className="px-2 py-3 text-left font-semibold">USER NAME</th>
                            <th className="px-2 py-3 text-left font-semibold">PAYMENT DATE</th>
                            <th className="px-2 py-3 text-left font-semibold">DUE DATE</th>
                            <th className="px-2 py-3 text-left font-semibold">UPDATE DATE</th>
                            <th className="px-2 py-3 text-left font-semibold">AMOUNT</th>
                            <th className="px-2 py-3 text-left font-semibold">STATUS</th>
                            <th className="px-2 py-3 text-left font-semibold">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map((payment, idx) => (
                            <tr key={payment.number} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-4 py-2 font-medium whitespace-nowrap">{payment.invoiceId}</td>
                                <td className="px-2 py-2 whitespace-nowrap">INV - 2025{payment.number}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{payment.userName}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{payment.paymentDate}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{payment.dueDate}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{payment.updateDate}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{payment.amount}</td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[payment.status]}`}>{payment.status}</span>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                    {payment.download ? (
                                        <div className="relative inline-block text-left">
                                            <button
                                                className="bg-transparent border-none cursor-pointer px-2 py-1"
                                                onClick={() => setDropdownOpen(idx)}
                                            >
                                                <span className="text-2xl">&#8942;</span>
                                            </button>
                                            {dropdownOpen === idx && (
                                                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-10">
                                                    <button
                                                        className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100"
                                                        onClick={() => { handleDownload(payment.number); setDropdownOpen(null); }}
                                                    >
                                                        Download
                                                    </button>
                                                    <button
                                                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                                        onClick={() => { handleView(payment.number); setDropdownOpen(null); }}
                                                    >
                                                        View
                                                    </button>
                                                </div>
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
                <div className="text-sm text-gray-500">1 - {filteredPayments.length} of {payments.length} entries</div>
                <div className="flex gap-1">
                    <button className="w-8 h-8 rounded bg-blue-600 text-white font-bold">1</button>
                    <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">2</button>
                    <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">3</button>
                    <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">4</button>
                    <button className="w-8 h-8 rounded bg-gray-100 text-gray-700">5</button>
                </div>
            </div>

            <PaymentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
};

export default Payments;