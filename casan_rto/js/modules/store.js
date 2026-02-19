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

    console.log(`Generated ${state.vehicles.length} vehicles and ${state.transactions.length} transactions`);
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
