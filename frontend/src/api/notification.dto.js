// src/api/notification.dto.js
// Display helpers that turn a raw notification (from the API) into
// something the bell can render.

const ICON_BY_TYPE = {
    TASK_ASSIGNED: '✅',
    PROJECT_CREATED: '📁',
    MEMBER_REGISTERED: '👋',
    REMINDER: '⏰',
};

export const notificationIcon = (type) => ICON_BY_TYPE[type] || '🔔';

export const relativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};
