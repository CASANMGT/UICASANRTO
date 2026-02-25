/* Map Logic */

let map = null;
let markers = null;
const markerMap = new Map(); // vehicleID -> marker

// Map filter state - all ON by default
const mapFilters = {
    active: true,
    expiring: true,
    grace: true,
    immobilized: true,
    paused: true,
    available: true,
    online: true,
    offline: true,
    running: true,
    stopped: true
};

let guideActive = false;

// Colors for each status
const COLORS = {
    active: 'var(--c-success)',
    expiring: 'var(--c-orange)',
    grace: 'var(--c-warning)',
    immobilized: 'var(--c-danger)',
    paused: '#6B7280',
    available: 'var(--c-info)',
    online: 'var(--c-success)',
    offline: '#FF6B6B'
};

// Icons for each filter button
const ICONS = {
    active: 'OK',
    expiring: 'WARN',
    grace: '⏳',
    immobilized: 'LOCK',
    paused: 'P',
    available: 'B',
    online: 'G',
    offline: 'R',
    running: '->',
    stopped: 'P'
};

// Labels for filter buttons
const LABELS = {
    active: 'Active',
    expiring: 'Expiring',
    grace: 'Grace',
    immobilized: 'Locked',
    paused: 'Paused',
    available: 'Available',
    online: 'Online',
    offline: 'Offline',
    running: 'Running',
    stopped: 'Stopped'
};

// Helper: bearing degrees → compass label
const bearingLabel = (deg) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
};


const initMap = (containerId = 'map', onVehicleSelect) => {
    try {
        // Check if map container exists
        if (!document.getElementById(containerId)) return;

        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet library (L) is not loaded. Map cannot be initialized.');
            return;
        }

        // Jabodetabek view
        map = L.map(containerId, {
            zoomControl: false,
            attributionControl: false // Hide for cleaner look
        }).setView([-6.2088, 106.8456], 11);

        // Dark Map Tiles (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
        }).addTo(map);

        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        // No clustering — show all markers individually
        markers = L.layerGroup();
        map.addLayer(markers);

        // Store callback
        map.onVehicleSelect = onVehicleSelect;
        console.log('Map initialized successfully');
    } catch (err) {
        console.error('Error initializing map:', err);
    }
};

