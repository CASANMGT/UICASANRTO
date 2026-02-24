import { formatRupiah, timeAgo, getCountdown, downloadCSV } from './utils.js';
import { state, programs, partners, addProgram, updateProgram, deleteProgram } from './store.js';
import { getVehicleById, getVehicleTransactions, getRTOProgress, immobilizeVehicle, releaseVehicle, extendGrace, getAllVehicles, getSTNKAlert, getVehicleSTNKStats } from './vehicle.js';
import { getUserById, getUserVehicles, getUserTransactions, getRiskColor, getOccupationEmoji, getUsers } from './users.js';

// Elements (Dynamic getters to avoid nulls during module load)
const getEl = (id) => document.getElementById(id);

// State for UI
let expandedCardId = null;
let currentPage = 1;
let statusGuideExpanded = true;

// State for new lists
let vehicleListFilter = { partner: 'all', status: 'all', search: '', program: 'all', sortBy: 'id', sortDir: 'asc' };
let userListFilter = { partner: 'all', risk: 'all', search: '', program: 'all', sortBy: 'name', sortDir: 'asc' };
let vehicleListPage = 1;
let userListPage = 1;
let programListPage = 1;

let rtoListPage = 1;
window.rtoListFilter = {
    operator: 'all',
    brand: 'all',
    programName: 'all',
    model: 'all'
};

window.setRtoFilter = (key, val) => {
    window.rtoListFilter[key] = val;
    window.rtoListPage = 1;
    // Targeting the correct container for RTO Fleet
    if (document.getElementById('rto-fleetContent')) {
        renderProgramListView();
    }
};

// Drawer navigation history
let drawerStack = [];

window.changePage = (delta) => {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    // Dispatch event to trigger re-render
    window.dispatchEvent(new CustomEvent('page-change'));
};


export const resetPagination = () => {
    currentPage = 1;
    window.financePage = 1;
};

export const renderStats = (stats, tab = 'fleet') => {
    const elStatsBar = getEl('statsBar');
    if (!elStatsBar) return;

    // Hide global stats bar for RTO tabs because they have their own KPI row
    if (tab && (tab.startsWith('rto-') || tab === 'gps' || tab === 'programs')) {
        elStatsBar.style.display = 'none';
        return;
    } else {
        elStatsBar.style.display = 'flex';
    }

    let html = '';
    const format = (v) => typeof v === 'number' ? v.toLocaleString() : v;

    switch (tab) {
        case 'users':
            html = `
                <div class="card stat-card"><h3>Verified</h3><div class="value" style="color:var(--c-success)">${format(stats.verified)}</div></div>
                <div class="card stat-card"><h3>Active Riders</h3><div class="value" style="color:var(--ac)">${format(stats.activeRiders)}</div></div>
                <div class="card stat-card"><h3>High Risk</h3><div class="value" style="color:var(--c-danger)">${format(stats.highRisk)}</div></div>
                <div class="card stat-card"><h3>Avg Risk</h3><div class="value" style="color:var(--p)">${stats.avgRisk}</div></div>
                <div class="card stat-card"><h3>KYC Pending</h3><div class="value" style="color:var(--c-warning)">${format(stats.kycPending)}</div></div>
                <div class="card stat-card"><h3>New (30d)</h3><div class="value" style="color:var(--g)">${format(stats.newRiders)}</div></div>
            `;
            break;

        case 'programs':
            return;

        case 'finance':
            html = `
                <div class="card stat-card"><h3>Total Revenue</h3><div class="value" style="color:var(--p)">${formatShortCurrency(stats.revenue)}</div></div>
                <div class="card stat-card"><h3>Monthly (Feb)</h3><div class="value" style="color:var(--c-success)">${formatShortCurrency(stats.monthly)}</div></div>
                <div class="card stat-card"><h3>Arrears Bal.</h3><div class="value" style="color:var(--c-danger)">${formatShortCurrency(stats.arrears)}</div></div>
                <div class="card stat-card"><h3>Success Rate</h3><div class="value" style="color:var(--ac)">${stats.successRate}%</div></div>
                <div class="card stat-card"><h3>Daily Avg</h3><div class="value" style="color:var(--t2)">${formatShortCurrency(stats.dailyAvg)}</div></div>
                <div class="card stat-card"><h3>Pending Payout</h3><div class="value" style="color:var(--t3)">${formatShortCurrency(stats.pendingPayout)}</div></div>
            `;
            break;

        case 'vehicles':
            html = `
                <div class="card stat-card"><h3>Total Fleet</h3><div class="value">${format(stats.total)}</div></div>
                <div class="card stat-card"><h3>Operational</h3><div class="value" style="color:var(--c-success)">${format(stats.active)}</div></div>
                <div class="card stat-card"><h3>STNK < 30d</h3><div class="value" style="color:var(--c-warning)">${format(stats.stnkSoon)}</div></div>
                <div class="card stat-card"><h3>GPS Online %</h3><div class="value" style="color:var(--ac)">${stats.gpsOnline}%</div></div>
                <div class="card stat-card"><h3>In Service</h3><div class="value" style="color:var(--p)">${format(stats.inService)}</div></div>
                <div class="card stat-card"><h3>Idle Assets</h3><div class="value" style="color:var(--t3)">${format(stats.idleAssets)}</div></div>
            `;
            break;

        case 'gps':
            html = `
                <div class="card stat-card"><h3>Total Stock</h3><div class="value">${format(stats.total)}</div></div>
                <div class="card stat-card"><h3>Assigned</h3><div class="value" style="color:var(--ac)">${format(stats.assigned)}</div></div>
                <div class="card stat-card"><h3>Spares</h3><div class="value" style="color:var(--p)">${format(stats.spares)}</div></div>
                <div class="card stat-card"><h3>Warranty Warn</h3><div class="value" style="color:var(--c-danger)">${format(stats.warrantySoon)}</div></div>
                <div class="card stat-card"><h3>Offline Gear</h3><div class="value" style="color:var(--t3)">${format(stats.offlineGear)}</div></div>
                <div class="card stat-card"><h3>Update Req.</h3><div class="value" style="color:var(--c-warning)">${format(stats.updateReq)}</div></div>
            `;
            break;

        case 'fleet':
        default:
            html = `
                <div class="card stat-card"><h3>Total Fleet</h3><div class="value">${format(stats.total)}</div></div>
                <div class="card stat-card"><h3>Running</h3><div class="value" style="color:var(--c-success)">${format(stats.moving)}</div></div>
                <div class="card stat-card"><h3>Stopped</h3><div class="value" style="color:var(--ac)">${format(stats.parked)}</div></div>
                <div class="card stat-card"><h3>No Signal</h3><div class="value" style="color:var(--c-danger)">${format(stats.noSignal)}</div></div>
                <div class="card stat-card"><h3>Risk / Alerts</h3><div class="value" style="color:var(--d)">${format(stats.alerts)}</div></div>
                <div class="card stat-card"><h3>Idle Assets</h3><div class="value" style="color:var(--t3)">${format(stats.available)}</div></div>
            `;
            break;
    }

    elStatsBar.innerHTML = html;
};

