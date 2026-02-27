// Main App Entry Point (Legacy Script Architecture)

// Redundant bindings removed as they are now global
// window.state is already set in store.js
// UI functions are already global

let activeTab = 'users'; // default

/* Initial Load */
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('App Initializing...');

        // 0. Global Aliases for backward compatibility
        if (window.rto) {
            window.rtoLogic = window.rto;
            console.log('Aliased window.rtoLogic to window.rto');
        }

        // 1. Data
        initData();
        console.log(`Data loaded: ${state.vehicles.length} vehicles, ${state.transactions.length} transactions`);

        // 2. Event Listeners (Setup early so navigation works even if map/RTO fail)
        setupEventListeners();
        console.log('UI Event listeners established');

        // 3. RTO Module Initial Load
        if (window.rto && window.rto.init) {
            window.rto.init();
        } else {
            console.warn('RTO module not fully loaded at DOMContentLoaded');
            setTimeout(() => {
                if (window.rto && window.rto.init) window.rto.init();
                else console.error('RTO module failed to load after timeout');
            }, 500);
        }

        // 4. Map (Wrapped to prevent blocking)
        try {
            initMap('map');
        } catch (mapErr) {
            console.error('Fatal error during map initialization:', mapErr);
        }

        // 5. UI Initial Render
        if (window.initUI) {
            window.initUI();
            const initialStats = window.getStats ? window.getStats() : {};
            if (window.renderStats) window.renderStats(initialStats);
            if (window.renderFilters) window.renderFilters('all', initialStats);
            if (window.renderProgramsTable) window.renderProgramsTable();
            if (window.updateView) window.updateView();
            if (window.updateUsers) window.updateUsers();
            if (window.updateStatsBar) window.updateStatsBar();
        } else {
            console.warn('UI module not fully loaded at DOMContentLoaded');
            setTimeout(() => {
                if (window.initUI) {
                    window.initUI();
                    const stats = window.getStats ? window.getStats() : {};
                    if (window.renderStats) window.renderStats(stats);
                    if (window.renderFilters) window.renderFilters('all', stats);
                    if (window.renderProgramsTable) window.renderProgramsTable();
                    if (window.updateView) window.updateView();
                    if (window.updateUsers) window.updateUsers();
                    if (window.updateStatsBar) window.updateStatsBar();
                } else {
                    console.error('UI module failed to load after timeout');
                }
            }, 500);
        }

        // 6. Loops
        // Countdowns
        setInterval(() => {
            if (window.updateCountdowns) window.updateCountdowns();
        }, 1000);

        // Movement Simulation Loop (every 3 seconds)
        setInterval(() => {
            simulateMovement();
            if (activeTab === 'fleet') {
                const filtered = getFilteredVehicles();
                updateMapMarkers(filtered);
            }
        }, 3000);

        // Force render update after short delay to ensure DOM is ready and Finance is populated
        setTimeout(() => {
            resizeMap();
            updateFinance();
        }, 200);

        // Listen for pagination
        window.addEventListener('page-change', () => {
            updateView();
        });

        window.addEventListener('finance-page-change', () => {
            updateFinance();
        });

    } catch (criticalErr) {
        console.error('CRITICAL: App failed to initialize properly:', criticalErr);
        alert('Application failed to initialize. Please check the console for details.');
    }
});

window.updateView = () => {
    // Check if views exist (might run before DOM is fully ready despite listener)
    if (!document.getElementById('fleetView')) return;

    const filtered = getFilteredVehicles();
    const stats = getStats();

    // List
    renderVehicleList(filtered, (selectedId) => {
        if (selectedId) {
            focusVehicleOnMap(selectedId);
        }
    });

    // Map
    updateMapMarkers(filtered);

    // Stats Bar
    renderStats(stats);

    // Filter Buttons (with counts)
    renderFilters(state.filter.status, stats);

    // Finance (Always update or check visibility to optimize)
    const financeView = document.getElementById('financeView');
    if (financeView && !financeView.classList.contains('hidden')) {
        updateFinance();
    }
}

window.updateFinance = () => {
    renderFinanceDashboard(window.getFinanceStats ? window.getFinanceStats() : {}, window.getTransactions ? window.getTransactions() : [], window.getProgramStats ? window.getProgramStats() : []);
};

// GPS filter state
let gpsFilter = { status: 'all', brand: 'all', search: '' };
window.gpsPage = 1;

