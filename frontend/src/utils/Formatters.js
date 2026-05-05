// src/utils/formatters.js

export const checkTaskUrgency = (dateString) => {
    if (!dateString) return { label: 'No Date', color: 'text-slate-500 bg-slate-800 border-slate-700' }; // Safety check

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Overdue', color: 'text-red-400 bg-red-400/10 border-red-400/20' };
    if (diffDays === 0) return { label: 'Due Today', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
    if (diffDays <= 2) return { label: `Due in ${diffDays} Days`, color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' };

    return { label: dueDate.toLocaleDateString(), color: 'text-slate-400 bg-slate-800 border-slate-700' };
};

export const getPriorityDot = (priority) => {
    if (priority === 3) return 'bg-red-500 shadow-red-500/50';
    if (priority === 2) return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
};