export const renderProgramsTable = () => {
    const wrapper = getEl('programs-table-wrapper');
    if (!wrapper) return;

    // Calculate dynamic stats per program
    const programStats = state.programs.map(p => {
        const pVehicles = state.vehicles.filter(v => v.programId === p.id);
        const fleetSize = pVehicles.length;
        const activeUsers = pVehicles.filter(v => v.customer).length;

        // Detailed Status Breakdown
        const activeCount = pVehicles.filter(v => v.status === 'active').length;
        const graceCount = pVehicles.filter(v => v.status === 'grace').length;
        const immobilizedCount = pVehicles.filter(v => v.status === 'immobilized').length;

        // Collection Health: (Active / Total Users)
        const healthPct = activeUsers > 0 ? Math.round((activeCount / activeUsers) * 100) : 0;
        const healthColor = healthPct >= 80 ? 'var(--c-success)' : (healthPct >= 60 ? 'var(--c-warning)' : 'var(--c-danger)');

        // Fleet Maturity: Average RTO Progress
        let totalProgressPct = 0;
        let rtoVehicles = 0;
        pVehicles.forEach(v => {
            if (v.programType === 'RTO' && v.customer) {
                const prog = getRTOProgress(v);
                totalProgressPct += (prog?.paidPct || 0);
                rtoVehicles++;
            }
        });
        const maturityPct = rtoVehicles > 0 ? Math.round(totalProgressPct / rtoVehicles) : 0;
        const maturityColor = maturityPct > 75 ? 'var(--c-success)' : (maturityPct > 25 ? 'var(--ac)' : 'var(--c-warning)');

        return { ...p, fleetSize, activeUsers, activeCount, graceCount, immobilizedCount, healthPct, healthColor, maturityPct, maturityColor, isRTO: p.type === 'RTO' };
    });

    const rows = programStats.map(p => `
        <tr style="border-bottom:1px solid var(--b1); cursor:pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--s1)'" onmouseout="this.style.background=''" onclick="window.openProgramDetails('${p.id}')">
            <td style="padding:16px 12px; font-weight:700; color:var(--t1)">
                <div style="font-size:var(--text-base)">${p.name}</div>
                <div style="font-size:var(--text-xs); color:var(--t3); font-family:'IBM Plex Mono'; margin-top:4px">${p.id}</div>
            </td>
            <td style="padding:16px 12px;"><span class="badge" style="background:${p.partnerId === 'tangkas' ? '#A78BFA' : (p.partnerId === 'maka' ? '#60A5FA' : '#FB923C')}; color:#000; font-weight:800">${p.partnerId.toUpperCase()}</span></td>
            <td style="padding:16px 12px; font-family:'IBM Plex Mono'; font-size:var(--text-sm)">${formatRupiah(p.price)}/d</td>
            <td style="padding:16px 12px; font-weight:700">
                ${p.fleetSize} <span style="font-size:10px; color:var(--t3); font-weight:normal">vhs</span><br>
                <span style="color:var(--c-success)">${p.activeUsers} <span style="font-size:10px; color:var(--t3); font-weight:normal">usr</span></span>
            </td>
            <td style="padding:16px 12px;">
                <div style="display:flex; gap:8px">
                    <span title="Active" style="color:var(--c-success); font-weight:700">• ${p.activeCount}</span>
                    <span title="Grace Period" style="color:var(--c-warning); font-weight:700">• ${p.graceCount}</span>
                    <span title="Locked/Inactive" style="color:var(--c-danger); font-weight:700">• ${p.immobilizedCount}</span>
                </div>
            </td>
            <td style="padding:16px 12px;">
                <div style="display:flex; align-items:center; gap:8px">
                    <div style="width:40px; height:6px; background:var(--s2); border-radius:3px; overflow:hidden">
                        <div style="width:${p.healthPct}%; height:100%; background:${p.healthColor}"></div>
                    </div>
                    <span style="font-weight:800; color:${p.healthColor}">${p.healthPct}%</span>
                </div>
            </td>
            <td style="padding:16px 12px;">
                ${p.isRTO ? `
                <div style="display:flex; align-items:center; gap:8px">
                    <span style="font-weight:700; color:${p.maturityColor}">${p.maturityPct}%</span>
                    <span style="font-size:10px; color:var(--t3)">Avg</span>
                </div>
                ` : '<span style="color:var(--t3)">N/A (Rental)</span>'}
            </td>
            <td style="padding:16px 12px; text-align:right">
                <button class="btn btn-secondary" style="padding:4px 8px; font-size:var(--text-xs)" onclick="event.stopPropagation(); window.rto.openProgramModal('${p.id}')">Edit</button>
                <button class="btn btn-secondary" style="padding:4px 8px; font-size:var(--text-xs); color:var(--c-danger); border-color:var(--c-danger)" onclick="event.stopPropagation(); window.rto.confirmDeleteProgram('${p.id}')">Del</button>
            </td>
        </tr>
    `).join('');

    // Global stats for Program Admin
    const totalPrograms = state.programs.length;
    const totalFleet = state.vehicles.length;
    const totalActiveUsers = state.vehicles.filter(v => v.customer).length;
    const avgHealth = programStats.length > 0 ? Math.round(programStats.reduce((acc, p) => acc + p.healthPct, 0) / programStats.length) : 0;
    const totalPartners = new Set(state.programs.map(p => p.partnerId)).size;

    wrapper.innerHTML = `
        <div class="stats-bar" style="grid-template-columns: repeat(5, 1fr); margin-bottom:24px">
            <div class="stat-card">
                <div class="stat-label">Total Programs</div>
                <div class="stat-value">${totalPrograms}</div>
                <div class="stat-trend" style="color:var(--t3)">Active Schemes</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Managed Fleet</div>
                <div class="stat-value">${totalFleet}</div>
                <div class="stat-trend">Units across all partners</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Enrollment</div>
                <div class="stat-value">${totalActiveUsers}</div>
                <div class="stat-trend" style="color:var(--c-success)">Active Riders</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Network Scale</div>
                <div class="stat-value">${totalPartners}</div>
                <div class="stat-trend">Partner Dealers</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">System Health</div>
                <div class="stat-value" style="color:${avgHealth > 90 ? 'var(--c-success)' : 'var(--c-warning)'}">${avgHealth}%</div>
                <div class="stat-trend">Compliance Avg</div>
            </div>
        </div>

        <div class="card" style="padding:0; overflow:hidden; border:1px solid var(--b1);">
            <table style="width:100%; border-collapse:collapse; text-align:left;">
                <thead style="background:var(--s1); color:var(--t3); font-size: var(--text-xs); text-transform:uppercase; letter-spacing:0.8px;">
                    <tr>
                        <th style="padding:12px; font-weight:600">Program</th>
                        <th style="padding:12px; font-weight:600">Partner</th>
                        <th style="padding:12px; font-weight:600">Price</th>
                        <th style="padding:12px; font-weight:600">Scale (Vhs/Usr)</th>
                        <th style="padding:12px; font-weight:600">State (Act/Grc/Lck)</th>
                        <th style="padding:12px; font-weight:600">Coll. Health</th>
                        <th style="padding:12px; font-weight:600">Maturity</th>
                        <th style="padding:12px; font-weight:600; text-align:right">Actions</th>
                    </tr>
                </thead>
                <tbody style="font-size: var(--text-base); color:var(--t1)">
                    ${rows || '<tr><td colspan="9" style="padding:32px; text-align:center; color:var(--t3)">No programs configured</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
};

export const renderFilters = (activeFilter, stats) => {
    const elStatusFilters = getEl('statusFilters');
    if (!elStatusFilters) return;

    // Default stats if missing
    const s = stats || { total: 0, active: 0, expiring: 0, grace: 0, immobilized: 0, paused: 0, online: 0, offline: 0 };

    const filters = [
        { id: 'all', label: `All (${s.total || 0})`, cls: 'btn-secondary' },
        { id: 'active', label: `Active (${s.active || 0})`, cls: 'btn-success' },
        { id: 'expiring', label: `Expiring (${s.expiring || 0})`, cls: 'btn-warning' },
        { id: 'grace', label: `Grace (${s.grace || 0})`, cls: 'btn-danger-light' },
        { id: 'immobilized', label: `Locked (${s.immobilized || 0})`, cls: 'btn-danger' },
        { id: 'paused', label: `Paused (${s.paused || 0})`, cls: 'btn-secondary' },
        { id: 'available', label: `Available (${s.available || 0})`, cls: 'btn-secondary' },
        { id: 'online', label: `Online (${s.online || 0})`, cls: 'btn-info' }
    ];

    // Using global event dispatch for simplicity
    elStatusFilters.innerHTML = filters.map(f => {
        const isActive = activeFilter === f.id;
        const style = isActive ? `opacity: 1; border-bottom: 2px solid var(--p);` : `opacity: 0.7`;

        return `
        <button class="filter-btn" 
                style="${style}; margin-right: 8px; font-weight: 600"
                data-filter="${f.id}">
            ${f.label}
        </button>
        `;
    }).join('');

    // Attach listeners
    elStatusFilters.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('filter-change', { detail: btn.dataset.filter }));
        });
    });
};

export const renderVehicleList = (vehicles, onCardClick) => {
    const elVehicleList = getEl('vehicleList');
    if (!elVehicleList) return;

    if (vehicles.length === 0) {
        elVehicleList.innerHTML = `<div style="padding:20px; text-align:center; color:var(--t3)">No vehicles found</div>`;
        return;
    }

    // Pagination Logic
    const itemsPerPage = 10;
    const totalPages = Math.ceil(vehicles.length / itemsPerPage);

    // Ensure current page is valid
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = vehicles.slice(start, start + itemsPerPage);

    const listHtml = paginated.map(v => {
        const isExpanded = expandedCardId === v.id;

        // Online/Offline Indicator (Data Integrity)
        const onlineStatusHtml = v.isOnline
            ? `<span class="badge" style="background:var(--c-success); color:#fff; border:none; display:inline-flex; align-items:center; gap:4px">● ONLINE</span>`
            : `<span class="badge" style="background:#6B7280; color:#fff; border:none">OFFLINE</span>`;

        // Badges
        const badgesHtml = `
            <div style="display:flex; gap:6px; flex-wrap:wrap">
                ${v.status === 'active' ? '<span class="badge active">ACTIVE</span>' : ''}
                ${v.status === 'grace' ? '<span class="badge grace">GRACE</span>' : ''}
                ${v.status === 'immobilized' ? '<span class="badge immobilized">IMMOBILIZED</span>' : ''}
                ${v.status === 'paused' ? '<span class="badge" style="background:var(--bl);color:#fff">PAUSED</span>' : ''}
                ${v.status === 'available' ? '<span class="badge" style="background:var(--t3);color:#fff">AVAIL</span>' : ''}
                ${v.creditExpiry ? '<span class="badge expiring">⚠ EXPIRING</span>' : ''}
                <span class="badge ${v.programType === 'RTO' ? 'rto' : 'rent'}">${v.programType}</span>
                ${onlineStatusHtml}
            </div>
        `;

        // Status Line Color
        let borderStyle = '';
        if (v.status === 'active') borderStyle = 'border-left: 3px solid var(--g)';
        else if (v.status === 'immobilized') borderStyle = 'border-left: 3px solid var(--d)';
        else if (v.status === 'grace') borderStyle = 'border-left: 3px solid var(--w)';

        // Countdown Display
        let countdownHtml = '';
        if (v.status === 'immobilized') {
            countdownHtml = `<span style="color:var(--d); font-weight:bold">LOCKED</span>`;
        } else if (v.status === 'paused') {
            countdownHtml = `<span style="color:var(--t2)">PAUSED</span>`;
        } else if (v.status === 'grace' && v.graceExpiry) {
            countdownHtml = `<span id="cd-${v.id}" class="text-orange" style="color:var(--w); font-weight:bold" data-type="grace" data-expiry="${v.graceExpiry}">00:00:00</span>`;
        } else if (v.creditExpiry) {
            countdownHtml = `<span id="cd-${v.id}" class="text-orange" style="font-weight:bold" data-type="credit" data-expiry="${v.creditExpiry}">00:00:00</span>`;
        } else if (v.credits > 0) {
            countdownHtml = `${v.credits}d`;
        } else {
            countdownHtml = `0d`;
        }

        const expandedBody = isExpanded ? `
            <div class="vc-body" style="display:block">
                <div class="info-grid">
                    <div class="info-item"><label>Phone</label><span>${v.phone}</span></div>
                    <div class="info-item"><label>Plate</label><span>${v.plate}</span></div>
                    <div class="info-item"><label>Model</label><span>${v.model}</span></div>
                    <div class="info-item"><label>Battery</label><span>${v.battery}%</span></div>
                    <div class="info-item"><label>Rate</label><span>${formatRupiah(v.dailyRate)}</span></div>
                    <div class="info-item"><label>Ping</label><span>${timeAgo(v.lastPing)}</span></div>
                    <div class="info-item"><label>Status</label><span style="text-transform:capitalize">${v.status}</span></div>
                    <div class="info-item"><label>Expiry</label><span>${v.graceExpiry ? 'Grace: ' + timeAgo(v.graceExpiry) : (v.creditExpiry ? 'Credit: ' + timeAgo(v.creditExpiry) : '-')}</span></div>
                </div>

                <!-- Credit Bar (Visual) -->
                ${v.customer ? `
                <div class="cb">
                    <div class="cbh">
                        <div>
                            <div class="cbl">CREDITS</div>
                            <div class="cbv" style="color:${v.credits < 3 ? 'var(--d)' : (v.credits < 7 ? 'var(--w)' : 'var(--g)')}">
                                ${v.status === 'grace' || v.status === 'immobilized' ? '0' : Math.floor(v.credits)} <span style="font-size: var(--text-sm);font-weight:500;color:var(--t3)">days</span>
                            </div>
                        </div>
                        <div style="text-align:right">
                            <div class="cbl">RATE</div>
                            <div style="font-size: var(--text-base);font-weight:700;color:var(--t1)">${formatRupiah(v.dailyRate)}/d</div>
                        </div>
                    </div>
                    <div class="cbt">
                        <div class="cbf" style="width:${Math.min(100, (v.credits / 30) * 100)}%; background:${v.credits < 3 ? 'var(--d)' : (v.credits < 7 ? 'var(--w)' : 'var(--g)')}"></div>
                    </div>
                    <div class="cbx">
                        <span>Paid: ${v.transactions ? v.transactions.length : 0} cycles</span>
                        <span>Grace: 7d</span>
                    </div>
                </div>
                ` : ''}

                <div class="action-row" style="margin-top: 16px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="window.dispatchAction('pay', '${v.id}')">💰 Pay / Unlock</button>
                    <button class="btn btn-secondary" onclick="window.dispatchAction('holiday', '${v.id}')">🏖️ Holiday</button>
                    <button class="btn btn-danger" onclick="window.dispatchAction('lock', '${v.id}')">🔒 Lock</button>
                </div>
            </div>
        ` : '';

        return `
            <div class="card vehicle-card ${isExpanded ? 'expanded' : ''}" 
                 style="${borderStyle}"
                 data-id="${v.id}">
                
                <div class="vc-header">
                    <div class="vc-id">${v.id}</div>
                    <div style="display:flex; flex-direction:column; gap:2px; flex:1; min-width:0">
                        <div class="vc-cust" style="font-size: var(--text-base); font-weight:700; color:var(--t1)">${v.customer || 'Available'}</div>
                        <div class="vc-badges" style="flex-wrap:wrap">${badgesHtml}</div>
                    </div>
                    <div class="vc-credits">${countdownHtml}</div>
                    <div class="vc-online">
                        <div class="dot ${v.isOnline ? 'green' : 'red'}"></div>
                        ${v.isOnline ? 'On' : 'Off'}
                    </div>
                </div>
                ${expandedBody}
            </div>
        `;
    }).join('');

    // Pagination Controls
    const paginationHtml = totalPages > 1 ? `
        <div class="vl-pagination">
            <button class="vl-page-btn" onclick="window.changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>
            <div class="vl-page-info">Page ${currentPage} of ${totalPages}</div>
            <button class="vl-page-btn" onclick="window.changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
        </div>
    ` : '';

    elVehicleList.innerHTML = paginationHtml + listHtml;

    // Attach Click Handlers for Expansion
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            const id = card.dataset.id;
            expandedCardId = (expandedCardId === id) ? null : id;
            renderVehicleList(vehicles, onCardClick); // Re-render to show expansion
            if (onCardClick) onCardClick(expandedCardId);
        });
    });
}

/* Action Dispatcher Helper */
window.dispatchAction = (action, id) => {
    // We use a custom event so App.js can listen without direct coupling
    window.dispatchEvent(new CustomEvent('vehicle-action', { detail: { action, id } }));

    // Stop propagation handled by button check above
};

/* Modal Logic */
export const openModal = (type, data) => {
    const overlay = document.getElementById(`${type}ModalOverlay`);
    const content = document.getElementById(`${type}ModalContent`);

    if (type === 'payment') {
        content.innerHTML = `
            <div class="form-group">
                <label>Vehicle</label>
                <div class="form-control" style="background:var(--s3);border:none">${data.id} - ${data.customer}</div>
            </div>
            <div class="form-group">
                <label>Days to Add</label>
                <input type="number" class="form-control" value="7" id="payDays">
            </div>
             <div class="form-group">
                <label>Total Amount</label>
                <div class="form-control" style="color:var(--ac);font-weight:bold" id="payAmount">${formatRupiah(data.dailyRate * 7)}</div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="window.closeModals()">Cancel</button>
                <button class="btn btn-primary" onclick="window.confirmPayment('${data.id}')">Confirm Payment</button>
            </div>
        `;

        // Add listener for dynamic calc
        setTimeout(() => {
            const input = document.getElementById('payDays');
            if (input) {
                input.addEventListener('input', (e) => {
                    const days = parseInt(e.target.value) || 0;
                    const amountEl = document.getElementById('payAmount');
                    if (amountEl) amountEl.textContent = formatRupiah(days * data.dailyRate);
                });
            }
        }, 100);

    } else if (type === 'holiday') {
        content.innerHTML = `
             <div class="form-group">
                <label>Vehicle</label>
                <div class="form-control" style="background:var(--s3);border:none">${data.id}</div>
            </div>
             <div class="form-group">
                <label>Reason</label>
                <select class="form-control">
                    <option>Mudik</option>
                    <option>Sakit</option>
                    <option>Liburan</option>
                    <option>Other</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="window.closeModals()">Cancel</button>
                <button class="btn btn-primary" onclick="window.closeModals()">Approve Pause</button>
            </div>
        `;
    }

    overlay.classList.add('active');
};

// Global Helpers for Modal Buttons (since we use onclick strings)
window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
};

window.confirmPayment = (id) => {
    // In a real app, this would call an API
    alert(`Payment recorded for ${id}! Credits updated.`);
    window.closeModals();
    // Dispatch event to update data store
    window.dispatchEvent(new CustomEvent('payment-confirmed', { detail: { id } }));
};

/* Finance Dashboard Rendering */
export const renderFinanceDashboard = (stats, transactions, programStats) => {
    const container = document.getElementById('financeContent');
    if (!container) return;

    // --- Pagination (20 per page) ---
    const PAGE_SIZE = 20;
    if (!window.financePage) window.financePage = 1;
    const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
    if (window.financePage > totalPages) window.financePage = 1;
    const start = (window.financePage - 1) * PAGE_SIZE;
    const paginated = transactions.slice(start, start + PAGE_SIZE);

    // --- Transaction Rows ---
    const rows = paginated.map(t => {
        const statusColor = t.status === 'paid' ? 'var(--g)' : (t.status === 'failed' ? 'var(--r)' : 'var(--w)');
        const statusLabel = (t.status || 'paid').toUpperCase();
        const v = state.vehicles ? state.vehicles.find(veh => veh.id === t.vehicleId) : null;
        const name = t.customer || (v && v.customer) || '—';
        const phone = t.customerPhone || (v && v.phone) || '—';

        return `
        <tr style="border-bottom:1px solid var(--s3); transition:background 0.15s" 
            onmouseover="this.style.background='var(--s2)'" 
            onmouseout="this.style.background=''">
            <td style="padding:10px 12px; font-family:'IBM Plex Mono'; font-size: var(--text-base); color:var(--t2)">${t.id}</td>
            <td style="padding:10px 12px; font-size: var(--text-base); color:var(--t2)">
                <div>${new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div style="font-size: var(--text-sm); opacity:0.7">${new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
            </td>
            <td style="padding:10px 12px; font-size: var(--text-lg)">${t.vehicleId}</td>
            <td style="padding:10px 12px; font-size: var(--text-base)">
                <div style="font-weight:600">${name}</div>
                <div style="font-size: var(--text-sm); color:var(--t3)">${phone}</div>
            </td>
            <td style="padding:10px 12px">
                <div style="font-size: var(--text-md); font-weight:700; color:var(--t1); margin-bottom:2px">
                    ${(t.partnerId || '').charAt(0).toUpperCase() + (t.partnerId || '').slice(1)} • ${t.brand || '—'}
                </div>
                <span style="font-size: var(--text-sm); padding:1px 6px; background:var(--s3); border-radius:4px; color:var(--t2); border:1px solid var(--b1)">
                    ${t.program || t.type || 'RTO'}
                </span>
            </td>
            <td style="padding:10px 12px; font-size: var(--text-base); color:var(--t3)">${t.method || '-'}</td>
            <td style="padding:10px 12px; font-size: var(--text-base)">
                <div style="font-weight:700; font-family:'IBM Plex Mono'; color:var(--ac)">${t.creditDays || 7}d</div>
                <div style="font-size: var(--text-sm); color:var(--t3)">Credit Days</div>
            </td>
            <td style="padding:10px 12px; text-align:right; font-family:'IBM Plex Mono'; font-size: var(--text-lg); font-weight:600">${formatRupiah(t.amount)}</td>
            <td style="padding:10px 12px">
                <span style="font-size: var(--text-md); font-weight:600; color:${statusColor}">${statusLabel}</span>
            </td>
        </tr>`;
    }).join('');

    // --- Pagination Controls ---
    const txPagination = totalPages > 1 ? `
    <div style="padding:12px 16px; border-top:1px solid var(--s3); display:flex; justify-content:space-between; align-items:center; flex-shrink:0">
        <span style="font-size: var(--text-base); color:var(--t3)">${start + 1}–${Math.min(start + PAGE_SIZE, transactions.length)} of ${transactions.length}</span>
        <div style="display:flex; gap:6px; align-items:center">
            <button class="btn btn-secondary" style="padding:4px 10px; font-size: var(--text-base)"
                onclick="window.changeFinancePage(-1)" ${window.financePage === 1 ? 'disabled' : ''}>◀</button>
            <span style="font-size: var(--text-base); color:var(--t2); min-width:80px; text-align:center">Page ${window.financePage} / ${totalPages}</span>
            <button class="btn btn-secondary" style="padding:4px 10px; font-size: var(--text-base)"
                onclick="window.changeFinancePage(1)" ${window.financePage === totalPages ? 'disabled' : ''}>Next ▶</button>
        </div>
    </div>` : '';

    // --- Program Filter Options ---
    const programOptions = (programStats || []).map(p =>
        `<option value="${p.id}">${p.name}</option>`
    ).join('');

    // --- Program Strip ---
    const programsHtml = programStats && programStats.length ? `
    <div class="fns" style="margin-bottom:20px">
        ${programStats.map(p => {
        const borderColor = p.partnerId === 'tangkas' ? '#A78BFA' : (p.partnerId === 'maka' ? '#60A5FA' : '#FB923C');
        return `
        <div class="pc" style="border-left:4px solid ${borderColor}; cursor:pointer" 
             onclick="window.dispatchEvent(new CustomEvent('finance-program-change', {detail:'${p.id}'}))">
            <h4 style="margin:0 0 8px">${p.shortName} <span style="font-size: var(--text-sm);opacity:0.7;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px">${p.type}</span></h4>
            <div style="font-size: var(--text-5xl); font-weight:700; font-family:'IBM Plex Mono'; color:var(--g)">${formatRupiah(p.totalEarnings)}</div>
            <div style="font-size: var(--text-md); color:var(--t3); margin-top:4px">${p.activeCount}/${p.vehicleCount} active units</div>
        </div>`;
    }).join('')}
    </div>` : '';

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; padding:20px; gap:0; box-sizing:border-box; min-height:100%;">

            <!-- Header row with title + program filter -->
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-shrink:0">
                <div>
                    <h2 style="margin:0 0 4px">Finance Overview</h2>
                    <div style="color:var(--t3); font-size: var(--text-lg)">Revenue streams and transaction history</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px">
                    <label style="font-size: var(--text-base); color:var(--t3)">Filter by Program:</label>
                    <select id="programFilter" class="form-control" style="width:180px; font-size: var(--text-lg)">
                        <option value="all">All Programs</option>
                        ${programOptions}
                    </select>
                </div>
            </div>

            <!-- Program Earnings Strip (clickable) -->
            ${programsHtml}

            <!-- Summary Cards -->
            <div class="stats-grid" style="grid-template-columns:repeat(4,1fr); margin-bottom:16px; flex-shrink:0">
                <div class="card stat-card">
                    <h3>Total Revenue</h3>
                    <div class="value text-green">${stats.revenue}</div>
                    <div class="sub">Gross Volume</div>
                </div>
                <div class="card stat-card">
                    <h3>Partner Payout</h3>
                    <div class="value" style="color:var(--p)">${stats.partner}</div>
                    <div class="sub">After Fees</div>
                </div>
                <div class="card stat-card">
                    <h3>CASAN Fees</h3>
                    <div class="value" style="color:var(--ac)">${stats.casan}</div>
                    <div class="sub">Platform Share</div>
                </div>
                <div class="card stat-card">
                    <h3>Outstanding</h3>
                    <div class="value text-red">${stats.outstanding}</div>
                    <div class="sub">Potential Loss</div>
                </div>
            </div>

            <!-- Transaction Table -->
            <div>
                <div class="card" style="display:flex; flex-direction:column; overflow:hidden">
                    <div style="padding:14px 16px; border-bottom:1px solid var(--s3); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0">Recent Transactions</h3>
                        <span style="font-size: var(--text-base); color:var(--t3)">${transactions.length} records</span>
                    </div>
                    <div style="overflow-x:auto">
                        <table style="width:100%; border-collapse:collapse; font-size: var(--text-lg); min-width:600px">
                            <thead style="position:sticky; top:0; background:var(--s2); z-index:10">
                                <tr style="text-align:left; color:var(--t3)">
                                    <th style="padding:10px 12px; font-weight:500; font-size: var(--text-md)">TX ID</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size: var(--text-md)">DATE & TIME</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size: var(--text-md)">VEHICLE</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size: var(--text-md)">USER / PHONE</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size: var(--text-md)">PROGRAM</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size: var(--text-md)">METHOD</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size: var(--text-md)">CREDIT DAYS</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size: var(--text-md); text-align:right">AMOUNT</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size: var(--text-md)">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows || '<tr><td colspan="9" style="padding:24px; text-align:center; color:var(--t3)">No transactions for selected filter</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    ${txPagination}
                </div>
            </div>
        </div>
    `;

    // Attach program filter listener (runs after innerHTML set)
    const sel = document.getElementById('programFilter');
    if (sel) {
        sel.value = window._currentProgramFilter || 'all';
        sel.addEventListener('change', (e) => {
            window.dispatchEvent(new CustomEvent('finance-program-change', { detail: e.target.value }));
        });
    }
};


function formatDate(iso) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Helper for short currency format (e.g., 100K, 1.2M)
function formatShortCurrency(amount) {
    if (amount >= 1000000) {
        return `Rp${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `Rp${(amount / 1000).toFixed(0)}K`;
    }
    return `Rp${amount}`;
}

export const updateCountdowns = () => {
    const elements = document.querySelectorAll('[id^="cd-"]');
    elements.forEach(el => {
        const expiry = el.dataset.expiry;
        if (!expiry) return;

        const cd = getCountdown(expiry);
        if (cd.expired) {
            el.textContent = "EXPIRED";
            el.classList.add('text-red');
            el.style.animation = 'pulse 1s infinite';
        } else {
            // Pulse seconds if < 1 hour
            const isUrgent = cd.hours === 0 && cd.minutes < 60;
            if (isUrgent) el.style.color = 'var(--d)';

            el.textContent = `${cd.hours}h ${cd.minutes}m ${cd.seconds}s`;
        }
    });
};

// ─── GPS LIST ─────────────────────────────────────────────────────────────────

const GPS_STATUS_COLOR = {
    'Online': 'var(--c-success)',
    'Offline': 'var(--c-danger)',
    'Low Signal': 'var(--c-warning)',
    'Tampered': 'var(--c-purple)',
};
const SIM_STATUS_COLOR = {
    'Active': 'var(--c-success)',
    'Low Balance': 'var(--c-warning)',
    'Expired': 'var(--c-danger)',
    'Inactive': '#6B7280',
};

export const renderGpsList = (devices, stats, filter = {}) => {
    const container = document.getElementById('gpsContent');
    if (!container) return;

    // Pagination constants
    const pageSize = 10;
    if (!window.gpsPage) window.gpsPage = 1;
    const totalPages = Math.ceil(devices.length / pageSize) || 1;
    if (window.gpsPage > totalPages) window.gpsPage = totalPages;
    const startIndex = (window.gpsPage - 1) * pageSize;
    const pageDevices = devices.slice(startIndex, startIndex + pageSize);

    const timeAgoFunc = (iso) => {
        if (!iso) return '—';
        const diff = Date.now() - new Date(iso);
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'Just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    // Stats bar
    const statsHtml = `
    <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:12px; margin-bottom:24px">
        ${[
            { label: 'Total', val: stats.total, color: 'var(--t1)' },
            { label: 'Online', val: stats.online, color: 'var(--c-success)' },
            { label: 'Offline', val: stats.offline, color: 'var(--c-danger)' },
            { label: 'Low Signal', val: stats.lowSignal, color: 'var(--c-warning)' },
            { label: 'Tampered', val: stats.tampered, color: 'var(--c-purple)' },
            { label: 'FW Alert', val: stats.firmwareAlert, color: '#F97316' },
            { label: 'SIM Expiry <30d', val: stats.simExpiring, color: 'var(--c-warning)' },
        ].map(s => `
            <div class="card stat-card" style="text-align:center">
                <h3 style="font-size: var(--text-md)">${s.label}</h3>
                <div class="value" style="color:${s.color}; font-size: var(--text-5xl)">${s.val}</div>
            </div>
        `).join('')}
    </div>`;

    // Filter + action toolbar
    const toolbar = `
    <div style="display:flex; gap:12px; align-items:center; margin-bottom:20px; flex-wrap:wrap">
        <input type="text" id="gpsSearch" class="search-bar" style="flex:1; min-width:200px"
            placeholder="Search ID, IMEI, plate..." value="${filter.search || ''}">
        <select id="gpsStatusFilter" class="form-control" style="width:140px">
            <option value="all" ${!filter.status || filter.status === 'all' ? 'selected' : ''}>All Status</option>
            <option value="Online" ${filter.status === 'Online' ? 'selected' : ''}>Online</option>
            <option value="Offline" ${filter.status === 'Offline' ? 'selected' : ''}>Offline</option>
            <option value="Low Signal" ${filter.status === 'Low Signal' ? 'selected' : ''}>Low Signal</option>
            <option value="Tampered" ${filter.status === 'Tampered' ? 'selected' : ''}>Tampered</option>
        </select>
        <select id="gpsBrandFilter" class="form-control" style="width:130px">
            <option value="all">All Brands</option>
            <option value="Weloop" ${filter.brand === 'Weloop' ? 'selected' : ''}>Weloop</option>
            <option value="Teltonika" ${filter.brand === 'Teltonika' ? 'selected' : ''}>Teltonika</option>
            <option value="Concox" ${filter.brand === 'Concox' ? 'selected' : ''}>Concox</option>
        </select>
        <button class="btn btn-primary" id="gpsAddBtn" style="white-space:nowrap">
            ＋ Add Device
        </button>
    </div>`;

    // Table rows
    const rows = pageDevices.map(d => {
        const statusColor = GPS_STATUS_COLOR[d.status] || '#6B7280';
        const simColor = SIM_STATUS_COLOR[d.sim.status] || '#6B7280';
        const fwAlert = d.firmwareUpdateRequired
            ? `<span style="margin-left:4px; font-size: var(--text-sm); background:#F97316; color:#fff; padding:1px 5px; border-radius:3px">UPDATE</span>`
            : '';
        const usagePct = Math.round((d.sim.dataUsedMB / d.sim.dataLimitMB) * 100);

        // Find program info
        let programName = '—';
        if (d.vehicleId) {
            const vehicle = state.vehicles.find(v => v.id === d.vehicleId);
            if (vehicle) {
                const prog = programs.find(p => p.id === vehicle.programId);
                programName = prog ? prog.name : '—';
            }
        }

        const addressHtml = d.status === 'Online' && d.address ?
            `<div style="font-size: var(--text-md); color:var(--t1); margin-bottom:2px">${d.address}</div>` :
            '';

        const locationHtml = d.lat ?
            `<div style="display:flex; flex-direction:column; gap:2px">
                ${addressHtml}
                <div style="display:flex; align-items:center; gap:8px">
                    <a href="#" onclick="window.dispatchEvent(new CustomEvent('focus-vehicle', {detail:'${d.vehicleId}'})); return false;" 
                       style="color:var(--ac); text-decoration:none; font-family:'IBM Plex Mono'; font-size: var(--text-sm)">${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</a>
                    <span style="font-size: var(--text-sm); color:var(--t3); background:var(--s3); padding:1px 4px; border-radius:3px">${d.lastPingTime || '—'}</span>
                </div>
            </div>` :
            '—';

        return `
        <tr style="border-bottom:1px solid var(--s3); transition:background .15s"
            onmouseenter="this.style.background='var(--s3)'" onmouseleave="this.style.background=''">
            <td style="padding:10px 12px; font-family:'IBM Plex Mono'; font-size: var(--text-base); color:var(--t2)">${d.id}</td>
            <td style="padding:10px 12px; font-size: var(--text-base)">
                <div style="font-weight:600">${d.brand} ${d.model}</div>
                <div style="font-size: var(--text-sm); color:var(--t3)">${d.imei}</div>
            </td>
            <td style="padding:10px 12px">
                <span style="color:${statusColor}; font-weight:600; font-size: var(--text-base)">● ${d.status}</span>
                <div style="font-size: var(--text-sm); color:var(--t3)">${timeAgoFunc(d.lastPing)}</div>
            </td>
            <td style="padding:10px 12px; font-size: var(--text-base)">
                <div style="color:var(--t1)">${d.vehiclePlate}</div>
                <div style="font-size: var(--text-md); color:var(--ac); font-weight:600">${d.vehicleBrand || '—'} ${d.vehicleModel || ''}</div>
                <div style="font-size: var(--text-sm); color:var(--t3)">${programName}</div>
            </td>
            <td style="padding:10px 12px; font-size: var(--text-base)">
                ${locationHtml}
            </td>
            <td style="padding:10px 12px; font-size: var(--text-base)">
                <div>${d.sim.carrier}</div>
                <div style="font-size: var(--text-sm); color:var(--t3)">${usagePct}% used</div>
                <div style="font-size: var(--text-sm); color:var(--t3); font-family:'IBM Plex Mono'">IMEI: ${d.imei}</div>
                <span style="font-size: var(--text-sm); color:${simColor}">${d.sim.status}</span>
            </td>
            <td style="padding:10px 12px">
                <div style="display:flex; gap:6px">
                    <button class="btn btn-secondary"
                        style="font-size: var(--text-md); padding:4px 10px"
                        onclick="window.dispatchEvent(new CustomEvent('gps-edit', {detail:'${d.id}'}))">Edit</button>
                    <button class="btn btn-secondary"
                        style="font-size: var(--text-md); padding:4px 10px; color:var(--d); border-color:var(--d)"
                        onclick="window.dispatchEvent(new CustomEvent('gps-delete', {detail:'${d.id}'}))">Del</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    const noResults = pageDevices.length === 0
        ? `<tr><td colspan="7" style="padding:32px; text-align:center; color:var(--t3)">No devices found</td></tr>`
        : '';

    const paginationHtml = `
    <div class="vl-pagination">
        <button class="vl-page-btn" onclick="window.changeGpsPage(-1)" ${window.gpsPage === 1 ? 'disabled' : ''}>Prev</button>
        <div class="vl-page-info">Page ${window.gpsPage} of ${totalPages}</div>
        <button class="vl-page-btn" onclick="window.changeGpsPage(1)" ${window.gpsPage === totalPages ? 'disabled' : ''}>Next</button>
    </div>`;

    container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
        <div>
            <h2 style="margin:0 0 4px">GPS Dashboard</h2>
            <div style="color:var(--t3); font-size: var(--text-lg)">${stats.total} devices — ${stats.online} online</div>
        </div>
    </div>

    ${statsHtml}
    ${toolbar}

    <div class="card" style="overflow:hidden">
        <div style="overflow-x:auto">
            <table style="width:100%; border-collapse:collapse; font-size: var(--text-lg)">
                <thead style="background:var(--s3); position:sticky; top:0; z-index:2">
                    <tr style="text-align:left; color:var(--t3); font-size: var(--text-md); text-transform:uppercase; letter-spacing:.05em">
                        <th style="padding:10px 12px">Device ID</th>
                        <th style="padding:10px 12px">Brand / IMEI</th>
                        <th style="padding:10px 12px">Status</th>
                        <th style="padding:10px 12px">Vehicle / Program</th>
                        <th style="padding:10px 12px">Last Location</th>
                        <th style="padding:10px 12px">SIM</th>
                        <th style="padding:10px 12px">Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}${noResults}</tbody>
            </table>
        </div>
        ${paginationHtml}
    </div>`;

    // Wire up filter events
    const searchEl = document.getElementById('gpsSearch');
    if (searchEl) searchEl.addEventListener('input', e => {
        window.gpsPage = 1;
        window.dispatchEvent(new CustomEvent('gps-filter', { detail: { search: e.target.value } }));
    });
    const statusEl = document.getElementById('gpsStatusFilter');
    if (statusEl) statusEl.addEventListener('change', e => {
        window.gpsPage = 1;
        window.dispatchEvent(new CustomEvent('gps-filter', { detail: { status: e.target.value } }));
    });
    const brandEl = document.getElementById('gpsBrandFilter');
    if (brandEl) brandEl.addEventListener('change', e => {
        window.gpsPage = 1;
        window.dispatchEvent(new CustomEvent('gps-filter', { detail: { brand: e.target.value } }));
    });
    const addBtn = document.getElementById('gpsAddBtn');
    if (addBtn) addBtn.addEventListener('click', () =>
        window.dispatchEvent(new CustomEvent('gps-add')));
};

export const openGpsModal = (device = null, vehicles = []) => {
    const overlay = document.getElementById('gpsModalOverlay');
    const title = document.getElementById('gpsModalTitle');
    const content = document.getElementById('gpsModalContent');
    if (!overlay || !content) return;

    const isEdit = !!device;
    title.textContent = isEdit ? `✏️ Edit Device — ${device.id}` : '📡 Add GPS Device';

    const vehicleOptions = [
        `<option value="">— Unassigned —</option>`,
        ...vehicles.map(v => `<option value="${v.id}" ${isEdit && device.vehicleId === v.id ? 'selected' : ''}>${v.id} — ${v.plate}</option>`)
    ].join('');

    content.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:14px; padding-top:8px">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div>
                <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">Brand</label>
                <select id="gf_brand" class="form-control">
                    ${['Weloop', 'Teltonika', 'Concox'].map(b =>
        `<option ${isEdit && device.brand === b ? 'selected' : ''}>${b}</option>`).join('')}
                </select>
            </div>
            <div>
                <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">Model</label>
                <input id="gf_model" class="form-control" value="${isEdit ? device.model : ''}" placeholder="e.g. WL-210 Pro">
            </div>
        </div>
        <div>
            <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">IMEI</label>
            <input id="gf_imei" class="form-control" value="${isEdit ? device.imei : ''}" placeholder="15-digit IMEI">
        </div>
        <div>
            <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">Serial Number</label>
            <input id="gf_serial" class="form-control" value="${isEdit ? device.serial : ''}" placeholder="Manufacturer serial">
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div>
                <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">Firmware</label>
                <input id="gf_firmware" class="form-control" value="${isEdit ? device.firmware : ''}" placeholder="FW-3.4.2">
            </div>
            <div>
                <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">Mount Position</label>
                <select id="gf_mount" class="form-control">
                    ${['Under Seat', 'Behind Panel', 'Frame', 'Battery Compartment'].map(m =>
            `<option ${isEdit && device.mountPosition === m ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
            </div>
        </div>
        <hr style="border-color:var(--s3); margin:4px 0">
        <div style="font-size: var(--text-base); font-weight:600; color:var(--t2)">SIM Card</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div>
                <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">SIM Number</label>
                <input id="gf_sim" class="form-control" value="${isEdit ? device.sim.number : ''}" placeholder="08xxxxxxxxxx">
            </div>
            <div>
                <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">Carrier</label>
                <select id="gf_carrier" class="form-control">
                    ${['Telkomsel', 'XL', 'Indosat', 'Tri', 'Smartfren'].map(c =>
                `<option ${isEdit && device.sim.carrier === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div>
                <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">SIM Expiry</label>
                <input id="gf_simexpiry" type="date" class="form-control" value="${isEdit ? device.sim.expiry : ''}">
            </div>
            <div>
                <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">Warranty Expiry</label>
                <input id="gf_warranty" type="date" class="form-control" value="${isEdit ? device.warrantyExpiry : ''}">
            </div>
        </div>
        <hr style="border-color:var(--s3); margin:4px 0">
        <div>
            <label style="font-size: var(--text-md); color:var(--t3); display:block; margin-bottom:4px">Assigned Vehicle</label>
            <select id="gf_vehicle" class="form-control">${vehicleOptions}</select>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px">
            <button class="btn btn-secondary" onclick="window.dispatchEvent(new CustomEvent('gps-modal-close'))">Cancel</button>
            <button class="btn btn-primary" onclick="window.dispatchEvent(new CustomEvent('gps-save', {detail:'${isEdit ? device.id : 'new'}'}))">
                ${isEdit ? 'Save Changes' : 'Add Device'}
            </button>
        </div>
    </div>`;

    overlay.classList.add('active');
};

export const closeGpsModal = () => {
    const overlay = document.getElementById('gpsModalOverlay');
    if (overlay) overlay.classList.remove('active');
};

// ─── VEHICLE LIST TAB ─────────────────────────────────────────────────────────

export const renderVehicleListView = () => {
    const elVehicleListContent = getEl('vehicleListContent');
    if (!elVehicleListContent) return;

    const vehicles = getAllVehicles(vehicleListFilter);
    const PAGE_SIZE = 10;
    const totalPages = Math.ceil(vehicles.length / PAGE_SIZE) || 1;
    if (vehicleListPage > totalPages) vehicleListPage = totalPages;
    const paginated = vehicles.slice((vehicleListPage - 1) * PAGE_SIZE, vehicleListPage * PAGE_SIZE);

    const tableRows = paginated.map(v => {
        const prog = getRTOProgress(v);
        const progressHtml = prog ? `
            <div class="vl-rto-bar">
                <div class="vl-rto-track"><div class="vl-rto-fill" style="width:${prog.paidPct}%"></div></div>
                <div style="font-size: var(--text-sm); color:var(--t2)">${prog.monthsLeft}m left</div>
            </div>` : '—';

        const creditColor = v.credits < 3 ? 'var(--c-danger)' : (v.credits < 7 ? 'var(--c-warning)' : 'var(--c-success)');
        const creditHtml = `
            <div class="vl-credit-bar">
                <div class="vl-credit-track"><div class="vl-credit-fill" style="width:${Math.min(100, (v.credits / 30) * 100)}%; background:${creditColor}"></div></div>
                <div class="vl-credit-label" style="color:${creditColor}">${v.credits}d</div>
            </div>`;

        const STNK = getSTNKAlert(v);
        const stnkHtml = STNK ? `<span class="vl-status" style="background:${STNK.type === 'expired' ? 'var(--c-danger)' : 'var(--c-warning)'}22; color:${STNK.type === 'expired' ? 'var(--c-danger)' : 'var(--c-warning)'}">${STNK.label}</span>` : '<span style="color:var(--t3)">—</span>';

        return `
            <tr data-status="${v.status}" onclick="window.openVehicleDrawer('${v.id}')">
                <td style="font-weight:700">${v.id}<div style="font-size: var(--text-sm); font-weight:400; color:var(--t3)">${v.plate}</div></td>
                <td>
                    <div style="font-weight:600">${v.customer || '—'}</div>
                    <div style="font-size: var(--text-sm); color:var(--t3)">${v.phone || ''}</div>
                </td>
                <td><span class="vl-status" style="background:${(v.status === 'active' ? 'var(--c-success)' : (v.status === 'grace' ? 'var(--c-warning)' : (v.status === 'immobilized' ? 'var(--c-danger)' : '#6B7280')))}22; color:${(v.status === 'active' ? 'var(--c-success)' : (v.status === 'grace' ? 'var(--c-warning)' : (v.status === 'immobilized' ? 'var(--c-danger)' : '#6B7280')))}">${v.status.toUpperCase()}</span></td>
                <td>${v.brand}<div style="font-size: var(--text-sm); color:var(--t3)">${v.programType}</div></td>
                <td>${creditHtml}</td>
                <td>${progressHtml}</td>
                <td>${stnkHtml}</td>
                <td><div class="dot ${v.isOnline ? 'green' : 'red'}" style="display:inline-block; margin-right:4px"></div>${v.isOnline ? 'On' : 'Off'}</td>
                <td><button class="vl-pill">👁 Detail</button></td>
            </tr>`;
    }).join('');

    elVehicleListContent.innerHTML = `
        <div class="vl-container">
            <div class="vl-header">
                <h2 class="vl-title">Assets Management</h2>
                <div style="display:flex; gap:10px; align-items:center">
                    <button class="vl-pill" onclick="window.exportVehiclesCSV()">📥 Export CSV</button>
                    <div class="vl-count">${vehicles.length} Units</div>
                </div>
            </div>
            <div class="vl-controls">
                <input type="text" class="vl-search" placeholder="Search plate, name, ID..." value="${vehicleListFilter.search}" id="vSearch">
                <select class="vl-search" id="vProgram" style="max-width:200px">
                    <option value="all">All Programs</option>
                    ${state.programs.map(p => `<option value="${p.id}" ${vehicleListFilter.program === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                </select>
                <div class="vl-filter-pills">
                    ${['all', 'active', 'grace', 'immobilized', 'available', 'stnk_soon'].map(s => `
                        <div class="vl-pill ${vehicleListFilter.status === s ? 'active' : ''}" onclick="window.setVehicleFilter('${s}')">${s === 'stnk_soon' ? '⚠️ STNK' : s.toUpperCase()}</div>
                    `).join('')}
                </div>
            </div>
            <table class="vl-table">
                <thead>
                    <tr>
                        <th onclick="window.setVehicleSort('id')">VEHICLE ${vehicleListFilter.sortBy === 'id' ? (vehicleListFilter.sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                        <th onclick="window.setVehicleSort('customer')">RIDER ${vehicleListFilter.sortBy === 'customer' ? (vehicleListFilter.sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                        <th onclick="window.setVehicleSort('status')">STATUS</th>
                        <th>PROGRAM</th>
                        <th onclick="window.setVehicleSort('credits')">CREDIT</th>
                        <th>PROGRESS</th>
                        <th>STNK</th>
                        <th>GPS</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
            <div class="vl-pagination">
                <button class="vl-page-btn" onclick="window.changeVehiclePage(-1)" ${vehicleListPage === 1 ? 'disabled' : ''}>Prev</button>
                <div class="vl-page-info">Page ${vehicleListPage} of ${totalPages}</div>
                <button class="vl-page-btn" onclick="window.changeVehiclePage(1)" ${vehicleListPage === totalPages ? 'disabled' : ''}>Next</button>
            </div>
        </div>`;

    document.getElementById('vSearch').addEventListener('input', (e) => {
        vehicleListFilter.search = e.target.value;
        vehicleListPage = 1;
        renderVehicleListView();
    });

    document.getElementById('vProgram').addEventListener('change', (e) => {
        vehicleListFilter.program = e.target.value;
        vehicleListPage = 1;
        renderVehicleListView();
    });
};

window.setVehicleFilter = (s) => { vehicleListFilter.status = s; vehicleListPage = 1; renderVehicleListView(); };
window.setVehicleSort = (field) => {
    if (vehicleListFilter.sortBy === field) vehicleListFilter.sortDir = vehicleListFilter.sortDir === 'asc' ? 'desc' : 'asc';
    else { vehicleListFilter.sortBy = field; vehicleListFilter.sortDir = 'asc'; }
    renderVehicleListView();
};
window.changeVehiclePage = (delta) => { vehicleListPage += delta; renderVehicleListView(); };

// ─── USER LIST TAB ────────────────────────────────────────────────────────────

export const renderUserListView = () => {
    const elUserListContent = getEl('userListContent');
    if (!elUserListContent) return;

    const users = getUsers(userListFilter);
    const PAGE_SIZE = 10;
    const totalPages = Math.ceil(users.length / PAGE_SIZE) || 1;
    if (userListPage > totalPages) userListPage = totalPages;
    const paginated = users.slice((userListPage - 1) * PAGE_SIZE, userListPage * PAGE_SIZE);

    const tableRows = paginated.map(u => {
        const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        const riskColor = getRiskColor(u.riskLabel);
        const genderIcon = u.gender === 'Male' ? '♂' : '♀';
        const genderColor = u.gender === 'Male' ? '#60A5FA' : '#F472B6';

        // Progress Bar for RTO users
        const rtoVehicle = u.vehicleIds.map(id => state.vehicles.find(v => v.id === id)).find(v => v && v.programType === 'RTO');
        const rtoProgress = rtoVehicle ? getRTOProgress(rtoVehicle) : null;
        const progressHtml = rtoProgress ? `
            <div style="width:100px">
                <div style="display:flex; justify-content:space-between; font-size: var(--text-xs); margin-bottom:2px; font-weight:700">
                    <span>${rtoProgress.paidPct}%</span>
                    <span>${rtoProgress.daysLeft}d left</span>
                </div>
                <div class="vl-rto-track" style="width:100%; height:4px; background:var(--s3); border-radius:2px; overflow:hidden">
                    <div class="vl-rto-fill" style="width:${rtoProgress.paidPct}%; height:100%; background:var(--g)"></div>
                </div>
            </div>
        ` : '<span style="color:var(--t3); font-size: var(--text-sm)">—</span>';

        return `
            <tr onclick="window.openUserDrawer('${u.userId}')">
                <td>
                    <div style="display:flex; align-items:center; gap:10px">
                        <div class="vl-avatar" style="background:${genderColor}">${initials}</div>
                        <div>
                            <div style="font-weight:700">${u.name}</div>
                            <div style="font-size: var(--text-sm); color:var(--t3)">${u.userId}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap">
                        ${u.vehicleIds.map(id => {
            const v = state.vehicles.find(veh => veh.id === id);
            if (!v) return null;
            const prog = state.programs.find(p => p.id === v.programId);
            if (!prog) return null;
            return `
                                <span class="vl-pill" 
                                      style="font-size: var(--text-sm); background:var(--s2); border:1px solid var(--bd); padding:1px 6px; border-radius:4px; color:var(--t2); font-weight:700; cursor:pointer"
                                      onclick="event.stopPropagation(); window.setUserProgramFilter('${prog.id}')">
                                    ${prog.shortName} ${prog.type}
                                </span>`;
        }).filter(Boolean).join('')}
                    </div>
                </td>
                <td>${progressHtml}</td>
                <td>
                    <div style="display:flex; justify-content:center; gap:4px">
                        ${(() => {
                const v = state.vehicles.find(veh => veh.userId === u.userId);
                if (!v) return '<span style="color:var(--t3); opacity:0.3">—</span>';
                return `
                                ${v.immobilizeLog?.length > 0 ? `
                                    <div class="vl-pill" style="background:rgba(239, 68, 68, 0.15); color:var(--c-danger); border-color:rgba(239, 68, 68, 0.3); padding:2px 6px; font-weight:800; font-size: var(--text-sm)" title="${v.immobilizeLog.length} Immobilizations">
                                        🔒 ${v.immobilizeLog.length}
                                    </div>
                                ` : '<span style="color:var(--t3); opacity:0.3">—</span>'}
                                ${v.graceEncounters > 0 ? `
                                    <div class="vl-pill" style="background:rgba(245, 158, 11, 0.15); color:var(--c-warning); border-color:rgba(245, 158, 11, 0.3); padding:2px 6px; font-weight:800; font-size: var(--text-sm)" title="${v.graceEncounters} Grace Period Entries">
                                        ⚠️ ${v.graceEncounters}
                                    </div>
                                ` : '<span style="color:var(--t3); opacity:0.3">—</span>'}
                            `;
            })()}
                    </div>
                </td>
                <td>
                    <div class="vl-risk-bar" style="background:${riskColor}22; color:${riskColor}">
                        <div style="width:12px; height:12px; border-radius:50%; background:${riskColor}"></div>
                        ${u.riskLabel} (${u.riskScore})
                    </div>
                </td>
                <td>
                    ${u.vehicleIds.length > 0 ? `<span style="font-size: var(--text-sm); background:var(--s3); padding:1px 6px; border-radius:3px; color:var(--t2); font-family:'IBM Plex Mono'; font-weight:700">${u.vehicleIds[0]}</span>` : '<span style="color:var(--t3); font-size: var(--text-sm)">—</span>'}
                </td>
                <td>
                    <div style="font-size: var(--text-base)">${u.phone}</div>
                    <div style="font-size: var(--text-sm); color:var(--t3)">${u.address.substring(0, 20)}...</div>
                </td>
                <td>${new Date(u.joinDate).toLocaleDateString()}</td>
                <td><button class="vl-pill" onclick="window.openUserDrawer('${u.userId}')">👤 Profile</button></td>
            </tr>`;
    }).join('');

    const allUsers = getUsers({}); // Get all users for pill counts
    const programStats = state.programs.map(p => {
        return {
            id: p.id,
            count: allUsers.filter(u => {
                const uv = state.vehicles.find(v => v.userId === u.userId);
                return uv && uv.programId === p.id;
            }).length
        };
    });

    // Detailed Stats for active filter
    let activeProgramStats = null;
    if (userListFilter.program !== 'all') {
        const progUsers = users; // already filtered by getUsers(userListFilter)
        const progVehicles = progUsers.map(u => state.vehicles.find(v => v.userId === u.userId)).filter(Boolean);
        activeProgramStats = {
            total: progUsers.length,
            active: progVehicles.filter(v => v.status === 'active').length,
            grace: progVehicles.filter(v => v.status === 'grace').length,
            immob: progVehicles.filter(v => v.status === 'immobilized').length,
            paused: progVehicles.filter(v => v.status === 'paused').length,
            health: Math.round((progVehicles.filter(v => v.status === 'active').length / progVehicles.length) * 100) || 0
        };
    }

    elUserListContent.innerHTML = `
        <div class="vl-container">
            <div class="vl-header">
                <div>
                    <h2 class="vl-title">Rider KYC & Profiles</h2>
                    <div style="font-size: var(--text-md); color:var(--t3); margin-top:2px">Operational Behavioral Auditing</div>
                </div>
                <div style="display:flex; gap:10px; align-items:center">
                    <button class="vl-pill" onclick="window.exportUsersCSV()">📥 Export CSV</button>
                    <div class="vl-count">${users.length} Riders Displayed</div>
                </div>
            </div>

            ${activeProgramStats ? `
            <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:12px; margin-bottom:20px; background:var(--s2); padding:16px; border-radius:12px; border:1px solid var(--bd)">
                <div style="border-right:1px solid var(--bd)">
                    <div style="font-size: var(--text-sm); color:var(--t3); font-weight:800; text-transform:uppercase">Program Health</div>
                    <div style="font-size: var(--text-5xl); font-weight:800; color:var(--g)">${activeProgramStats.health}%</div>
                </div>
                <div style="border-right:1px solid var(--bd); padding-left:12px">
                    <div style="font-size: var(--text-sm); color:var(--t3); font-weight:800; text-transform:uppercase">Active Assets</div>
                    <div style="font-size: var(--text-5xl); font-weight:800; color:var(--t1)">${activeProgramStats.active}</div>
                </div>
                <div style="border-right:1px solid var(--bd); padding-left:12px">
                    <div style="font-size: var(--text-sm); color:var(--c-warning); font-weight:800; text-transform:uppercase">In Grace</div>
                    <div style="font-size: var(--text-5xl); font-weight:800; color:var(--c-warning)">${activeProgramStats.grace}</div>
                </div>
                <div style="border-right:1px solid var(--bd); padding-left:12px">
                    <div style="font-size: var(--text-sm); color:var(--c-danger); font-weight:800; text-transform:uppercase">Immobilized</div>
                    <div style="font-size: var(--text-5xl); font-weight:800; color:var(--c-danger)">${activeProgramStats.immob}</div>
                </div>
                <div style="padding-left:12px">
                    <div style="font-size: var(--text-sm); color:var(--t3); font-weight:800; text-transform:uppercase">Total Riders</div>
                    <div style="font-size: var(--text-5xl); font-weight:800; color:var(--p)">${activeProgramStats.total}</div>
                </div>
            </div>
            ` : ''}

            <!-- Finance-consistent Program Strip -->
            <div class="fns" style="margin-bottom:20px; padding-bottom:10px">
                <div class="pc ${userListFilter.program === 'all' ? 'active' : ''}" 
                     style="cursor:pointer; border-left:4px solid var(--t3)"
                     onclick="window.setUserProgramFilter('all')">
                    <h4 style="margin:0 0 8px">All Programs <span style="font-size: var(--text-sm);opacity:0.7;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px">GLOBAL</span></h4>
                    <div style="font-size: var(--text-5xl); font-weight:700; font-family:'IBM Plex Mono'; color:var(--p)">${allUsers.length}</div>
                    <div style="font-size: var(--text-md); color:var(--t3); margin-top:4px">Consolidated Rider KYC</div>
                </div>

                ${state.programs.map(p => {
        const stats = programStats.find(s => s.id === p.id);
        const borderColor = p.partnerId === 'tangkas' ? '#A78BFA' : (p.partnerId === 'maka' ? '#60A5FA' : '#FB923C');

        // Specific stats for this program card
        const progVehicles = state.vehicles.filter(v => v.programId === p.id);
        const activeCount = progVehicles.filter(v => v.status === 'active').length;

        return `
                        <div class="pc ${userListFilter.program === p.id ? 'active' : ''}" 
                             style="cursor:pointer; border-left:4px solid ${borderColor}"
                             onclick="window.setUserProgramFilter('${p.id}')">
                            <h4 style="margin:0 0 8px">${p.shortName} <span style="font-size: var(--text-sm);opacity:0.7;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px">${p.type}</span></h4>
                            <div style="font-size: var(--text-5xl); font-weight:700; font-family:'IBM Plex Mono'; color:var(--g)">${stats?.count || 0}</div>
                            <div style="font-size: var(--text-md); color:var(--t3); margin-top:4px">${activeCount}/${progVehicles.length} active units</div>
                        </div>
                    `;
    }).join('')}
            </div>

            <div class="vl-controls" style="margin-bottom:20px">
                <input type="text" class="vl-search" placeholder="Search name, phone, NIK..." value="${userListFilter.search}" id="uSearch">
            </div>
            <table class="vl-table">
                <thead>
                    <tr>
                        <th onclick="window.setUserSort('name')">USER ${userListFilter.sortBy === 'name' ? (userListFilter.sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                        <th>PROGRAM</th>
                        <th>PROGRESS</th>
                        <th style="text-align:center">COLLECTION AUDIT</th>
                        <th onclick="window.setUserSort('riskScore')">RISK SCORE</th>
                        <th>VEHICLE</th>
                        <th>CONTACT</th>
                        <th onclick="window.setUserSort('joinDate')">JOINED ${userListFilter.sortBy === 'joinDate' ? (userListFilter.sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
            <div class="vl-pagination">
                <button class="vl-page-btn" onclick="window.changeUserPage(-1)" ${userListPage === 1 ? 'disabled' : ''}>Prev</button>
                <div class="vl-page-info">Page ${userListPage} of ${totalPages}</div>
                <button class="vl-page-btn" onclick="window.changeUserPage(1)" ${userListPage === totalPages ? 'disabled' : ''}>Next</button>
            </div>
        </div>`;

    document.getElementById('uSearch').addEventListener('input', (e) => {
        userListFilter.search = e.target.value;
        userListPage = 1;
        renderUserListView();
    });
};

window.setUserProgramFilter = (p) => {
    userListFilter.program = p;
    userListPage = 1;
    renderUserListView();
};

window.setUserRiskFilter = (r) => { userListFilter.risk = r; userListPage = 1; renderUserListView(); };
window.setUserSort = (field) => {
    if (userListFilter.sortBy === field) userListFilter.sortDir = userListFilter.sortDir === 'asc' ? 'desc' : 'asc';
    else { userListFilter.sortBy = field; userListFilter.sortDir = 'asc'; }
    renderUserListView();
};
window.changeUserPage = (delta) => { userListPage += delta; renderUserListView(); };
window.changeProgramPage = (delta) => { programListPage += delta; renderProgramListView(); };

// ─── DETAIL DRAWER LOGIC ──────────────────────────────────────────────────────

const openDrawer = (html) => {
    const elDrawerContent = getEl('drawerContent');
    const elDetailDrawer = getEl('detailDrawer');
    const elDrawerBackdrop = getEl('drawerBackdrop');
    if (!elDrawerContent || !elDetailDrawer || !elDrawerBackdrop) return;
    elDrawerContent.innerHTML = html;
    elDetailDrawer.classList.add('open');
    elDrawerBackdrop.classList.add('open');
};

window.popDrawerStack = () => {
    const prev = drawerStack.pop();
    if (prev) {
        if (prev.type === 'vehicle') window.openVehicleDrawer(prev.id, false);
        else if (prev.type === 'user') window.openUserDrawer(prev.id, false);
    }
};

window.closeDrawer = () => {
    const elDetailDrawer = getEl('detailDrawer');
    const elDrawerBackdrop = getEl('drawerBackdrop');
    if (elDetailDrawer) elDetailDrawer.classList.remove('open');
    if (elDrawerBackdrop) elDrawerBackdrop.classList.remove('open');
    drawerStack = []; // Reset history
};
export const closeDrawer = window.closeDrawer;

window.openVehicleDrawer = (id, pushToStack = true) => {
    const v = getVehicleById(id);
    if (!v) return;

    if (pushToStack && elDetailDrawer.classList.contains('open')) {
        if (window._currentDrawer && window._currentDrawer.id !== id) drawerStack.push(window._currentDrawer);
    }
    window._currentDrawer = { type: 'vehicle', id };

    const txs = getVehicleTransactions(id);
    const rto = getRTOProgress(v);
    const STNK = getSTNKAlert(v);
    const initials = (v.customer || '??').split(' ').map(n => n[0]).join('').substring(0, 2);

    const backBtn = drawerStack.length > 0 ? `<button class="drawer-back" onclick="window.popDrawerStack()">← Back</button>` : '';

    const html = `
        <div class="drawer-header">
            ${backBtn}
            <button class="drawer-close" onclick="window.closeDrawer()">✕</button>
            <div class="drawer-avatar" style="background:var(--g)">${initials}</div>
            <div style="flex:1">
                <div class="drawer-name">${v.customer || 'No Active Rider'}</div>
                <div class="drawer-sub">${v.plate} • ${v.id}</div>
                <div style="font-size: var(--text-sm); color:var(--g); font-weight:800; font-family:'IBM Plex Mono'; margin-top:2px">${v.rtoId}</div>
            </div>
            <span class="vl-status" style="background:${(v.status === 'active' ? 'var(--c-success)' : 'var(--c-danger)')}22; color:${(v.status === 'active' ? 'var(--c-success)' : 'var(--c-danger)')}">${v.status.toUpperCase()}</span>
        </div>
        <div class="drawer-body">
            ${STNK ? `
            <div class="drawer-alert ${STNK.type}">
                <div style="font-weight:700">STNK EXPIRY ALERT</div>
                <div style="font-size: var(--text-base)">Document is ${STNK.type}. ${STNK.label}.</div>
            </div>
            ` : ''}
            ${rto ? `
            <div class="drawer-section">
                <div class="drawer-section-title">RTO Progress</div>
                <div style="margin-bottom:12px">
                    <div style="display:flex; justify-content:space-between; font-size: var(--text-md); margin-bottom:4px; font-weight:700">
                        <span>${formatRupiah(rto.paidRp)} Paid</span>
                        <span>${rto.paidPct}%</span>
                    </div>
                    <div class="vl-rto-track" style="width:100%; height:8px"><div class="vl-rto-fill" style="width:${rto.paidPct}%"></div></div>
                </div>
                <div class="drawer-field"><span class="drawer-field-label">Remaining</span><span class="drawer-field-value">${formatRupiah(rto.remainingRp)}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Months Left</span><span class="drawer-field-value">${rto.monthsLeft} of ${v.contractMonths}</span></div>
            </div>
            ` : ''}

            <div class="drawer-section">
                <div class="drawer-section-title">Credit Status</div>
                <div style="background:var(--s2); border:1px solid var(--bd); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                    <div>
                        <div style="font-size: var(--text-5xl); font-weight:800; color:var(--g); font-family:'IBM Plex Mono'">${v.credits}</div>
                        <div style="font-size: var(--text-sm); color:var(--t2); font-weight:700">DAYS REMAINING</div>
                    </div>
                    <button class="vl-pill active" onclick="window.dispatchAction('pay', '${v.id}')">Extend +7d</button>
                </div>
            </div>

            <div class="drawer-section">
                <div class="drawer-section-title">Collection Audit</div>
                <div style="display:flex; gap:8px">
                    ${v.immobilizeLog?.length > 0 ? `
                        <div style="flex:1; background:var(--c-danger)11; border:1px solid rgba(239, 68, 68, 0.15); padding:10px; border-radius:8px; text-align:center">
                            <div style="font-size: var(--text-4xl)">🔒</div>
                            <div style="font-size: var(--text-xl); font-weight:800; color:var(--c-danger)">${v.immobilizeLog.length}</div>
                            <div style="font-size: var(--text-xs); color:var(--t3); font-weight:700">LOCKS</div>
                        </div>
                    ` : ''}
                    ${v.graceEncounters > 0 ? `
                        <div style="flex:1; background:var(--c-warning)11; border:1px solid rgba(245, 158, 11, 0.15); padding:10px; border-radius:8px; text-align:center">
                            <div style="font-size: var(--text-4xl)">⚠️</div>
                            <div style="font-size: var(--text-xl); font-weight:800; color:var(--c-warning)">${v.graceEncounters}</div>
                            <div style="font-size: var(--text-xs); color:var(--t3); font-weight:700">GRACE</div>
                        </div>
                    ` : ''}
                    ${!v.immobilizeLog?.length && !v.graceEncounters ? `
                        <div style="flex:1; background:var(--g)11; border:1px solid var(--g)22; padding:12px; border-radius:8px; text-align:center">
                            <div style="color:var(--g); font-weight:800; font-size: var(--text-lg)">CLEAN COLLECTION HISTORY</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="drawer-section">
                <div class="drawer-section-title">Rider Info</div>
                <div class="drawer-field"><span class="drawer-field-label">NIK</span><span class="drawer-field-value">${v.nik}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Phone</span><span class="drawer-field-value">${v.phone}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Address</span><span class="drawer-field-value">${v.address}</span></div>
                <button class="drawer-action-btn" style="width:100%; margin-top:8px" onclick="window.openUserDrawer('${v.userId}')">View Full KYC Profile</button>
            </div>

            <div class="drawer-section">
                <div class="drawer-section-title">Vehicle & Docs</div>
                <div class="drawer-field"><span class="drawer-field-label">Model</span><span class="drawer-field-value">${v.model}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">STNK Expiry</span><span class="drawer-field-value">${new Date(v.stnkExpiry).toLocaleDateString()}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Last Ping</span><span class="drawer-field-value">${timeAgo(v.lastPing)}</span></div>
            </div>

            <div class="drawer-section">
                <div class="drawer-section-title">Operational Actions</div>
                <div class="drawer-actions">
                    <button class="drawer-action-btn" onclick="window.dispatchAction('pay', '${v.id}')">💰 Record Payment</button>
                    ${v.status === 'immobilized' ?
            `<button class="drawer-action-btn" onclick="window.dispatchAction('unlock', '${v.id}')">🔓 Release Vehicle</button>` :
            `<button class="drawer-action-btn danger" onclick="window.dispatchAction('lock', '${v.id}')">🔒 Immobilize</button>`
        }
                    <button class="drawer-action-btn" onclick="window.dispatchAction('holiday', '${v.id}')">🏖️ Pause</button>
                </div>
            </div>

            <div class="drawer-section">
                <div class="drawer-section-title">Recent History</div>
                <table class="drawer-mini-table">
                    <thead><tr><th style="text-align:left">Date</th><th style="text-align:left">Type</th><th style="text-align:center">Days</th><th style="text-align:right">Amount</th></tr></thead>
                    <tbody>
                        ${txs.map(t => `
                            <tr>
                                <td>${new Date(t.date).toLocaleDateString()}</td>
                                <td>${t.type}</td>
                                <td style="text-align:center; font-weight:700; color:var(--g)">+${t.creditDays || 0}d</td>
                                <td style="text-align:right; font-weight:600">${formatRupiah(t.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    openDrawer(html);
};

window.openUserDrawer = (userId, pushToStack = true) => {
    const u = getUserById(userId);
    if (!u) return;

    if (pushToStack && elDetailDrawer.classList.contains('open')) {
        if (window._currentDrawer && window._currentDrawer.id !== userId) drawerStack.push(window._currentDrawer);
    }
    window._currentDrawer = { type: 'user', id: userId };

    const vehicles = getUserVehicles(userId);
    const txs = getUserTransactions(userId).slice(0, 10);
    const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    const riskColor = getRiskColor(u.riskLabel);

    // Find RTO progress if applicable
    const rtoVehicle = vehicles.find(v => v.programType === 'RTO');
    const rtoProgress = rtoVehicle ? getRTOProgress(rtoVehicle) : null;

    const genderIcon = u.gender === 'Male' ? '♂' : '♀';
    const genderColor = u.gender === 'Male' ? '#60A5FA' : '#F472B6';

    const backBtn = drawerStack.length > 0 ? `<button class="drawer-back" onclick="window.popDrawerStack()">← Back</button>` : '';

    const html = `
        <div class="drawer-header">
            ${backBtn}
            <button class="drawer-close" onclick="window.closeDrawer()">✕</button>
            <div class="drawer-avatar" style="background:${genderColor}">${initials}</div>
            <div style="flex:1">
                <div class="drawer-name" style="display:flex; align-items:center; gap:8px">
                    ${u.name} 
                    <span style="font-size: var(--text-3xl); color:${genderColor}">${genderIcon}</span>
                </div>
                <div class="drawer-sub">${u.userId} • Joined ${new Date(u.joinDate).toLocaleDateString()}</div>
            </div>
            <div class="vl-risk-bar" style="background:${riskColor}22; color:${riskColor}">${u.riskLabel}</div>
        </div>
        <div class="drawer-body">
            <div class="drawer-section">
                <div class="drawer-section-title">Risk Scoring Detail</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px">
                    <div style="background:var(--s2); padding:10px; border-radius:8px; border:1px solid var(--bd)">
                        <div style="font-size: var(--text-sm); color:var(--t3); font-weight:700">RISK SCORE</div>
                        <div style="font-size: var(--text-4xl); font-weight:800; color:${riskColor}">${u.riskScore}</div>
                    </div>
                    <div style="background:var(--s2); padding:10px; border-radius:8px; border:1px solid var(--bd)">
                        <div style="font-size: var(--text-sm); color:var(--t3); font-weight:700; margin-bottom:4px">COLLECTION AUDIT</div>
                        <div style="display:flex; gap:6px">
                            ${(() => {
            const v = vehicles[0];
            if (!v) return '<span style="color:var(--t3); opacity:0.3">—</span>';
            return `
                                    ${v.immobilizeLog?.length > 0 ? `<div style="background:rgba(239, 68, 68, 0.15); color:var(--c-danger); padding:2px 8px; border-radius:12px; font-weight:800; font-size: var(--text-base)">🔒 ${v.immobilizeLog.length}</div>` : ''}
                                    ${v.graceEncounters > 0 ? `<div style="background:rgba(245, 158, 11, 0.15); color:var(--c-warning); padding:2px 8px; border-radius:12px; font-weight:800; font-size: var(--text-base)">⚠️ ${v.graceEncounters}</div>` : ''}
                                    ${!v.immobilizeLog?.length && !v.graceEncounters ? '<span style="color:var(--g); font-weight:700; font-size: var(--text-base)">Clean History</span>' : ''}
                                `;
        })()}
                        </div>
                    </div>
                </div>
                <div class="drawer-field"><span class="drawer-field-label">Job</span><span class="drawer-field-value">${getOccupationEmoji(u.occupation)} ${u.occupation}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Employer</span><span class="drawer-field-value">${u.employer}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Income</span><span class="drawer-field-value">${u.incomeRange}</span></div>
            </div>

            ${rtoProgress ? `
            <div class="drawer-section">
                <div class="drawer-section-title">RTO Contract Maturity</div>
                <div style="margin-bottom:12px">
                    <div style="display:flex; justify-content:space-between; font-size: var(--text-md); margin-bottom:4px; font-weight:700">
                        <span>${formatRupiah(rtoProgress.paidRp)} Paid</span>
                        <span>${rtoProgress.paidPct}%</span>
                    </div>
                    <div class="vl-rto-track" style="width:100%; height:8px; background:var(--s3); border-radius:4px; overflow:hidden">
                        <div class="vl-rto-fill" style="width:${rtoProgress.paidPct}%; height:100%; background:var(--g)"></div>
                    </div>
                </div>
                <div class="drawer-field"><span class="drawer-field-label">Remaining Buyout</span><span class="drawer-field-value">${formatRupiah(rtoProgress.remainingRp)}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Contract Progress</span><span class="drawer-field-value">${rtoProgress.daysElapsed} of ${rtoProgress.totalDays} Days</span></div>
            </div>
            ` : ''}

            <div class="drawer-section">
                <div class="drawer-section-title">Linked Vehicle</div>
                ${vehicles.length > 0 ? (() => {
            const v = vehicles[0];
            return `
                    <div class="drawer-vehicle-card" onclick="window.openVehicleDrawer('${v.id}')">
                        <div style="width:36px; height:36px; background:var(--s3); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size: var(--text-3xl)">🏍️</div>
                        <div style="flex:1">
                            <div style="font-weight:700; font-size: var(--text-lg)">${v.plate}</div>
                            <div style="font-size: var(--text-sm); color:var(--t3); font-family:'IBM Plex Mono'">${v.rtoId}</div>
                            <div style="font-size: var(--text-md); color:var(--t3)">${v.id} • ${v.status}</div>
                        </div>
                        <div style="text-align:right">
                            <div style="font-weight:800; font-size: var(--text-xl); color:${v.credits < 3 ? 'var(--c-danger)' : 'var(--g)'}">${v.credits}d</div>
                            <div style="font-size: var(--text-xs); color:var(--t3); font-weight:600">CREDIT</div>
                        </div>
                    </div>
                `;
        })() : '<div style="opacity:0.5; font-size: var(--text-base); padding:10px">No assigned vehicle</div>'}
            </div>

            <div class="drawer-section">
                <div class="drawer-section-title">Identity & Contacts</div>
                <div class="drawer-field"><span class="drawer-field-label">NIK (KTP)</span><span class="drawer-field-value">${u.nik}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Phone</span><span class="drawer-field-value">${u.phone}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Gender</span><span class="drawer-field-value">${u.gender}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Emergency 1 (Spouse)</span><span class="drawer-field-value">${u.emergencyContacts[0].name}</span></div>
                <div class="drawer-field"><span class="drawer-field-label">Emergency 2</span><span class="drawer-field-value">${u.emergencyContacts[1].name} (${u.emergencyContacts[1].relationship})</span></div>
            </div>

            <div class="drawer-section">
                <div class="drawer-section-title">Payment History (Last 10)</div>
                <table class="drawer-mini-table" style="width:100%; border-collapse:collapse; font-size: var(--text-md)">
                    <thead>
                        <tr style="text-align:left; color:var(--t3)">
                            <th style="padding:6px 0; border-bottom:1px solid var(--bd)">DATE</th>
                            <th style="padding:6px 0; border-bottom:1px solid var(--bd)">TYPE</th>
                            <th style="padding:6px 0; border-bottom:1px solid var(--bd); text-align:center">DAYS</th>
                            <th style="padding:6px 0; border-bottom:1px solid var(--bd); text-align:right">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${txs.map(t => `
                            <tr>
                                <td style="padding:6px 0; border-bottom:1px solid var(--bd)">${new Date(t.date).toLocaleDateString()}</td>
                                <td style="padding:6px 0; border-bottom:1px solid var(--bd); font-weight:700">${t.type}</td>
                                <td style="padding:6px 0; border-bottom:1px solid var(--bd); text-align:center">
                                    <span style="background:var(--g)11; color:var(--g); padding:2px 6px; border-radius:4px; font-weight:800; font-size: var(--text-sm)">+${t.creditDays || 0}d</span>
                                </td>
                                <td style="padding:6px 0; border-bottom:1px solid var(--bd); text-align:right; font-family:'IBM Plex Mono'; font-weight:600">${formatRupiah(t.amount)}</td>
                            </tr>
                        `).join('')}
                        ${txs.length === 0 ? '<tr><td colspan="3" style="text-align:center; padding:20px; opacity:0.5">No transactions found</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    openDrawer(html);
};

// Setup UI Event Listeners (Call during app init)
export const initUI = () => {
    const backdrop = getEl('drawerBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeDrawer);
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDrawer();
            closeModals();
            closeCommandPalette();
        }
    });
};

// CSV Export handlers
window.exportVehiclesCSV = () => {
    const list = getAllVehicles(vehicleListFilter);
    const rows = [
        ["ID", "Plate", "Rider", "Status", "Brand", "Program", "Credits", "STNK Expiry"],
        ...list.map(v => [v.id, v.plate, v.customer || '-', v.status, v.brand, v.programType, v.credits, v.stnkExpiry])
    ];
    downloadCSV(`vehicles_export_${new Date().toISOString().split('T')[0]}.csv`, rows);
};

window.exportUsersCSV = () => {
    const list = getUsers(userListFilter);
    const rows = [
        ["User ID", "Name", "Phone", "Risk Label", "Risk Score", "Total Paid", "Missed Pmts", "Join Date"],
        ...list.map(u => [u.userId, u.name, u.phone, u.riskLabel, u.riskScore, u.totalPaid, u.missedPayments, u.joinDate])
    ];
    downloadCSV(`users_export_${new Date().toISOString().split('T')[0]}.csv`, rows);
};

export const renderProgramListView = () => {
    const elRtoFleetContent = getEl('rto-fleetContent');
    if (!elRtoFleetContent) return;

    // Filter programs by global partner filter
    let filteredPrograms = [...state.programs];
    if (state.filter.partner !== 'all') {
        filteredPrograms = filteredPrograms.filter(p => p.partnerId === state.filter.partner);
    }

    // Prepare Top Navigation content
    const topNavItems = filteredPrograms.map(p => {
        const programVehicles = state.vehicles.filter(v => v.programId === p.id);
        const activeCount = programVehicles.filter(v => v.status === 'active').length;
        const graceCount = programVehicles.filter(v => v.status === 'grace').length;
        const lockedCount = programVehicles.filter(v => v.status === 'immobilized').length;
        const isActive = state.filter.program === p.id;

        // Pulse health bar for shorthand
        const total = programVehicles.length || 1;
        const healthPct = Math.round((activeCount / total) * 100);
        const healthColor = healthPct > 90 ? 'var(--c-success)' : (healthPct > 70 ? 'var(--c-warning)' : 'var(--c-danger)');

        return `
            <div class="adm-ni ${isActive ? 'on' : ''}" style="flex-direction:column; align-items:flex-start; padding:12px 16px; min-width:210px; height:100%; gap:4px; box-sizing:border-box;" onclick="window.selectProgram('${p.id}')">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                    <span style="font-size: var(--text-base); font-weight:700">${p.name}</span>
                    <span style="font-size: var(--text-sm); opacity:0.6">${p.shortName}</span>
                </div>
                <div style="display:flex; justify-content:space-between; width:100%; align-items:flex-end">
                    <div style="font-size: var(--text-sm); color:var(--t3); font-weight:600">
                        ${formatShortCurrency(p.price)}/day • ${p.grace}d Grace
                    </div>
                </div>
                <div style="height:3px; width:100%; background:rgba(255,255,255,0.1); border-radius:1px; margin-bottom:2px">
                    <div style="height:100%; width:${healthPct}%; background:${healthColor}; border-radius:1px"></div>
                </div>
                <div style="display:flex; gap:6px; font-size: var(--text-xs); font-weight:700; width:100%;">
                    <div style="color:var(--c-success); background:var(--c-success)11; padding:2px 4px; border-radius:4px" title="Active">A:${activeCount}</div>
                    <div style="color:var(--c-warning); background:var(--c-warning)11; padding:2px 4px; border-radius:4px" title="Grace">G:${graceCount}</div>
                    <div style="color:var(--c-danger); background:var(--c-danger)11; padding:2px 4px; border-radius:4px" title="Locked">L:${lockedCount}</div>
                </div>
            </div>
        `;
    }).join('');

    // Prepare Table data
    let displayVehicles = [];
    let viewTitle = 'All Programs Fleet';
    let viewSubtitle = 'Consolidated fleet monitoring across all partner schemes.';

    if (state.filter.program === 'all') {
        displayVehicles = state.vehicles.filter(v => filteredPrograms.some(p => p.id === v.programId));
    } else {
        const program = filteredPrograms.find(p => p.id === state.filter.program);
        if (program) {
            displayVehicles = state.vehicles.filter(v => v.programId === state.filter.program);
            viewTitle = program.name;
            viewSubtitle = `Detailed lifecycle monitoring for ${program.shortName} scheme.`;
        }
    }

    // Apply Deep Filters (Operator, Brand, Program, Model)
    if (window.rtoListFilter) {
        if (window.rtoListFilter.operator !== 'all') {
            displayVehicles = displayVehicles.filter(v => v.operator === window.rtoListFilter.operator);
        }
        if (window.rtoListFilter.brand !== 'all') {
            displayVehicles = displayVehicles.filter(v => v.brand === window.rtoListFilter.brand);
        }
        if (window.rtoListFilter.programName !== 'all') {
            displayVehicles = displayVehicles.filter(v => {
                const p = state.programs.find(prog => prog.id === v.programId);
                return p && p.name === window.rtoListFilter.programName;
            });
        }
        if (window.rtoListFilter.model !== 'all') {
            displayVehicles = displayVehicles.filter(v => v.model === window.rtoListFilter.model);
        }
    }

    // Calculate display-level stats for the top bar
    const totalUnits = displayVehicles.length || 1;
    const activeUnits = displayVehicles.filter(v => v.status === 'active').length;
    const healthPct = Math.round((activeUnits / totalUnits) * 100);
    const maturityPct = displayVehicles.length > 0 ? Math.round(displayVehicles.reduce((acc, v) => acc + (getRTOProgress(v)?.paidPct || 0), 0) / displayVehicles.length) : 0;

    // --- Pagination (10 per page) ---
    const PAGE_SIZE = 10;
    const totalPages = Math.ceil(displayVehicles.length / PAGE_SIZE) || 1;
    if (programListPage > totalPages) programListPage = totalPages;
    const paginated = displayVehicles.slice((programListPage - 1) * PAGE_SIZE, programListPage * PAGE_SIZE);

    const tableRows = paginated.map(v => {
        const prog = getRTOProgress(v);
        const lastPayment = v.lastPaymentDate ? new Date(v.lastPaymentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—';
        const statusColor = v.status === 'active' ? 'var(--c-success)' : (v.status === 'grace' ? 'var(--c-warning)' : 'var(--c-danger)');
        const programName = state.programs.find(p => p.id === v.programId)?.shortName || '—';

        // Find user for phone/risk
        const rider = state.users.find(u => u.name === v.customer);
        const riskColor = getRiskColor(rider?.riskLabel || 'Medium');
        const riderPhone = rider?.phone || v.phone || '—';

        const progressHtml = prog ? `
            <div style="width:120px">
                <div style="display:flex; justify-content:space-between; font-size: var(--text-xs); margin-bottom:4px; font-weight:700">
                    <span style="color:var(--t1)">${prog.paidPct}%</span>
                    <span style="color:var(--t3)">${prog.daysLeft}d left</span>
                </div>
                <div class="vl-rto-track" style="width:100%; height:6px; background:var(--s3); border-radius:3px; overflow:hidden">
                    <div class="vl-rto-fill" style="width:${prog.paidPct}%; height:100%; background:var(--g)"></div>
                </div>
            </div>
        ` : '<span style="color:var(--t3); font-size: var(--text-sm)">—</span>';

        return `
            <tr>
                <td>
                    <div style="font-size: var(--text-sm); color:var(--p); font-weight:700; margin-bottom:2px">${programName}</div>
                    <div style="font-size: var(--text-md); font-weight:700; font-family:'IBM Plex Mono', monospace; color:var(--t1)">${v.rtoId}</div>
                </td>
                <td>
                    <div style="font-weight:700; font-size: var(--text-lg); color:var(--t1)">${v.customer || 'Available'}</div>
                    <div style="display:flex; align-items:center; gap:6px; margin-top:2px">
                        <div style="width:8px; height:8px; border-radius:50%; background:${riskColor}"></div>
                        <div style="font-size: var(--text-sm); color:var(--t3); font-weight:600">${rider?.riskLabel || 'Medium'} Risk</div>
                    </div>
                </td>
                <td style="text-align:center">
                    <div style="font-weight:800; font-size: var(--text-lg); color:${v.credits > 2 ? 'var(--t1)' : 'var(--c-danger)'}">${v.credits}d</div>
                </td>
                <td style="text-align:center">
                    <div style="display:flex; justify-content:center; gap:4px">
                        ${v.immobilizeLog?.length > 0 ? `
                            <div class="vl-pill" style="background:rgba(239, 68, 68, 0.15); color:var(--c-danger); border-color:rgba(239, 68, 68, 0.3); padding:2px 6px; font-weight:800; font-size: var(--text-sm)" title="${v.immobilizeLog.length} Immobilizations">
                                🔒 ${v.immobilizeLog.length}
                            </div>
                        ` : '<span style="color:var(--t3); opacity:0.3">—</span>'}
                        ${v.graceEncounters > 0 ? `
                            <div class="vl-pill" style="background:rgba(245, 158, 11, 0.15); color:var(--c-warning); border-color:rgba(245, 158, 11, 0.3); padding:2px 6px; font-weight:800; font-size: var(--text-sm)" title="${v.graceEncounters} Grace Period Entries">
                                ⚠️ ${v.graceEncounters}
                            </div>
                        ` : '<span style="color:var(--t3); opacity:0.3">—</span>'}
                    </div>
                </td>
                <td>
                    <div style="font-weight:800; font-family:'IBM Plex Mono', monospace; font-size: var(--text-md); color:var(--t1); letter-spacing:0.02em">${v.plate}</div>
                    <div style="display:flex; align-items:center; gap:6px; margin-top:2px">
                        <div class="vl-status" style="padding:2px 6px; font-size:var(--text-2xs); background:${statusColor}22; color:${statusColor}; border-radius:4px; font-weight:800">${v.status.toUpperCase()}</div>
                        <div style="font-size: var(--text-xs); color:var(--t3); font-weight:600">${v.model}</div>
                    </div>
                </td>
                <td style="text-align:right">
                    <div style="font-size: var(--text-md); font-weight:600; color:var(--t1)">${v.lastPaymentAmount ? formatShortCurrency(v.lastPaymentAmount) : '—'}</div>
                    <div style="font-size: var(--text-xs); color:var(--t3)">${lastPayment}</div>
                </td>
                <td>
                     ${progressHtml}
                </td>
                <td style="text-align:right">
                    <button class="vl-pill" style="padding:6px 12px; font-weight:700" onclick="window.openVehicleDrawer('${v.id}')">Audit</button>
                </td>
            </tr>
        `;
    }).join('');

    elRtoFleetContent.innerHTML = `
        <div class="program-layout" style="flex-direction:column; height: 100%;">
            <!-- Top Nav -->
            <div class="adm-top-nav" style="border-bottom: 1px solid var(--b1); overflow-x: auto; background: var(--s0);">
                <div class="adm-nav horizontal-adm" style="padding: 0 20px;">
                    <div class="adm-ni ${state.filter.program === 'all' ? 'on' : ''}" style="flex-direction:column; align-items:flex-start; padding:12px 16px; min-width:160px; height:100%; justify-content:center; box-sizing:border-box" onclick="window.selectProgram('all')">
                        <div style="font-weight:800; font-size: var(--text-base)">All Programs</div>
                        <div style="font-size: var(--text-sm); opacity:0.6; margin-top:4px">Consolidated View</div>
                    </div>
                    ${topNavItems}
                    <div style="padding: 10px; display:flex; align-items:center;">
                         <button class="vl-pill" onclick="window.document.querySelector('.nav-tab[data-tab=\\'programs\\']').click()">+ New Program</button>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="program-main" style="padding: 24px;">
                <div class="vl-header" style="margin-bottom:24px">
                    <div>
                        <h2 class="vl-title">${viewTitle}</h2>
                        <p style="font-size: var(--text-base); color:var(--t3); margin-top:4px">${viewSubtitle}</p>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center">
                        ${state.filter.program !== 'all' ? `
                            <button class="vl-pill" onclick="window.rto.openProgramModal('${state.filter.program}')">⚙️ Scheme Settings</button>
                            <button class="vl-pill danger" onclick="window.rto.confirmDeleteProgram('${state.filter.program}')">🗑️ Delete</button>
                        ` : ''}
                    </div>
                </div>

                <!-- Program Pulse Stats Cards -->
                <div class="program-stats-grid">
                    <div class="program-card-stat">
                        <div class="label">Active Units</div>
                        <div class="value" style="color:var(--c-success)">${displayVehicles.filter(v => v.status === 'active').length}</div>
                    </div>
                    <div class="program-card-stat">
                        <div class="label">Grace Units</div>
                        <div class="value" style="color:var(--c-warning)">${displayVehicles.filter(v => v.status === 'grace').length}</div>
                    </div>
                    <div class="program-card-stat">
                        <div class="label">Locked Units</div>
                        <div class="value" style="color:var(--c-danger)">${displayVehicles.filter(v => v.status === 'immobilized').length}</div>
                    </div>
                    
                    <div class="program-card-stat has-tooltip clickable" onclick="window.popoutProgramStats('health', '${state.filter.program}')">
                        <div class="label">Collection Health ℹ️</div>
                        <div class="value" style="color:var(--p)">${healthPct}%</div>
                        <div class="program-tooltip">
                            <strong>Audit Detail Available</strong><br>
                            Logic: (Active / Total) × 100.<br>
                            Click to open full collection health report.
                        </div>
                    </div>

                    <div class="program-card-stat has-tooltip clickable" onclick="window.popoutProgramStats('maturity', '${state.filter.program}')">
                        <div class="label">Fleet Maturity ℹ️</div>
                        <div class="value" style="color:var(--ac)">${maturityPct}%</div>
                        <div class="program-tooltip">
                            <strong>Maturity Forecast Available</strong><br>
                            Click to view asset recovery progress and ownership transfer forecasts.
                        </div>
                    </div>
                </div>

                <div class="card" style="padding:0; overflow:hidden; flex:1; display:flex; flex-direction:column">
                    <!-- Advanced Filters Row -->
                    <div style="padding:16px 20px; border-bottom:1px solid var(--b1); background:var(--s2); display:flex; gap:16px; align-items:center; flex-wrap:wrap">
                        <div style="font-weight:700; color:var(--dw); font-size:var(--text-md); margin-right:8px;">Deep Filters:</div>
                        
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <label style="font-size: var(--text-xs); color:var(--dt3); font-weight:600;">Operator / Dealer</label>
                            <select id="rtoFilterOperator" class="form-control" style="width:160px; padding:6px 12px; font-size:var(--text-sm);" onchange="window.setRtoFilter('operator', this.value)">
                                <option value="all">All Operators</option>
                                ${Array.from(new Set(state.vehicles.map(v => v.operator).filter(Boolean))).map(op => `<option value="${op}" ${window.rtoListFilter?.operator === op ? 'selected' : ''}>${op}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <label style="font-size: var(--text-xs); color:var(--dt3); font-weight:600;">Brand / Maker</label>
                            <select id="rtoFilterBrand" class="form-control" style="width:160px; padding:6px 12px; font-size:var(--text-sm);" onchange="window.setRtoFilter('brand', this.value)">
                                <option value="all">All Brands</option>
                                ${Array.from(new Set(state.vehicles.map(v => v.brand).filter(Boolean))).map(b => `<option value="${b}" ${window.rtoListFilter?.brand === b ? 'selected' : ''}>${b}</option>`).join('')}
                            </select>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <label style="font-size: var(--text-xs); color:var(--dt3); font-weight:600;">Program Name</label>
                            <select id="rtoFilterProgram" class="form-control" style="width:160px; padding:6px 12px; font-size:var(--text-sm);" onchange="window.setRtoFilter('programName', this.value)">
                                <option value="all">All Programs</option>
                                ${Array.from(new Set(state.programs.map(p => p.name).filter(Boolean))).map(pn => `<option value="${pn}" ${window.rtoListFilter?.programName === pn ? 'selected' : ''}>${pn}</option>`).join('')}
                            </select>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <label style="font-size: var(--text-xs); color:var(--dt3); font-weight:600;">Motor Type / Model</label>
                            <select id="rtoFilterModel" class="form-control" style="width:160px; padding:6px 12px; font-size:var(--text-sm);" onchange="window.setRtoFilter('model', this.value)">
                                <option value="all">All Models</option>
                                ${Array.from(new Set(state.vehicles.map(v => v.model).filter(Boolean))).map(m => `<option value="${m}" ${window.rtoListFilter?.model === m ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div style="overflow-y:auto; flex:1">
                        <table class="vl-table">
                            <thead>
                                <tr>
                                    <th>Program / ID</th>
                                    <th>Rider / Risk Audit</th>
                                    <th style="text-align:center">Credit</th>
                                    <th style="text-align:center">Collections Audit</th>
                                    <th>Vehicle / Status</th>
                                    <th style="text-align:right">Last Payment</th>
                                    <th>Progress</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows || '<tr><td colspan="10" style="text-align:center; padding:100px; color:var(--t3)">📭<br>No matching records found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="vl-pagination" style="border-top:1px solid var(--b1); margin-top:0; padding:16px 20px">
                    <button class="vl-page-btn" onclick="window.changeProgramPage(-1)" ${programListPage === 1 ? 'disabled' : ''}>Prev</button>
                    <div class="vl-page-info">Page ${programListPage} of ${totalPages}</div>
                    <button class="vl-page-btn" onclick="window.changeProgramPage(1)" ${programListPage === totalPages ? 'disabled' : ''}>Next</button>
                </div>
            </div>
        </div>

        <style>
            .program-layout {
                display: flex;
                height: calc(100vh - 120px);
                background: var(--s1);
                overflow: hidden;
            }
            .program-sidebar {
                width: 260px;
                border-right: 1px solid var(--b1);
                background: var(--s1);
                display: flex;
                flex-direction: column;
            }
            .program-sidebar-header {
                padding: 20px;
                border-bottom: 1px solid var(--b1);
            }
            .program-sidebar-scroll {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
            }
            .program-sidebar-item {
                padding: 12px 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                margin-bottom: 4px;
                border: 1px solid transparent;
            }
            .program-sidebar-item:hover {
                background: var(--s2);
                border-color: var(--b1);
            }
            .program-sidebar-item.active {
                background: var(--g);
                color: #000;
                border-color: var(--g);
            }
            .program-card-stat.clickable:hover {
                border-color: var(--p);
                background: rgba(0, 229, 195, 0.05);
                cursor: pointer;
            }
            .program-main {
                flex: 1;
                width: 100%;
                display: flex;
                flex-direction: column;
                background: var(--s1);
                overflow: hidden;
            }
            /* Stats Card Grid */
            .program-stats-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 16px;
                margin-bottom: 24px;
            }
            .program-card-stat {
                background: var(--s2);
                border: 1px solid var(--b1);
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                position: relative;
                transition: transform 0.2s, border-color 0.2s;
            }
            .program-card-stat:hover {
                border-color: var(--b2);
                transform: translateY(-2px);
            }
            .program-card-stat .label {
                font-size: var(--text-sm);
                font-weight: 700;
                color: var(--t3);
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 6px;
            }
            .program-card-stat .value {
                font-size: var(--text-4xl);
                font-weight: 800;
                font-family: var(--font-mono);
            }

            /* Tooltip Stylings */
            .has-tooltip { cursor: help; }
            .program-tooltip {
                visibility: hidden;
                width: 240px;
                background: var(--s3);
                color: var(--t1);
                text-align: left;
                border-radius: 8px;
                padding: 12px;
                position: absolute;
                z-index: 1000;
                bottom: 125%;
                left: 50%;
                margin-left: -120px;
                opacity: 0;
                transition: opacity 0.3s;
                border: 1px solid var(--b2);
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                font-size: var(--text-md);
                line-height: 1.5;
                pointer-events: none;
            }
            .program-tooltip::after {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: var(--b2) transparent transparent transparent;
            }
            .has-tooltip:hover .program-tooltip {
                visibility: visible;
                opacity: 1;
            }
        </style>
    `;
};

window.popoutProgramStats = (type, programId) => {
    const p = programId === 'all' ? { name: 'All Programs', shortName: 'FLEET' } : state.programs.find(x => x.id === programId);
    let title = '';
    let html = '';

    // Calculate real-time stats
    const displayVehicles = programId === 'all'
        ? state.vehicles
        : state.vehicles.filter(v => v.programId === programId);

    const total = displayVehicles.length || 1;
    const activeCount = displayVehicles.filter(v => v.status === 'active').length;
    const healthPct = Math.round((activeCount / total) * 100);
    const maturityPct = displayVehicles.length > 0 ? Math.round(displayVehicles.reduce((acc, v) => acc + (getRTOProgress(v)?.paidPct || 0), 0) / displayVehicles.length) : 0;

    if (type === 'health') {
        const healthColor = healthPct > 95 ? 'var(--c-success)' : (healthPct > 90 ? 'var(--c-warning)' : 'var(--c-danger)');
        const variance = (healthPct - 100).toFixed(1);

        title = `Collection Health Audit: ${p.shortName}`;
        html = `
            <div style="padding:20px">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px">
                    <div class="card" style="padding:15px; background:var(--s3)">
                        <div style="font-size: var(--text-sm); color:var(--t3); font-weight:700">COLLECTION HEALTH</div>
                        <div style="font-size: var(--text-5xl); font-weight:800; color:${healthColor}">${healthPct}%</div>
                    </div>
                    <div class="card" style="padding:15px; background:var(--s3)">
                        <div style="font-size: var(--text-sm); color:var(--t3); font-weight:700">PAYMENT VARIANCE</div>
                        <div style="font-size: var(--text-5xl); font-weight:800; color:${variance < 0 ? 'var(--c-danger)' : 'var(--c-success)'}">${variance}% <span style="font-size: var(--text-base); font-weight:400; color:var(--t3)">vs Target</span></div>
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.2); border-radius:12px; padding:20px; border:1px solid var(--b1); margin-bottom:20px">
                    <h4 style="margin-bottom:12px; font-size: var(--text-xl); display:flex; align-items:center; gap:8px">📋 Data Audit Breakdown</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size: var(--text-base)">
                        <div style="color:var(--t3)">Total Assets:</div>
                        <div style="text-align:right; font-weight:700; color:var(--t1)">${total} Units</div>
                        <div style="color:var(--t3)">Healthy (Active):</div>
                        <div style="text-align:right; font-weight:700; color:var(--c-success)">${activeCount} Units</div>
                        <div style="color:var(--t3)">Non-Performing:</div>
                        <div style="text-align:right; font-weight:700; color:var(--c-danger)">${total - activeCount} Units</div>
                    </div>
                    <div style="margin-top:12px; font-size: var(--text-sm); color:var(--t3); border-top:1px solid var(--b1); padding-top:8px">
                        Calculation: (Active / Total) × 100 = <strong>${healthPct}%</strong>
                    </div>
                </div>

                <div style="background:rgba(0,0,0,0.2); border-radius:12px; padding:20px; border:1px solid var(--b1)">
                    <h4 style="margin-bottom:12px; font-size: var(--text-xl); display:flex; align-items:center; gap:8px">🧠 Executive Intelligence</h4>
                    <p style="font-size: var(--text-base); color:var(--t2); margin-bottom:15px">Health is calculated by the ratio of <strong>Active</strong> (Paid) units vs total assigned units. Higher percentages indicate strong payment discipline.</p>
                    
                    <div style="display:flex; flex-direction:column; gap:10px">
                        <div style="display:flex; align-items:center; justify-content:space-between; font-size: var(--text-md)">
                            <span style="color:var(--c-success); font-weight:700">● GOOD (>95%)</span>
                            <span style="color:var(--t3)">Operational Excellence</span>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; font-size: var(--text-md)">
                            <span style="color:var(--c-warning); font-weight:700">● WARNING (90-95%)</span>
                            <span style="color:var(--t3)">Increase collection rigor</span>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; font-size: var(--text-md)">
                            <span style="color:var(--c-danger); font-weight:700">● CRITICAL (<90%)</span>
                            <span style="color:var(--t3)">Review rider risk profiles</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top:25px; display:flex; justify-content:flex-end">
                    <button class="btn primary" onclick="window.closeModals()">Close Audit</button>
                </div>
            </div>
        `;
    } else {
        const maturityColor = maturityPct > 75 ? 'var(--c-success)' : (maturityPct > 25 ? 'var(--ac)' : 'var(--c-warning)');

        title = `Fleet Maturity Snapshot: ${p.shortName}`;
        html = `
            <div style="padding:20px">
                <div style="height:12px; background:var(--b1); border-radius:50px; margin-bottom:15px; overflow:hidden; border:1px solid var(--s3)">
                    <div style="width:${maturityPct}%; height:100%; background:${maturityColor}; border-radius:50px; box-shadow: 0 0 10px ${maturityColor}55"></div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:25px">
                    <span style="font-size: var(--text-md); color:var(--t3); font-weight:600">NEW 0%</span>
                    <span style="font-size: var(--text-xl); font-weight:800; color:${maturityColor}">${maturityPct}% AVG RECOVERY</span>
                    <span style="font-size: var(--text-md); color:var(--t3); font-weight:600">OWNED 100%</span>
                </div>

                <div style="background:rgba(0,0,0,0.2); border-radius:12px; padding:20px; border:1px solid var(--b1)">
                    <h4 style="margin-bottom:12px; font-size: var(--text-xl); display:flex; align-items:center; gap:8px">📈 Lifecycle Benchmarks</h4>
                    <p style="font-size: var(--text-base); color:var(--t2); margin-bottom:15px">Maturity represents the average contract completion across the fleet. This determines when assets transition from RTO to full ownership.</p>
                    
                    <div style="display:flex; flex-direction:column; gap:10px">
                        <div style="display:flex; align-items:center; justify-content:space-between; font-size: var(--text-md)">
                            <span style="color:var(--c-success); font-weight:700">● HIGH (>75%)</span>
                            <span style="color:var(--t3)">Impending Equity Transfer</span>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; font-size: var(--text-md)">
                            <span style="color:var(--ac); font-weight:700">● MID (25-75%)</span>
                            <span style="color:var(--t3)">Operational Stable Phase</span>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; font-size: var(--text-md)">
                            <span style="color:var(--c-warning); font-weight:700">● EARLY (<25%)</span>
                            <span style="color:var(--t3)">Growth & Deployment</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top:25px; display:flex; justify-content:flex-end">
                    <button class="btn primary" onclick="window.closeModals()">Close Audit</button>
                </div>
            </div>
        `;
    }

    document.getElementById('gpsModalTitle').innerText = title;
    document.getElementById('gpsModalContent').innerHTML = html;
    document.getElementById('gpsModalOverlay').classList.add('active');
};

window.selectProgram = (programId) => {
    state.filter.program = programId;
    const rtoTab = document.querySelector('.nav-tab[data-tab="rto-fleet"]');
    if (rtoTab) {
        rtoTab.click();
    } else {
        renderProgramListView();
    }
};

window.toggleProgramExpansion = (programId) => {
    window.selectProgram(programId);
};

window.openProgramModal = (programId = null) => {
    const p = programId ? state.programs.find(x => x.id === programId) : {
        id: `P-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        name: '',
        shortName: '',
        partnerId: partners[0].id,
        motorModel: '',
        type: 'RTO',
        price: 30000,
        grace: 7,
        targetScore: 60
    };

    const isEdit = !!programId;
    const title = isEdit ? 'Edit Program Terms' : 'Create New Program';

    const html = `
        <div class="modal-form">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                <div class="form-group">
                    <label>Program Name</label>
                    <input type="text" id="pName" value="${p.name}" placeholder="e.g. Maka RTO Standard">
                </div>
                <div class="form-group">
                    <label>Short Name</label>
                    <input type="text" id="pShort" value="${p.shortName}" placeholder="e.g. Maka">
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                <div class="form-group">
                    <label>Partner</label>
                    <select id="pPartner">
                        ${partners.map(part => `<option value="${part.id}" ${p.partnerId === part.id ? 'selected' : ''}>${part.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Motor Model</label>
                    <input type="text" id="pMotor" value="${p.motorModel || ''}" placeholder="e.g. Tangkas X7">
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                <div class="form-group">
                    <label>Daily Price (Rp)</label>
                    <input type="number" id="pPrice" value="${p.price}">
                </div>
                <div class="form-group">
                    <label>Grace Period (Days)</label>
                    <input type="number" id="pGrace" value="${p.grace}">
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                <div class="form-group">
                    <label>Target Min Score</label>
                    <input type="number" id="pScore" value="${p.targetScore || 60}">
                </div>
                <div class="form-group">
                    <label>Program Type</label>
                    <select id="pType">
                        <option value="RTO" ${p.type === 'RTO' ? 'selected' : ''}>Rent To Own (RTO)</option>
                        <option value="Rental" ${p.type === 'Rental' ? 'selected' : ''}>Daily Rental</option>
                    </select>
                </div>
            </div>
            <div class="modal-actions" style="margin-top:20px; display:flex; justify-content:flex-end; gap:12px;">
                <button class="btn btn-secondary" onclick="document.getElementById('gpsModalOverlay').classList.remove('active')">Cancel</button>
                <button class="btn btn-primary" onclick="window.saveProgram('${p.id}', ${isEdit})">${isEdit ? 'Update Program' : 'Create Program'}</button>
            </div>
        </div>
    `;

    document.getElementById('gpsModalTitle').innerText = `🤝 ${title}`;
    document.getElementById('gpsModalContent').innerHTML = html;
    document.getElementById('gpsModalOverlay').classList.add('active');
};

window.saveProgram = (id, isEdit) => {
    const data = {
        id,
        name: document.getElementById('pName').value,
        shortName: document.getElementById('pShort').value,
        partnerId: document.getElementById('pPartner').value,
        motorModel: document.getElementById('pMotor').value,
        price: parseInt(document.getElementById('pPrice').value || 30000),
        grace: parseInt(document.getElementById('pGrace').value || 7),
        targetScore: parseInt(document.getElementById('pScore').value || 60),
        type: document.getElementById('pType').value
    };

    if (isEdit) updateProgram(id, data);
    else addProgram(data);

    document.getElementById('gpsModalOverlay').classList.remove('active');
    renderProgramsTable();
    if (typeof window.updatePrograms === 'function') window.updatePrograms();

    // Always refresh RTO Fleet if it exists, to keep filters in sync
    if (typeof window.renderProgramListView === 'function') {
        window.renderProgramListView();
    }
};

// Wire up for index.html calls
if (!window.rto) window.rto = {};
window.rto.openProgramModal = window.openProgramModal;
window.rto.saveProgram = window.saveProgram;
window.rto.confirmDeleteProgram = window.confirmDeleteProgram;

window.openProgramDetails = (id) => {
    const p = state.programs.find(x => x.id === id);
    if (!p) return;

    // Calculate metrics strictly for this program
    const pVehicles = state.vehicles.filter(v => v.programId === p.id);
    const fleetSize = pVehicles.length;
    const activeUsers = pVehicles.filter(v => v.customer).length;
    const breakdown = { active: 0, grace: 0, immobilized: 0, paused: 0, available: 0 };
    pVehicles.forEach(v => {
        if (breakdown[v.status] !== undefined) breakdown[v.status]++;
    });
    const revenueEst = activeUsers * p.price;

    // Generate Promotions List
    const promos = p.promotions || [];
    let promoHtml = promos.length === 0 ?
        '<div style="color:var(--t3); padding:20px; text-align:center; border:1px dashed var(--b1); border-radius:8px">No active promotions for this program.</div>' :
        promos.map(pr => `
            <div style="background:var(--s1); padding:16px; border-radius:8px; border:1px solid var(--b1); display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                <div style="display:flex; align-items:center; gap:12px">
                    ${pr.image ? `<img src="${pr.image}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; border:1px solid var(--b1)">` : `<div style="width:40px; height:40px; border-radius:6px; background:var(--s2); display:flex; align-items:center; justify-content:center; font-size:20px">🎁</div>`}
                    <div>
                        <div style="font-weight:700; color:var(--t1)">${pr.title}</div>
                        <div style="font-size:var(--text-xs); color:var(--t3); text-transform:uppercase; margin-top:4px">${pr.type}</div>
                    </div>
                </div>
                <div class="badge" style="background:${pr.status === 'active' ? 'var(--c-success)' : 'var(--t3)'}; color:#000">${pr.status}</div>
            </div>
        `).join('');

    // Generate Settings Form inline
    const title = p.name;
    const settingsHtml = `
        <div class="modal-form" style="padding:0">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                <div class="form-group"><label>Program Name</label><input type="text" id="dpName" value="${p.name}"></div>
                <div class="form-group"><label>Short Name</label><input type="text" id="dpShort" value="${p.shortName}"></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                <div class="form-group">
                    <label>Partner</label>
                    <select id="dpPartner">
                        ${partners.map(part => `<option value="${part.id}" ${p.partnerId === part.id ? 'selected' : ''}>${part.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Motor Model</label><input type="text" id="dpMotor" value="${p.motorModel || ''}"></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                <div class="form-group"><label>Daily Price (Rp)</label><input type="number" id="dpPrice" value="${p.price}"></div>
                <div class="form-group"><label>Grace Period (Days)</label><input type="number" id="dpGrace" value="${p.grace}"></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
                <div class="form-group"><label>Target Min Score</label><input type="number" id="dpScore" value="${p.targetScore || 60}"></div>
                <div class="form-group"><label>Program Type</label>
                    <select id="dpType">
                        <option value="RTO" ${p.type === 'RTO' ? 'selected' : ''}>Rent To Own (RTO)</option>
                        <option value="Rental" ${p.type === 'Rental' ? 'selected' : ''}>Daily Rental</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primary" onclick="window.saveProgramDetails('${p.id}')" style="width:100%">💾 Save Configurations</button>
        </div>
    `;

    const html = `
        <div class="drawer-header" style="border-bottom:none">
            <button class="drawer-close" onclick="window.closeDrawer()">✕</button>
            <div style="flex:1">
                <div class="drawer-name" style="font-size:24px; color:var(--b-yellow)">${p.name}</div>
                <div class="drawer-sub" style="font-family:'IBM Plex Mono'">${p.id} • ${p.partnerId.toUpperCase()}</div>
            </div>
        </div>

        <!-- Custom Tabs for Drawer -->
        <div style="display:flex; border-bottom:1px solid var(--b1); padding:0 32px">
            <div class="p-tab active" onclick="window.switchPTab(this, 'p-overview')" style="padding:12px 24px; cursor:pointer; font-weight:700; border-bottom:2px solid var(--ac); color:var(--t1)">Overview & Ops</div>
            <div class="p-tab" onclick="window.switchPTab(this, 'p-promos')" style="padding:12px 24px; cursor:pointer; font-weight:600; color:var(--t3)">Promotions</div>
            <div class="p-tab" onclick="window.switchPTab(this, 'p-settings')" style="padding:12px 24px; cursor:pointer; font-weight:600; color:var(--t3)">⚙️ Settings</div>
        </div>

        <div class="drawer-body" style="padding:24px 32px">
            <!-- OVERVIEW TAB -->
            <div id="p-overview" class="p-content-pane">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px">
                    <div style="background:var(--s1); padding:20px; border-radius:12px; border:1px solid var(--b1)">
                        <div style="color:var(--t3); font-size:var(--text-xs); letter-spacing:1px; text-transform:uppercase; margin-bottom:8px">Fleet Size</div>
                        <div style="font-size:32px; font-weight:800; color:var(--t1)">${fleetSize}</div>
                    </div>
                    <div style="background:var(--s1); padding:20px; border-radius:12px; border:1px solid var(--b1)">
                        <div style="color:var(--t3); font-size:var(--text-xs); letter-spacing:1px; text-transform:uppercase; margin-bottom:8px">Active Users</div>
                        <div style="font-size:32px; font-weight:800; color:var(--c-success)">${activeUsers}</div>
                    </div>
                </div>
                
                <h4 style="margin-bottom:12px; color:var(--t2)">Status Breakdown</h4>
                <div style="background:var(--s1); border-radius:12px; border:1px solid var(--b1); padding:16px; margin-bottom:24px">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px"><span>🟢 Active</span><b>${breakdown.active}</b></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px"><span>🟡 Grace Period</span><b>${breakdown.grace}</b></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px"><span>🔴 Immobilized</span><b>${breakdown.immobilized}</b></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px"><span>⚪ Paused</span><b>${breakdown.paused}</b></div>
                    <div style="display:flex; justify-content:space-between; padding-top:8px; border-top:1px solid var(--b1)"><span>🔵 Available (Idle)</span><b>${breakdown.available}</b></div>
                </div>

                <div style="background:var(--s1); padding:20px; border-radius:12px; border:1px solid var(--c-success); margin-bottom:24px">
                    <div style="color:var(--t3); font-size:var(--text-xs); letter-spacing:1px; text-transform:uppercase; margin-bottom:8px">Est. Daily Revenue</div>
                    <div style="font-size:24px; font-weight:800; color:var(--c-success)">${formatRupiah(revenueEst)}</div>
                </div>

                <button class="btn btn-secondary" style="width:100%; justify-content:center" onclick="window.viewFleetForProgram('${p.id}')">View Fleet in Tracker →</button>
            </div>

            <!-- PROMOTIONS TAB -->
            <div id="p-promos" class="p-content-pane" style="display:none">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; color:var(--t2)">Active Promotions</h4>
                    <button class="btn btn-secondary" style="padding:4px 12px; font-size:12px" onclick="window.openAddPromoModal('${p.id}')">+ Add Promo</button>
                </div>
                ${promoHtml}
            </div>

            <!-- SETTINGS TAB -->
            <div id="p-settings" class="p-content-pane" style="display:none">
                <h4 style="margin-bottom:16px; color:var(--t2)">Program Configurations</h4>
                ${settingsHtml}
            </div>
        </div>
    `;

    document.getElementById('drawerContent').innerHTML = html;
    document.getElementById('detailDrawer').classList.add('open');
    document.getElementById('drawerBackdrop').classList.add('open');
};

window.switchPTab = (tabEl, paneId) => {
    document.querySelectorAll('.p-tab').forEach(el => {
        el.style.borderBottom = 'none';
        el.style.color = 'var(--t3)';
        el.style.fontWeight = '600';
    });
    tabEl.style.borderBottom = '2px solid var(--ac)';
    tabEl.style.color = 'var(--t1)';
    tabEl.style.fontWeight = '700';

    document.querySelectorAll('.p-content-pane').forEach(el => el.style.display = 'none');
    document.getElementById(paneId).style.display = 'block';
};

window.viewFleetForProgram = (programId) => {
    window.closeDrawer();
    window.selectProgram(programId); // Filters and switches to RTO Fleet tab
};

window.saveProgramDetails = (id) => {
    const data = {
        name: document.getElementById('dpName').value,
        shortName: document.getElementById('dpShort').value,
        partnerId: document.getElementById('dpPartner').value,
        motorModel: document.getElementById('dpMotor').value,
        price: parseInt(document.getElementById('dpPrice').value || 0),
        grace: parseInt(document.getElementById('dpGrace').value || 0),
        targetScore: parseInt(document.getElementById('dpScore').value || 0),
        type: document.getElementById('dpType').value
    };

    updateProgram(id, data);

    // Refresh Drawer Details
    window.openProgramDetails(id);

    // Refresh Table
    renderProgramsTable();
    if (typeof window.updatePrograms === 'function') window.updatePrograms(); // sync with app.js
};

window.openAddPromoModal = (programId) => {
    const html = `
        <div class="modal-form">
            <div class="form-group" style="margin-bottom:12px">
                <label>Promotion Title</label>
                <input type="text" id="promoTitle" placeholder="e.g. Free Helmet & Jacket">
            </div>
            <div class="form-group" style="margin-bottom:12px">
                <label>Promotion Type</label>
                <select id="promoType">
                    <option value="gear">Apparel / Gear</option>
                    <option value="discount">Discount / Cashback</option>
                    <option value="service">Service / Maintenance</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom:20px">
                <label>Image URL (Optional)</label>
                <input type="text" id="promoImage" placeholder="https://example.com/image.jpg">
            </div>
            <div class="modal-actions" style="display:flex; justify-content:flex-end; gap:12px;">
                <button class="btn btn-secondary" onclick="document.getElementById('gpsModalOverlay').classList.remove('active')">Cancel</button>
                <button class="btn btn-primary" onclick="window.savePromo('${programId}')">Save Promotion</button>
            </div>
        </div>
    `;
    document.getElementById('gpsModalTitle').innerText = `🎁 Add Promotion`;
    document.getElementById('gpsModalContent').innerHTML = html;
    document.getElementById('gpsModalOverlay').classList.add('active');
};

window.savePromo = (programId) => {
    const p = state.programs.find(x => x.id === programId);
    if (!p) return;

    if (!p.promotions) p.promotions = [];

    const newPromo = {
        id: 'PRMO-' + Math.floor(Math.random() * 10000),
        title: document.getElementById('promoTitle').value || 'New Promotion',
        type: document.getElementById('promoType').value,
        image: document.getElementById('promoImage').value || null,
        status: 'active'
    };

    p.promotions.push(newPromo);
    updateProgram(programId, p);

    document.getElementById('gpsModalOverlay').classList.remove('active');

    // Refresh Drawer Details directly to the Promotions tab
    window.openProgramDetails(programId);
    setTimeout(() => {
        const promoTab = Array.from(document.querySelectorAll('.p-tab')).find(el => el.innerText.includes('Promotions'));
        if (promoTab) window.switchPTab(promoTab, 'p-promos');
    }, 50);
};

window.confirmDeleteProgram = (id) => {
    const units = state.vehicles.filter(v => v.programId === id).length;
    if (units > 0) {
        alert(`Cannot delete program.There are ${units} vehicles assigned to this scheme.`);
        return;
    }
    if (confirm('Are you sure you want to delete this program?')) {
        deleteProgram(id);
        renderProgramListView();
    }
};


window.setProgramFilter = (programId) => {
    state.filter.program = programId;
    // Switch to fleet view
    const fleetTab = document.querySelector('.nav-tab[data-tab="fleet"]');
    if (fleetTab) fleetTab.click();
};

// ── Command Palette Logic ──────────────────────────────────────────
let cpSelectedIdx = -1;
let cpMatches = [];

export const openCommandPalette = () => {
    const overlay = document.getElementById('commandPaletteOverlay');
    const input = document.getElementById('cpInput');
    if (!overlay || !input) return;

    overlay.classList.add('open');
    input.value = '';
    input.focus();
    updateCommandPaletteResults('');
};

export const closeCommandPalette = () => {
    const overlay = document.getElementById('commandPaletteOverlay');
    if (overlay) overlay.classList.remove('open');
};

const updateCommandPaletteResults = (q) => {
    const resultsContainer = document.getElementById('cpResults');
    if (!resultsContainer) return;

    if (!q) {
        resultsContainer.innerHTML = '<div class="cp-hint">Type to search vehicles, riders, or RTO IDs...</div>';
        cpMatches = [];
        cpSelectedIdx = -1;
        return;
    }

    const query = q.toLowerCase();
    cpMatches = [];

    // 1. Search Vehicles (Plate, ID, RTO ID)
    state.vehicles.forEach(v => {
        if (v.plate.toLowerCase().includes(query) || v.id.toLowerCase().includes(query) || (v.rtoId && v.rtoId.toLowerCase().includes(query))) {
            cpMatches.push({ type: 'vehicle', id: v.id, title: v.plate, sub: `${v.rtoId || v.id} • ${v.customer || 'Available'} ` });
        }
    });

    // 2. Search Users
    state.users.forEach(u => {
        if (u.name.toLowerCase().includes(query) || u.userId.toLowerCase().includes(query)) {
            cpMatches.push({ type: 'user', id: u.userId, title: u.name, sub: `User ID: ${u.userId} • Joined ${new Date(u.joinDate).toLocaleDateString()} ` });
        }
    });

    // 3. Search Programs
    state.programs.forEach(p => {
        if (p.name.toLowerCase().includes(query) || p.shortName.toLowerCase().includes(query)) {
            cpMatches.push({ type: 'program', id: p.id, title: p.name, sub: `${p.type} • ${formatRupiah(p.price)}/day` });
        }
    });

    // Limit to top 10
    cpMatches = cpMatches.slice(0, 10);

    if (cpMatches.length === 0) {
        resultsContainer.innerHTML = '<div class="cp-hint">No results found for "' + q + '"</div>';
    } else {
        cpSelectedIdx = 0;
        renderCPMatches();
    }
};

const renderCPMatches = () => {
    const resultsContainer = document.getElementById('cpResults');
    resultsContainer.innerHTML = cpMatches.map((m, i) => `
        <div class="cp-item ${i === cpSelectedIdx ? 'selected' : ''}" onclick="window.selectCPItem(${i})">
            <div class="cp-icon">${m.type === 'vehicle' ? '🏍️' : m.type === 'user' ? '👤' : '🤝'}</div>
            <div class="cp-info">
                <div class="cp-name">${m.title}</div>
                <div class="cp-sub">${m.sub}</div>
            </div>
        </div>
    `).join('');

    const selectedItem = resultsContainer.children[cpSelectedIdx];
    if (selectedItem) selectedItem.scrollIntoView({ block: 'nearest' });
};

window.selectCPItem = (idx) => {
    const item = cpMatches[idx];
    if (!item) return;

    closeCommandPalette();

    if (item.type === 'vehicle') window.openVehicleDrawer(item.id);
    else if (item.type === 'user') window.openUserDrawer(item.id);
    else if (item.type === 'program') {
        const programTab = document.querySelector('.nav-tab[data-tab="programs"]');
        if (programTab) programTab.click();
        // Maybe scroll to it? renderProgramListView will show all.
    }
};

window.openChangelogModal = () => {
    const elOverlay = document.getElementById('gpsModalOverlay');
    const elTitle = document.getElementById('gpsModalTitle');
    const elContent = document.getElementById('gpsModalContent');

    if (!elOverlay || !elTitle || !elContent) return;

    elTitle.innerText = "Platform Updates — v1.6.1";
    elContent.innerHTML = `
        <div style="padding:4px">
            <div style="background:var(--s3); border:1px solid var(--b1); border-radius:12px; padding:20px; margin-bottom:20px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                    <h3 style="margin:0; font-size: var(--text-2xl); color:var(--ac)">🏗️ Latest Release: v1.6.1</h3>
                    <span style="font-size: var(--text-md); color:var(--t3); font-family:var(--font-mono)">2026-02-24</span>
                </div>
                <p style="font-size: var(--text-base); color:var(--t2); line-height:1.6">Introducing <strong>UI Standardization</strong>. This release unifies the pagination experience across all modules, ensuring a professional and predictable navigation pattern throughout the entire platform.</p>
            </div>

            <div style="display:flex; flex-direction:column; gap:20px">
                <div>
                    <h4 style="font-size: var(--text-base); font-weight:700; color:var(--t1); margin-bottom:10px; display:flex; align-items:center; gap:8px">
                        <span style="width:6px; height:6px; background:var(--ac); border-radius:50%"></span> UI STANDARDIZATION
                    </h4>
                    <ul style="font-size: var(--text-base); color:var(--t2); padding-left:18px; margin:0; display:flex; flex-direction:column; gap:8px">
                        <li><strong>Universal Pagination:</strong> All lists (Users, Fleet, Assets, GPS) now display exactly 10 items per page.</li>
                        <li><strong>Consistent Controls:</strong> Unified the clickable pagination footer style across every table in the app.</li>
                    </ul>
                </div>

                <div style="border-top: 1px dashed var(--b1); padding-top: 20px; margin-top: 10px;">
                    <h4 style="font-size: var(--text-base); font-weight:700; color:var(--t3); margin-bottom:10px; display:flex; align-items:center; gap:8px">
                        🔄 PREVIOUS: v1.6.0 (Navigation Update)
                    </h4>
                    <ul style="font-size: var(--text-sm); color:var(--t3); padding-left:18px; margin:0; display:flex; flex-direction:column; gap:6px; opacity: 0.8">
                        <li><strong>Sidebar Reorg:</strong> Reordered navigation to match business operations flow.</li>
                        <li><strong>Standardized Labels:</strong> Renamed modules (e.g., Vehicles → Assets) for industrial clarity.</li>
                    </ul>
                </div>
                        <li><strong>Promotions Engine:</strong> Integrated incentive management with image support.</li>
                    </ul>
                </div>
            </div>

            <div style="margin-top:30px; padding-top:20px; border-top:1px solid var(--b1); text-align:center">
                <button class="vl-pill" onclick="window.closeGPSModal()" style="width:120px">Got it, thanks!</button>
            </div>
        </div>
    `;
    elOverlay.classList.add('active');
};

window.closeGPSModal = () => {
    const elOverlay = document.getElementById('gpsModalOverlay');
    if (elOverlay) elOverlay.classList.remove('active');
};

// Event Listeners for Input
document.addEventListener('DOMContentLoaded', () => {
    const cpInput = document.getElementById('cpInput');
    if (!cpInput) return;

    cpInput.addEventListener('input', (e) => {
        updateCommandPaletteResults(e.target.value);
    });

    cpInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            cpSelectedIdx = (cpSelectedIdx + 1) % cpMatches.length;
            renderCPMatches();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            cpSelectedIdx = (cpSelectedIdx - 1 + cpMatches.length) % cpMatches.length;
            renderCPMatches();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (cpSelectedIdx !== -1) window.selectCPItem(cpSelectedIdx);
        } else if (e.key === 'Escape') {
            closeCommandPalette();
        }
    });

    const cpOverlay = document.getElementById('commandPaletteOverlay');
    cpOverlay.addEventListener('click', (e) => {
        if (e.target === cpOverlay) closeCommandPalette();
    });
});