const renderMapControls = (vehicles) => {
    const elMock = document.getElementById('mapFilters');
    if (!elMock) return;

    // Filters
    // Status filters
    const statusKeys = ['active', 'expiring', 'grace', 'immobilized', 'paused', 'available', 'online', 'offline'];
    // Movement filters (separate row)
    const moveKeys = ['running', 'stopped'];

    const allKeys = [...statusKeys, ...moveKeys];

    const renderBtns = (keys) => keys.map(k => {
        const c = COLORS[k] || '#aaa';
        const isOn = mapFilters[k];
        const icon = ICONS[k] || '●';
        return `
        <button class="mfb ${isOn ? 'on' : ''}" 
            onclick="window.toggleMapFilter('${k}')"
            title="${LABELS[k]}"
            style="
                flex-direction:column; gap:2px; padding:6px 8px; min-width:50px;
                ${isOn ? 'border-color:' + c + '; background:' + c + '22;' : 'opacity:0.5;'}
            ">
            <span style="font-size: var(--text-3xl); line-height:1">${icon}</span>
            <span style="font-size: var(--text-xs); font-weight:600; letter-spacing:0.02em">${LABELS[k]}</span>
        </button>`;
    }).join('');

    let overlay = document.querySelector('.mf');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mf';
        document.getElementById('map').appendChild(overlay);
    }

    // Select All / None row
    const quickBtns = `
        <button class="mfb on" onclick="window.selectAllFilters()" 
            style="flex-direction:column; gap:2px; padding:6px 8px; min-width:44px; border-color:#00E5C3; background:#00E5C322; color:#00E5C3">
            <span style="font-size: var(--text-2xl)">☑️</span>
            <span style="font-size: var(--text-xs); font-weight:600">All</span>
        </button>
        <button class="mfb" onclick="window.selectNoneFilters()"
            style="flex-direction:column; gap:2px; padding:6px 8px; min-width:44px; opacity:0.6">
            <span style="font-size: var(--text-2xl)">🚫</span>
            <span style="font-size: var(--text-xs); font-weight:600">None</span>
        </button>
        <div style="width:1px;background:rgba(255,255,255,0.2);margin:0 3px;align-self:stretch"></div>`;

    overlay.innerHTML = quickBtns +
        renderBtns(statusKeys) +
        '<div style="width:1px;background:rgba(255,255,255,0.15);margin:0 3px"></div>' +
        renderBtns(moveKeys) +
        '<div style="width:1px;background:rgba(255,255,255,0.15);margin:0 3px"></div>' +
        `<button class="mfb ${guideActive ? 'on' : ''}" onclick="window.toggleStatusGuide()" style="flex-direction:column; gap:2px; padding:6px 12px; border-color:var(--p); color:var(--p)">
            <span style="font-size: var(--text-2xl)">💡</span>
            <span style="font-size: var(--text-xs); font-weight:800">Guide</span>
        </button>`;

    // Status Guide Overlay
    let guide = document.querySelector('.mguide');
    if (!guide) {
        guide = document.createElement('div');
        guide.className = 'mguide';
        document.getElementById('map').appendChild(guide);
    }
    guide.className = `mguide ${guideActive ? 'active' : ''}`;
    guide.innerHTML = `
        <div class="mguide-header">
            <span>Color & Status Guide</span>
            <span style="font-size:10px; opacity:0.6; cursor:pointer" onclick="window.toggleStatusGuide()">ESC</span>
        </div>
        <div class="mguide-item"><span class="badge active">ACTIVE</span> <span>Normal operation</span></div>
        <div class="mguide-item"><span class="badge expiring">⚠ EXPIRING</span> <span>Expires &lt; 24h</span></div>
        <div class="mguide-item"><span class="badge grace">GRACE</span> <span>0 credits, 7d grace</span></div>
        <div class="mguide-item"><span class="badge immobilized">IMMOBILIZED</span> <span>Relay Locked</span></div>
        <div class="mguide-item"><span class="badge" style="background:#6B7280;color:#fff">PAUSED</span> <span>Suspended</span></div>
        <div class="mguide-item"><span class="badge" style="background:var(--t3);color:#fff">AVAIL</span> <span>Unassigned</span></div>
        <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1); display:flex; flex-direction:column; gap:8px">
            <div class="mguide-item">
                <div style="width:24px; height:24px; background:var(--g); border-radius:50%; border:2px solid #fff"></div>
                <span>Online / Stopped</span>
            </div>
            <div class="mguide-item">
                <svg viewBox="0 0 36 36" width="24" height="24"><polygon points="18,2 30,32 18,24 6,32" fill="var(--g)" stroke="#fff" stroke-width="2"/></svg>
                <span>Online / Running</span>
            </div>
            <div class="mguide-item">
                <div style="width:24px; height:24px; background:#FF6B6B; border-radius:50%; border:2px solid #fff"></div>
                <span>Offline</span>
            </div>
        </div>
    `;

    // Legend
    const onlineCount = vehicles.filter(v => v.isOnline).length;
    const offlineCount = vehicles.length - onlineCount;
    const runningCount = vehicles.filter(v => v.isOnline && v.status !== 'immobilized' && (v.speed || 0) > 5).length;

    let leg = document.querySelector('.mleg');
    if (!leg) {
        leg = document.createElement('div');
        leg.className = 'mleg';
        document.getElementById('map').appendChild(leg);
    }
    leg.innerHTML = `
        <div class="lg"><div class="lg-d" style="background:var(--g)"></div><span>${onlineCount} Online</span></div>
        <div class="lg"><div class="lg-d" style="background:#FF6B6B"></div><span>${offlineCount} Offline</span></div>
        <div class="lg"><div class="lg-d" style="background:#60a5fa"></div><span>${runningCount} Running</span></div>
    `;

    // Global handlers
    window.toggleMapFilter = (key) => {
        mapFilters[key] = !mapFilters[key];
        renderMapControls(vehicles);
        window.dispatchEvent(new CustomEvent('map-filter-toggle', { detail: { key, vehicles } }));
    };
    window.selectAllFilters = () => {
        allKeys.forEach(k => mapFilters[k] = true);
        renderMapControls(vehicles);
        window.dispatchEvent(new CustomEvent('map-filter-toggle', { detail: { vehicles } }));
    };
    window.selectNoneFilters = () => {
        allKeys.forEach(k => mapFilters[k] = false);
        renderMapControls(vehicles);
        window.dispatchEvent(new CustomEvent('map-filter-toggle', { detail: { vehicles } }));
    };
    window.toggleStatusGuide = () => {
        guideActive = !guideActive;
        // Don't re-render with vehicles here as it might be out of scope, 
        // rely on the user event listener or local state
        // renderMapControls([]); // Temporary silent update
    };
};

