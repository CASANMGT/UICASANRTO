import { initData, state, getFilteredVehicles, getStats, getContextStats } from './modules/store.js';
import { initMap, updateMapMarkers, focusVehicleOnMap, resizeMap } from './modules/map.js';
import { renderStats, renderFilters, renderVehicleList, openModal, updateCountdowns, renderFinanceDashboard, resetPagination, renderGpsList, openGpsModal, closeGpsModal, renderVehicleListView, renderUserListView, renderProgramListView, openCommandPalette, closeCommandPalette } from './modules/ui.js';
import { getFinanceStats, getTransactions, getProgramStats } from './modules/finance.js';
import { getGpsDevices, getGpsStats, getGpsById, createGpsDevice, updateGpsDevice, deleteGpsDevice } from './modules/gps.js';

let activeTab = 'users'; // default

/* Initial Load */
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('App Initializing...');

        // 1. Data
        initData();
        console.log(`Data loaded: ${state.vehicles.length} vehicles, ${state.transactions.length} transactions`);

        // 2. Map
        initMap('map');

        // 3. UI
        const initialStats = getStats();
        renderFilters('all', initialStats);
        updateView();
        updateUsers(); // LANDING VIEW: Users override
        updateStatsBar(); // Contextual stats for Users

        // 4. Events
        setupEventListeners();

        // 5. Loops
        // Countdowns
        setInterval(() => {
            updateCountdowns();
        }, 1000);

        // Force render update after short delay to ensure DOM is ready and Finance is populated
        setTimeout(() => {
            resizeMap();
            updateFinance();
            updateView();
            updateUsers();
        }, 200);

        // Listen for pagination
        window.addEventListener('page-change', () => {
            updateView();
        });

        window.addEventListener('finance-page-change', () => {
            updateFinance();
        });

    } catch (err) {
        console.error('FATAL APP ERROR:', err);
        // Show error on screen
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:white;padding:16px;z-index:9999;font-family:monospace;font-size:13px;white-space:pre-wrap;';
        errDiv.textContent = `FATAL APP ERROR:\n${err.message}\n\nStack:\n${err.stack}`;
        document.body.prepend(errDiv);
    }
});

function updateView() {
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

function updateFinance() {
    renderFinanceDashboard(getFinanceStats(), getTransactions(), getProgramStats());
}

// GPS filter state
let gpsFilter = { status: 'all', brand: 'all', search: '' };
window.gpsPage = 1;

function updateGps() {
    renderGpsList(getGpsDevices(gpsFilter), getGpsStats(), gpsFilter);
}

function updateVehicles() {
    renderVehicleListView();
}

function updateUsers() {
    renderUserListView();
}

function updatePrograms() {
    renderProgramListView();
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

function updateStatsBar() {
    renderStats(getContextStats(activeTab), activeTab);
}

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
                const showFleet = target === 'fleet';
                const showFinance = target === 'finance';
                const showGps = target === 'gps';
                const showVehicles = target === 'vehicles';
                const showUsers = target === 'users';
                const showPrograms = target === 'programs';

                const fleetView = document.getElementById('fleetView');
                const financeView = document.getElementById('financeView');
                const gpsView = document.getElementById('gpsView');
                const vehicleListView = document.getElementById('vehicleListView');
                const userListView = document.getElementById('userListView');
                const programListView = document.getElementById('programListView');

                if (fleetView) fleetView.classList.toggle('hidden', !showFleet);
                if (financeView) financeView.classList.toggle('hidden', !showFinance);
                if (gpsView) gpsView.classList.toggle('hidden', !showGps);
                if (vehicleListView) vehicleListView.classList.toggle('hidden', !showVehicles);
                if (userListView) userListView.classList.toggle('hidden', !showUsers);
                if (programListView) programListView.classList.toggle('hidden', !showPrograms);

                if (showFleet) {
                    resizeMap();
                    updateView();
                }
                if (showFinance) updateFinance();
                if (showGps) updateGps();
                if (showVehicles) updateVehicles();
                if (showUsers) updateUsers();
                if (showPrograms) updatePrograms();

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
            resetPagination();
            updateView();
            updateStatsBar(); // Re-calc stats
            updateFinance(); // Update finance tab too
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

    // ── GPS CRUD Events ────────────────────────────────────────────────────────

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
