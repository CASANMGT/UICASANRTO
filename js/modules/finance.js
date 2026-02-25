/* Finance Module */

function getFinanceStats() {
    const txs = state.transactions.filter(t => t.status === 'paid');

    let filteredTxs = state.filter.partner === 'all'
        ? txs
        : txs.filter(t => t.partnerId === state.filter.partner);

    if (state.filter.program !== 'all') {
        filteredTxs = filteredTxs.filter(t => {
            const v = state.vehicles.find(veh => veh.id === t.vehicleId);
            return v && v.programId === state.filter.program;
        });
    }

    const totalRevenue = filteredTxs.reduce((sum, t) => sum + t.amount, 0);
    const partnerShare = filteredTxs.reduce((sum, t) => sum + (t.partnerShare || 0), 0);
    const casanShare = filteredTxs.reduce((sum, t) => sum + (t.casanShare || 0), 0);

    const relevantVehicles = state.vehicles.filter(v =>
        (state.filter.partner === 'all' || v.partnerId === state.filter.partner) &&
        (state.filter.program === 'all' || v.programId === state.filter.program) &&
        v.status === 'immobilized'
    );
    const outstanding = relevantVehicles.length * 500000;

    return {
        revenue: totalRevenue,
        partner: partnerShare,
        casan: casanShare,
        outstanding: outstanding,
        txCount: filteredTxs.length
    };
}

function getTransactions() {
    let txs = state.transactions;
    if (state.filter.partner !== 'all') {
        txs = txs.filter(t => t.partnerId === state.filter.partner);
    }
    if (state.filter.program !== 'all') {
        txs = txs.filter(t => {
            const v = state.vehicles.find(veh => veh.id === t.vehicleId);
            return v && v.programId === state.filter.program;
        });
    }
    return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getProgramStats() {
    const activePartner = state.filter.partner;
    const relevantPrograms = activePartner === 'all'
        ? state.programs
        : state.programs.filter(p => p.partnerId === activePartner);

    return relevantPrograms.map(p => {
        const vehs = state.vehicles.filter(v => v.programId === p.id);
        const active = vehs.filter(v => v.status === 'active').length;

        const progTxs = state.transactions.filter(t => {
            const v = state.vehicles.find(veh => veh.id === t.vehicleId);
            if (!v) return false;
            return v.programId === p.id && (t.status === 'paid' || !t.status);
        });

        const totalEarn = progTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        const partnerEarn = progTxs.reduce((sum, t) => sum + (t.partnerShare || 0), 0);
        const casanEarn = progTxs.reduce((sum, t) => sum + (t.casanShare || 0), 0);

        return {
            ...p,
            vehicleCount: vehs.length,
            activeCount: active,
            totalEarnings: totalEarn,
            partnerEarnings: partnerEarn,
            casanEarnings: casanEarn
        };
    });
}

// ─── GLOBAL EXPOSURE ──────────────────────────────────────────────────────────
window.getFinanceStats = getFinanceStats;
window.getTransactions = getTransactions;
window.getProgramStats = getProgramStats;
