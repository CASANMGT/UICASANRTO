/* Vehicle Module — helpers for vehicle list & drawer */
import { state } from './store.js';

export const getVehicleById = (id) => state.vehicles.find(v => v.id === id);

export const getVehicleTransactions = (vehicleId) =>
    state.transactions
        .filter(t => t.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

export const getRTOProgress = (vehicle) => {
    if (vehicle.programType !== 'RTO' || !vehicle.startDate || !vehicle.contractMonths) return null;
    const start = new Date(vehicle.startDate).getTime();
    const now = Date.now();
    const totalDays = vehicle.contractMonths * 30;
    const elapsedDays = Math.max(0, (now - start) / (24 * 60 * 60 * 1000));

    const paidPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
    const totalPrice = vehicle.buyoutPrice || 0;
    const paidRp = Math.round(totalPrice * paidPct / 100);
    const remainingRp = totalPrice - paidRp;
    const daysLeft = Math.max(0, Math.round(totalDays - elapsedDays));

    return {
        paidPct,
        paidRp,
        remainingRp,
        daysLeft,
        daysElapsed: Math.round(elapsedDays),
        totalDays,
        monthsElapsed: Math.round(elapsedDays / 30) // deprecated but kept for UI compatibility if needed
    };
};

export const immobilizeVehicle = (id, reason = 'Manual lock') => {
    const v = getVehicleById(id);
    if (!v) return;
    v.status = 'immobilized';
    v.credits = 0;
    v.immobilizeLog.push({ action: 'lock', timestamp: new Date().toISOString(), reason });
};

export const releaseVehicle = (id) => {
    const v = getVehicleById(id);
    if (!v) return;
    v.status = 'active';
    v.immobilizeLog.push({ action: 'unlock', timestamp: new Date().toISOString(), reason: 'Manual release' });
};

export const extendGrace = (id, days) => {
    const v = getVehicleById(id);
    if (!v) return;
    const current = v.graceExpiry ? new Date(v.graceExpiry) : new Date();
    current.setDate(current.getDate() + days);
    v.graceExpiry = current.toISOString();
};

// Get all vehicles with optional filter/sort
export const getAllVehicles = (filter = {}) => {
    let list = [...state.vehicles];

    // Search
    if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(v =>
            v.id.toLowerCase().includes(q) ||
            v.plate.toLowerCase().includes(q) ||
            (v.customer || '').toLowerCase().includes(q) ||
            (v.phone || '').includes(q)
        );
    }

    // Status filter
    if (filter.status && filter.status !== 'all') {
        if (filter.status === 'stnk_soon') {
            list = list.filter(v => {
                const alert = getSTNKAlert(v);
                return alert && (alert.type === 'expired' || alert.type === 'warning');
            });
        } else {
            list = list.filter(v => v.status === filter.status);
        }
    }

    // Program filter
    if (filter.program && filter.program !== 'all') {
        list = list.filter(v => v.programId === filter.program);
    }

    // Sort
    if (filter.sortBy) {
        const dir = filter.sortDir === 'desc' ? -1 : 1;
        list.sort((a, b) => {
            if (filter.sortBy === 'credits') return (a.credits - b.credits) * dir;
            if (filter.sortBy === 'customer') return ((a.customer || '').localeCompare(b.customer || '')) * dir;
            if (filter.sortBy === 'status') return a.status.localeCompare(b.status) * dir;
            if (filter.sortBy === 'id') return a.id.localeCompare(b.id) * dir;
            return 0;
        });
    }

    return list;
};

// Check if STNK is expiring soon (within 30 days)
export const getSTNKAlert = (vehicle) => {
    if (!vehicle.stnkExpiry) return null;
    const expiry = new Date(vehicle.stnkExpiry);
    const now = new Date();
    const diff = expiry - now;
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));

    if (days < 0) return { type: 'expired', days: Math.abs(days), label: 'EXPIRED' };
    if (days < 30) return { type: 'warning', days, label: `${days}d left` };
    return null;
};

export const getVehicleSTNKStats = () => {
    return state.vehicles.filter(v => {
        const alert = getSTNKAlert(v);
        return alert && (alert.type === 'expired' || alert.type === 'warning');
    }).length;
};
