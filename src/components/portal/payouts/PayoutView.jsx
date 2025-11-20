
import React from 'react';

const mockPayouts = [
    {
        id: 'P001',
        user: 'John Doe',
        amount: 5000,
        date: '2025-11-01',
        status: 'Completed',
    },
    {
        id: 'P002',
        user: 'Jane Smith',
        amount: 3200,
        date: '2025-11-10',
        status: 'Pending',
    },
    {
        id: 'P003',
        user: 'Amit Patel',
        amount: 4500,
        date: '2025-11-15',
        status: 'Completed',
    },
];

const PayoutView = () => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
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
            <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="py-2 px-4 border-b">Payout ID</th>
                        <th className="py-2 px-4 border-b">User</th>
                        <th className="py-2 px-4 border-b">Amount</th>
                        <th className="py-2 px-4 border-b">Date</th>
                        <th className="py-2 px-4 border-b">Status</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {mockPayouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b">{payout.id}</td>
                            <td className="py-2 px-4 border-b">{payout.user}</td>
                            <td className="py-2 px-4 border-b">₹{payout.amount}</td>
                            <td className="py-2 px-4 border-b">{payout.date}</td>
                            <td className="py-2 px-4 border-b">
                                <span className={`px-2 py-1 rounded text-xs ${payout.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{payout.status}</span>
                            </td>
                            <td className="py-2 px-4 border-b">
                                <button className="text-blue-600 hover:underline mr-2">View</button>
                                <button className="text-gray-600 hover:underline">Download</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PayoutView;
