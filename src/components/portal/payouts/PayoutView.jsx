
"use client";
import React, { useState } from 'react';

const mockPayouts = [
    {
        id: 'P001',
        user: 'John Doe',
        amount: 111.05,
        date: '2025-11-01',
        status: 'Completed',
    },
    {
        id: 'P002',
        user: 'Jane Smith',
        amount: 320.50,
        date: '2025-11-10',
        status: 'Pending',
    },
    {
        id: 'P003',
        user: 'Amit Patel',
        amount: 29.5,
        date: '2025-11-15',
        status: 'Completed',
    },
];

const PayoutView = () => {
    const [dropdownOpen, setDropdownOpen] = useState(null);
    return (
        <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-end md:justify-end mb-4 gap-2">
                {/* Project Dropdown Filter */}
                {/* <select
                    className="theme-btn-blue-color border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    // value={projectFilter}
                    // onChange={e => setProjectFilter(e.target.value)}
                >
                    <option value="">All Projects</option>
                    </select> */}
                {/* {[...new Set(mockPayouts.map(payout => payout.user))].map((user) => (
                        <option key={user} value={user}>{user}</option>
                    ))} */}
                <div className="flex items-end gap-2">
                    <input
                        type="text"
                        placeholder="Search Name..."
                        // value={search}
                        // onChange={e => setSearch(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button className="theme-btn-blue-color px-4 py-2 rounded-md text-gray-700 border hover:bg-gray-200">Filter</button>
                </div>
            </div>
            <div className="overflow border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-2 px-4 border-b text-uppercase">Invoice ID</th>
                            <th className="py-2 px-4 border-b text-uppercase">User</th>
                            <th className="py-2 px-4 border-b text-uppercase">Amount</th>
                            <th className="py-2 px-4 border-b text-uppercase">Date</th>
                            <th className="py-2 px-4 border-b text-uppercase">Status</th>
                            <th className="py-2 px-4 border-b text-uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockPayouts.map((payout, idx) => (
                            <tr key={payout.id} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                                <td className="py-2 px-4 border-b">{payout.id}</td>
                                <td className="py-2 px-4 border-b">{payout.user}</td>
                                <td className="py-2 px-4 border-b">${payout.amount}</td>
                                <td className="py-2 px-4 border-b">{payout.date}</td>
                                <td className="py-2 px-4 border-b">
                                    <span className={`px-2 py-1 rounded text-xs ${payout.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{payout.status}</span>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">
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
                                                        onClick={() => { handleDownload(payment.number); setDropdownOpen(null); }}
                                                    >
                                                        Download
                                                    </button>
                                                    {/* <button
                                                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                                            onClick={() => { handleView(payment.number); setDropdownOpen(null); }}
                                                        >
                                                            View
                                                        </button> */}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">1 - {mockPayouts.length} of {mockPayouts.length} entries</div>
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

export default PayoutView;
