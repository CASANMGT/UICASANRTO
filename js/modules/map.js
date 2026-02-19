/* Map Logic */
import { timeAgo } from './utils.js';

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
                    color:#000; 
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
        const isExpiring = !!v.creditExpiry;

        // Map Filter Logic
        // ... (existing logic)
        if (isExpiring) {
            if (!mapFilters.expiring) return;
        } else {
            if (!mapFilters[v.status]) return;
        }

        // Online/Offline check
        if (v.isOnline && !mapFilters.online) return;
        if (!v.isOnline && !mapFilters.offline) return;

        // Create Marker
        const credits = v.credits || 0;

        let label = '';
        if (v.status === 'active') {
            label = isExpiring ? '<1' : credits;
        } else if (v.status === 'grace') {
            label = 'G'; // Indicate Grace period
        } else if (v.status === 'immobilized') {
            label = 'L'; // Indicate Locked
        }

        const el = document.createElement('div');
        el.className = 'marker-custom';
        const scColor = COLORS[v.status] || '#999';
        const finalColor = !v.isOnline ? '#FF6B6B' : (isExpiring ? '#FF6B35' : scColor);

        el.style.backgroundColor = finalColor;
        el.style.width = '24px'; // Increased for better clickability
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid #fff';
        el.style.boxShadow = '0 0 6px rgba(0,0,0,0.4)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = label === '<1' ? '8px' : '11px';
        el.style.fontWeight = 'bold';
        el.style.color = '#000';
        el.style.fontFamily = 'IBM Plex Mono';
        el.innerText = label;

        const icon = L.divIcon({
            className: '',
            html: el,
            iconSize: [24, 24]
        });

        // Ensure v.location exists and has lat/lng, otherwise fallback to v.lat/v.lng if they exist
        const lat = v.location?.lat || v.lat;
        const lng = v.location?.lng || v.lng;

        if (!lat || !lng) return; // Skip if no valid coordinates

        const marker = L.marker([lat, lng], { icon });

        // Popup
        const creditDisplay = label === '<1' ? 'EXPIRING' : (label === 'G' ? 'GRACE' : (label === 'L' ? 'LOCKED' : `${label} Days Left`));

        marker.bindPopup(`
            <div style="font-family:'IBM Plex Mono'; font-size:12px; line-height:1.5; color:#000; min-width:200px; padding:4px">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; gap:10px">
                    <div style="font-weight:800; font-size:15px; color:#000">${v.customer || 'No Customer'}</div>
                    <div style="font-size:10px; padding:2px 6px; background:${finalColor}25; border:1px solid ${finalColor}; border-radius:4px; color:#000; font-weight:700; white-space:nowrap">${creditDisplay}</div>
                </div>
                <div style="font-size:12px; font-weight:600; color:#555; margin-bottom:10px">📞 ${v.phone || '-'}</div>
                
                <div style="border-top:1px solid rgba(0,0,0,0.1); padding-top:8px; margin-bottom:8px">
                    <div style="font-weight:700; color:#333; font-size:11px">${v.id} • ${v.plate}</div>
                    <div style="opacity:0.7; font-size:11px">${v.model}</div>
                </div>

                <div style="font-size:10px; display:flex; align-items:center; gap:5px; font-weight:600">
                    ${v.isOnline ?
                `<span style="color:#16a34a">🟢 Online (${timeAgo(v.lastPing)})</span>` :
                `<span style="color:#dc2626">🔴 Offline (${timeAgo(v.lastPing)})</span>`}
                </div>
            </div>
        `, {
            closeButton: false,
            className: 'custom-popup-light'
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