window.updateGps = () => {
    renderGpsList(window.getGpsDevices ? window.getGpsDevices(gpsFilter) : [], window.getGpsStats ? window.getGpsStats() : {}, gpsFilter);
};

function updateVehicles() {
    renderVehicleListView();
}

window.updateUsers = () => {
    renderUserListView();
};

function updatePrograms() {
    renderProgramsTable();
}

// Global for inline onclick on pagination buttons in the finance table
window.changeFinancePage = (delta) => {
    if (!window.financePage) window.financePage = 1;
    window.financePage = Math.max(1, window.financePage + delta);
    updateFinance();
};

window.changeGpsPage = (delta) => {
    if (!window.gpsPage) window.gpsPage = 1;
    window.gpsPage = Math.max(1, window.gpsPage + delta);
    updateGps();
};

window.updateStatsBar = () => {
    renderStats(getStats(activeTab), activeTab);
};

function selectVehicle(id) {
    console.log('Selecting:', id);
    const card = document.querySelector(`.vehicle-card[data-id="${id}"]`);
    if (card && !card.classList.contains('expanded')) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.click();
    }
}

function setupEventListeners() {
    // Tabs
    const tabs = document.querySelectorAll('.nav-tab');
    if (tabs) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const target = tab.dataset.tab;
                activeTab = target; // Track context
                const showRtoFleet = target === 'rto-fleet';
                const showFinance = target === 'finance';
                const showGps = target === 'gps';
                const showVehicles = target === 'vehicles';
                const showUsers = target === 'users';
                const showPrograms = target === 'programs';
                const showRtoApps = target === 'rto-applications';
                const showRtoPickup = target === 'rto-pickup';
                const showRtoScore = target === 'rto-score';
                const showRtoWA = target === 'rto-wa';
                const showProgramSettings = target === 'program-settings';
                const showFleet = target === 'fleet';

                const rtoFleetView = document.getElementById('rto-fleetView');
                const rtoLayoutView = document.getElementById('rto-layout-view');
                const financeView = document.getElementById('financeView');
                const gpsView = document.getElementById('gpsView');
                const vehicleListView = document.getElementById('vehicleListView');
                const userListView = document.getElementById('userListView');
                const programsView = document.getElementById('programsView');
                const programSettingsView = document.getElementById('program-settingsView');
                const fleetView = document.getElementById('fleetView');

                const isRtoTab = showRtoApps || showRtoPickup || showRtoScore || showRtoWA;

                if (rtoFleetView) rtoFleetView.classList.toggle('hidden', !showRtoFleet);
                if (rtoLayoutView) rtoLayoutView.classList.toggle('hidden', !isRtoTab);
                if (financeView) financeView.classList.toggle('hidden', !showFinance);
                if (gpsView) gpsView.classList.toggle('hidden', !showGps);
                if (vehicleListView) vehicleListView.classList.toggle('hidden', !showVehicles);
                if (userListView) userListView.classList.toggle('hidden', !showUsers);
                if (programsView) programsView.classList.toggle('hidden', !showPrograms);
                if (programSettingsView) programSettingsView.classList.toggle('hidden', !showProgramSettings);
                if (fleetView) fleetView.classList.toggle('hidden', !showFleet);

                if (showRtoFleet) {
                    resizeMap();
                    updateView();
                    renderProgramListView();
                }
                if (showFleet) {
                    resizeMap();
                    updateView();
                }
                if (showFinance) updateFinance();
                if (showGps) updateGps();
                if (showVehicles) updateVehicles();
                if (showUsers) updateUsers();
                if (showPrograms) updatePrograms();

                // Consolidated RTO switch logic
                if (showRtoApps) window.rto.switchRtoTab('apps');
                if (showRtoPickup) window.rto.switchRtoTab('pickup');
                if (showRtoScore) window.rto.switchRtoTab('score');
                if (showRtoWA) window.rto.switchRtoTab('wa');

                updateStatsBar(); // Refresh context stats on tab switch
            });
        });
    }

    // Controls
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filter.search = e.target.value;
            updateView();
        });
    }

    // Command Palette Shortcut
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openCommandPalette();
        }
    });

    // Global Filter Events
    window.addEventListener('filter-change', (e) => {
        state.filter.status = e.detail;
        resetPagination();
        updateView();

        // Also update map filters UI
        const btns = document.querySelectorAll('#statusFilters .filter-btn');
        btns.forEach(b => {
            if (b.dataset.filter === e.detail) b.classList.add('active');
            else b.classList.remove('active');
        });
    });

    // Partner Select
    const partnerSelect = document.getElementById('partnerSelect');
    if (partnerSelect) {
        partnerSelect.addEventListener('change', (e) => {
            state.filter.partner = e.target.value;
            // Reset renter-view program filter when partner changes
            state.filter.program = 'all';
            if (typeof resetPagination === 'function') resetPagination();
            updateView();
            updateStatsBar(); // Re-calc stats
            updateFinance(); // Update finance tab too
            if (window.updatePrograms) window.updatePrograms(); // Update Programs Admin tab
            if (window.admRTbl) window.admRTbl(); // Update RTO Applications tab
            if (window.renderPUList) window.renderPUList(); // Update RTO Pickup Schedule tab
            if (activeTab === 'rto-fleet' && window.renderProgramListView) window.renderProgramListView(); // Update Renters view
        });
    }

    // Custom Events
    window.addEventListener('vehicle-action', (e) => {
        const { action, id } = e.detail;
        const v = state.vehicles.find(veh => veh.id === id);
        if (!v) return;

        if (action === 'pay') openModal('payment', v);
        else if (action === 'holiday') openModal('holiday', v);
        else if (action === 'lock') {
            if (confirm(`Lock ${id}?`)) {
                v.status = 'immobilized';
                updateView();
                updateStatsBar();
            }
        }
    });

    window.addEventListener('payment-confirmed', (e) => {
        const v = state.vehicles.find(veh => veh.id === e.detail.id);
        if (v) {
            v.status = 'active';
            v.credits += 7;
            v.creditExpiry = null;
            updateView();
            updateStatsBar();
        }
    });

    // Map Filter Toggle
    window.addEventListener('map-filter-toggle', (e) => {
        // Trigger re-render of markers with same vehicles (filtered list) but new map settings
        // getFilteredVehicles() returns list filtered by UI. 
        // updateMapMarkers will use GLOBAL mapFilters state (which was updated by toggleMapFilter)
        // to filter that list further for display.
        updateView(); // This calls updateMapMarkers(getFilteredVehicles())
    });

    // Finance Program Filter
    window.addEventListener('finance-program-change', (e) => {
        state.filter.program = e.detail;
        window._currentProgramFilter = e.detail;
        window.financePage = 1; // Reset to first page
        updateFinance();
    });

    window.addEventListener('gps-page-change', () => {
        updateGps();
    });

    //  GPS CRUD Events 

    // Filter change (search, status, brand)
    window.addEventListener('gps-filter', (e) => {
        Object.assign(gpsFilter, e.detail);
        updateGps();
    });

    // Add new device
    window.addEventListener('gps-add', () => {
        openGpsModal(null, state.vehicles);
    });

    // Edit existing device
    window.addEventListener('gps-edit', (e) => {
        const device = getGpsById(e.detail);
        if (device) openGpsModal(device, state.vehicles);
    });

    // Save (create or update)
    window.addEventListener('gps-save', (e) => {
        const fields = {
            brand: document.getElementById('gf_brand')?.value,
            model: document.getElementById('gf_model')?.value,
            imei: document.getElementById('gf_imei')?.value,
            serial: document.getElementById('gf_serial')?.value,
            firmware: document.getElementById('gf_firmware')?.value,
            mountPosition: document.getElementById('gf_mount')?.value,
            simNumber: document.getElementById('gf_sim')?.value,
            carrier: document.getElementById('gf_carrier')?.value,
            simExpiry: document.getElementById('gf_simexpiry')?.value,
            warrantyExpiry: document.getElementById('gf_warranty')?.value,
            vehicleId: document.getElementById('gf_vehicle')?.value || null,
        };
        if (e.detail === 'new') {
            createGpsDevice(fields);
        } else {
            updateGpsDevice(e.detail, fields);
        }
        closeGpsModal();
        updateGps();
    });

    // Delete
    window.addEventListener('gps-delete', (e) => {
        if (confirm(`Delete device ${e.detail}? This cannot be undone.`)) {
            deleteGpsDevice(e.detail);
            updateGps();
        }
    });

    // Close modal
    window.addEventListener('gps-modal-close', () => closeGpsModal());
}

