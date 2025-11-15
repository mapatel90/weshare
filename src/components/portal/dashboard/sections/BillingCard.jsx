import React from 'react';

function BillingCard() {

    return () => {
        <div className="billing-card">
            <div className="card-header">
                <div className="card-title">💳 Pending Billing & Payments</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>INVOICE</th>
                        <th>PERIOD</th>
                        <th>AMOUNT</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>INV-2024-005</td>
                        <td>January 2025</td>
                        <td>đ149.23K</td>
                        <td><span className="status-badge status-upcoming">Pending</span></td>
                        <td>...</td>
                    </tr>
                    <tr>
                        <td>INV-2024-004</td>
                        <td>December 2024</td>
                        <td>đ158.87K</td>
                        <td><span className="status-badge status-installation">Paid</span></td>
                        <td>...</td>
                    </tr>
                    <tr>
                        <td>INV-2024-003</td>
                        <td>November 2024</td>
                        <td>đ145.67K</td>
                        <td><span className="status-badge status-upcoming">Pending</span></td>
                        <td>...</td>
                    </tr>
                    <tr>
                        <td>INV-2024-002</td>
                        <td>October 2024</td>
                        <td>đ134.25K</td>
                        <td><span className="status-badge status-upcoming">Pending</span></td>
                        <td>...</td>
                    </tr>
                    <tr>
                        <td>INV-2024-001</td>
                        <td>September 2024</td>
                        <td>đ167.83K</td>
                        <td><span className="status-badge status-upcoming">Pending</span></td>
                        <td>...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    }
}

export default BillingCard;