/* Store & Data Generation */

/* Store & Data Generation */

export const partners = [
    { id: 'tangkas', name: 'Tangkas Motors', color: '#A78BFA' },
    { id: 'maka', name: 'Maka Motors', color: '#60A5FA' },
    { id: 'united', name: 'United Motors', color: '#FB923C' }
];

const initialPrograms = [
    { id: 'P-TK-RTO', name: 'Zeeho RTO', shortName: 'Zeeho', partnerId: 'tangkas', type: 'RTO', price: 38000, grace: 7 },
    { id: 'P-TK-RNT', name: 'Zeeho Rent', shortName: 'Zeeho', partnerId: 'tangkas', type: 'Rent', price: 30000, grace: 5 },
    { id: 'P-MK-RTO', name: 'Maka RTO', shortName: 'Maka', partnerId: 'maka', type: 'RTO', price: 35000, grace: 7 },
    { id: 'P-MK-RNT', name: 'Maka Rent', shortName: 'Maka', partnerId: 'maka', type: 'Rent', price: 28000, grace: 5 },
    { id: 'P-UN-RTO', name: 'United RTO', shortName: 'Unitd', partnerId: 'united', type: 'RTO', price: 32000, grace: 7 },
    { id: 'P-UN-RNT', name: 'United Rent', shortName: 'Unitd', partnerId: 'united', type: 'Rent', price: 25000, grace: 5 }
];

export let programs = [...initialPrograms];

// Seeded random for consistent demo data
let seed = 1234;
const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

const randInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;
const randArr = (arr) => arr[randInt(0, arr.length - 1)];

const maleFirstNames = ['Ahmad', 'Budi', 'Eko', 'Fajar', 'Hadi', 'Joko', 'Rizky', 'Aditya', 'Bambang', 'Wawan'];
const femaleFirstNames = ['Citra', 'Dewi', 'Gita', 'Indah', 'Lestari', 'Sari', 'Anisa', 'Putri', 'Maya', 'Rini'];
const allFirstNames = [...maleFirstNames, ...femaleFirstNames];
const lastNames = ['Santoso', 'Pratama', 'Wijaya', 'Saputra', 'Hidayat', 'Nugroho', 'Kusuma', 'Lestari', 'Wibowo', 'Yulianto'];

const streets = ['Jl. Sudirman', 'Jl. Gatot Subroto', 'Jl. Rasuna Said', 'Jl. Thamrin', 'Jl. TB Simatupang', 'Jl. Kemang Raya', 'Jl. Senopati', 'Jl. Raya Bogor'];
const kecamatans = ['Kebayoran Baru', 'Setiabudi', 'Menteng', 'Tebet', 'Cilandak', 'Pancoran', 'Pasar Minggu', 'Tanah Abang'];
const kotas = ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat', 'Jakarta Utara'];
const occupations = ['ojol', 'msme', 'private_employee', 'civil_servant', 'freelancer', 'logistics', 'student', 'other'];
const employers = ['Gojek', 'Grab', 'Shopee Express', 'J&T', 'SiCepat', 'Tokopedia', 'PT Maju Jaya', 'CV Sentosa', 'Warung Barokah', 'PNS DKI'];
const incomeRanges = ['< 3jt', '3–5jt', '5–10jt', '> 10jt'];
const relationships = ['spouse', 'parent', 'sibling', 'friend', 'employer'];

export const state = {
    vehicles: [],
    transactions: [],
    gpsDevices: [],
    users: [],
    programs: [],
    filter: {
        partner: 'all',
        status: 'all',
        search: '',
        program: 'all'
    }
};

