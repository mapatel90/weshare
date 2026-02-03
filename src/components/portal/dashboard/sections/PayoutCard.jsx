import React, { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PAYOUT_STATUS } from '@/constants/payout_status';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePriceWithCurrency } from '@/hooks/usePriceWithCurrency';

export default function PayoutCard() {
    const { user } = useAuth();
    const { lang } = useLanguage();
    const priceWithCurrency = usePriceWithCurrency();
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPayouts = async () => {
            if (!user?.id) return;
            setLoading(true);
            setError(null);
            try {
                const res = await apiGet(
                    `/api/payouts?investorId=${user.id}&page=1&pageSize=5`
                );
                if (res?.success && Array.isArray(res.data)) {
                    setPayouts(res.data);
                } else {
                    setPayouts([]);
                }
            } catch (err) {
                console.error('Failed to load payouts:', err);
                setError(err?.message || 'Failed to load payouts');
                setPayouts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPayouts();
    }, [user?.id]);

    const formatStatus = (status) => {
        if (status === PAYOUT_STATUS.PAYOUT) return 'Completed';
        if (status === PAYOUT_STATUS.PENDING) return 'Pending';
        return status || '-';
    };

    const getStatusClass = (status) => {
        if (status === PAYOUT_STATUS.PAYOUT) {
            return 'bg-green-100 text-green-700';
        }
        if (status === PAYOUT_STATUS.PENDING) {
            return 'bg-yellow-100 text-yellow-700';
        }
        return 'bg-gray-100 text-gray-700';
    };

    const formatAmount = (amount) => {
        if (amount == null) return '-';
        const num = Number(amount);
        if (Number.isNaN(num)) return '-';
        return `$${num.toFixed(2)}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (Number.isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString();
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="billing-card">
            <div className="card-header">
                <div className="card-title">{lang("payouts.payouts", "Payouts")}</div>
            </div>

            {loading && (
                <div className="py-4 text-center text-gray-600 text-sm">
                    Loading payouts...
                </div>
            )}

            {error && !loading && (
                <div className="py-4 text-center text-red-600 text-sm">
                    {error}
                </div>
            )}

            {!loading && !error && payouts.length === 0 && (
                <div className="py-4 text-center text-gray-500 text-sm">
                    No payouts found yet.
                </div>
            )}

            {payouts?.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th className="border-b text-uppercase">{lang("payouts.payout", "Payout")}</th>
                            <th className="border-b text-uppercase">{lang("projects.projectName", "Project Name")}</th>
                            <th className="border-b text-uppercase">{lang("payouts.amount", "Amount")}</th>
                            <th className="border-b text-uppercase">{lang("payouts.date", "Date")}</th>
                            <th className="border-b text-uppercase">{lang("payouts.status", "Status")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payouts?.map((payout, idx) => {
                            const payoutCode = `${payout.payout_prefix ?? 'PYT'}-${payout.payout_number ?? payout.id}`;
                            const projectName = payout.projects?.project_name || payout.invoices?.projects?.project_name || '-';
                            const status = payout.status;

                            return (
                                <tr
                                    key={payout.id}
                                    className={idx % 2 ? 'bg-white' : 'bg-gray-50'}
                                >
                                    <td className="py-2 px-4 border-b text-sm">
                                        <Link href={`/investor/payouts/view/${payout.id}`} target="_blank" rel="noopener noreferrer">
                                            {payoutCode}
                                        </Link>
                                    </td>
                                    <td className="py-2 px-4 border-b text-sm">
                                        {projectName || '-'}
                                    </td>
                                    <td className="py-2 px-4 border-b text-sm">
                                        {payout.payout_amount ? priceWithCurrency(payout.payout_amount) : '-'}
                                    </td>
                                    <td className="py-2 px-4 border-b text-sm">
                                        {payout.payout_date ? new Date(payout.payout_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="py-2 px-4 border-b text-sm">
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusClass(status)}`}>
                                            {status ? lang("common.status", "Status") : '-'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}