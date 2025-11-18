"use client";

import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';

const Notification = () => {
    // Sample notification data
    const notifications = [
        { id: 1, type: 'info', message: 'We’re pleased to inform you that a new customer has registered! Please follow up promptly by contacting.', time: 'Just Now', favorite: true },
        { id: 2, type: 'offer', message: 'Hello Sales Marketing Team, We have a special offer for our customers! Enjoy a 20% discount on selected.', time: '30 min ago', favorite: false },
        { id: 3, type: 'reminder', message: 'This is a reminder to achieve this month’s sales target. Currently, we’ve...', time: '2 days ago', favorite: false },
        { id: 4, type: 'product', message: 'We’ve received a product information request from a potential customer.', time: '5 days ago', favorite: false },
        { id: 5, type: 'product', message: 'We’ve received a product information request from a potential customer.', time: '07 Feb, 2024', favorite: true },
        { id: 6, type: 'meeting', message: 'A meeting or presentation has been scheduled with a customer/prospect.', time: '01 Feb, 2024', favorite: false },
        { id: 7, type: 'reminder', message: 'This is a reminder to review the contract or proposal currently under...', time: '28 Jan, 2024', favorite: false },
        { id: 8, type: 'followup', message: 'It’s time for a follow-up with a customer after their recent purchase/meeting.', time: '27 Jan, 2024', favorite: false },
        { id: 9, type: 'testimonial', message: 'We’ve received positive feedback/testimonial from a satisfied customer.', time: '26 Jan, 2024', favorite: true },
        { id: 10, type: 'reminder', message: 'This is a reminder regarding an outstanding payment from a customer...', time: '28 Jan, 2024', favorite: false },
    ];

    // Simple icon mapping for types
    const typeIcons = {
        info: 'ℹ️',
        offer: '🎁',
        reminder: '⏰',
        product: '📦',
        meeting: '📅',
        followup: '🔄',
        testimonial: '⭐',
    };

    return (
        <div className="notification-container">
            <div className="notification-header">
                <h2 className="notification-title">List Notification</h2>
                <input type="text" placeholder="Search by Name/Product" className="notification-search" />
            </div>
            <div className="notification-count">188 Notification</div>
            <div className="notification-tabs">
                <span className="notification-tab-all">20 All</span>
                <span className="notification-tab-archive">10 Archive</span>
                <span className="notification-tab-favorite">17 Favorite</span>
            </div>
            <div className="notification-table-wrapper">
                <table className="notification-table">
                    <thead className="notification-thead">
                        <tr>
                            <th>Type</th>
                            <th>Message</th>
                            <th>Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notifications.map((note) => (
                            <tr key={note.id} className={`notification-row${note.favorite ? ' notification-row-favorite' : ''}`}>
                                <td className="notification-type">{typeIcons[note.type] || '🔔'}</td>
                                <td className="notification-message">{note.message}</td>
                                <td className="notification-time">{note.time}</td>
                                <td className="notification-delete"><span><DeleteForeverOutlinedIcon /></span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export default Notification;