export const initData = () => {
    state.programs = [...programs];
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

        // New enriched fields
        const startDate = new Date(now - randInt(30, 720) * oneDay).toISOString();
        const contractMonths = randArr([12, 18, 24, 36]);
        const buyoutPrice = randInt(25, 40) * 1000000;
        const stnkExpiry = new Date(now + randInt(-30, 365) * oneDay).toISOString();
        const nikNum = `3${randInt(100, 999)}${randInt(10, 99)}${randInt(100000, 999999)}${randInt(1000, 9999)}`;
        const addr = `${randArr(streets)} No. ${randInt(1, 150)}, ${randArr(kecamatans)}, ${randArr(kotas)}`;

        const vehicle = {
            id: `CSN-${String(i).padStart(3, '0')}`,
            rtoId: `RTO-2026-${program.shortName.toUpperCase()}-${String(i).padStart(3, '0')}`,
            plate: `B ${randInt(1000, 9999)} ${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}`,
            model: partner.name + (isRto ? ' RTO' : ' Rent'),
            partnerId: partner.id,
            programId: program.id,
            programType: isRto ? 'RTO' : 'Rent',
            customer: status !== 'available' ? (randArr(allFirstNames) + ' ' + randArr(lastNames)) : null,
            status: status,
            creditExpiry: creditExpiry,
            graceExpiry: graceExpiry,
            credits: credits,
            totalDays: 30,
            phone: `+62 8${randInt(11, 99)}-${randInt(1000, 9999)}-${randInt(100, 999)}`,
            lat: lat,
            lng: lng,
            isOnline: isOnline,
            lastPing: lastPing.toISOString(),
            lastPaymentDate: new Date(now - randInt(1, 10) * oneDay).toISOString(),
            lastPaymentAmount: program.price * randInt(1, 7),
            speed: isOnline ? randInt(0, 60) : 0,
            bearing: Math.floor(Math.random() * 360),
            battery: randInt(20, 100),
            dailyRate: program.price,
            brand: partner.name,
            // Enriched fields
            nik: nikNum,
            address: addr,
            startDate: startDate,
            contractMonths: contractMonths,
            buyoutPrice: buyoutPrice,
            stnkExpiry: stnkExpiry,
            graceEncounters: randInt(0, 5), // Added for historical tracking
            immobilizeLog: status === 'immobilized' ? [{ action: 'lock', timestamp: new Date(now - randInt(1, 14) * oneDay).toISOString(), reason: randArr(['Overdue payment', 'Grace expired', 'Contract violation']) }] : [],
            userId: null // linked below
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
        // Credit days (1, 2, 3, 5, 7, or 15 days per transaction)
        const creditDays = randArr([1, 2, 3, 5, 7, 15]);
        const amount = creditDays * v.dailyRate;
        const fees = (v.programType === 'RTO' && random() < 0.2) ? 25000 : 0; // Occasional fee

        // Partner share calculation (mock)
        const partnerShare = amount * 0.9;
        const casanShare = amount * 0.1;

        state.transactions.push({
            id: `TX-${randInt(10000, 99999)}`,
            date: date.toISOString(),
            vehicleId: v.id,
            brand: v.brand,
            customer: v.customer,
            customerPhone: v.phone,
            partnerId: v.partnerId,
            program: v.programName,
            type: v.programType,
            creditDays: creditDays,
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
            // Vehicle Link
            vehicleId: v.id,
            vehiclePlate: v.plate,
            vehicleBrand: v.brand,
            vehicleModel: v.model,
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

    // ── Generate Users (Strict 1:1 mapping) ──────────────────────────────
    const assignedVehicles = state.vehicles.filter(v => v.customer);
    const userCount = assignedVehicles.length;
    for (let u = 0; u < userCount; u++) {
        const uId = `USR-${String(u + 1).padStart(3, '0')}`;
        const gender = random() > 0.1 ? 'Male' : 'Female';
        const fName = gender === 'Male' ? randArr(maleFirstNames) : randArr(femaleFirstNames);
        const lName = randArr(lastNames);
        const occ = randArr(occupations);
        const riskScore = randInt(15, 100);

        const spouseGender = gender === 'Male' ? 'Female' : 'Male';
        const spouseFName = spouseGender === 'Male' ? randArr(maleFirstNames) : randArr(femaleFirstNames);

        const user = {
            userId: uId,
            name: `${fName} ${lName}`,
            gender: gender,
            nik: `3${randInt(100, 999)}${randInt(10, 99)}${randInt(100000, 999999)}${randInt(1000, 9999)}`,
            phone: `+62 8${randInt(11, 99)}-${randInt(1000, 9999)}-${randInt(100, 999)}`,
            altPhone: random() > 0.5 ? `+62 8${randInt(11, 99)}-${randInt(1000, 9999)}-${randInt(100, 999)}` : null,
            address: `${randArr(streets)} No. ${randInt(1, 150)}, ${randArr(kecamatans)}, ${randArr(kotas)}`,
            currentAddress: random() > 0.6 ? `${randArr(streets)} No. ${randInt(1, 150)}, ${randArr(kecamatans)}, ${randArr(kotas)}` : null,
            joinDate: new Date(now - randInt(30, 730) * oneDay).toISOString(),
            ktpVerified: random() > 0.2,
            selfieVerified: random() > 0.3,
            occupation: occ,
            employer: randArr(employers),
            incomeRange: randArr(incomeRanges),
            workSince: new Date(now - randInt(180, 1800) * oneDay).toISOString(),
            workDaysPerWeek: occ === 'ojol' ? randInt(5, 7) : randInt(5, 6),
            emergencyContacts: [
                { name: `${spouseFName} ${randArr(lastNames)}`, phone: `+62 8${randInt(11, 99)}-${randInt(1000, 9999)}-${randInt(100, 999)}`, relationship: 'spouse', isGuarantor: true },
                { name: `${randArr(gender === 'Male' ? maleFirstNames : femaleFirstNames)} ${randArr(lastNames)}`, phone: `+62 8${randInt(11, 99)}-${randInt(1000, 9999)}-${randInt(100, 999)}`, relationship: randArr(['parent', 'sibling', 'friend']), isGuarantor: random() > 0.7 }
            ],
            riskScore: riskScore,
            riskLabel: riskScore >= 75 ? 'Low' : riskScore >= 45 ? 'Medium' : 'High',
            vehicleIds: [],
            totalTransactions: 0,
            totalPaid: 0,
            missedPayments: randInt(0, 8)
        };
        state.users.push(user);
    }

    // Link users ↔ vehicles (Strict 1:1 ownership constraint)
    assignedVehicles.forEach((v, idx) => {
        const user = state.users[idx];
        if (!user) return;

        v.userId = user.userId;
        v.customer = user.name; // sync name
        v.phone = user.phone;
        user.vehicleIds = [v.id]; // Strict 1:1
    });

    // Compute user transaction stats
    state.users.forEach(u => {
        const uTxs = state.transactions.filter(t => {
            const v = state.vehicles.find(veh => veh.id === t.vehicleId);
            return v && v.userId === u.userId;
        });
        u.totalTransactions = uTxs.length;
        u.totalPaid = uTxs.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount, 0);
    });

    console.log(`Generated ${state.vehicles.length} vehicles, ${state.transactions.length} transactions, ${state.gpsDevices.length} GPS devices, ${state.users.length} users`);
};

export const getContextStats = (tab) => {
    const fleet = state.vehicles.filter(v => state.filter.partner === 'all' || v.partnerId === state.filter.partner);
    const now = Date.now();

    switch (tab) {
        case 'users':
            const verified = state.users.filter(u => u.ktpVerified).length;
            const activeRiders = state.users.filter(u => u.vehicleIds.length > 0).length;
            const highRisk = state.users.filter(u => u.riskLabel === 'High').length;
            const avgRisk = Math.round(state.users.reduce((acc, u) => acc + u.riskScore, 0) / state.users.length) || 0;
            const kycPending = state.users.filter(u => !u.ktpVerified).length;
            const newRiders = state.users.filter(u => (now - new Date(u.joinDate)) < 30 * 86400000).length;
            return { verified, activeRiders, highRisk, avgRisk, kycPending, newRiders };

        case 'programs':
            const activeSchemes = state.programs.length;
            const rtoUnits = fleet.filter(v => v.programType === 'RTO').length;
            const maturity = fleet.length > 0 ? Math.round(fleet.reduce((acc, v) => {
                const prog = getRtoProgress(v);
                return acc + (prog ? prog.percent : 0);
            }, 0) / fleet.length) : 0;
            const health = 85 + (fleet.length % 12);
            const inGrace = fleet.filter(v => v.status === 'grace').length;
            const expiringSoon = fleet.filter(v => v.creditExpiry && (new Date(v.creditExpiry) - now) < 7 * 86400000).length;
            return { activeSchemes, rtoUnits, maturity, health, inGrace, expiringSoon };

        case 'finance':
            const revenue = state.transactions.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount, 0);
            const monthly = state.transactions.filter(t => {
                const d = new Date(t.date);
                return t.status === 'paid' && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
            }).reduce((s, t) => s + t.amount, 0);
            const arrears = fleet.filter(v => v.status === 'grace' || v.status === 'immobilized').length * 450000;
            const successRate = Math.round((state.transactions.filter(t => t.status === 'paid').length / state.transactions.length) * 100) || 0;
            const dailyAvg = Math.round(revenue / 90);
            const pendingPayout = Math.round(revenue * 0.12); // Simulated
            return { revenue, monthly, arrears, successRate, dailyAvg, pendingPayout };

        case 'vehicles':
            const stnkSoon = fleet.filter(v => {
                if (!v.stnkExpiry) return false;
                const days = Math.ceil((new Date(v.stnkExpiry) - now) / 86400000);
                return days < 30;
            }).length;
            const gpsOnline = fleet.length > 0 ? Math.round((fleet.filter(v => v.isOnline).length / fleet.length) * 100) : 0;
            const fleetActive = fleet.filter(v => v.status === 'active' || v.status === 'grace').length;
            const inService = fleet.filter(v => v.status === 'paused').length;
            const idleAssets = fleet.filter(v => v.status === 'available').length;
            return { total: fleet.length, active: fleetActive, stnkSoon, gpsOnline, inService, idleAssets };

        case 'gps':
            const assigned = state.gpsDevices.filter(d => d.vehicleId).length;
            const spares = state.gpsDevices.filter(d => !d.vehicleId).length;
            const warrantySoon = state.gpsDevices.filter(d => {
                if (!d.warrantyExpiry) return false;
                const days = Math.ceil((new Date(d.warrantyExpiry) - now) / 86400000);
                return days < 30;
            }).length;
            const offlineGear = state.gpsDevices.filter(d => d.status === 'Offline').length;
            const updateReq = state.gpsDevices.filter(d => d.firmwareUpdateRequired).length;
            return { total: state.gpsDevices.length, assigned, spares, warrantySoon, offlineGear, updateReq };

        case 'fleet':
        default:
            const moving = fleet.filter(v => v.isOnline && v.speed > 0).length;
            const parked = fleet.filter(v => v.isOnline && v.speed === 0).length;
            const noSignal = fleet.filter(v => !v.isOnline && v.status !== 'available').length;
            const lowBat = fleet.filter(v => v.battery < 30).length;
            const avgSpeed = moving > 0 ? Math.round(fleet.filter(v => v.isOnline && v.speed > 0).reduce((s, v) => s + v.speed, 0) / moving) : 0;
            const alerts = fleet.filter(v => v.battery < 20 || (!v.isOnline && v.status !== 'available' && v.status !== 'paused')).length;
            return { moving, parked, noSignal, lowBat, avgSpeed, alerts };
    }
};

export const getFilteredVehicles = () => {
    return state.vehicles.filter(v => {
        // Partner Filter
        if (state.filter.partner !== 'all' && v.partnerId !== state.filter.partner) return false;

        // Program Filter
        if (state.filter.program !== 'all' && v.programId !== state.filter.program) return false;

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
                (v.rtoId && v.rtoId.toLowerCase().includes(q)) ||
                (v.customer && v.customer.toLowerCase().includes(q)) ||
                v.phone.includes(q);
            if (!match) return false;
        }

        return true;
    });
};

export const getRtoProgress = (v) => {
    if (v.programType !== 'RTO' || !v.startDate || !v.contractMonths) return null;

    const start = new Date(v.startDate).getTime();
    const now = Date.now();
    const totalDays = v.contractMonths * 30;
    const elapsedDays = Math.max(0, (now - start) / (24 * 60 * 60 * 1000));

    const percent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
    const daysLeft = Math.max(0, Math.round(totalDays - elapsedDays));

    return { percent, daysLeft, totalDays, daysElapsed: Math.round(elapsedDays) };
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

// CRUD for Programs
export const addProgram = (p) => {
    state.programs.push(p);
    programs = state.programs; // Sync deprecated export
};

export const updateProgram = (id, data) => {
    const idx = state.programs.findIndex(p => p.id === id);
    if (idx !== -1) {
        state.programs[idx] = { ...state.programs[idx], ...data };
        programs = state.programs; // Sync deprecated export
    }
};

export const deleteProgram = (id) => {
    state.programs = state.programs.filter(p => p.id !== id);
    programs = state.programs; // Sync deprecated export
};
