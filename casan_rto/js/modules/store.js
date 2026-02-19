/* Store & Data Generation */

/* Store & Data Generation */

export const partners = [
    { id: 'tangkas', name: 'Tangkas Motors', color: '#A78BFA' },
    { id: 'maka', name: 'Maka Motors', color: '#60A5FA' },
    { id: 'united', name: 'United Motors', color: '#FB923C' }
];

export const programs = [
    { id: 'P-TK-RTO', name: 'Zeeho RTO', shortName: 'Zeeho', partnerId: 'tangkas', type: 'RTO', price: 38000, grace: 7 },
    { id: 'P-TK-RNT', name: 'Zeeho Rent', shortName: 'Zeeho', partnerId: 'tangkas', type: 'Rent', price: 30000, grace: 5 },
    { id: 'P-MK-RTO', name: 'Maka RTO', shortName: 'Maka', partnerId: 'maka', type: 'RTO', price: 35000, grace: 7 },
    { id: 'P-MK-RNT', name: 'Maka Rent', shortName: 'Maka', partnerId: 'maka', type: 'Rent', price: 28000, grace: 5 },
    { id: 'P-UN-RTO', name: 'United RTO', shortName: 'Unitd', partnerId: 'united', type: 'RTO', price: 32000, grace: 7 },
    { id: 'P-UN-RNT', name: 'United Rent', shortName: 'Unitd', partnerId: 'united', type: 'Rent', price: 25000, grace: 5 }
];

// Seeded random for consistent demo data
let seed = 1234;
const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

const randInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;
const randArr = (arr) => arr[randInt(0, arr.length - 1)];

const firstNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Joko'];
const lastNames = ['Santoso', 'Pratama', 'Wijaya', 'Saputra', 'Hidayat', 'Nugroho', 'Kusuma', 'Lestari', 'Wibowo', 'Yulianto'];

export const state = {
    vehicles: [],
    transactions: [],
    gpsDevices: [],
    filter: {
        partner: 'all',
        status: 'all',
        search: '',
        program: 'all'
    }
};

