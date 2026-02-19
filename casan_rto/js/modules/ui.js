/* UI Rendering & Event Handling */
import { formatRupiah, timeAgo, getCountdown } from './utils.js';

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

window.changeFinancePage = (delta) => {
    if (!window.financePage) window.financePage = 1;
    window.financePage += delta;
    if (window.financePage < 1) window.financePage = 1;
    window.dispatchEvent(new CustomEvent('finance-page-change'));
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
