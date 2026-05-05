//Utils/StatusColor

export const getStatusLabel = (status) => {
        const map = {0: 'Planning', 1: 'Active', 2: 'Completed', 3: 'On Hold', 4: 'Failed'};
        return map[status] || 'Planning';
}

export const getStatusColor = (status) => {
    const map = {
        0: 'bg-gray-500/10 text-gray-400 border-gray-500/20',   // Planning
        1: 'bg-blue-500/10 text-blue-400 border-blue-500/20',       // Active
        2: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', // Completed
        3: 'bg-amber-500/10 text-amber-400 border-amber-500/20',    // On Hold
        4: 'bg-red-500/10 text-red-400 border-red-500/20'           // Failed
    };
    return map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'; // Default Gray
};