export const initData = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Generate 100 Vehicles
    for (let i = 1; i <= 100; i++) {
        const partner = randArr(partners);
        // Force RTO type more often as requested
        const isRto = random() > 0.3; // 70% RTO
        const program = programs.find(p => p.partnerId === partner.id && (isRto ? p.type === 'RTO' : p.type === 'Rent'));

        // Status Distribution
        // 55 Active (approx), 15 Grace, 12 Immob, 8 Paused, 10 Avail
        const r = random();
        let status = 'active';
        if (r < 0.10) status = 'available';
        else if (r < 0.18) status = 'paused';
        else if (r < 0.30) status = 'immobilized';
        else if (r < 0.45) status = 'grace';

        let credits = 0;
        let creditExpiry = null;
        let graceExpiry = null;

        const now = Date.now();
        const oneDay = 86400000;

        if (status === 'active') {
            credits = randInt(1, 20);
            // 20% of active are expiring (< 24h)
            if (random() < 0.2) {
                credits = 0; // Technically 0 days but valid until specific hour
                creditExpiry = new Date(now + randInt(1000 * 60, 23 * 60 * 60 * 1000)).toISOString();
            }
        } else if (status === 'grace') {
            credits = 0;
            const graceDaysTotal = program.grace;
            const daysIntoGrace = randInt(1, graceDaysTotal - 1);
            graceExpiry = new Date(now + (graceDaysTotal - daysIntoGrace) * oneDay).toISOString();
        } else if (status === 'immobilized') {
            credits = 0;
        }

        // Locations (Jabodetabek)
        // Center roughly Jakarta -6.2, 106.8
        const lat = -6.2 + (random() - 0.5) * 0.3;
        const lng = 106.8 + (random() - 0.5) * 0.4;

        // Online logic
        const lastPing = new Date(now - randInt(0, 10 * oneDay)); // Up to 10 days ago
        let isOnline = false;

        // If actually active/grace/immob, high chance of being online recently if not paused
        if (status !== 'available' && status !== 'paused') {
            if (random() > 0.2) { // 80% have recent ping
                // Reset lastPing to very recent
                lastPing.setTime(now - randInt(0, 59 * 60 * 1000));
                isOnline = true;
            }
        }

        const vehicle = {
            id: `CSN-${String(i).padStart(3, '0')}`,
            plate: `B ${randInt(1000, 9999)} ${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}`,
            model: partner.name + (isRto ? ' RTO' : ' Rent'), // Simplified model name
            partnerId: partner.id,
            programId: program.id,
            programType: isRto ? 'RTO' : 'Rent',
            customer: status !== 'available' ? (firstNames[randInt(0, 9)] + ' ' + lastNames[randInt(0, 9)]) : null,
            status: status,
            creditExpiry: creditExpiry, // For active but expiring
            graceExpiry: graceExpiry, // For grace period
            credits: credits,
            totalDays: 30, // Cycle length
            phone: `+62 8${randInt(11, 99)}-${randInt(1000, 9999)}-${randInt(100, 999)}`,
            lat: lat,
            lng: lng,
            isOnline: isOnline,
            lastPing: lastPing.toISOString(),
            speed: isOnline ? randInt(0, 60) : 0,
            battery: randInt(20, 100),
            dailyRate: program.price
        };

        state.vehicles.push(vehicle);
    }


    // Generate Transactions
    // Aim for ~500-800 transactions total
    // Walk back 90 days
    const txCount = randInt(500, 800);
    const sortedVehicles = [...state.vehicles];

    for (let i = 0; i < txCount; i++) {
        // Pick a random vehicle, weighted towards active/grace ones
        const v = randArr(sortedVehicles);

        // Random date within last 90 days
        const date = new Date(now - randInt(0, 90 * oneDay));

        // Determine type of transaction
        // 80% Payment, 20% Fine/Fee (simplified as just extra payment for now)
        const days = 7;
        const amount = days * v.dailyRate;
        const fees = v.programType === 'RTO' ? 25000 : 0; // Random fee

        // Partner share calculation (mock)
        const partnerShare = amount * 0.9;
        const casanShare = amount * 0.1;

        state.transactions.push({
            id: `TX-${randInt(10000, 99999)}`,
            date: date.toISOString(),
            vehicleId: v.id,
            customer: v.customer,
            partnerId: v.partnerId,
            program: v.programName,
            type: v.programType,
            amount: amount + (random() < 0.1 ? fees : 0),
            partnerShare: partnerShare,
            casanShare: casanShare,
            status: random() > 0.95 ? 'failed' : 'paid', // 5% failure rate
            method: randArr(['BCA', 'Mandiri', 'OVO', 'Gopay', 'Cash'])
        });
    }

    // Sort transactions by date desc
    state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate GPS Devices (one per vehicle + 3 unassigned spares)
    const gpsBrands = [
        { brand: 'Weloop', models: ['WL-210 Pro', 'WL-310'], firmwareBase: 'FW-3.4.' },
        { brand: 'Teltonika', models: ['FMB920', 'FMB130'], firmwareBase: 'FW-03.27.' },
        { brand: 'Concox', models: ['GT06N', 'TR06'], firmwareBase: 'FW-2.1.' },
    ];
    const carriers = ['Telkomsel', 'XL', 'Indosat', 'Tri', 'Smartfren'];
    const mountPositions = ['Under Seat', 'Behind Panel', 'Frame', 'Battery Compartment'];
    const gpsStatuses = ['Online', 'Online', 'Online', 'Offline', 'Low Signal', 'Tampered'];
    const simStatuses = ['Active', 'Active', 'Active', 'Low Balance', 'Expired'];

    // One GPS per vehicle
    state.vehicles.forEach((v, idx) => {
        const brandObj = randArr(gpsBrands);
        const model = randArr(brandObj.models);
        const fwNum = randInt(1, 9);
        const fwLatest = fwNum + 1;
        const carrier = randArr(carriers);
        const devStatus = randArr(gpsStatuses);
        const dataUsed = randInt(50, 490);
        const installDate = new Date(now - randInt(30 * oneDay, 365 * oneDay)).toISOString().split('T')[0];

        // Mock Indonesian address components
        const streets = ['Jl. Sudirman', 'Jl. Gatot Subroto', 'Jl. Rasuna Said', 'Jl. Thamrin', 'Jl. TB Simatupang', 'Jl. Kemang Raya', 'Jl. Senopati', 'Jl. Raya Bogor'];
        const kecamatans = ['Kebayoran Baru', 'Setiabudi', 'Menteng', 'Tebet', 'Cilandak', 'Pancoran', 'Pasar Minggu', 'Tanah Abang'];
        const kotas = ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat', 'Jakarta Utara'];

        const street = randArr(streets) + ' No. ' + randInt(1, 150);
        const kec = randArr(kecamatans);
        const kota = randArr(kotas);
        const address = `${street}, ${kec}, ${kota}`;

        const lastPingDate = devStatus === 'Online'
            ? new Date(now - randInt(0, 60 * 60 * 1000))
            : new Date(now - randInt(2 * 60 * 60 * 1000, 10 * oneDay));

        state.gpsDevices.push({
            id: `GPS-${String(idx + 1).padStart(5, '0')}`,
            imei: `86${randInt(1000000000000, 9999999999999)}`,
            serial: `${brandObj.brand.substring(0, 2).toUpperCase()}-2024-${String(randInt(1000, 9999))}`,
            brand: brandObj.brand,
            model: model,
            firmware: `${brandObj.firmwareBase}${fwNum}`,
            firmwareLatest: `${brandObj.firmwareBase}${fwLatest}`,
            firmwareUpdateRequired: fwNum < fwLatest,
            // SIM
            sim: {
                number: `0${randInt(811, 899)}${randInt(10000000, 99999999)}`,
                carrier: carrier,
                dataUsedMB: dataUsed,
                dataLimitMB: 500,
                expiry: new Date(now + randInt(7 * oneDay, 180 * oneDay)).toISOString().split('T')[0],
                status: randArr(simStatuses),
                monthlyCost: 15000,
            },
            // Installation
            vehicleId: v.id,
            vehiclePlate: v.plate,
            installDate: installDate,
            mountPosition: randArr(mountPositions),
            relayConnected: true,
            // Status
            status: devStatus,
            lat: devStatus === 'Online' ? -6.2 + (random() - 0.5) * 0.3 : null,
            lng: devStatus === 'Online' ? 106.8 + (random() - 0.5) * 0.4 : null,
            address: devStatus === 'Online' ? address : '—',
            lastPing: lastPingDate.toISOString(),
            lastPingTime: lastPingDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            signalStrength: devStatus === 'Online' ? randArr(['Excellent', 'Good', 'Fair']) : 'Poor',
            uptime30d: devStatus === 'Online' ? randInt(92, 100) : randInt(40, 85),
            immobilizationState: v.status === 'immobilized' ? 'Immobilized' : 'Normal',
            // Financial
            purchaseCost: 350000,
            monthlyCost: 15000,
            warrantyExpiry: new Date(now + randInt(30 * oneDay, 365 * oneDay)).toISOString().split('T')[0],
        });
    });

    // 3 unassigned spare devices
    for (let s = 0; s < 3; s++) {
        const brandObj = randArr(gpsBrands);
        state.gpsDevices.push({
            id: `GPS-SPARE-${String(s + 1).padStart(3, '0')}`,
            imei: `86${randInt(1000000000000, 9999999999999)}`,
            serial: `${brandObj.brand.substring(0, 2).toUpperCase()}-SPARE-${randInt(100, 999)}`,
            brand: brandObj.brand,
            model: randArr(brandObj.models),
            firmware: `${brandObj.firmwareBase}1`,
            firmwareLatest: `${brandObj.firmwareBase}2`,
            firmwareUpdateRequired: true,
            sim: { number: '-', carrier: '-', dataUsedMB: 0, dataLimitMB: 500, expiry: '-', status: 'Inactive', monthlyCost: 0 },
            vehicleId: null,
            vehiclePlate: '—',
            installDate: null,
            mountPosition: '—',
            relayConnected: false,
            status: 'Offline',
            lastPing: null,
            signalStrength: 'None',
            uptime30d: 0,
            immobilizationState: '—',
            purchaseCost: 350000,
            monthlyCost: 0,
            warrantyExpiry: new Date(now + 365 * oneDay).toISOString().split('T')[0],
        });
    }

    console.log(`Generated ${state.vehicles.length} vehicles, ${state.transactions.length} transactions, ${state.gpsDevices.length} GPS devices`);
};

