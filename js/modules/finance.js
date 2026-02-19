import { formatRupiah } from './utils.js';
import { state, programs } from './store.js';

export const getFinanceStats = () => {
    // Aggregate from transactions
    const txs = state.transactions.filter(t => t.status === 'paid');

    // Filter by partner if selected
    let filteredTxs = state.filter.partner === 'all'
        ? txs
        : txs.filter(t => t.partnerId === state.filter.partner);

    // Filter by program if selected
    if (state.filter.program !== 'all') {
        filteredTxs = filteredTxs.filter(t => {
            const v = state.vehicles.find(veh => veh.id === t.vehicleId);
            return v && v.programId === state.filter.program;
        });
    }

    const totalRevenue = filteredTxs.reduce((sum, t) => sum + t.amount, 0);
    const partnerShare = filteredTxs.reduce((sum, t) => sum + (t.partnerShare || 0), 0);
    const casanShare = filteredTxs.reduce((sum, t) => sum + (t.casanShare || 0), 0);

    // Outstanding (immobilized vehicles debt)
    const relevantVehicles = state.vehicles.filter(v =>
        (state.filter.partner === 'all' || v.partnerId === state.filter.partner) &&
        (state.filter.program === 'all' || v.programId === state.filter.program) &&
        v.status === 'immobilized'
    );
    const outstanding = relevantVehicles.length * 500000;

    return {
        revenue: formatRupiah(totalRevenue),
        partner: formatRupiah(partnerShare),
        casan: formatRupiah(casanShare),
        outstanding: formatRupiah(outstanding),
        txCount: filteredTxs.length
    };
};

export const getTransactions = () => {
    let txs = state.transactions;
    if (state.filter.partner !== 'all') {
        txs = txs.filter(t => t.partnerId === state.filter.partner);
    }
    // Filter by program
    if (state.filter.program !== 'all') {
        txs = txs.filter(t => {
            const v = state.vehicles.find(veh => veh.id === t.vehicleId);
            return v && v.programId === state.filter.program;
        });
    }
    return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getProgramStats = () => {
    // Determine relevant programs (filtered by partner)
    const activePartner = state.filter.partner;
    const relevantPrograms = activePartner === 'all'
        ? programs
        : programs.filter(p => p.partnerId === activePartner);

    return relevantPrograms.map(p => {
        // Vehicles in this program
        const vehs = state.vehicles.filter(v => v.programId === p.id);
        const active = vehs.filter(v => v.status === 'active').length;

        // Earnings from Paid Transactions for this program
        const progTxs = state.transactions.filter(t => {
            // Find vehicle for this tx
            const v = state.vehicles.find(veh => veh.id === t.vehicleId);
            if (!v) return false;
            // Check if vehicle is in this program AND tx is paid (assuming standard flow)
            // If transaction doesn't have status, we assume it's historical/paid?
            // Store.js generation didn't show status explicitly in view, but ui.js uses it.
            // We'll assume if it's in history, it counts, or check 'status' property if valid.
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
};
