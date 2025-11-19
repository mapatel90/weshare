import React from 'react';

export default function BillingCard() {

    return (
        <div className="billing-card">
            <div className="card-header">
                <div className="card-title">💳 Pending Billing</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Project Name</th>
                        <th>INVOICE</th>
                        <th>PERIOD</th>
                        <th>AMOUNT</th>
                        <th>STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Project A</td>
                        <td>INV-2024-005</td>
                        <td>January 2025</td>
                        <td>đ149.23K</td>
                        <td><span className="status-badge status-upcoming">Pending</span></td>
                    </tr>
                    <tr>
                        <td>Project B</td>
                        <td>INV-2024-004</td>
                        <td>December 2024</td>
                        <td>đ158.87K</td>
                        <td><span className="status-badge status-installation">Paid</span></td>
                    </tr>
                    <tr>
                        <td>Project C</td>
                        <td>INV-2024-003</td>
                        <td>November 2024</td>
                        <td>đ145.67K</td>
                        <td><span className="status-badge status-upcoming">Pending</span></td>                       
                    </tr>
                    <tr>
                        <td>Project D</td>
                        <td>INV-2024-002</td>
                        <td>October 2024</td>
                        <td>đ134.25K</td>
                        <td><span className="status-badge status-upcoming">Pending</span></td>
                    </tr>
                    <tr>
                        <td>Project E</td>
                        <td>INV-2024-001</td>
                        <td>September 2024</td>
                        <td>đ167.83K</td>
                        <td><span className="status-badge status-upcoming">Pending</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

// export default BillingCard;