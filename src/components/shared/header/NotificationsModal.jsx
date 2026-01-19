import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, Badge, Box, Typography, Divider, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPatch } from '@/lib/api';

const NotificationsModal = () => {
    const { user } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const open = Boolean(anchorEl);

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await apiGet('/api/notifications/unread-count', {
                showLoader: false,
                includeAuth: true
            });
            if (response.success) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Fetch notifications when dropdown opens
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await apiGet('/api/notifications?limit=10', {
                showLoader: false,
                includeAuth: true
            });
            if (response.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await apiPatch(`/api/notifications/${notificationId}/read`, {}, {
                showLoader: false,
                includeAuth: true
            });
            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, is_read: 1 } : notif
                )
            );
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await apiPatch('/api/notifications/mark-all-read', {}, {
                showLoader: false,
                includeAuth: true
            });
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, is_read: 1 }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Handle bell icon click
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications();
    };

    // Handle close
    const handleClose = () => {
        setAnchorEl(null);
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (notification.is_read === 0) {
            markAsRead(notification.id);
        }
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
        handleClose();
    };

    // Format time ago
    const formatTimeAgo = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifDate.toLocaleDateString();
    };

    // Fetch unread count on mount and periodically
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
            return () => clearInterval(interval);
        }
    }, [user]);

    return (
        <>
            <div
                className="profile-icon"
                onClick={handleClick}
                style={{ cursor: 'pointer', position: 'relative' }}
            >
                🔔
                {unreadCount > 0 && (
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        sx={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            '& .MuiBadge-badge': {
                                fontSize: '0.65rem',
                                height: 18,
                                minWidth: 18,
                                padding: '0 4px'
                            }
                        }}
                    />
                )}
            </div>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 380,
                        maxHeight: 500,
                        borderRadius: 2,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                        mt: 1
                    }
                }}
            >
                {/* Header */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Typography
                            onClick={markAllAsRead}
                            sx={{
                                fontSize: '0.85rem',
                                color: '#F6A623',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            Mark all read
                        </Typography>
                    )}
                </Box>
                <Divider />

                {/* Notifications List */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={30} />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            No notifications
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {notifications.map((notification) => (
                            <MenuItem
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    backgroundColor: notification.is_read === 0 ? 'rgba(246, 166, 35, 0.05)' : 'transparent',
                                    borderLeft: notification.is_read === 0 ? '3px solid #F6A623' : '3px solid transparent',
                                    '&:hover': {
                                        backgroundColor: 'rgba(246, 166, 35, 0.1)',
                                    },
                                    display: 'block',
                                    whiteSpace: 'normal',
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: notification.is_read === 0 ? 600 : 400,
                                            fontSize: '0.95rem',
                                            flex: 1,
                                        }}
                                    >
                                        {notification.title}
                                    </Typography>
                                    {notification.is_read === 0 && (
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                backgroundColor: '#F6A623',
                                                ml: 1,
                                                mt: 0.5,
                                            }}
                                        />
                                    )}
                                </Box>
                                {notification.message && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            fontSize: '0.85rem',
                                            mt: 0.5,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                        }}
                                    >
                                        {notification.message}
                                    </Typography>
                                )}
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}
                                >
                                    {formatTimeAgo(notification.created_at)}
                                </Typography>
                            </MenuItem>
                        ))}
                    </Box>
                )}

                {/* Footer */}
                {notifications.length > 0 && (
                    <>
                        <Divider />
                        <Box sx={{ p: 1.5, textAlign: 'center' }}>
                            <Typography
                                sx={{
                                    fontSize: '0.9rem',
                                    color: '#F6A623',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => {
                                    window.location.href = '/offtaker/notifications';
                                    handleClose();
                                }}
                            >
                                View all notifications
                            </Typography>
                        </Box>
                    </>
                )}
            </Menu>
        </>
    );
}

export default NotificationsModal;