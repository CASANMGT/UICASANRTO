/* Users Module — helpers for user list & profile drawer */
import { state } from './store.js';

export const getUserById = (id) => state.users.find(u => u.userId === id);

export const getUserVehicles = (userId) =>
    state.vehicles.filter(v => v.userId === userId);

export const getUserTransactions = (userId) => {
    const vehicleIds = getUserVehicles(userId).map(v => v.id);
    return state.transactions
        .filter(t => vehicleIds.includes(t.vehicleId))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getRiskLabel = (score) =>
    score >= 75 ? 'Low' : score >= 45 ? 'Medium' : 'High';

export const getRiskColor = (label) => {
    if (label === 'Low') return '#22C55E';
    if (label === 'Medium') return '#F59E0B';
    return '#EF4444';
};

const OCC_EMOJI = {
    ojol: '🛵', msme: '🏪', private_employee: '👔', civil_servant: '🏛️',
    freelancer: '🔧', logistics: '🚛', student: '🎓', other: '❓'
};
export const getOccupationEmoji = (occ) => OCC_EMOJI[occ] || '❓';

export const getUsers = (filter = {}) => {
    let list = [...state.users];

    // Search
    if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(u =>
            u.name.toLowerCase().includes(q) ||
            u.phone.includes(q) ||
            u.nik.includes(q) ||
            u.userId.toLowerCase().includes(q)
        );
    }

    // Risk filter
    if (filter.risk && filter.risk !== 'all') {
        list = list.filter(u => u.riskLabel === filter.risk);
    }

    // Program filter
    if (filter.program && filter.program !== 'all') {
        list = list.filter(u => {
            const userVehicles = getUserVehicles(u.userId);
            return userVehicles.some(v => v.programId === filter.program);
        });
    }

    // Sort
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
};