//  Program Settings CRUD 
window.createProgram = () => {
    const name = document.getElementById('new-prog-name')?.value;
    const partner = document.getElementById('new-prog-partner')?.value;
    const brand = document.getElementById('new-prog-brand')?.value;
    const model = document.getElementById('new-prog-model')?.value;
    const score = document.getElementById('new-prog-score')?.value;

    if (!name || !partner || !brand || !model || !score) {
        alert("Please fill all fields.");
        return;
    }

    const newId = 'P-' + brand.substring(0, 2).toUpperCase() + '-' + Date.now().toString().substring(8);

    state.programs.unshift({
        id: newId,
        name: name,
        shortName: brand,
        motorModel: model,
        partnerId: partner.toLowerCase(),
        type: 'RTO',
        price: 35000,
        grace: 1,
        targetScore: parseInt(score, 10)
    });

    document.getElementById('new-prog-name').value = '';
    document.getElementById('new-prog-partner').value = '';
    document.getElementById('new-prog-brand').value = '';
    document.getElementById('new-prog-model').value = '';
    document.getElementById('new-prog-score').value = '60';

    if (window.rto && window.rto.t) window.rto.t("Program Created: " + name);
    window.renderActivePrograms();
};

window.renderActivePrograms = () => {
    const list = document.getElementById('active-programs-list');
    if (!list) return;

    list.innerHTML = state.programs.filter(p => p.type === 'RTO').map(p => `
        <div class="sc-dim-card prog-card" style="cursor:pointer; padding: 12px; background: var(--s0); border: 1px solid var(--b1); border-radius: 6px; transition: border-color 0.2s;" onclick="window.selectProgramSetting('${p.id}', this)">
            <div style="font-weight:700; color:var(--dw); font-size: var(--text-base);">${p.name}</div>
            <div style="font-size: var(--text-xs); color:var(--dt3); margin-top:4px;">Partner: ${p.partnerId.toUpperCase()} | Model: ${p.motorModel || 'N/A'} | Target Score: ${p.targetScore || 60}</div>
        </div>
    `).join('');
};

