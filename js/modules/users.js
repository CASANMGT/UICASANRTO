/* Users Module — helpers for user list & profile drawer */

function getUserById(id) { return state.users.find(u => u.userId === id); }

function getUserVehicles(userId) {
    return state.vehicles.filter(v => v.userId === userId);
}

function getUserTransactions(userId) {
    const vehicleIds = getUserVehicles(userId).map(v => v.id);
    return state.transactions
        .filter(t => vehicleIds.includes(t.vehicleId))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getRiskLabel(score) {
    return score >= 75 ? 'Low' : score >= 45 ? 'Medium' : 'High';
}

function getRiskColor(label) {
    if (label === 'Low') return 'var(--c-success)';
    if (label === 'Medium') return 'var(--c-warning)';
    return 'var(--c-danger)';
}

const OCC_EMOJI = {
    ojol: '🛵', msme: '🏪', private_employee: '👔', civil_servant: '🏛️',
    freelancer: '🔧', logistics: '🚛', student: '🎓', other: '❓'
};
function getOccupationEmoji(occ) { return OCC_EMOJI[occ] || '❓'; }

function getUsers(filter = {}) {
    let list = [...state.users];

    if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(u =>
            u.name.toLowerCase().includes(q) ||
            u.phone.includes(q) ||
            u.nik.includes(q) ||
            u.userId.toLowerCase().includes(q)
        );
    }

    if (filter.risk && filter.risk !== 'all') {
        list = list.filter(u => u.riskLabel === filter.risk);
    }

    if (filter.program && filter.program !== 'all') {
        list = list.filter(u => {
            const userVehicles = getUserVehicles(u.userId);
            return userVehicles.some(v => v.programId === filter.program);
        });
    }

    const sortBy = filter.sortBy || 'joinDate';
    const sortDir = filter.sortDir || 'desc';
    const dir = sortDir === 'desc' ? -1 : 1;

    list.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
        if (sortBy === 'riskScore') return (a.riskScore - b.riskScore) * dir;
        if (sortBy === 'totalPaid') return (a.totalPaid - b.totalPaid) * dir;
        if (sortBy === 'missedPayments') return (a.missedPayments - b.missedPayments) * dir;
        if (sortBy === 'joinDate') return (new Date(a.joinDate) - new Date(b.joinDate)) * dir;
        return 0;
    });

    return list;
}

// ─── GLOBAL EXPOSURE ──────────────────────────────────────────────────────────
window.getUserById = getUserById;
window.getUserVehicles = getUserVehicles;
window.getUserTransactions = getUserTransactions;
window.getRiskLabel = getRiskLabel;
window.getRiskColor = getRiskColor;
window.getOccupationEmoji = getOccupationEmoji;
window.getUsers = getUsers;
