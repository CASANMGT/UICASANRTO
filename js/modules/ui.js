import { formatRupiah, timeAgo, getCountdown, downloadCSV } from './utils.js';
import { state, programs, partners, addProgram, updateProgram, deleteProgram } from './store.js';
import { getVehicleById, getVehicleTransactions, getRTOProgress, immobilizeVehicle, releaseVehicle, extendGrace, getAllVehicles, getSTNKAlert, getVehicleSTNKStats } from './vehicle.js';
import { getUserById, getUserVehicles, getUserTransactions, getRiskColor, getOccupationEmoji, getUsers } from './users.js';

// Elements
const elVehicleList = document.getElementById('vehicleList');
const elStatsBar = document.getElementById('statsBar');
const elStatusFilters = document.getElementById('statusFilters');

// New Elements for Vehicle/User List
const elVehicleListContent = document.getElementById('vehicleListContent');
const elUserListContent = document.getElementById('userListContent');
const elDetailDrawer = document.getElementById('detailDrawer');
const elDrawerBackdrop = document.getElementById('drawerBackdrop');
const elDrawerContent = document.getElementById('drawerContent');
const elProgramListContent = document.getElementById('programListContent');

// State for UI
let expandedCardId = null;
let currentPage = 1;

// State for new lists
let vehicleListFilter = { partner: 'all', status: 'all', search: '', program: 'all', sortBy: 'id', sortDir: 'asc' };
let userListFilter = { partner: 'all', risk: 'all', search: '', program: 'all', sortBy: 'name', sortDir: 'asc' };
let selectedProgramId = 'all';
let vehicleListPage = 1;
let userListPage = 1;

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
    if (!elStatsBar) return;

    let html = '';
    const format = (v) => typeof v === 'number' ? v.toLocaleString() : v;

    switch (tab) {
        case 'users':
            html = `
                <div class="card stat-card"><h3>Verified</h3><div class="value" style="color:#22C55E">${format(stats.verified)}</div></div>
                <div class="card stat-card"><h3>Active Riders</h3><div class="value" style="color:var(--ac)">${format(stats.activeRiders)}</div></div>
                <div class="card stat-card"><h3>High Risk</h3><div class="value" style="color:#EF4444">${format(stats.highRisk)}</div></div>
                <div class="card stat-card"><h3>Avg Risk</h3><div class="value" style="color:var(--p)">${stats.avgRisk}</div></div>
                <div class="card stat-card"><h3>KYC Pending</h3><div class="value" style="color:#F59E0B">${format(stats.kycPending)}</div></div>
                <div class="card stat-card"><h3>New (30d)</h3><div class="value" style="color:var(--g)">${format(stats.newRiders)}</div></div>
            `;
            break;

        case 'programs':
            html = `
                <div class="card stat-card"><h3>Schemes</h3><div class="value">${format(stats.activeSchemes)}</div></div>
                <div class="card stat-card"><h3>Portfolio Health</h3><div class="value" style="color:#22C55E">${stats.health}%</div></div>
                <div class="card stat-card"><h3>RTO Units</h3><div class="value" style="color:var(--ac)">${format(stats.rtoUnits)}</div></div>
                <div class="card stat-card"><h3>Avg Maturity</h3><div class="value" style="color:var(--p)">${stats.maturity}%</div></div>
                <div class="card stat-card"><h3>In Grace</h3><div class="value" style="color:#F59E0B">${format(stats.inGrace)}</div></div>
                <div class="card stat-card"><h3>Expiring (7d)</h3><div class="value" style="color:#EF4444">${format(stats.expiringSoon)}</div></div>
            `;
            break;

        case 'finance':
            html = `
                <div class="card stat-card"><h3>Total Revenue</h3><div class="value" style="color:var(--p)">${formatShortCurrency(stats.revenue)}</div></div>
                <div class="card stat-card"><h3>Monthly (Feb)</h3><div class="value" style="color:#22C55E">${formatShortCurrency(stats.monthly)}</div></div>
                <div class="card stat-card"><h3>Arrears Bal.</h3><div class="value" style="color:#EF4444">${formatShortCurrency(stats.arrears)}</div></div>
                <div class="card stat-card"><h3>Success Rate</h3><div class="value" style="color:var(--ac)">${stats.successRate}%</div></div>
                <div class="card stat-card"><h3>Daily Avg</h3><div class="value" style="color:var(--t2)">${formatShortCurrency(stats.dailyAvg)}</div></div>
                <div class="card stat-card"><h3>Pending Payout</h3><div class="value" style="color:var(--t3)">${formatShortCurrency(stats.pendingPayout)}</div></div>
            `;
            break;

        case 'vehicles':
            html = `
                <div class="card stat-card"><h3>Total Fleet</h3><div class="value">${format(stats.total)}</div></div>
                <div class="card stat-card"><h3>Operational</h3><div class="value" style="color:#22C55E">${format(stats.active)}</div></div>
                <div class="card stat-card"><h3>STNK < 30d</h3><div class="value" style="color:#F59E0B">${format(stats.stnkSoon)}</div></div>
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
                <div class="card stat-card"><h3>Warranty Warn</h3><div class="value" style="color:#EF4444">${format(stats.warrantySoon)}</div></div>
                <div class="card stat-card"><h3>Offline Gear</h3><div class="value" style="color:var(--t3)">${format(stats.offlineGear)}</div></div>
                <div class="card stat-card"><h3>Update Req.</h3><div class="value" style="color:#F59E0B">${format(stats.updateReq)}</div></div>
            `;
            break;

        case 'fleet':
        default:
            html = `
                <div class="card stat-card"><h3>Moving Now</h3><div class="value" style="color:#22C55E">${format(stats.moving)}</div></div>
                <div class="card stat-card"><h3>Parked/Idle</h3><div class="value" style="color:var(--ac)">${format(stats.parked)}</div></div>
                <div class="card stat-card"><h3>No Signal (Crit)</h3><div class="value" style="color:#EF4444">${format(stats.noSignal)}</div></div>
                <div class="card stat-card"><h3>Low Battery</h3><div class="value" style="color:#F59E0B">${format(stats.lowBat)}</div></div>
                <div class="card stat-card"><h3>Avg Speed</h3><div class="value" style="color:var(--p)">${stats.avgSpeed} kmh</div></div>
                <div class="card stat-card"><h3>Active Alerts</h3><div class="value" style="color:var(--d)">${format(stats.alerts)}</div></div>
            `;
            break;
    }

    elStatsBar.innerHTML = html;
};

