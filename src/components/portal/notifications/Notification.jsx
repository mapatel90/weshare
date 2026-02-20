"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import { apiDelete, apiGet } from '@/lib/api';
import { confirmDelete, showDeleteError } from '@/utils/confirmDelete';
import { useLanguage } from '@/contexts/LanguageContext';

const Notification = () => {
    const PAGE_SIZE = 10;
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const { lang } = useLanguage();

    const typeIcons = {
        Invoice: '🧾',
        Payment: '💳',
        contract: '📄',
        projects: '📁',
        reminder: '⏰',
        offer: '🎁',
        meeting: '📅',
        followup: '🔄',
        testimonial: '⭐',
        default: '🔔',
    };

    const unreadCount = useMemo(
        () => notifications.filter((n) => n.is_read === 0).length,
        [notifications]
    );

    const totalCount = pagination?.total ?? notifications.length;

    const formatTime = (dateString) => {
        const parsed = new Date(dateString);
        if (Number.isNaN(parsed.getTime())) return 'N/A';

        const now = new Date();
        const diffMs = now - parsed;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return parsed.toLocaleDateString();
    };

    const fetchNotifications = async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(PAGE_SIZE),
                sortBy: sortBy,
                sortOrder: sortOrder,
            });

            if (searchTerm && searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }

            const response = await apiGet(`/api/notifications?${params.toString()}`, {
                includeAuth: true,
                showLoader: false,
            });

            if (response.success) {
                setNotifications(response.data.notifications || []);
                setPagination(response.data.pagination || null);
                setCurrentPage(page);
            } else {
                setError(response.message || 'Failed to load notifications');
            }
        } catch (err) {
            setError(err.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (notificationId) => {
        const confirmed = await confirmDelete(
            'Delete notification?',
            'This action cannot be undone.',
            'Yes, delete',
            'notification'
        );

        if (!confirmed) return;

        try {
            await apiDelete(`/api/notifications/${notificationId}`, {
                includeAuth: true,
                showLoader: false,
            });
            setNotifications((prev) => prev.filter((note) => note.id !== notificationId));
        } catch (err) {
            setError(err.message || 'Failed to delete notification');
            showDeleteError('Delete failed', 'Unable to delete this notification.');
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        fetchNotifications(1);
    }, [searchTerm, sortBy, sortOrder]);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const getSortIndicator = (column) => {
        if (sortBy !== column) return '↕';
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="notification-count" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <strong>{totalCount}</strong> {lang("notification.title")}{totalCount === 1 ? '' : 's'}
                    {unreadCount > 0 && <span style={{ marginLeft: 8, color: '#d97706' }}>({unreadCount} {lang("common.unread")})</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder={lang("common.search", "Search notifications...")}
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                        style={{ minWidth: '250px' }}
                    />
                    <button
                        type="button"
                        onClick={() => fetchNotifications(currentPage)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        {lang("common.refresh")}
                    </button>
                </div>
            </div>
            {error && (
                <div className="mt-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th 
                                onClick={() => handleSort('title')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                className="hover:bg-gray-100"
                            >
                                {lang("leaseRequest.messageTable")} {getSortIndicator('title')}
                            </th>
                            <th 
                                onClick={() => handleSort('created_at')}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                className="hover:bg-gray-100"
                            >
                                {lang("common.time")} {getSortIndicator('created_at')}
                            </th>
                            <th>{lang("common.action")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="text-center py-6">Loading notifications...</td>
                            </tr>
                        ) : notifications.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-6">{lang("notification.noNotifications")}</td>
                            </tr>
                        ) : (
                            notifications.map((note, idx) => (
                                <tr key={note.id} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                                    <td className="notification-message">
                                        {note.action_url ? (
                                            <Link href={note.action_url} className="block hover:text-blue-600">
                                                <div className="font-medium">{note.title || 'Notification'}</div>
                                                {note.message && <div className="text-gray-600 text-xs mt-1">{note.message}</div>}
                                            </Link>
                                        ) : (
                                            <>
                                                <div className="font-medium">{note.title || 'Notification'}</div>
                                                {note.message && <div className="text-gray-600 text-xs mt-1">{note.message}</div>}
                                            </>
                                        )}
                                    </td>
                                    <td className="notification-time whitespace-nowrap">{formatTime(note.created_at)}</td>
                                    <td className="notification-delete text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(note.id)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Delete notification"
                                        >
                                            <DeleteForeverOutlinedIcon fontSize="small" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
                <div>
                    {pagination?.total !== undefined ? (
                        <span>
                            {lang("home.exchangeHub.showing")} {pagination.total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
                            {Math.min(currentPage * PAGE_SIZE, pagination.total || 0)} of {pagination.total || 0}
                        </span>
                    ) : (
                        <span>{lang("home.exchangeHub.showing")}: {notifications.length}</span>
                    )}
                </div>
                <div className="space-x-2">
                    <button
                        type="button"
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => fetchNotifications(Math.max(1, currentPage - 1))}
                        disabled={loading || currentPage <= 1}
                    >
                        {lang("common.previous")}
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => fetchNotifications((pagination?.totalPages || currentPage) > currentPage ? currentPage + 1 : currentPage)}
                        disabled={loading || (pagination?.totalPages ? currentPage >= pagination.totalPages : false)}
                    >
                        {lang("common.next")}
                    </button>
                </div>
            </div>
        </div>
    );
}


export default Notification;