/* UI Rendering & Event Handling */
import { formatRupiah, timeAgo, getCountdown } from './utils.js';
import { state, programs } from './store.js';

// Elements
const elVehicleList = document.getElementById('vehicleList');
const elStatsBar = document.getElementById('statsBar');
const elStatusFilters = document.getElementById('statusFilters');

// State for UI
// State for UI
let expandedCardId = null;
let currentPage = 1;

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

export const renderStats = (stats) => {
    if (!elStatsBar) return;

    elStatsBar.innerHTML = `
        <div class="card stat-card"><h3>Fleet</h3><div class="value">${stats.total}</div></div>
        <div class="card stat-card"><h3>Active</h3><div class="value text-green">${stats.active}</div></div>
        <div class="card stat-card"><h3>Expiring</h3><div class="value text-orange">${stats.expiring}</div></div>
        <div class="card stat-card"><h3>Grace</h3><div class="value" style="color:var(--w)">${stats.grace}</div></div>
        <div class="card stat-card"><h3>Locked</h3><div class="value text-red">${stats.immobilized}</div></div>
        <div class="card stat-card"><h3>Online</h3><div class="value" style="color:var(--ac);font-size:16px">${stats.online}/${stats.total}</div></div>
        <div class="card stat-card"><h3>Revenue</h3><div class="value" style="color:var(--p);font-size:14px">${formatRupiah(stats.revenue)}</div></div>
    `;
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
            <td style="padding:10px 12px; font-size:12px; color:var(--t2)">${new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            <td style="padding:10px 12px; font-size:13px">${t.vehicleId}</td>
            <td style="padding:10px 12px">
                <span style="font-size:11px; padding:2px 8px; background:var(--s3); border-radius:20px; color:var(--t2)">${t.program || t.type || 'RTO'}</span>
            </td>
            <td style="padding:10px 12px; font-size:12px; color:var(--t3)">${t.method || '-'}</td>
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
                onclick="window.changeFinancePage(-1)" ${window.financePage === 1 ? 'disabled' : ''}>◀ Prev</button>
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
        <div style="height:100%; overflow:hidden; display:flex; flex-direction:column; padding:20px; gap:0; box-sizing:border-box">

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

            <!-- Table + Payment Methods grid -->
            <div style="display:grid; grid-template-columns:2fr 1fr; gap:16px; flex:1; min-height:0">

                <!-- Transaction Table -->
                <div class="card" style="display:flex; flex-direction:column; overflow:hidden">
                    <div style="padding:14px 16px; border-bottom:1px solid var(--s3); display:flex; justify-content:space-between; align-items:center; flex-shrink:0">
                        <h3 style="margin:0">Recent Transactions</h3>
                        <span style="font-size:12px; color:var(--t3)">${transactions.length} records</span>
                    </div>
                    <div style="flex:1; overflow-y:auto; min-height:0">
                        <table style="width:100%; border-collapse:collapse; font-size:13px">
                            <thead style="position:sticky; top:0; background:var(--s2); z-index:10">
                                <tr style="text-align:left; color:var(--t3)">
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">TX ID</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">DATE</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">VEHICLE</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">PROGRAM</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">METHOD</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px; text-align:right">AMOUNT</th>
                                    <th style="padding:10px 12px; font-weight:500; font-size:11px">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows || '<tr><td colspan="7" style="padding:24px; text-align:center; color:var(--t3)">No transactions for selected filter</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    ${txPagination}
                </div>

                <!-- Payment Methods -->
                <div class="card" style="padding:20px; overflow-y:auto">
                    <h3 style="margin:0 0 16px">Payment Methods</h3>
                    <div style="display:flex; flex-direction:column; gap:14px">
                        ${renderPaymentMethodBars(transactions)}
                    </div>
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



// Helper to render simple bars for payment methods
function renderPaymentMethodBars(txs) {
    const counts = {};
    txs.forEach(t => counts[t.method] = (counts[t.method] || 0) + 1);
    const total = txs.length;

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([method, count]) => {
            const pct = (count / total) * 100;
            return `
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px">
                        <span>${method}</span>
                        <span>${Math.round(pct)}%</span>
                    </div>
                    <div style="height:6px; background:var(--s3); border-radius:3px; overflow:hidden">
                        <div style="height:100%; width:${pct}%; background:var(--w)"></div>
                    </div>
                </div>
            `;
        }).join('');
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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
                <div style="font-size:10px; color:var(--t3)">${programName}</div>
            </td>
            <td style="padding:10px 12px; font-size:12px">
                ${locationHtml}
            </td>
            <td style="padding:10px 12px; font-size:12px">
                <div>${d.sim.carrier}</div>
                <div style="font-size:10px; color:var(--t3)">${usagePct}% used</div>
                <span style="font-size:10px; color:${simColor}">${d.sim.status}</span>
            </td>
            <td style="padding:10px 12px; font-size:12px; color:var(--t2)">
                ${d.firmware}${fwAlert}
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
        ? `<tr><td colspan="8" style="padding:32px; text-align:center; color:var(--t3)">No devices found</td></tr>`
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
                        <th style="padding:10px 12px">Firmware</th>
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

