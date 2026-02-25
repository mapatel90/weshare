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
        <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md">
            <div className="notification-count flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                    <strong>{totalCount}</strong> {lang("notification.title")}{totalCount === 1 ? '' : 's'}
                    {unreadCount > 0 && (
                        <span className="ml-2 text-sm text-amber-600">
                            ({unreadCount} {lang("common.unread")})
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-2 xs:flex-row xs:items-center">
                    <input
                        type="text"
                        placeholder={lang("common.search", "Search notifications...")}
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full xs:w-64 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                        type="button"
                        onClick={() => fetchNotifications(currentPage)}
                        className="self-start text-sm text-blue-600 hover:text-blue-800"
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

            {loading && (
                <div className="py-6 text-center text-sm text-gray-500">
                    Loading notifications...
                </div>
            )}

            {!loading && notifications.length === 0 && (
                <div className="py-6 text-center text-sm text-gray-500">
                    {lang("notification.noNotifications")}
                </div>
            )}

            {!loading && notifications.length > 0 && (
                <>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        onClick={() => handleSort('title')}
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                        className="px-4 py-2 text-left hover:bg-gray-100"
                                    >
                                        {lang("leaseRequest.messageTable")} {getSortIndicator('title')}
                                    </th>
                                    <th
                                        onClick={() => handleSort('created_at')}
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                        className="px-4 py-2 text-left hover:bg-gray-100 whitespace-nowrap"
                                    >
                                        {lang("common.time")} {getSortIndicator('created_at')}
                                    </th>
                                    <th className="px-4 py-2 text-center">{lang("common.action")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map((note, idx) => (
                                    <tr key={note.id} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                                        <td className="notification-message px-4 py-3">
                                            {note.action_url ? (
                                                <Link href={note.action_url} className="block hover:text-blue-600">
                                                    <div className="font-medium">{note.title || 'Notification'}</div>
                                                    {note.message && (
                                                        <div className="text-gray-600 text-xs mt-1">
                                                            {note.message}
                                                        </div>
                                                    )}
                                                </Link>
                                            ) : (
                                                <>
                                                    <div className="font-medium">{note.title || 'Notification'}</div>
                                                    {note.message && (
                                                        <div className="text-gray-600 text-xs mt-1">
                                                            {note.message}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        <td className="notification-time px-4 py-3 whitespace-nowrap">
                                            {formatTime(note.created_at)}
                                        </td>
                                        <td className="notification-delete px-4 py-3 text-center">
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
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {notifications.map((note) => (
                            <div
                                key={note.id}
                                className="flex flex-col gap-2 rounded-lg border bg-white p-3 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">
                                            {note.title || 'Notification'}
                                        </div>
                                        {note.message && (
                                            <div className="mt-1 text-xs text-gray-600">
                                                {note.message}
                                            </div>
                                        )}
                                        {note.action_url && (
                                            <Link
                                                href={note.action_url}
                                                className="mt-2 inline-flex text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                {lang("common.viewDetails", "View details")}
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[11px] text-gray-500">
                                            {formatTime(note.created_at)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(note.id)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Delete notification"
                                        >
                                            <DeleteForeverOutlinedIcon fontSize="small" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
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
                <div className="flex gap-2 sm:justify-end">
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