export const getFilteredVehicles = () => {
    return state.vehicles.filter(v => {
        // Partner Filter
        if (state.filter.partner !== 'all' && v.partnerId !== state.filter.partner) return false;

        // Status Filter
        if (state.filter.status !== 'all') {
            if (state.filter.status === 'expiring') {
                return v.creditExpiry !== null; // Specific check
            }
            if (state.filter.status === 'offline') {
                return !v.isOnline && v.status !== 'available';
            }
            if (state.filter.status === 'online') {
                return v.isOnline;
            }
            if (v.status !== state.filter.status) return false;
        }

        // Search Filter
        if (state.filter.search) {
            const q = state.filter.search.toLowerCase();
            const match = v.id.toLowerCase().includes(q) ||
                v.plate.toLowerCase().includes(q) ||
                (v.customer && v.customer.toLowerCase().includes(q)) ||
                v.phone.includes(q);
            if (!match) return false;
        }

        return true;
    });
};

export const getStats = () => {
    // Calculate stats based on CURRENT filtered partner

    const fleet = state.vehicles.filter(v => state.filter.partner === 'all' || v.partnerId === state.filter.partner);

    const active = fleet.filter(v => v.status === 'active').length;
    const expiring = fleet.filter(v => v.creditExpiry !== null).length;
    const grace = fleet.filter(v => v.status === 'grace').length;
    const immobilized = fleet.filter(v => v.status === 'immobilized').length;
    const online = fleet.filter(v => v.isOnline).length;

    // Mock Revenue Calculation
    const revenue = fleet.length * 4500000; // rough estimate

    return {
        total: fleet.length,
        active,
        expiring,
        grace,
        immobilized,
        online,
        revenue
    };
};