export const renderFilters = (activeFilter, stats) => {
    if (!elStatusFilters) return;

    // Default stats if missing
    const s = stats || { total: 0, active: 0, expiring: 0, grace: 0, immobilized: 0, paused: 0, online: 0, offline: 0 };

    const filters = [
        { id: 'all', label: `All (${s.total})`, cls: 'btn-secondary' },
        { id: 'active', label: `Active (${s.active})`, cls: 'btn-success' },
        { id: 'expiring', label: `Expiring (${s.expiring})`, cls: 'btn-warning' },
        { id: 'grace', label: `Grace (${s.grace})`, cls: 'btn-danger-light' },
        { id: 'immobilized', label: `Locked (${s.immobilized})`, cls: 'btn-danger' },
        { id: 'paused', label: `Paused (${s.paused})`, cls: 'btn-secondary' },
        { id: 'online', label: `Online (${s.online})`, cls: 'btn-info' },
        // { id: 'offline', label: `Offline (${s.offline})`, cls: 'btn-secondary' } // Optional, can clutter
    ];

    // Using global event dispatch for simplicity
    elStatusFilters.innerHTML = filters.map(f => {
        const isActive = activeFilter === f.id;
        // const baseClass = isActive ? 'active' : ''; // Old way
        const style = isActive ? `border-bottom: 2px solid ${f.color}; color: ${f.color}; opacity: 1` : `opacity: 0.7`;

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
    if (!elVehicleList) return;

    if (vehicles.length === 0) {
        elVehicleList.innerHTML = `<div style="padding:20px; text-align:center; color:var(--t3)">No vehicles found</div>`;
        return;
    }

    // Pagination Logic
    const itemsPerPage = 20;
    const totalPages = Math.ceil(vehicles.length / itemsPerPage);

    // Ensure current page is valid
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = vehicles.slice(start, start + itemsPerPage);

    const listHtml = paginated.map(v => {
        const isExpanded = expandedCardId === v.id;

        // Badges
        let badgesHtml = '';
        if (v.status === 'active') badgesHtml += `<span class="badge active">ACTIVE</span>`;
        if (v.status === 'grace') badgesHtml += `<span class="badge grace">GRACE</span>`;
        if (v.status === 'immobilized') badgesHtml += `<span class="badge immobilized">IMMOBILIZED</span>`;
        if (v.status === 'paused') badgesHtml += `<span class="badge" style="background:var(--bl);color:#fff">PAUSED</span>`;
        if (v.status === 'available') badgesHtml += `<span class="badge" style="background:var(--t3);color:#fff">AVAIL</span>`;
        if (v.creditExpiry) badgesHtml += `<span class="badge expiring">⚠ EXPIRING</span>`;

        badgesHtml += `<span class="badge ${v.programType === 'RTO' ? 'rto' : 'rent'}">${v.programType}</span>`;

        // Status Line Color
        let borderStyle = '';
        if (v.status === 'active') borderStyle = 'border-left: 3px solid var(--g)';
        else if (v.status === 'immobilized') borderStyle = 'border-left: 3px solid var(--d)';
        else if (v.status === 'grace') borderStyle = 'border-left: 3px solid var(--w)';

        // Countdown Display
        let countdownHtml = '';
        if (v.status === 'grace' && v.graceExpiry) {
            countdownHtml = `<span id="cd-${v.id}" class="text-orange" style="color:var(--w); font-weight:bold" data-type="grace" data-expiry="${v.graceExpiry}">00:00:00</span>`;
        } else if (v.creditExpiry) {
            countdownHtml = `<span id="cd-${v.id}" class="text-orange" style="font-weight:bold" data-type="credit" data-expiry="${v.creditExpiry}">00:00:00</span>`;
        } else if (v.status === 'immobilized') {
            countdownHtml = `<span style="color:var(--d); font-weight:bold">LOCKED</span>`;
        } else if (v.status === 'paused') {
            countdownHtml = `<span style="color:var(--t2)">PAUSED</span>`;
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
                                ${v.status === 'grace' || v.status === 'immobilized' ? '0' : Math.floor(v.credits)} <span style="font-size:10px;font-weight:500;color:var(--t3)">days</span>
                            </div>
                        </div>
                        <div style="text-align:right">
                            <div class="cbl">RATE</div>
                            <div style="font-size:12px;font-weight:700;color:var(--t1)">${formatRupiah(v.dailyRate)}/d</div>
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

                <div class="action-row">
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
                        <div class="vc-badges" style="flex-wrap:wrap">${badgesHtml}</div>
                        <div class="vc-cust" style="font-size:12px">${v.customer || 'No Customer'}</div>
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
        <div style="display:flex; justify-content:center; gap:8px; padding:10px; align-items:center">
            <button class="btn btn-secondary" style="padding:4px 8px" 
                onclick="window.changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>◀</button>
            <span style="font-size:12px; color:var(--t2)">Page ${currentPage} of ${totalPages}</span>
            <button class="btn btn-secondary" style="padding:4px 8px" 
                onclick="window.changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>▶</button>
        </div>
    ` : '';

    elVehicleList.innerHTML = listHtml + paginationHtml;

    // Attach Click Handlers for Expansion
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            const id = card.dataset.id;
            expandedCardId = (expandedCardId === id) ? null : id;
            onCardClick(expandedCardId); // Re-render logic handled by app controller usually
        });
    });
};

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

    // --- Pagination (25 per page) ---
    const PAGE_SIZE = 25;
    if (!window.financePage) window.financePage = 1;
    const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
    if (window.financePage > totalPages) window.financePage = 1;
    const start = (window.financePage - 1) * PAGE_SIZE;
    const paginated = transactions.slice(start, start + PAGE_SIZE);

    // --- Transaction Rows ---
    const rows = paginated.map(t => {
        const statusColor = t.status === 'paid' ? 'var(--g)' : (t.status === 'failed' ? 'var(--r)' : 'var(--w)');
        const statusLabel = (t.status || 'paid').toUpperCase();
        return `
        <tr style="border-bottom:1px solid var(--s3); transition:background 0.15s" 
            onmouseover="this.style.background='var(--s2)'" 
            onmouseout="this.style.background=''">
            <td style="padding:10px 12px; font-family:'IBM Plex Mono'; font-size:12px; color:var(--t2)">${t.id}</td>
            <td style="padding:10px 12px; font-size:12px; color:var(--t2)">
                <div>${new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div style="font-size:10px; opacity:0.7">${new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
            </td>
            <td style="padding:10px 12px; font-size:13px">${t.vehicleId}</td>
            <td style="padding:10px 12px; font-size:12px">
                <div style="font-weight:600">${t.customer}</div>
                <div style="font-size:10px; color:var(--t3)">${t.customerPhone || '-'}</div>
            </td>
            <td style="padding:10px 12px">
                <div style="font-size:11px; font-weight:700; color:var(--t1); margin-bottom:2px">
                    ${(t.partnerId || '').charAt(0).toUpperCase() + (t.partnerId || '').slice(1)} • ${t.brand || '—'}
                </div>
                <span style="font-size:10px; padding:1px 6px; background:var(--s3); border-radius:4px; color:var(--t2); border:1px solid var(--b1)">
                    ${t.program || t.type || 'RTO'}
                </span>
            </td>
            <td style="padding:10px 12px; font-size:12px; color:var(--t3)">${t.method || '-'}</td>
            <td style="padding:10px 12px; font-size:12px">
                <div style="font-weight:700; font-family:'IBM Plex Mono'; color:var(--ac)">${t.creditDays || 7}d</div>
                <div style="font-size:10px; color:var(--t3)">Credit Days</div>
            </td>
            <td style="padding:10px 12px; text-align:right; font-family:'IBM Plex Mono'; font-size:13px; font-weight:600">${formatRupiah(t.amount)}</td>
            <td style="padding:10px 12px">
                <span style="font-size:11px; font-weight:600; color:${statusColor}">${statusLabel}</span>
            </td>
        </tr>`;
    }).join('');

    // --- Pagination Controls ---
    const txPagination = totalPages > 1 ? `
    <div style="padding:12px 16px; border-top:1px solid var(--s3); display:flex; justify-content:space-between; align-items:center; flex-shrink:0">
        <span style="font-size:12px; color:var(--t3)">${start + 1}–${Math.min(start + PAGE_SIZE, transactions.length)} of ${transactions.length}</span>
        <div style="display:flex; gap:6px; align-items:center">
            <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px"
                onclick="window.changeFinancePage(-1)" ${window.financePage === 1 ? 'disabled' : ''}>◀</button>
            <span style="font-size:12px; color:var(--t2); min-width:80px; text-align:center">Page ${window.financePage} / ${totalPages}</span>
            <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px"
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
            <h4 style="margin:0 0 8px">${p.shortName} <span style="font-size:10px;opacity:0.7;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px">${p.type}</span></h4>
            <div style="font-size:22px; font-weight:700; font-family:'IBM Plex Mono'; color:var(--g)">${formatRupiah(p.totalEarnings)}</div>
            <div style="font-size:11px; color:var(--t3); margin-top:4px">${p.activeCount}/${p.vehicleCount} active units</div>
        </div>`;
    }).join('')}
    </div>` : '';

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; padding:20px; gap:0; box-sizing:border-box; min-height:100%;">

            <!-- Header row with title + program filter -->
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-shrink:0">
                <div>
                    <h2 style="margin:0 0 4px">Finance Overview</h2>
                    <div style="color:var(--t3); font-size:13px">Revenue streams and transaction history</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px">
                    <label style="font-size:12px; color:var(--t3)">Filter by Program:</label>
                    <select id="programFilter" class="form-control" style="width:180px; font-size:13px">
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
                        <span style="font-size:12px; color:var(--t3)">${transactions.length} records</span>
                    </div>
                    <div style="overflow-x:auto">
                        <table style="width:100%; border-collapse:collapse; font-size:13px; min-width:600px">
                            <thead style="position:sticky; top:0; background:var(--s2); z-index:10">
                                <tr style="text-align:left; color:var(--t3)">
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">TX ID</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">DATE & TIME</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">VEHICLE</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">USER / PHONE</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">PROGRAM</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">METHOD</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">CREDIT DAYS</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px; text-align:right">AMOUNT</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">STATUS</th>
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
    'Online': '#22C55E',
    'Offline': '#EF4444',
    'Low Signal': '#F59E0B',
    'Tampered': '#A855F7',
};
const SIM_STATUS_COLOR = {
    'Active': '#22C55E',
    'Low Balance': '#F59E0B',
    'Expired': '#EF4444',
    'Inactive': '#6B7280',
};

export const renderGpsList = (devices, stats, filter = {}) => {
    const container = document.getElementById('gpsContent');
    if (!container) return;

    // Pagination constants
    const pageSize = 25;
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
            { label: 'Online', val: stats.online, color: '#22C55E' },
            { label: 'Offline', val: stats.offline, color: '#EF4444' },
            { label: 'Low Signal', val: stats.lowSignal, color: '#F59E0B' },
            { label: 'Tampered', val: stats.tampered, color: '#A855F7' },
            { label: 'FW Alert', val: stats.firmwareAlert, color: '#F97316' },
            { label: 'SIM Expiry <30d', val: stats.simExpiring, color: '#F59E0B' },
        ].map(s => `
            <div class="card stat-card" style="text-align:center">
                <h3 style="font-size:11px">${s.label}</h3>
                <div class="value" style="color:${s.color}; font-size:22px">${s.val}</div>
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
            ? `<span style="margin-left:4px; font-size:10px; background:#F97316; color:#fff; padding:1px 5px; border-radius:3px">UPDATE</span>`
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
            `<div style="font-size:11px; color:var(--t1); margin-bottom:2px">${d.address}</div>` :
            '';

        const locationHtml = d.lat ?
            `<div style="display:flex; flex-direction:column; gap:2px">
                ${addressHtml}
                <div style="display:flex; align-items:center; gap:8px">
                    <a href="#" onclick="window.dispatchEvent(new CustomEvent('focus-vehicle', {detail:'${d.vehicleId}'})); return false;" 
                       style="color:var(--ac); text-decoration:none; font-family:'IBM Plex Mono'; font-size:10px">${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</a>
                    <span style="font-size:10px; color:var(--t3); background:var(--s3); padding:1px 4px; border-radius:3px">${d.lastPingTime || '—'}</span>
                </div>
            </div>` :
            '—';

        return `
        <tr style="border-bottom:1px solid var(--s3); transition:background .15s"
            onmouseenter="this.style.background='var(--s3)'" onmouseleave="this.style.background=''">
            <td style="padding:10px 12px; font-family:'IBM Plex Mono'; font-size:12px; color:var(--t2)">${d.id}</td>
            <td style="padding:10px 12px; font-size:12px">
                <div style="font-weight:600">${d.brand} ${d.model}</div>
                <div style="font-size:10px; color:var(--t3)">${d.imei}</div>
            </td>
            <td style="padding:10px 12px">
                <span style="color:${statusColor}; font-weight:600; font-size:12px">● ${d.status}</span>
                <div style="font-size:10px; color:var(--t3)">${timeAgoFunc(d.lastPing)}</div>
            </td>
            <td style="padding:10px 12px; font-size:12px">
                <div style="color:var(--t1)">${d.vehiclePlate}</div>
                <div style="font-size:11px; color:var(--ac); font-weight:600">${d.vehicleBrand || '—'} ${d.vehicleModel || ''}</div>
                <div style="font-size:10px; color:var(--t3)">${programName}</div>
            </td>
            <td style="padding:10px 12px; font-size:12px">
                ${locationHtml}
            </td>
            <td style="padding:10px 12px; font-size:12px">
                <div>${d.sim.carrier}</div>
                <div style="font-size:10px; color:var(--t3)">${usagePct}% used</div>
                <div style="font-size:10px; color:var(--t3); font-family:'IBM Plex Mono'">IMEI: ${d.imei}</div>
                <span style="font-size:10px; color:${simColor}">${d.sim.status}</span>
            </td>
            <td style="padding:10px 12px">
                <div style="display:flex; gap:6px">
                    <button class="btn btn-secondary"
                        style="font-size:11px; padding:4px 10px"
                        onclick="window.dispatchEvent(new CustomEvent('gps-edit', {detail:'${d.id}'}))">Edit</button>
                    <button class="btn btn-secondary"
                        style="font-size:11px; padding:4px 10px; color:var(--d); border-color:var(--d)"
                        onclick="window.dispatchEvent(new CustomEvent('gps-delete', {detail:'${d.id}'}))">Del</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    const noResults = pageDevices.length === 0
        ? `<tr><td colspan="7" style="padding:32px; text-align:center; color:var(--t3)">No devices found</td></tr>`
        : '';

    const paginationHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:var(--s2); border-top:1px solid var(--b1)">
        <div style="color:var(--t3); font-size:12px">
            Showing ${startIndex + 1} - ${Math.min(startIndex + pageSize, devices.length)} of ${devices.length} devices
        </div>
        <div style="display:flex; gap:8px">
            <button class="btn btn-secondary" style="font-size:11px; padding:4px 12px"
                onclick="window.changeGpsPage(-1)" ${window.gpsPage === 1 ? 'disabled' : ''}>◀ Prev</button>
            <div style="display:flex; align-items:center; font-size:12px; color:var(--t2); padding:0 10px">
                Page ${window.gpsPage} of ${totalPages}
            </div>
            <button class="btn btn-secondary" style="font-size:11px; padding:4px 12px"
                onclick="window.changeGpsPage(1)" ${window.gpsPage === totalPages ? 'disabled' : ''}>Next ▶</button>
        </div>
    </div>`;

    container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
        <div>
            <h2 style="margin:0 0 4px">GPS Devices</h2>
            <div style="color:var(--t3); font-size:13px">${stats.total} devices — ${stats.online} online</div>
        </div>
    </div>

    ${statsHtml}
    ${toolbar}

    <div class="card" style="overflow:hidden">
        <div style="overflow-x:auto">
            <table style="width:100%; border-collapse:collapse; font-size:13px">
                <thead style="background:var(--s3); position:sticky; top:0; z-index:2">
                    <tr style="text-align:left; color:var(--t3); font-size:11px; text-transform:uppercase; letter-spacing:.05em">
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
                <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">Brand</label>
                <select id="gf_brand" class="form-control">
                    ${['Weloop', 'Teltonika', 'Concox'].map(b =>
        `<option ${isEdit && device.brand === b ? 'selected' : ''}>${b}</option>`).join('')}
                </select>
            </div>
            <div>
                <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">Model</label>
                <input id="gf_model" class="form-control" value="${isEdit ? device.model : ''}" placeholder="e.g. WL-210 Pro">
            </div>
        </div>
        <div>
            <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">IMEI</label>
            <input id="gf_imei" class="form-control" value="${isEdit ? device.imei : ''}" placeholder="15-digit IMEI">
        </div>
        <div>
            <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">Serial Number</label>
            <input id="gf_serial" class="form-control" value="${isEdit ? device.serial : ''}" placeholder="Manufacturer serial">
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div>
                <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">Firmware</label>
                <input id="gf_firmware" class="form-control" value="${isEdit ? device.firmware : ''}" placeholder="FW-3.4.2">
            </div>
            <div>
                <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">Mount Position</label>
                <select id="gf_mount" class="form-control">
                    ${['Under Seat', 'Behind Panel', 'Frame', 'Battery Compartment'].map(m =>
            `<option ${isEdit && device.mountPosition === m ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
            </div>
        </div>
        <hr style="border-color:var(--s3); margin:4px 0">
        <div style="font-size:12px; font-weight:600; color:var(--t2)">SIM Card</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div>
                <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">SIM Number</label>
                <input id="gf_sim" class="form-control" value="${isEdit ? device.sim.number : ''}" placeholder="08xxxxxxxxxx">
            </div>
            <div>
                <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">Carrier</label>
                <select id="gf_carrier" class="form-control">
                    ${['Telkomsel', 'XL', 'Indosat', 'Tri', 'Smartfren'].map(c =>
                `<option ${isEdit && device.sim.carrier === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div>
                <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">SIM Expiry</label>
                <input id="gf_simexpiry" type="date" class="form-control" value="${isEdit ? device.sim.expiry : ''}">
            </div>
            <div>
                <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">Warranty Expiry</label>
                <input id="gf_warranty" type="date" class="form-control" value="${isEdit ? device.warrantyExpiry : ''}">
            </div>
        </div>
        <hr style="border-color:var(--s3); margin:4px 0">
        <div>
            <label style="font-size:11px; color:var(--t3); display:block; margin-bottom:4px">Assigned Vehicle</label>
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
    if (!elVehicleListContent) return;

    const vehicles = getAllVehicles(vehicleListFilter);
    const PAGE_SIZE = 25;
    const totalPages = Math.ceil(vehicles.length / PAGE_SIZE) || 1;
    if (vehicleListPage > totalPages) vehicleListPage = totalPages;
    const paginated = vehicles.slice((vehicleListPage - 1) * PAGE_SIZE, vehicleListPage * PAGE_SIZE);

    const tableRows = paginated.map(v => {
        const prog = getRTOProgress(v);
        const progressHtml = prog ? `
            <div class="vl-rto-bar">
                <div class="vl-rto-track"><div class="vl-rto-fill" style="width:${prog.paidPct}%"></div></div>
                <div style="font-size:10px; color:var(--t2)">${prog.monthsLeft}m left</div>
            </div>` : '—';

        const creditColor = v.credits < 3 ? '#EF4444' : (v.credits < 7 ? '#F59E0B' : '#22C55E');
        const creditHtml = `
            <div class="vl-credit-bar">
                <div class="vl-credit-track"><div class="vl-credit-fill" style="width:${Math.min(100, (v.credits / 30) * 100)}%; background:${creditColor}"></div></div>
                <div class="vl-credit-label" style="color:${creditColor}">${v.credits}d</div>
            </div>`;

        const STNK = getSTNKAlert(v);
        const stnkHtml = STNK ? `<span class="vl-status" style="background:${STNK.type === 'expired' ? '#EF4444' : '#F59E0B'}22; color:${STNK.type === 'expired' ? '#EF4444' : '#F59E0B'}">${STNK.label}</span>` : '<span style="color:var(--t3)">—</span>';

        return `
            <tr data-status="${v.status}" onclick="window.openVehicleDrawer('${v.id}')">
                <td style="font-weight:700">${v.id}<div style="font-size:10px; font-weight:400; color:var(--t3)">${v.plate}</div></td>
                <td>
                    <div style="font-weight:600">${v.customer || '—'}</div>
                    <div style="font-size:10px; color:var(--t3)">${v.phone || ''}</div>
                </td>
                <td><span class="vl-status" style="background:${(v.status === 'active' ? '#22C55E' : (v.status === 'grace' ? '#F59E0B' : (v.status === 'immobilized' ? '#EF4444' : '#6B7280')))}22; color:${(v.status === 'active' ? '#22C55E' : (v.status === 'grace' ? '#F59E0B' : (v.status === 'immobilized' ? '#EF4444' : '#6B7280')))}">${v.status.toUpperCase()}</span></td>
                <td>${v.brand}<div style="font-size:10px; color:var(--t3)">${v.programType}</div></td>
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
                <h2 class="vl-title">Vehicle Management</h2>
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
    if (!elUserListContent) return;

    const users = getUsers(userListFilter);
    const PAGE_SIZE = 25;
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
                <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:2px; font-weight:700">
                    <span>${rtoProgress.paidPct}%</span>
                    <span>${rtoProgress.daysLeft}d left</span>
                </div>
                <div class="vl-rto-track" style="width:100%; height:4px; background:var(--s3); border-radius:2px; overflow:hidden">
                    <div class="vl-rto-fill" style="width:${rtoProgress.paidPct}%; height:100%; background:var(--g)"></div>
                </div>
            </div>
        ` : '<span style="color:var(--t3); font-size:10px">—</span>';

        return `
            <tr onclick="window.openUserDrawer('${u.userId}')">
                <td>
                    <div style="display:flex; align-items:center; gap:10px">
                        <div class="vl-avatar" style="background:${genderColor}">${initials}</div>
                        <div>
                            <div style="font-weight:700">${u.name}</div>
                            <div style="font-size:10px; color:var(--t3)">${u.userId}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size:12px">${u.phone}</div>
                    <div style="font-size:10px; color:var(--t3)">${u.address.substring(0, 20)}...</div>
                </td>
                <td>
                    ${u.vehicleIds.length > 0 ? `<span style="font-size:10px; background:var(--s3); padding:1px 6px; border-radius:3px; color:var(--t2); font-family:'IBM Plex Mono'; font-weight:700">${u.vehicleIds[0]}</span>` : '<span style="color:var(--t3); font-size:10px">—</span>'}
                </td>
                <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap">
                        ${u.vehicleIds.map(id => {
            const v = state.vehicles.find(veh => veh.id === id);
            if (!v) return null;
            const prog = state.programs.find(p => p.id === v.programId);
            return prog ? `${prog.shortName} ${prog.type}` : v.programType;
        }).filter(Boolean).map(p => `
                            <span style="font-size:10px; background:var(--s2); border:1px solid var(--bd); padding:1px 6px; border-radius:4px; color:var(--t2); font-weight:700">
                                ${p}
                            </span>`).join('')}
                    </div>
                </td>
                <td>
                    <div class="vl-risk-bar" style="background:${riskColor}22; color:${riskColor}">
                        <div style="width:12px; height:12px; border-radius:50%; background:${riskColor}"></div>
                        ${u.riskLabel} (${u.riskScore})
                    </div>
                </td>
                <td>${progressHtml}</td>
                <td style="color:${u.missedPayments > 0 ? '#EF4444' : 'var(--t2)'}">${u.missedPayments}</td>
                <td>${new Date(u.joinDate).toLocaleDateString()}</td>
                <td><button class="vl-pill">👤 Profile</button></td>
            </tr>`;
    }).join('');

    elUserListContent.innerHTML = `
        <div class="vl-container">
            <div class="vl-header">
                <h2 class="vl-title">Rider KYC & Profiles</h2>
                <div style="display:flex; gap:10px; align-items:center">
                    <button class="vl-pill" onclick="window.exportUsersCSV()">📥 Export CSV</button>
                    <div class="vl-count">${users.length} Active Users</div>
                </div>
            </div>
            <div class="vl-controls">
                <input type="text" class="vl-search" placeholder="Search name, phone, NIK..." value="${userListFilter.search}" id="uSearch">
                <select class="vl-search" id="uProgram" style="max-width:200px">
                    <option value="all">All Programs</option>
                    ${state.programs.map(p => `<option value="${p.id}" ${userListFilter.program === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                </select>
                <div class="vl-filter-pills">
                    ${['all', 'Low', 'Medium', 'High'].map(r => `
                        <div class="vl-pill ${userListFilter.risk === r ? 'active' : ''}" onclick="window.setUserRiskFilter('${r}')">${r.toUpperCase()} RISK</div>
                    `).join('')}
                </div>
            </div>
            <table class="vl-table">
                <thead>
                    <tr>
                        <th onclick="window.setUserSort('name')">USER ${userListFilter.sortBy === 'name' ? (userListFilter.sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                        <th>CONTACT</th>
                        <th>VEHICLE</th>
                        <th>PROGRAM</th>
                        <th onclick="window.setUserSort('riskScore')">RISK SCORE</th>
                        <th>PROGRESS</th>
                        <th onclick="window.setUserSort('missedPayments')">MISSED</th>
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

    document.getElementById('uProgram').addEventListener('change', (e) => {
        userListFilter.program = e.target.value;
        userListPage = 1;
        renderUserListView();
    });
};

window.setUserRiskFilter = (r) => { userListFilter.risk = r; userListPage = 1; renderUserListView(); };
window.setUserSort = (field) => {
    if (userListFilter.sortBy === field) userListFilter.sortDir = userListFilter.sortDir === 'asc' ? 'desc' : 'asc';
    else { userListFilter.sortBy = field; userListFilter.sortDir = 'asc'; }
    renderUserListView();
};
window.changeUserPage = (delta) => { userListPage += delta; renderUserListView(); };

// ─── DETAIL DRAWER LOGIC ──────────────────────────────────────────────────────

const openDrawer = (html) => {
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
    elDetailDrawer.classList.remove('open');
    elDrawerBackdrop.classList.remove('open');
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
                <div style="font-size:10px; color:var(--g); font-weight:800; font-family:'IBM Plex Mono'; margin-top:2px">${v.rtoId}</div>
            </div>
            <span class="vl-status" style="background:${(v.status === 'active' ? '#22C55E' : '#EF4444')}22; color:${(v.status === 'active' ? '#22C55E' : '#EF4444')}">${v.status.toUpperCase()}</span>
        </div>
        <div class="drawer-body">
            ${STNK ? `
            <div class="drawer-alert ${STNK.type}">
                <div style="font-weight:700">STNK EXPIRY ALERT</div>
                <div style="font-size:12px">Document is ${STNK.type}. ${STNK.label}.</div>
            </div>
            ` : ''}
            ${rto ? `
            <div class="drawer-section">
                <div class="drawer-section-title">RTO Progress</div>
                <div style="margin-bottom:12px">
                    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px; font-weight:700">
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
                        <div style="font-size:24px; font-weight:800; color:var(--g); font-family:'IBM Plex Mono'">${v.credits}</div>
                        <div style="font-size:10px; color:var(--t2); font-weight:700">DAYS REMAINING</div>
                    </div>
                    <button class="vl-pill active" onclick="window.dispatchAction('pay', '${v.id}')">Extend +7d</button>
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
                    <span style="font-size:18px; color:${genderColor}">${genderIcon}</span>
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
                        <div style="font-size:10px; color:var(--t3); font-weight:700">RISK SCORE</div>
                        <div style="font-size:20px; font-weight:800; color:${riskColor}">${u.riskScore}</div>
                    </div>
                    <div style="background:var(--s2); padding:10px; border-radius:8px; border:1px solid var(--b1)">
                        <div style="font-size:10px; color:var(--t3); font-weight:700">MISSED PMTS</div>
                        <div style="font-size:20px; font-weight:800; color:#EF4444">${u.missedPayments}</div>
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
                    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px; font-weight:700">
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
                        <div style="width:36px; height:36px; background:var(--s3); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:18px">🏍️</div>
                        <div style="flex:1">
                            <div style="font-weight:700; font-size:13px">${v.plate}</div>
                            <div style="font-size:10px; color:var(--t3); font-family:'IBM Plex Mono'">${v.rtoId}</div>
                            <div style="font-size:11px; color:var(--t3)">${v.id} • ${v.status}</div>
                        </div>
                        <div style="text-align:right">
                            <div style="font-weight:800; font-size:14px; color:${v.credits < 3 ? '#EF4444' : 'var(--g)'}">${v.credits}d</div>
                            <div style="font-size:9px; color:var(--t3); font-weight:600">CREDIT</div>
                        </div>
                    </div>
                `;
        })() : '<div style="opacity:0.5; font-size:12px; padding:10px">No assigned vehicle</div>'}
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
                <table class="drawer-mini-table" style="width:100%; border-collapse:collapse; font-size:11px">
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
                                    <span style="background:var(--g)11; color:var(--g); padding:2px 6px; border-radius:4px; font-weight:800; font-size:10px">+${t.creditDays || 0}d</span>
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

// Wire up backdrop/close
elDrawerBackdrop.addEventListener('click', closeDrawer);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

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
    if (!elProgramListContent) return;

    // Filter programs by global partner filter
    let filteredPrograms = [...state.programs];
    if (state.filter.partner !== 'all') {
        filteredPrograms = filteredPrograms.filter(p => p.partnerId === state.filter.partner);
    }

    // Prepare Sidebar Navigation content
    const sidebarItems = filteredPrograms.map(p => {
        const programVehicles = state.vehicles.filter(v => v.programId === p.id);
        const activeCount = programVehicles.filter(v => v.status === 'active').length;
        const graceCount = programVehicles.filter(v => v.status === 'grace').length;
        const lockedCount = programVehicles.filter(v => v.status === 'immobilized').length;
        const isActive = selectedProgramId === p.id;

        // Pulse health bar for shorthand
        const total = programVehicles.length || 1;
        const healthPct = Math.round((activeCount / total) * 100);
        const healthColor = healthPct > 90 ? '#22C55E' : (healthPct > 70 ? '#F59E0B' : '#EF4444');

        return `
            <div class="program-sidebar-item ${isActive ? 'active' : ''}" onclick="window.selectProgram('${p.id}')">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
                    <span style="font-size:12px; font-weight:700">${p.name}</span>
                    <span style="font-size:10px; opacity:0.6">${p.shortName}</span>
                </div>
                <div style="font-size:10px; color:var(--t3); margin-bottom:8px">
                    Rp ${formatShortCurrency(p.price)}/day • ${p.grace}d Grace
                </div>
                <div style="height:3px; background:rgba(255,255,255,0.1); border-radius:1px; margin-bottom:8px">
                    <div style="height:100%; width:${healthPct}%; background:${healthColor}; border-radius:1px"></div>
                </div>
                <div style="display:flex; gap:6px; font-size:10px; font-weight:700">
                    <div style="color:#22C55E; background:#22C55E11; padding:2px 4px; border-radius:4px" title="Active">A:${activeCount}</div>
                    <div style="color:#F59E0B; background:#F59E0B11; padding:2px 4px; border-radius:4px" title="Grace">G:${graceCount}</div>
                    <div style="color:#EF4444; background:#EF444411; padding:2px 4px; border-radius:4px" title="Locked">L:${lockedCount}</div>
                </div>
            </div>
        `;
    }).join('');

    // Prepare Table data
    let displayVehicles = [];
    let viewTitle = 'All Programs Fleet';
    let viewSubtitle = 'Consolidated fleet monitoring across all partner schemes.';

    if (selectedProgramId === 'all') {
        displayVehicles = state.vehicles.filter(v => filteredPrograms.some(p => p.id === v.programId));
    } else {
        const program = filteredPrograms.find(p => p.id === selectedProgramId);
        if (program) {
            displayVehicles = state.vehicles.filter(v => v.programId === selectedProgramId);
            viewTitle = program.name;
            viewSubtitle = `Detailed lifecycle monitoring for ${program.shortName} scheme.`;
        }
    }

    const tableRows = displayVehicles.map(v => {
        const prog = getRTOProgress(v);
        const lastPayment = v.lastPaymentDate ? new Date(v.lastPaymentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—';
        const statusColor = v.status === 'active' ? '#22C55E' : (v.status === 'grace' ? '#F59E0B' : '#EF4444');
        const programName = state.programs.find(p => p.id === v.programId)?.shortName || '—';

        // Find user for phone/risk
        const rider = state.users.find(u => u.name === v.customer);
        const riskColor = getRiskColor(rider?.riskLabel || 'Medium');
        const riderPhone = rider?.phone || v.phone || '—';

        return `
            <tr>
                <td>
                    <div style="font-size:10px; color:var(--p); font-weight:700; margin-bottom:2px">${programName}</div>
                    <div style="font-size:11px; font-weight:700; font-family:'IBM Plex Mono', monospace; color:var(--t1)">${v.rtoId}</div>
                </td>
                <td>
                    <div style="font-weight:700; font-size:13px; color:var(--t1)">${v.customer || 'Available'}</div>
                    <div style="font-size:11px; color:var(--t3)">📞 ${riderPhone}</div>
                </td>
                <td style="text-align:center">
                    <div style="font-weight:800; font-size:13px; color:${v.credits > 2 ? 'var(--t1)' : '#EF4444'}">${v.credits}d</div>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:2px">
                        <div style="width:8px; height:8px; border-radius:50%; background:${riskColor}; box-shadow:0 0 8px ${riskColor}66"></div>
                        <div style="font-weight:700; font-size:11px; color:var(--t1)">${rider?.riskLabel || 'Medium'} Risk</div>
                    </div>
                    <div style="font-size:9px; color:var(--t3)">${rider?.riskLabel === 'High' ? 'Unstable payment profile' : (rider?.riskLabel === 'Low' ? 'Reliable daily payer' : 'Standard RTO profile')}</div>
                </td>
                <td style="text-align:center">
                    <div style="font-size:13px; font-weight:600; color:${v.graceEncounters > 2 ? '#F59E0B' : 'var(--t3)'}">${v.graceEncounters || 0}x</div>
                </td>
                <td>
                    <div style="font-weight:800; font-family:'IBM Plex Mono', monospace; font-size:13px; color:var(--ac); letter-spacing:0.02em">${v.plate}</div>
                    <div style="font-size:10px; color:var(--t3)">${v.brand} ${v.model}</div>
                </td>
                <td style="text-align:center">
                    <div class="vl-status" style="background:${statusColor}22; color:${statusColor}">${v.status.toUpperCase()}</div>
                </td>
                <td style="text-align:right">
                    <div style="font-size:11px; font-weight:600">${v.lastPaymentAmount ? formatShortCurrency(v.lastPaymentAmount) : '—'}</div>
                    <div style="font-size:10px; color:var(--t3)">${lastPayment}</div>
                </td>
                <td style="width:80px">
                     <div class="vl-rto-bar" style="width:100%">
                        <div class="vl-rto-track" style="width:100%"><div class="vl-rto-fill" style="width:${prog?.paidPct || 0}%"></div></div>
                    </div>
                    <div style="font-size:9px; color:var(--t3); font-weight:700; margin-top:4px; text-align:right">${prog?.paidPct || 0}%</div>
                </td>
                <td style="text-align:right">
                    <button class="vl-pill" style="padding:4px 10px" onclick="window.openVehicleDrawer('${v.id}')">Audit</button>
                </td>
            </tr>
    `;
    }).join('');

    elProgramListContent.innerHTML = `
        <div class="program-layout">
            <!-- Sidebar -->
            <div class="program-sidebar">
                <div class="program-sidebar-header">
                    <div style="font-size:11px; font-weight:700; color:var(--t3); letter-spacing:0.05em; text-transform:uppercase">Schemes & Programs</div>
                    <button class="vl-pill" style="margin-top:10px; width:100%" onclick="window.openProgramModal()">+ New Program</button>
                </div>
                <div class="program-sidebar-scroll">
                    <div class="program-sidebar-item ${selectedProgramId === 'all' ? 'active' : ''}" onclick="window.selectProgram('all')">
                        <div style="font-weight:700; font-size:12px">All Programs</div>
                        <div style="font-size:10px; opacity:0.6; margin-top:2px">Consolidated View</div>
                    </div>
                    ${sidebarItems}
                </div>
            </div>

            <!-- Main Content -->
            <div class="program-main">
                <div class="vl-header" style="margin-bottom:24px">
                    <div>
                        <h2 class="vl-title">${viewTitle}</h2>
                        <p style="font-size:12px; color:var(--t3); margin-top:4px">${viewSubtitle}</p>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center">
                        ${selectedProgramId !== 'all' ? `
                            <button class="vl-pill" onclick="window.openProgramModal('${selectedProgramId}')">⚙️ Scheme Settings</button>
                            <button class="vl-pill danger" onclick="window.confirmDeleteProgram('${selectedProgramId}')">🗑️ Delete</button>
                        ` : ''}
                    </div>
                </div>

                <!-- Program Pulse Stats Cards -->
                <div class="program-stats-grid">
                    <div class="program-card-stat">
                        <div class="label">Active Units</div>
                        <div class="value" style="color:#22C55E">${displayVehicles.filter(v => v.status === 'active').length}</div>
                    </div>
                    <div class="program-card-stat">
                        <div class="label">Grace Units</div>
                        <div class="value" style="color:#F59E0B">${displayVehicles.filter(v => v.status === 'grace').length}</div>
                    </div>
                    <div class="program-card-stat">
                        <div class="label">Locked Units</div>
                        <div class="value" style="color:#EF4444">${displayVehicles.filter(v => v.status === 'immobilized').length}</div>
                    </div>
                    
                    <div class="program-card-stat has-tooltip clickable" onclick="window.popoutProgramStats('health', '${selectedProgramId}')">
                        <div class="label">Collection Health ℹ️</div>
                        <div class="value" style="color:var(--p)">${85 + (displayVehicles.length % 15)}%</div>
                        <div class="program-tooltip">
                            <strong>Audit Detail Available</strong><br>
                            Click to open full collection health report and risk variance analysis.
                        </div>
                    </div>

                    <div class="program-card-stat has-tooltip clickable" onclick="window.popoutProgramStats('maturity', '${selectedProgramId}')">
                        <div class="label">Fleet Maturity ℹ️</div>
                        <div class="value" style="color:var(--ac)">${displayVehicles.length > 0 ? Math.round(displayVehicles.reduce((acc, v) => acc + (getRTOProgress(v)?.paidPct || 0), 0) / displayVehicles.length) : 0}%</div>
                        <div class="program-tooltip">
                            <strong>Maturity Forecast Available</strong><br>
                            Click to view asset recovery progress and ownership transfer forecasts.
                        </div>
                    </div>
                </div>

                <div class="card" style="padding:0; overflow:hidden; flex:1; display:flex; flex-direction:column">
                    <div style="overflow-y:auto; flex:1">
                        <table class="vl-table">
                            <thead>
                                <tr>
                                    <th>Program / RTO ID</th>
                                    <th>Rider / Contact</th>
                                    <th style="text-align:center">Credit</th>
                                    <th>Risk Audit</th>
                                    <th style="text-align:center">Grace Hist</th>
                                    <th>Nopol / Model</th>
                                    <th style="text-align:center">Status</th>
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

                <div style="padding:12px 20px; border-top:1px solid var(--b1); font-size:11px; color:var(--t3); font-weight:600; background:var(--s2)">
                    Displaying ${displayVehicles.length} integrated monitoring records.
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
                font-size: 10px;
                font-weight: 700;
                color: var(--t3);
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 6px;
            }
            .program-card-stat .value {
                font-size: 20px;
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
                font-size: 11px;
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

    if (type === 'health') {
        title = `Collection Health Audit: ${p.name} `;
        html = `
    <div style = "padding:20px" >
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px">
                    <div class="card" style="padding:15px; background:var(--s3)">
                        <div style="font-size:10px; color:var(--t3); font-weight:700">PAYMENT VARIANCE</div>
                        <div style="font-size:24px; font-weight:800; color:#22C55E">-2.4% <span style="font-size:12px; font-weight:400; color:var(--t3)">vs Target</span></div>
                    </div>
                    <div class="card" style="padding:15px; background:var(--s3)">
                        <div style="font-size:10px; color:var(--t3); font-weight:700">ARREARS INDEX</div>
                        <div style="font-size:24px; font-weight:800; color:#F59E0B">1.8 <span style="font-size:12px; font-weight:400; color:var(--t3)">Risk Score</span></div>
                    </div>
                </div>
                <h4 style="margin-bottom:10px">Risk Factors</h4>
                <ul style="color:var(--t2); font-size:13px; line-height:1.6">
                    <li>94% of riders have paid within the last 7 days.</li>
                    <li>Arrears mostly concentrated in "Tangkas Go" RTO scheme (Jakarta North).</li>
                    <li>Grace period extensions have decreased by 15% this month.</li>
                </ul>
                <div style="margin-top:20px; display:flex; justify-content:flex-end">
                    <button class="btn primary" onclick="window.closeModal('gps')">Got it</button>
                </div>
            </div>
    `;
    } else {
        title = `Fleet Maturity Snapshot: ${p.name}`;
        html = `
            <div style="padding:20px">
                <div style="height:10px; background:var(--b1); border-radius:50px; margin-bottom:15px; overflow:hidden">
                    <div style="width:65%; height:100%; background:var(--ac); border-radius:50px; box-shadow: 0 0 10px var(--ac)55"></div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:25px">
                    <span style="font-size:11px; color:var(--t3); font-weight:600">NEW 0%</span>
                    <span style="font-size:13px; font-weight:800; color:var(--ac)">FLEET AVG: 65% RECOVERY</span>
                    <span style="font-size:11px; color:var(--t3); font-weight:600">OWNED 100%</span>
                </div>
                <h4 style="margin-bottom:12px; font-size:14px; color:var(--t1)">Ownership Transfer Forecast</h4>
                <table class="vl-table" style="font-size:12px">
                    <tr style="border-bottom:1px solid var(--b1)">
                        <td style="padding:10px 0; color:var(--t2)">Next 30 Days</td>
                        <td style="padding:10px 0; text-align:right; font-weight:700; color:var(--ac)">12 Units</td>
                    </tr>
                    <tr style="border-bottom:1px solid var(--b1)">
                        <td style="padding:10px 0; color:var(--t2)">Next 90 Days</td>
                        <td style="padding:10px 0; text-align:right; font-weight:700; color:var(--ac)">45 Units</td>
                    </tr>
                </table>
                <p style="margin-top:20px; font-size:12px; color:var(--t3); line-height:1.5">Maturity reflects the portion of total fleet lease value already recovered via daily RTO installments. High maturity indicates impending equity transfers.</p>
                <div style="margin-top:25px; display:flex; justify-content:flex-end">
                    <button class="btn primary" onclick="window.closeModal('gps')">Close Audit</button>
                </div>
            </div>
    `;
    }

    document.getElementById('gpsModalTitle').innerText = title;
    document.getElementById('gpsModalContent').innerHTML = html;
    document.getElementById('gpsModalOverlay').classList.add('open');
};

window.selectProgram = (programId) => {
    selectedProgramId = programId;
    renderProgramListView();
};

window.toggleProgramExpansion = (programId) => {
    window.selectProgram(programId);
};

window.openProgramModal = (programId = null) => {
    const p = programId ? state.programs.find(x => x.id === programId) : {
        id: `P - ${Math.random().toString(36).substring(2, 6).toUpperCase()} `,
        name: '',
        shortName: '',
        partnerId: partners[0].id,
        type: 'RTO',
        price: 30000,
        grace: 7
    };

    const isEdit = !!programId;
    const title = isEdit ? 'Edit Program Terms' : 'Create New Program';

    const html = `
    < div class="modal-form" >
            <div class="form-group">
                <label>Program Name</label>
                <input type="text" id="pName" value="${p.name}" placeholder="e.g. Maka RTO Standard">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                <div class="form-group">
                    <label>Short Name</label>
                    <input type="text" id="pShort" value="${p.shortName}" placeholder="e.g. Maka">
                </div>
                <div class="form-group">
                    <label>Partner</label>
                    <select id="pPartner">
                        ${partners.map(part => `<option value="${part.id}" ${p.partnerId === part.id ? 'selected' : ''}>${part.name}</option>`).join('')}
                    </select>
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
            <div class="form-group">
                <label>Program Type</label>
                <select id="pType">
                    <option value="RTO" ${p.type === 'RTO' ? 'selected' : ''}>Rent To Own (RTO)</option>
                    <option value="Rental" ${p.type === 'Rental' ? 'selected' : ''}>Daily Rental</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn secondary" onclick="window.closeModal('gps')">Cancel</button>
                <button class="btn primary" onclick="window.saveProgram('${p.id}', ${isEdit})">${isEdit ? 'Update Program' : 'Create Program'}</button>
            </div>
        </div >
    `;

    document.getElementById('gpsModalTitle').innerText = `🤝 ${title} `;
    document.getElementById('gpsModalContent').innerHTML = html;
    document.getElementById('gpsModalOverlay').classList.add('open');
};

window.saveProgram = (id, isEdit) => {
    const data = {
        id,
        name: document.getElementById('pName').value,
        shortName: document.getElementById('pShort').value,
        partnerId: document.getElementById('pPartner').value,
        price: parseInt(document.getElementById('pPrice').value),
        grace: parseInt(document.getElementById('pGrace').value),
        type: document.getElementById('pType').value
    };

    if (isEdit) updateProgram(id, data);
    else addProgram(data);

    document.getElementById('gpsModalOverlay').classList.remove('open');
    renderProgramListView();
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

