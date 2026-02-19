/* Map Logic */
// Removed invalid import

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
    offline: true
};

// Colors for each status
const COLORS = {
    active: '#22C55E',
    expiring: '#FF6B35',
    grace: '#F59E0B',
    immobilized: '#EF4444',
    paused: '#6B7280',
    available: '#3B82F6',
    online: '#22C55E',
    offline: '#FF6B6B'
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
    offline: 'Offline'
};


export const initMap = (onVehicleSelect) => {
    // Check if map container exists
    if (!document.getElementById('map')) return;

    // Jabodetabek view
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false // Hide for cleaner look
    }).setView([-6.2088, 106.8456], 11);

    // Dark Map Tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
    }).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Cluster Group with Custom Styling
    markers = L.markerClusterGroup({
        maxClusterRadius: 40,
        iconCreateFunction: function (cluster) {
            const count = cluster.getChildCount();
            return L.divIcon({
                html: `<div style="
                    width:32px; height:32px; 
                    background:rgba(0, 229, 195, 0.2); 
                    border:2px solid #00E5C3; 
                    border-radius:50%; 
                    color:#fff; 
                    display:flex; 
                    align-items:center; 
                    justify-content:center; 
                    font-weight:bold;
                    backdrop-filter: blur(4px);
                    font-family: 'IBM Plex Mono';
                    font-size: 12px;
                ">${count}</div>`,
                className: 'custom-cluster',
                iconSize: [32, 32]
            });
        }
    });

    map.addLayer(markers);

    // Store callback
    map.onVehicleSelect = onVehicleSelect;
};

export const renderMapControls = (vehicles) => {
    const elMock = document.getElementById('mapFilters');
    if (!elMock) return;

    // Filters
    const keys = ['active', 'expiring', 'grace', 'immobilized', 'paused', 'available', 'online', 'offline'];
    const html = keys.map(k => {
        const c = COLORS[k];
        const isOn = mapFilters[k];
        return `
        <button class="mfb ${isOn ? 'on' : ''}" 
            onclick="window.toggleMapFilter('${k}')"
            style="${isOn ? 'border-color:' + c + '40' : ''}">
            <div class="dot" style="background:${c}"></div>
            <span>${LABELS[k]}</span>
        </button>`;
    }).join('');

    // Prepend to body or map container? index.html has #mapFilters INSIDE #map.
    // We already have a div inside map.
    // But we need to define toggleMapFilter globally or attach listeners.

    // We'll use a container overlay
    let overlay = document.querySelector('.mf');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mf';
        document.getElementById('map').appendChild(overlay);
    }
    overlay.innerHTML = html;

    // Legend
    const onlineCount = vehicles.filter(v => v.isOnline).length;
    const offlineCount = vehicles.length - onlineCount;

    let leg = document.querySelector('.mleg');
    if (!leg) {
        leg = document.createElement('div');
        leg.className = 'mleg';
        document.getElementById('map').appendChild(leg);
    }
    leg.innerHTML = `
        <div class="lg">
            <div class="lg-d" style="background:var(--g)"></div>
            <span>${onlineCount} Online</span>
        </div>
        <div class="lg">
            <div class="lg-d" style="background:#FF6B6B"></div>
            <span>${offlineCount} Offline</span>
        </div>
    `;

    // Global toggle handler
    window.toggleMapFilter = (key) => {
        mapFilters[key] = !mapFilters[key];
        // Re-render controls to show state change
        renderMapControls(vehicles); // We need vehicles list... or just update classes?
        // Better: trigger updateMapMarkers with stored vehicles?
        // We don't have stored vehicles here.
        // We should dispatch event or just re-run updateMapMarkers if we had access to data.
        // For now, let's dispatch event
        window.dispatchEvent(new CustomEvent('map-filter-toggle', { detail: { key, vehicles } }));
    };
};

// Update Map Makers with Filter Logic
export const updateMapMarkers = (vehicles) => {
    if (!map || !markers) return;

    // First render controls (so counts update if provided, logic somewhat circular if we rely on it for filtering)
    // We render controls with ALL vehicles to show totals? Or filtered?
    // Gap Analysis: "Add on-map status filter buttons & legend"
    renderMapControls(vehicles);

    markers.clearLayers();
    markerMap.clear();

    vehicles.forEach(v => {
        // Map Filter Logic
        // 1. Status Check
        // if (!mapFilters[v.status] && v.status !== 'expiring') { // Expiring is a derived status usually?
        //      // If status is active but has creditExpiry, is it 'expiring'?
        //      // Reference HTML: 
        //      // if(expiring && !mapF.expiring) return;
        //      // if(!mapF[v.st]) return;
        // }

        const isExpiring = !!v.creditExpiry;
        // const statusKey = isExpiring ? 'expiring' : v.status; // Not used directly in filter logic below

        // Check Map Filters
        // If it's expiring, check 'expiring' filter. If not allowed, return.
        // Note: 'active' vehicles can be expiring.

        if (isExpiring) {
            if (!mapFilters.expiring) return;
        } else {
            if (!mapFilters[v.status]) return;
        }

        // Online/Offline check
        if (v.isOnline && !mapFilters.online) return;
        if (!v.isOnline && !mapFilters.offline) return;

        // Create Marker
        // ... (Existing Logic)
        const el = document.createElement('div');
        el.className = 'marker-custom';
        // const color = isExpiring ? COLORS.expiring : (v.isOnline ? COLORS.active : COLORS.offline); // Simplified color logic

        // Exact logic from Reference:
        // const col=!online?'#FF6B6B':expiring?'#FF6B35':sc.c;
        const scColor = COLORS[v.status] || '#999';
        const finalColor = !v.isOnline ? '#FF6B6B' : (isExpiring ? '#FF6B35' : scColor);

        el.style.backgroundColor = finalColor;
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid #fff';
        el.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';

        const icon = L.divIcon({
            className: '',
            html: el,
            iconSize: [12, 12]
        });

        // Ensure v.location exists and has lat/lng, otherwise fallback to v.lat/v.lng if they exist
        const lat = v.location?.lat || v.lat;
        const lng = v.location?.lng || v.lng;

        if (!lat || !lng) return; // Skip if no valid coordinates

        const marker = L.marker([lat, lng], { icon });

        // Popup
        marker.bindPopup(`
            <div style="font-family:'IBM Plex Mono'; font-size:11px; line-height:1.6; color:#fff">
                <div style="font-weight:bold; color:${finalColor}">${v.id}</div>
                <div>${v.model} • ${v.plate}</div>
                <div style="opacity:0.7">${v.customer || 'No Customer'}</div>
                <div style="margin-top:4px; font-size:10px">
                    ${v.isOnline ? '🟢 Online' : '🔴 Offline ' + (v.lastPing ? new Date(v.lastPing).toLocaleTimeString() : '')}
                </div>
            </div>
        `, {
            closeButton: false,
            className: 'custom-popup-dark' // Need css for this
        });

        marker.on('click', () => {
            if (map.onVehicleSelect) map.onVehicleSelect(v.id);
        });

        markers.addLayer(marker);
        markerMap.set(v.id, marker);
    });
};

export const focusVehicleOnMap = (id) => {
    const marker = markerMap.get(id);
    if (marker) {
        map.flyTo(marker.getLatLng(), 15);

        // Open popup if clustered?
        // markers.zoomToShowLayer(marker, () => {
        //    marker.openPopup();
        // });
        // Standard cluster plugin method:
        markers.zoomToShowLayer(marker, () => {
            marker.openPopup();
        });
    }
};

export const resizeMap = () => {
    // Leaflet needs to know if container resized
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 200);
};