// Update Map Makers with Filter Logic
const updateMapMarkers = (vehicles) => {
    if (!map || !markers) return;

    // First render controls (so counts update if provided, logic somewhat circular if we rely on it for filtering)
    // We render controls with ALL vehicles to show totals? Or filtered?
    // Gap Analysis: "Add on-map status filter buttons & legend"
    renderMapControls(vehicles);

    markers.clearLayers();
    markerMap.clear();

    vehicles.forEach(v => {
        const isExpiring = !!v.creditExpiry;
        // Locked or offline vehicles CANNOT be running
        const isRunning = v.status !== 'immobilized' && v.isOnline && (v.speed || 0) > 5;

        // Map Filter Logic
        if (isExpiring) {
            if (!mapFilters.expiring) return;
        } else {
            if (!mapFilters[v.status]) return;
        }

        // Online/Offline check
        if (v.isOnline && !mapFilters.online) return;
        if (!v.isOnline && !mapFilters.offline) return;

        // Running/Stopped filter
        if (isRunning && !mapFilters.running) return;
        if (!isRunning && !mapFilters.stopped) return;

        // Create Marker
        const credits = v.credits || 0;
        const scColor = COLORS[v.status] || '#999';
        const finalColor = !v.isOnline ? '#FF6B6B' : (isExpiring ? 'var(--c-orange)' : scColor);
        const bearing = v.bearing || 0;

        // Directional arrow icon
        let iconHtml;
        if (isRunning) {
            // Bold glowing directional arrow for running vehicles
            iconHtml = `<div style="
                width:36px; height:36px;
                transform: rotate(${bearing}deg);
                display:flex; align-items:center; justify-content:center;
                filter: drop-shadow(0 0 6px ${finalColor}) drop-shadow(0 2px 4px rgba(0,0,0,0.6));
            ">
                <svg viewBox="0 0 36 36" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="18,2 30,32 18,24 6,32" fill="${finalColor}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
                    <polygon points="18,7 26,28 18,21 10,28" fill="${finalColor}CC" stroke="none"/>
                </svg>
            </div>`;
        } else {
            // Bold circle pin for stopped vehicles
            iconHtml = `<div style="
                width:28px; height:28px;
                background: radial-gradient(circle at 40% 35%, ${finalColor}EE, ${finalColor});
                border: 3px solid rgba(255,255,255,0.9);
                border-radius: 50%;
                box-shadow: 0 0 8px ${finalColor}99, 0 3px 6px rgba(0,0,0,0.5);
                display:flex; align-items:center; justify-content:center;
                font-size: var(--text-base);
            "></div>`;
        }

        const icon = L.divIcon({
            className: '',
            html: iconHtml,
            iconSize: isRunning ? [36, 36] : [28, 28],
            iconAnchor: isRunning ? [18, 18] : [14, 14]
        });

        const lat = v.location?.lat || v.lat;
        const lng = v.location?.lng || v.lng;
        if (!lat || !lng) return;

        const marker = L.marker([lat, lng], { icon });

        // Build credit/grace info row for popup
        const creditDaysLeft = v.credits || 0;
        const isGrace = v.status === 'grace';
        const graceDaysLeft = isGrace && v.graceExpiry
            ? Math.max(0, Math.ceil((new Date(v.graceExpiry) - Date.now()) / 86400000))
            : 0;

        const creditRow = isExpiring
            ? `<div style="background:var(--c-orange)22; border:1px solid var(--c-orange); border-radius:6px; padding:6px 8px; margin-bottom:6px">
                <div style="font-size: var(--text-sm); color:var(--c-orange); font-weight:700">⚠️ EXPIRING TODAY</div>
                <div style="font-size: var(--text-md); color:#333">Credit expires within 24h</div>
               </div>`
            : isGrace
                ? `<div style="background:var(--c-warning)22; border:1px solid var(--c-warning); border-radius:6px; padding:6px 8px; margin-bottom:6px">
                <div style="font-size: var(--text-sm); color:var(--c-warning); font-weight:700">⏳ GRACE PERIOD</div>
                <div style="font-size: var(--text-md); color:#333">${graceDaysLeft} rest days remaining</div>
               </div>`
                : v.status === 'immobilized'
                    ? `<div style="background:var(--c-danger)22; border:1px solid var(--c-danger); border-radius:6px; padding:6px 8px; margin-bottom:6px">
                <div style="font-size: var(--text-sm); color:var(--c-danger); font-weight:700">🔒 IMMOBILIZED</div>
                <div style="font-size: var(--text-md); color:#333">Vehicle relay locked</div>
               </div>`
                    : `<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px">
                <div style="text-align:center; background:var(--c-success)22; border:1px solid var(--c-success)44; border-radius:6px; padding:4px 10px; flex:1">
                    <div style="font-size: var(--text-3xl); font-weight:800; color:var(--c-success); font-family:'IBM Plex Mono'">${creditDaysLeft}</div>
                    <div style="font-size: var(--text-xs); color:#555; font-weight:600">CREDIT DAYS</div>
                </div>
                <div style="text-align:center; background:#60a5fa22; border:1px solid #60a5fa44; border-radius:6px; padding:4px 10px; flex:1">
                    <div style="font-size: var(--text-3xl); font-weight:800; color:#60a5fa; font-family:'IBM Plex Mono'">${v.totalDays || 30}</div>
                    <div style="font-size: var(--text-xs); color:#555; font-weight:600">CYCLE DAYS</div>
                </div>
               </div>`;

        const speedText = isRunning
            ? `🏃 ${v.speed} km/h · ${bearingLabel(bearing)}`
            : '■ Stopped';

        marker.bindPopup(`
            <div style="font-family:'IBM Plex Mono'; font-size: var(--text-base); line-height:1.5; color:#000; min-width:220px; padding:4px">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; gap:8px">
                    <div style="font-weight:800; font-size: var(--text-xl); color:#000">${v.customer || 'No Customer'}</div>
                    <div style="font-size: var(--text-sm); padding:2px 6px; background:${finalColor}25; border:1px solid ${finalColor}; border-radius:4px; color:${finalColor}; font-weight:700; white-space:nowrap">${v.status.toUpperCase()}</div>
                </div>
                <div style="font-size: var(--text-md); font-weight:600; color:#555; margin-bottom:8px">📞 ${v.phone || '-'} &nbsp;|&nbsp; 🏍️ ${v.plate}</div>

                ${creditRow}

                <div style="border-top:1px solid rgba(0,0,0,0.08); padding-top:6px; margin-bottom:6px">
                    <div style="font-weight:700; color:#333; font-size: var(--text-md)">${v.id} — ${v.model}</div>
                </div>
                <div style="font-size: var(--text-md); font-weight:700; margin-bottom:4px; color:${isRunning ? '#16a34a' : '#888'}">${speedText}</div>
                <div style="font-size: var(--text-sm); font-weight:600">
                    ${v.isOnline ?
                `<span style="color:#16a34a">● ${isRunning ? 'Running' : 'Stopped'} (${timeAgo(v.lastPing)})</span>` :
                `<span style="color:#dc2626">○ Offline (${timeAgo(v.lastPing)})</span>`}
                </div>
            </div>
        `, { closeButton: false, className: 'custom-popup-light', maxWidth: 280 });

        marker.on('click', () => {
            if (map.onVehicleSelect) map.onVehicleSelect(v.id);
        });

        markers.addLayer(marker);
        markerMap.set(v.id, marker);
    });
};

const focusVehicleOnMap = (id) => {
    const marker = markerMap.get(id);
    if (marker) {
        map.flyTo(marker.getLatLng(), 15);
        setTimeout(() => marker.openPopup(), 600);
    }
};

const resizeMap = () => {
    // Leaflet needs to know if container resized
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 200);
};
