/* GPS Device CRUD Operations */
import { state } from './store.js';

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createGpsDevice = (fields) => {
    const newDevice = {
        id: `GPS-${String(state.gpsDevices.length + 1).padStart(5, '0')}`,
        imei: fields.imei || '',
        serial: fields.serial || '',
        brand: fields.brand || 'Weloop',
        model: fields.model || 'WL-210 Pro',
        firmware: fields.firmware || 'FW-1.0.0',
        firmwareLatest: fields.firmware || 'FW-1.0.0',
        firmwareUpdateRequired: false,
        sim: {
            number: fields.simNumber || '',
            carrier: fields.carrier || 'Telkomsel',
            dataUsedMB: 0,
            dataLimitMB: 500,
            expiry: fields.simExpiry || '',
            status: 'Active',
            monthlyCost: 15000,
        },
        vehicleId: fields.vehicleId || null,
        vehiclePlate: fields.vehicleId
            ? (state.vehicles.find(v => v.id === fields.vehicleId)?.plate || '—')
            : '—',
        installDate: fields.installDate || null,
        mountPosition: fields.mountPosition || 'Under Seat',
        relayConnected: fields.relayConnected !== false,
        status: fields.vehicleId ? 'Online' : 'Offline',
        lastPing: fields.vehicleId ? new Date().toISOString() : null,
        signalStrength: fields.vehicleId ? 'Good' : 'None',
        uptime30d: 0,
        immobilizationState: 'Normal',
        purchaseCost: Number(fields.purchaseCost) || 350000,
        monthlyCost: 15000,
        warrantyExpiry: fields.warrantyExpiry || '',
    };
    state.gpsDevices.push(newDevice);
    return newDevice;
};

// ─── READ ─────────────────────────────────────────────────────────────────────
export const getGpsDevices = (filter = {}) => {
    let devices = [...state.gpsDevices];
    if (filter.status && filter.status !== 'all') {
        devices = devices.filter(d => d.status === filter.status);
    }
    if (filter.brand && filter.brand !== 'all') {
        devices = devices.filter(d => d.brand === filter.brand);
    }
    if (filter.carrier && filter.carrier !== 'all') {
        devices = devices.filter(d => d.sim.carrier === filter.carrier);
    }
    if (filter.search) {
        const q = filter.search.toLowerCase();
        devices = devices.filter(d =>
            d.id.toLowerCase().includes(q) ||
            d.imei.toLowerCase().includes(q) ||
            d.vehiclePlate.toLowerCase().includes(q) ||
            d.brand.toLowerCase().includes(q)
        );
    }
    return devices;
};

export const getGpsById = (id) => state.gpsDevices.find(d => d.id === id);

export const getGpsStats = () => {
    const all = state.gpsDevices;
    return {
        total: all.length,
        online: all.filter(d => d.status === 'Online').length,
        offline: all.filter(d => d.status === 'Offline').length,
        lowSignal: all.filter(d => d.status === 'Low Signal').length,
        tampered: all.filter(d => d.status === 'Tampered').length,
        firmwareAlert: all.filter(d => d.firmwareUpdateRequired).length,
        simExpiring: all.filter(d => {
            if (!d.sim.expiry || d.sim.expiry === '-') return false;
            const days = (new Date(d.sim.expiry) - Date.now()) / 86400000;
            return days >= 0 && days < 30;
        }).length,
    };
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateGpsDevice = (id, fields) => {
    const idx = state.gpsDevices.findIndex(d => d.id === id);
    if (idx === -1) return null;
    const device = state.gpsDevices[idx];

    // Update top-level fields
    const topLevel = ['brand', 'model', 'firmware', 'mountPosition', 'vehicleId', 'installDate', 'warrantyExpiry', 'purchaseCost'];
    topLevel.forEach(k => { if (fields[k] !== undefined) device[k] = fields[k]; });

    // Update vehicle plate if vehicleId changed
    if (fields.vehicleId !== undefined) {
        device.vehiclePlate = fields.vehicleId
            ? (state.vehicles.find(v => v.id === fields.vehicleId)?.plate || '—')
            : '—';
    }

    // Update SIM sub-fields
    const simFields = ['simNumber', 'carrier', 'simExpiry'];
    if (fields.simNumber !== undefined) device.sim.number = fields.simNumber;
    if (fields.carrier !== undefined) device.sim.carrier = fields.carrier;
    if (fields.simExpiry !== undefined) device.sim.expiry = fields.simExpiry;

    state.gpsDevices[idx] = device;
    return device;
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteGpsDevice = (id) => {
    const idx = state.gpsDevices.findIndex(d => d.id === id);
    if (idx === -1) return false;
    state.gpsDevices.splice(idx, 1);
    return true;
};