window.selectProgramSetting = (pid, el) => {
    // Highlight active card
    document.querySelectorAll('.prog-card').forEach(c => c.style.borderColor = 'var(--b1)');
    if (el) el.style.borderColor = 'var(--dac)';

    const prog = state.programs.find(p => p.id === pid);
    const container = document.getElementById('prog-rto-listings');
    if (!container || !prog) return;

    if (!window.rto) return;

    // Filter applications loosely matching the brand/partner
    let matchingApps = (window.rto.state.admApps || []).filter(a =>
        (a.prog && a.prog.includes(prog.shortName)) ||
        (a.prog && a.prog.includes(prog.name)) ||
        (a.ptn && a.ptn === prog.partnerId)
    );

    // Fallback: Just grab random apps for demo purposes if none strictly match
    if (matchingApps.length === 0) {
        matchingApps = (window.rto.state.admApps || []).sort(() => 0.5 - Math.random()).slice(0, 4);
    }

    let html = `<div style="font-weight:700; color:var(--dt1); margin-bottom:12px; font-size:var(--text-md);">Applicants for ${prog.name}</div>`;

    if (matchingApps.length === 0) {
        html += `<div style="text-align:center; padding: 20px; color:var(--dt3);">No applicants found for ${prog.name}.</div>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:8px;">`;
        matchingApps.forEach(app => {
            let badgeBg = 'var(--dw1)';
            let badgeCol = 'var(--dw)';
            if (app.dec === 'approved') { badgeBg = 'var(--dg1)'; badgeCol = 'var(--dg)'; }
            if (app.dec === 'declined') { badgeBg = 'var(--dd1)'; badgeCol = 'var(--dd)'; }

            html += `
                <div style="background: var(--s0); border: 1px solid var(--b1); border-radius: 6px; padding: 12px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:700; color:var(--dw); font-size:var(--text-sm);">${app.nm}</div>
                        <div style="font-size:var(--text-xs); color:var(--dt3); margin-top:2px;">${app.id} | Score: <span style="color:var(--dac); font-weight:700;">${app.score || 'N/A'}</span></div>
                    </div>
                    <div style="padding: 4px 8px; border-radius: 4px; font-size: var(--text-2xs); font-weight:800; background: ${badgeBg}; color: ${badgeCol}; text-transform:uppercase;">
                        ${app.dec}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
};
window.updatePrograms = updatePrograms;



