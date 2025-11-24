import React from 'react';

export default function PayoutCard() {

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

    return (
        <div className="billing-card">
            <div className="card-header">
                <div className="card-title"> Payouts</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th className="border-b text-uppercase">Invoice ID</th>
                        <th className="border-b text-uppercase">User</th>
                        <th className="border-b text-uppercase">Amount</th>
                        <th className="border-b text-uppercase">Date</th>
                        <th className="border-b text-uppercase">Status</th>
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
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// export default PayoutCard;