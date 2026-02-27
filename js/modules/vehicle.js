/* Vehicle Module — helpers for vehicle list & drawer */

function getVehicleById(id) { return state.vehicles.find(v => v.id === id); }

function getVehicleTransactions(vehicleId) {
    return state.transactions
        .filter(t => t.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
}

function getRTOProgress(vehicle) {
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
        monthsLeft: Math.round(daysLeft / 30),
        daysElapsed: Math.round(elapsedDays),
        totalDays,
        monthsElapsed: Math.round(elapsedDays / 30),
        percent: Math.min(100, Math.round((elapsedDays / totalDays) * 100)) // alias for store.js
    };
}

function immobilizeVehicle(id, reason = 'Manual lock') {
    const v = getVehicleById(id);
    if (!v) return;
    v.status = 'immobilized';
    v.credits = 0;
    v.immobilizeLog.push({ action: 'lock', timestamp: new Date().toISOString(), reason });
}

function releaseVehicle(id) {
    const v = getVehicleById(id);
    if (!v) return;
    v.status = 'active';
    v.immobilizeLog.push({ action: 'unlock', timestamp: new Date().toISOString(), reason: 'Manual release' });
}

function extendGrace(id, days) {
    const v = getVehicleById(id);
    if (!v) return;
    const current = v.graceExpiry ? new Date(v.graceExpiry) : new Date();
    current.setDate(current.getDate() + days);
    v.graceExpiry = current.toISOString();
}

function getAllVehicles(filter = {}) {
    let list = [...state.vehicles];

    if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(v =>
            v.id.toLowerCase().includes(q) ||
            v.plate.toLowerCase().includes(q) ||
            (v.customer || '').toLowerCase().includes(q) ||
            (v.phone || '').includes(q)
        );
    }

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

    if (filter.program && filter.program !== 'all') {
        list = list.filter(v => v.programId === filter.program);
    }

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
}

function getSTNKAlert(vehicle) {
    if (!vehicle.stnkExpiry) return null;
    const expiry = new Date(vehicle.stnkExpiry);
    const now = new Date();
    const diff = expiry - now;
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));

    if (days < 0) return { type: 'expired', days: Math.abs(days), label: 'EXPIRED' };
    if (days < 30) return { type: 'warning', days, label: `${days}d left` };
    return null;
}

function getVehicleSTNKStats() {
    return state.vehicles.filter(v => {
        const alert = getSTNKAlert(v);
        return alert && (alert.type === 'expired' || alert.type === 'warning');
    }).length;
}

// ─── GLOBAL EXPOSURE ──────────────────────────────────────────────────────────
window.getVehicleById = getVehicleById;
window.getVehicleTransactions = getVehicleTransactions;
window.getRTOProgress = getRTOProgress;
window.immobilizeVehicle = immobilizeVehicle;
window.releaseVehicle = releaseVehicle;
window.extendGrace = extendGrace;
window.getAllVehicles = getAllVehicles;
window.getSTNKAlert = getSTNKAlert;
window.getVehicleSTNKStats = getVehicleSTNKStats;
