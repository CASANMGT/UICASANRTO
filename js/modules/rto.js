/**
 * RTO Logic extracted from casan-driver-app-v11.html
 */

//  CONSTANTS & DATA 
// window.state is already defined in store.js
const MAIN_PROGS = [
    { id: 'P-TK-RTO', p: 'tangkas', nm: 'Zeeho RTO', ty: 'RTO', dr: 38000, mi: 4500000, gd: 7, ic: 'E', bg: '#f5f3ff', bc: '#7C3AED' },
    { id: 'P-TK-RENT', p: 'tangkas', nm: 'Tangkas Rental', ty: 'Rent', dr: 28000, mi: 2000000, gd: 5, ic: 'B', bg: '#eff6ff', bc: '#2563EB' },
    { id: 'P-MK-RTO', p: 'maka', nm: 'Maka Cavalry RTO', ty: 'RTO', dr: 35000, mi: 3500000, gd: 7, ic: 'G', bg: '#f0fdf4', bc: '#16A34A' },
    { id: 'P-MK-RENT', p: 'maka', nm: 'Maka Cavalry Rent', ty: 'Rent', dr: 25000, mi: 2000000, gd: 7, ic: 'G', bg: '#f0fdf4', bc: '#16A34A' },
    { id: 'P-UT-RTO', p: 'united', nm: 'United RTO', ty: 'RTO', dr: 32000, mi: 3500000, gd: 10, ic: 'O', bg: '#fff7ed', bc: '#EA580C' },
    { id: 'P-UT-RENT', p: 'united', nm: 'United Share', ty: 'Rent', dr: 22000, mi: 2000000, gd: 5, ic: 'W', bg: '#f0f9ff', bc: '#0284C7' },
];

const PARTNERS = {
    tangkas: { name: 'Tangkas Motors', ic: 'E', area: 'Jakarta Pusat', c: '#7C3AED' },
    maka: { name: 'Maka Motors', ic: 'G', area: 'Jakarta Selatan', c: '#16A34A' },
    united: { name: 'United Motors', ic: 'O', area: 'Jakarta Timur', c: '#EA580C' }
};

const DEALER_LOCATIONS = {
    tangkas: { name: 'Tangkas Motors', addr: 'Jl. Kemayoran Baru No. 22, Jakarta Pusat', lat: -6.159, lng: 106.852, hours: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] },
    maka: { name: 'Maka Motors', addr: 'Jl. Fatmawati Raya No. 88, Jakarta Selatan', lat: -6.286, lng: 106.793, hours: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'] },
    united: { name: 'United Motors', addr: 'Jl. Raya Bekasi KM 18, Jakarta Timur', lat: -6.218, lng: 106.902, hours: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] },
};

const DOCS = {
    id: [
        { id: 'ktp', n: 'KTP Asli', d: 'KTP aktif', tag: 'wajib', ic: '', img: 'https://placehold.co/600x400/eeeeee/999999?text=KTP' },
        { id: 'kk', n: 'Kartu Keluarga', d: 'KK terbaru', tag: 'wajib', ic: '', img: 'https://placehold.co/600x800/eeeeee/999999?text=Kartu+Keluarga' },
        { id: 'sim', n: 'SIM C Aktif', d: 'SIM C motor', tag: 'wajib', ic: '', img: 'https://placehold.co/600x400/eeeeee/999999?text=SIM+C' },
        { id: 'selfie', n: 'Selfie + KTP', d: 'Foto memegang KTP', tag: 'wajib', ic: '', img: 'https://placehold.co/400x600/eeeeee/999999?text=Selfie' }
    ],
    work: [
        { id: 'slip', n: 'Slip Gaji / Screenshot Income', d: '3 bulan terakhir', tag: 'wajib', ic: '', img: 'https://placehold.co/600x800/eeeeee/999999?text=Slip+Gaji' },
        { id: 'rekening', n: 'Rekening Koran', d: 'Mutasi 3 bulan', tag: 'wajib', ic: '', img: 'https://placehold.co/600x800/eeeeee/999999?text=Rekening+Koran' },
        { id: 'sktm', n: 'Surat Keterangan Kerja', d: 'Dari platform/perusahaan', tag: 'opt', ic: '', img: 'https://placehold.co/600x800/eeeeee/999999?text=Surat+Keterangan' },
        { id: 'npwp', n: 'NPWP', d: 'Jika ada', tag: 'opt', ic: '', img: 'https://placehold.co/600x400/eeeeee/999999?text=NPWP' }
    ],
    boost: [
        { id: 'tabungan', n: 'Bukti Tabungan >Rp 1 Jt', d: '+4 pts', tag: 'boost', ic: '', img: 'https://placehold.co/600x800/eeeeee/999999?text=Tabungan' },
        { id: 'bpjs_tk', n: 'BPJS Ketenagakerjaan', d: '+3 pts', tag: 'boost', ic: '', img: 'https://placehold.co/600x400/eeeeee/999999?text=BPJS' },
        { id: 'ref_ojol', n: 'Screenshot Rating OJOL 4.5', d: '+2 pts', tag: 'boost', ic: '', img: 'https://placehold.co/600x800/eeeeee/999999?text=Rating+Ojol' },
        { id: 'gu_ktp', n: 'KTP Penjamin', d: '+5 pts', tag: 'boost', ic: '', img: 'https://placehold.co/600x400/eeeeee/999999?text=KTP+Penjamin' },
        { id: 'sertif', n: 'Sertifikat / BPKB Kendaraan', d: '+3 pts', tag: 'boost', ic: '', img: 'https://placehold.co/600x800/eeeeee/999999?text=BPKB' }
    ]
};

const ADMIN_APPS = [
    { id: 'CASAN-A01', nm: 'Ahmad Rizki', ph: '+62 812-3456-7890', ptn: 'tangkas', prog: 'P-TK-RTO', area: 'Kemayoran', prof: 'OJOL', inc: 4800000, score: 78, dec: 'approved', miss: ['npwp'], submitted: '2 jam lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A02', nm: 'Budi Santoso', ph: '+62 821-9876-5432', ptn: 'maka', prog: 'P-MK-RENT', area: 'Tebet', prof: 'Wiraswasta', inc: 3200000, score: 55, dec: 'review', miss: ['rekening', 'sktm'], submitted: '4 jam lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A03', nm: 'Dewi Lestari', ph: '+62 857-1111-2222', ptn: 'united', prog: 'P-UT-RTO', area: 'Bekasi Barat', prof: 'Karyawan', inc: 6500000, score: 82, dec: 'approved', miss: [], submitted: '6 jam lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A04', nm: 'Eko Prasetyo', ph: '+62 813-3333-4444', ptn: 'tangkas', prog: 'P-TK-RENT', area: 'Ciputat', prof: 'Petani', inc: 1800000, score: 28, dec: 'declined', miss: ['slip', 'rekening', 'sktm'], submitted: '8 jam lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A05', nm: 'Fitri Handayani', ph: '+62 877-5555-6666', ptn: 'maka', prog: 'P-MK-RTO', area: 'Cakung', prof: 'OJOL', inc: 5200000, score: 71, dec: 'approved', miss: ['npwp'], submitted: '1 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A06', nm: 'Gunawan Wibowo', ph: '+62 811-7777-8888', ptn: 'united', prog: 'P-UT-RENT', area: 'Serpong', prof: 'Karyawan Kontrak', inc: 2900000, score: 49, dec: 'pending', miss: ['rekening'], submitted: '1 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A07', nm: 'Hendra Kusuma', ph: '+62 896-9999-0000', ptn: 'tangkas', prog: 'P-TK-RTO', area: 'Penjaringan', prof: 'PNS', inc: 7200000, score: 88, dec: 'approved', miss: [], submitted: '2 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A08', nm: 'Indra Wijaya', ph: '+62 812-1111-2222', ptn: 'maka', prog: 'P-MK-RTO', area: 'Pasar Minggu', prof: 'OJOL', inc: 4500000, score: 65, dec: 'pending', miss: ['ktp'], submitted: '2 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A09', nm: 'Joko Susilo', ph: '+62 813-2222-3333', ptn: 'united', prog: 'P-UT-RTO', area: 'Pulogadung', prof: 'Buruh', inc: 3800000, score: 52, dec: 'review', miss: ['slip'], submitted: '3 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A10', nm: 'Kartini Putri', ph: '+62 814-3333-4444', ptn: 'tangkas', prog: 'P-TK-RENT', area: 'Gambir', prof: 'Guru', inc: 5500000, score: 74, dec: 'approved', miss: [], submitted: '3 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A11', nm: 'Lukman Hakim', ph: '+62 815-4444-5555', ptn: 'maka', prog: 'P-MK-RENT', area: 'Jagakarsa', prof: 'Driver Grab', inc: 4200000, score: 61, dec: 'pending', miss: ['npwp'], submitted: '4 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A12', nm: 'Maya Sari', ph: '+62 816-5555-6666', ptn: 'united', prog: 'P-UT-RENT', area: 'Cengkareng', prof: 'Sales', inc: 3100000, score: 45, dec: 'pending_docs', miss: ['rekening', 'kk'], submitted: '4 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A13', nm: 'Nanang Kosim', ph: '+62 817-6666-7777', ptn: 'tangkas', prog: 'P-TK-RTO', area: 'Senen', prof: 'Kurir', inc: 3900000, score: 58, dec: 'review', miss: ['sktm'], submitted: '5 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A14', nm: 'Oki Pratama', ph: '+62 818-7777-8888', ptn: 'maka', prog: 'P-MK-RTO', area: 'Mampang', prof: 'OJOL', inc: 4900000, score: 72, dec: 'approved', miss: [], submitted: '5 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A15', nm: 'Puji Astuti', ph: '+62 819-8888-9999', ptn: 'united', prog: 'P-UT-RTO', area: 'Kelapa Gading', prof: 'Admin', inc: 4700000, score: 69, dec: 'approved', miss: ['npwp'], submitted: '6 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A16', nm: 'Qori Ramadhan', ph: '+62 820-9999-0000', ptn: 'tangkas', prog: 'P-TK-RENT', area: 'Tanah Abang', prof: 'Freelance', inc: 2500000, score: 38, dec: 'declined', miss: ['slip'], submitted: '6 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A17', nm: 'Rian Hidayat', ph: '+62 821-0000-1111', ptn: 'maka', prog: 'P-MK-RENT', area: 'Pancoran', prof: 'Karyawan', inc: 5800000, score: 76, dec: 'approved', miss: [], submitted: '1 minggu lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A18', nm: 'Siska Amelia', ph: '+62 822-1111-2222', ptn: 'united', prog: 'P-UT-RENT', area: 'Koja', prof: 'SPG', inc: 2800000, score: 42, dec: 'pending', miss: ['kk'], submitted: '1 minggu lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A19', nm: 'Taufik Ismail', ph: '+62 823-2222-3333', ptn: 'tangkas', prog: 'P-TK-RTO', area: 'Menteng', prof: 'Security', inc: 4100000, score: 63, dec: 'pending', miss: ['ktp', 'sim'], submitted: '1 minggu lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A20', nm: 'Umar Bakri', ph: '+62 824-3333-4444', ptn: 'maka', prog: 'P-MK-RTO', area: 'Tebet', prof: 'OJOL', inc: 5100000, score: 75, dec: 'approved', miss: [], submitted: '1 minggu lalu', adj: 0, note: '', ovlog: '' },
];

const WA_SCENARIOS = [
    {
        k: 'approved', ic: '\u{2705}', nm: 'Approved \u00B7 Selamat', desc: 'Pengajuan disetujui, info serah terima',
        tmpl: `Halo {nama}! \n\nKabar baik dari tim CASAN!\n\nPengajuan motor listrik kamu telah *DISETUJUI*.\n\n App ID: *{app_id}*\n Program: *{program}*\n Skor: *{score}/100*\n Dealer: *{dealer}*\n\nLangkah selanjutnya:\n1. Konfirmasi jadwal serah terima\n2. Siapkan dokumen asli (KTP, SIM C, KK)\n3. Tanda tangan kontrak RTO\n\nHubungi kami untuk informasi lebih lanjut. Selamat bergabung! `
    },
    {
        k: 'declined', ic: '\u{274C}', nm: 'Declined \u00B7 Penolakan', desc: 'Pengajuan ditolak, saran perbaikan',
        tmpl: `Halo {nama},\n\nTerima kasih sudah mendaftar di CASAN.\n\nSayang sekali, pengajuan kamu belum bisa kami setujui saat ini.\n\n App ID: *{app_id}*\n Skor: *{score}/100*\n\nAlasan utama & saran perbaikan:\n Lengkapi dokumen wajib (KTP, SIM C, Rekening)\n Tingkatkan skor dengan menambah penjamin\n Pastikan DSR di bawah 70%\n\nKamu bisa mendaftar kembali dalam 30 hari setelah melengkapi persyaratan. \n\nTim CASAN siap membantu: {dealer}`
    },
    {
        k: 'review', ic: '\u{2696}\u{FE0F}', nm: 'Review/Pending \u00B7 Proses', desc: 'Aplikasi masih dalam review manual',
        tmpl: `Halo {nama}! \n\nPengajuan motor listrik kamu sudah kami terima.\n\n App ID: *{app_id}*\n Program: *{program}*\n Skor: *{score}/100*\n\nSaat ini aplikasimu sedang dalam proses *review manual* oleh tim analis kami.\n\n Estimasi: 13 hari kerja\n\nKamu akan kami hubungi kembali setelah proses selesai. Pastikan nomor WhatsApp aktif ya!\n\nTim CASAN  {dealer}`
    },
    {
        k: 'missing_docs', ic: '\u{1F4C4}', nm: 'Missing Docs \u00B7 Reminder', desc: 'Pengingat dokumen yang masih kurang',
        tmpl: `Halo {nama}! \n\nPengajuanmu (App ID: *{app_id}*) hampir lengkap!\n\nMasih ada beberapa dokumen yang perlu dilengkapi:\n\n{missing_docs}\n\nCara kirim:\n1. Foto/scan dokumen yang jelas\n2. Kirim via WhatsApp ke nomor ini\n3. Sebutkan App ID: *{app_id}*\n\nDokumen lengkap = proses lebih cepat! \n\nTim CASAN  {dealer}`
    },
];

const DIM_DEFAULTS = [
    { k: 'id', l: 'Identitas', max: 18, c: '#14B8A6' }, { k: 'inc', l: 'Penghasilan', max: 22, c: '#16A34A' },
    { k: 'job', l: 'Pekerjaan', max: 15, c: '#2563EB' }, { k: 'fam', l: 'Keluarga', max: 12, c: '#7C3AED' },
    { k: 'crd', l: 'Kredit', max: 18, c: '#D97706' }, { k: 'doc', l: 'Dokumen', max: 15, c: '#0F766E' },
];

const THRESH_DEFAULTS = [
    { k: 'auto', l: 'Auto-Approve', min: 80, bg: 'var(--dg1)', c: 'var(--dg)' },
    { k: 'approve', l: 'Approved', min: 60, bg: 'var(--dac1)', c: 'var(--dac)' },
    { k: 'review', l: 'Manual Review', min: 41, bg: 'var(--dw1)', c: 'var(--dw)' },
    { k: 'conditional', l: 'Conditional', min: 21, bg: 'rgba(251,146,60,.07)', c: '#FB923C' },
    { k: 'decline', l: 'Declined', min: 0, bg: 'var(--dd1)', c: 'var(--dd)' },
];

function fmtPickupDate(daysFromNow) {
    const d = new Date(); d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
}

const PU_ORDERS = [
    { id: 'PU-001', appId: 'CASAN-A01', nm: 'Ahmad Rizki', ph: '+62 812-3456-7890', ptn: 'tangkas', prog: 'P-TK-RTO', model: 'Zeeho Aegis', deadline: fmtPickupDate(7), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-001', plate: 'B 1234 ABC' },
    { id: 'PU-002', appId: 'CASAN-A03', nm: 'Dewi Lestari', ph: '+62 857-1111-2222', ptn: 'united', prog: 'P-UT-RTO', model: 'United T3', deadline: fmtPickupDate(3), status: 'scheduled', schedDate: fmtPickupDate(2), schedTime: '10:00', hoStatus: 'pending', vehicleId: 'CSN-003', plate: 'B 5678 DEF' },
    { id: 'PU-003', appId: 'CASAN-A05', nm: 'Fitri Handayani', ph: '+62 877-5555-6666', ptn: 'maka', prog: 'P-MK-RTO', model: 'Maka M1 Pro', deadline: fmtPickupDate(14), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-005', plate: 'B 9012 GHI' },
    { id: 'PU-004', appId: 'CASAN-A07', nm: 'Hendra Kusuma', ph: '+62 896-9999-0000', ptn: 'tangkas', prog: 'P-TK-RTO', model: 'Zeeho AE8', deadline: fmtPickupDate(-1), status: 'overdue', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-007', plate: 'B 3456 JKL' },
    { id: 'PU-005', appId: 'CASAN-A11', nm: 'Bagus Prakoso', ph: '+62 812-1234-5678', ptn: 'tangkas', prog: 'P-TK-RTO', model: 'Zeeho Aegis', deadline: fmtPickupDate(-2), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-008', plate: 'B 1005 XYZ' },
    { id: 'PU-006', appId: 'CASAN-A13', nm: 'Reza Rahardian', ph: '+62 857-9876-5432', ptn: 'united', prog: 'P-UT-RTO', model: 'United T3', deadline: fmtPickupDate(5), status: 'scheduled', schedDate: fmtPickupDate(3), schedTime: '10:00', hoStatus: 'pending', vehicleId: 'CSN-009', plate: 'B 1006 XYZ' },
    { id: 'PU-007', appId: 'CASAN-A15', nm: 'Wawan Setiawan', ph: '+62 877-1111-2222', ptn: 'maka', prog: 'P-MK-RTO', model: 'Maka M1 Pro', deadline: fmtPickupDate(8), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-010', plate: 'B 1007 XYZ' },
    { id: 'PU-008', appId: 'CASAN-A18', nm: 'Agus Harimurti', ph: '+62 896-3333-4444', ptn: 'maka', prog: 'P-MK-RTO', model: 'Maka M1 Pro', deadline: fmtPickupDate(2), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-011', plate: 'B 1008 XYZ' },
    { id: 'PU-009', appId: 'CASAN-A22', nm: 'Enzy Storia', ph: '+62 813-5555-6666', ptn: 'united', prog: 'P-UT-RENT', model: 'United TX8', deadline: fmtPickupDate(10), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-012', plate: 'B 1009 XYZ' },
    { id: 'PU-010', appId: 'CASAN-A23', nm: 'Fedi Nuril', ph: '+62 858-7777-8888', ptn: 'tangkas', prog: 'P-TK-RTO', model: 'Zeeho AE8', deadline: fmtPickupDate(12), status: 'scheduled', schedDate: fmtPickupDate(10), schedTime: '10:00', hoStatus: 'pending', vehicleId: 'CSN-013', plate: 'B 1010 XYZ' },
    { id: 'PU-011', appId: 'CASAN-A24', nm: 'Gading Marten', ph: '+62 819-9999-0000', ptn: 'maka', prog: 'P-MK-RTO', model: 'Maka M1 Pro', deadline: fmtPickupDate(-1), status: 'overdue', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-014', plate: 'B 1011 XYZ' },
    { id: 'PU-012', appId: 'CASAN-A29', nm: 'Tulus', ph: '+62 812-4444-5555', ptn: 'tangkas', prog: 'P-TK-RTO', model: 'Zeeho Aegis', deadline: fmtPickupDate(15), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-015', plate: 'B 1012 XYZ' },
    { id: 'PU-013', appId: 'CASAN-A30', nm: 'Vidi Aldiano', ph: '+62 857-6666-7777', ptn: 'maka', prog: 'P-MK-RTO', model: 'Maka M1 Pro', deadline: fmtPickupDate(3), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending', vehicleId: 'CSN-016', plate: 'B 1013 XYZ' }
];

// Formatting
const fRp = n => 'Rp ' + Number(n).toLocaleString('id-ID');

//  STATE INITIALIZATION 
// Merge RTO-specific state into the main global state
if (window.state) {
    window.state.admApps = window.state.admApps || [...ADMIN_APPS];
    window.state.puOrders = window.state.puOrders || [...PU_ORDERS];
    window.state.admFlt = window.state.admFlt || 'all';
    window.state.admQ = window.state.admQ || '';
    window.state.selApp = window.state.selApp || null;
    window.state.waTmpls = window.state.waTmpls || Object.fromEntries(WA_SCENARIOS.map(s => [s.k, s.tmpl]));
    window.state.selScen = window.state.selScen || null;
    window.state.puFlt = window.state.puFlt || 'all';
    window.state.puProgFlt = window.state.puProgFlt || 'all';
    window.state.appProgFlt = window.state.appProgFlt || 'all';
    window.state.selPU = window.state.selPU || null;
    window.state.calYear = window.state.calYear || new Date().getFullYear();
    window.state.calMonth = (window.state.calMonth !== undefined) ? window.state.calMonth : new Date().getMonth();
    window.state.selDate = window.state.selDate || null;
    window.state.selTime = window.state.selTime || null;
    window.state.dimCfg = window.state.dimCfg || JSON.parse(JSON.stringify(DIM_DEFAULTS));
    window.state.threshCfg = window.state.threshCfg || JSON.parse(JSON.stringify(THRESH_DEFAULTS));
    window.state.dsrCfg = window.state.dsrCfg || [
        { l: 'Batas Sehat', v: 50, c: 'var(--dg)' },
        { l: 'Batas Waspada', v: 70, c: 'var(--dw)' },
        { l: 'Penalty Waspada', v: 85, c: '#FB923C' },
        { l: 'Penalty Berat', v: 100, c: 'var(--dd)' }
    ];
    window.state.admPage = window.state.admPage || 1;
    window.state.admPageSize = window.state.admPageSize || 10;
}

// Local alias to minimize changes to existing logic
// state is already global

// Auto-load config
try {
    const saved = localStorage.getItem('casan_rto_cfg');
    if (saved) {
        const p = JSON.parse(saved);
        if (p.dimCfg) state.dimCfg = p.dimCfg;
        if (p.threshCfg) state.threshCfg = p.threshCfg;
        if (p.dsrCfg) state.dsrCfg = p.dsrCfg;
    }
} catch (e) {
    console.error('Failed to load storage', e);
}

// Utils
function getDecStyle(dec) {
    const m = {
        approved: { bg: 'var(--dg1)', c: 'var(--dg)', l: 'ACCEPTED' },
        auto: { bg: 'var(--dac1)', c: 'var(--dac)', l: 'AUTO-APP' },
        review: { bg: 'var(--dw1)', c: 'var(--dw)', l: 'REVIEW' },
        pending: { bg: 'var(--dbl1)', c: 'var(--dbl)', l: 'PENDING' },
        pending_docs: { bg: 'rgba(251,191,36,.1)', c: 'var(--dw)', l: 'REQ DOCS' },
        declined: { bg: 'var(--dd1)', c: 'var(--dd)', l: 'REJECTED' }
    };
    return m[dec] || { bg: 'var(--ds3)', c: 'var(--dt2)', l: dec.toUpperCase() };
}

function getScoreColor(s) {
    if (s >= 80) return 'var(--dg)';
    if (s >= 60) return 'var(--dac)';
    if (s >= 41) return 'var(--dw)';
    if (s >= 21) return '#FB923C';
    return 'var(--dd)';
}


function daysLeft(dateStr) {
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

// Admin Functions
function admV(view, elId) {
    document.querySelectorAll('.av').forEach(v => v.classList.remove('on'));
    document.getElementById('adm-' + view).classList.add('on');
    document.querySelectorAll('.adm-ni').forEach(n => n.classList.remove('on'));
    if (elId) document.getElementById(elId).classList.add('on');

    document.getElementById('adm-tb-t').textContent = {
        apps: 'Applications', analytics: 'Analytics', fleet: 'Renter', pickup: 'Pickup Schedule', score: 'Score Config', wa: 'WA Templates'
    }[view] || view;

    if (view === 'analytics') renderAnalytics();
    if (view === 'score') renderScoreCfg();
    if (view === 'wa') {
        renderWAScens();
        if (!state.selScen && WA_SCENARIOS.length) selWAScen(WA_SCENARIOS[0].k);
    }
    if (view === 'pickup') {
        state.calYear = new Date().getFullYear();
        state.calMonth = new Date().getMonth();
        renderPUList();
    }
}

function setAdmFlt(f, el) {
    state.admFlt = f;
    document.querySelectorAll('.afb').forEach(b => b.classList.remove('on'));
    if (el) el.classList.add('on');
    admRTbl();
}

function setAdmProgFlt(val) {
    state.appProgFlt = val;
    admRTbl();
}

function admSrch(q) {
    state.admQ = q.toLowerCase();
    admRTbl();
}

function admRTbl() {
    // 1. Initial Program/Partner Filtering (Base List for this context)
    let partnerApps = state.admApps.filter(a => {
        if (state.filter && state.filter.partner && state.filter.partner !== 'all') {
            if (a.ptn.toLowerCase() !== state.filter.partner.toLowerCase()) return false;
        }
        if (state.appProgFlt && state.appProgFlt !== 'all') {
            if (a.prog !== state.appProgFlt) return false;
        }
        return true;
    });

    // Populate Program Filter Options dynamically based on selected partner
    const progSel = document.getElementById('app-prog-filter');
    if (progSel) {
        let progsToKeep = MAIN_PROGS;
        if (state.filter && state.filter.partner && state.filter.partner !== 'all') {
            progsToKeep = MAIN_PROGS.filter(p => p.p.toLowerCase() === state.filter.partner.toLowerCase());
        }

        let opts = `<option value="all">🌐 All Programs</option>`;
        progsToKeep.forEach(p => {
            opts += `<option value="${p.id}" ${state.appProgFlt === p.id ? 'selected' : ''}>[${p.p.toUpperCase()}] ${p.nm}</option>`;
        });

        if (progSel.innerHTML !== opts) {
            progSel.innerHTML = opts;
            if (state.appProgFlt !== 'all' && !progsToKeep.find(p => p.id === state.appProgFlt)) {
                state.appProgFlt = 'all';
                progSel.value = 'all';
            }
        }
    }

    // 2. Generate KPIs BEFORE applying the Status/Search filters, 
    // so badges show total possible matches in this Partner/Program context
    const tot = partnerApps.length;
    let pnd = 0; let apr = 0; let dec = 0; let rev = 0;

    partnerApps.forEach(a => {
        if (a.dec === 'pending' || a.dec === 'pending_docs') pnd++;
        else if (a.dec === 'approved') apr++;
        else if (a.dec === 'declined') dec++;
        else if (a.dec === 'review') rev++;
    });
    const avg = Math.round(partnerApps.reduce((s, a) => s + a.score, 0) / (partnerApps.length || 1)) || 0;

    const elTot = document.getElementById('kpi-tot'); if (elTot) elTot.textContent = tot;
    const elPnd = document.getElementById('kpi-pnd'); if (elPnd) elPnd.textContent = pnd;
    const elApr = document.getElementById('kpi-apr'); if (elApr) elApr.textContent = apr;
    const elDec = document.getElementById('kpi-dec'); if (elDec) elDec.textContent = dec;
    const elAvg = document.getElementById('kpi-avg'); if (elAvg) elAvg.textContent = avg;

    // Filter badges
    const bAll = document.getElementById('cnt-all'); if (bAll) bAll.textContent = tot;
    const bPnd = document.getElementById('cnt-pnd'); if (bPnd) bPnd.textContent = pnd;
    const bRev = document.getElementById('cnt-rev'); if (bRev) bRev.textContent = rev;
    const bApr = document.getElementById('cnt-apr'); if (bApr) bApr.textContent = apr;
    const bDec = document.getElementById('cnt-dec'); if (bDec) bDec.textContent = dec;

    const pendBadge = document.getElementById('pend-badge');
    if (pendBadge) pendBadge.textContent = pnd;

    // 3. Apply Deep Filters (Status & Search) for rendering
    let displayApps = partnerApps.filter(a => {
        if (state.admFlt !== 'all') {
            if (state.admFlt === 'pending') {
                if (a.dec !== 'pending' && a.dec !== 'pending_docs') return false;
            } else {
                if (a.dec !== state.admFlt) return false;
            }
        }
        if (state.admQ && !a.nm.toLowerCase().includes(state.admQ) && !a.id.toLowerCase().includes(state.admQ) && !a.area.toLowerCase().includes(state.admQ)) return false;
        return true;
    });

    // Sidebar Notification Dots
    const sideApps = document.getElementById('side-cnt-apps');
    if (sideApps) {
        sideApps.textContent = pnd;
        sideApps.style.display = pnd > 0 ? 'flex' : 'none';
    }

    const puCount = (state.puOrders || []).filter(a => a.status === 'waiting').length;
    const sidePU = document.getElementById('side-cnt-pickup');
    if (sidePU) {
        sidePU.textContent = puCount;
        sidePU.style.display = puCount > 0 ? 'flex' : 'none';
    }

    const totalFiltered = displayApps.length;
    const totalPages = Math.ceil(totalFiltered / state.admPageSize) || 1;
    if (state.admPage > totalPages) state.admPage = totalPages;
    if (state.admPage < 1) state.admPage = 1;

    const startIdx = (state.admPage - 1) * state.admPageSize;
    const paginatedApps = displayApps.slice(startIdx, startIdx + state.admPageSize);

    const cardList = document.getElementById('adm-card-list');
    if (!cardList) return;

    cardList.innerHTML = paginatedApps.map((a) => {
        const ptn = PARTNERS[a.ptn] || { name: a.ptn, ic: '', c: '#999' };
        const pr = MAIN_PROGS.find(p => p.id === a.prog) || { nm: a.prog, ty: '' };
        const ds = getDecStyle(a.dec);
        const sc = a.score + (a.adj || 0);
        const scColor = getScoreColor(sc);
        const isSelected = state.selApp === a.id;
        const puOrder = (state.puOrders || []).find(o => o.appId === a.id);
        const assetPlate = a.dec === 'approved' && puOrder && puOrder.plate ? puOrder.plate : null;

        return `<div onclick="window.rto.admSel('${a.id}')" style="
            padding: 12px 14px;
            border-bottom: 1px solid var(--db1);
            cursor: pointer;
            background: ${isSelected ? 'rgba(0,229,195,0.08)' : 'transparent'};
            border-left: 3px solid ${isSelected ? 'var(--dac)' : 'transparent'};
            transition: background 0.15s;
        ">
            <div style="display:flex; align-items:center; gap:10px;">
                <!-- Score Ring -->
                <div style="width:40px;height:40px;border-radius:50%;border:2.5px solid ${scColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${scColor}18">
                    <span style="font-size:11px;font-weight:900;color:${scColor}">${sc}</span>
                </div>
                <!-- Info -->
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">
                        <div style="font-weight:700;font-size:var(--text-sm);color:var(--dt1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.nm}</div>
                        <span style="background:${ds.bg};color:${ds.c};font-size:9px;font-weight:800;padding:2px 7px;border-radius:4px;white-space:nowrap;flex-shrink:0">${ds.l}</span>
                    </div>
                    <div style="font-size:10px;color:var(--dt3);margin-top:2px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                        <span style="color:${ptn.c};font-weight:600">${pr.nm}</span>
                        <span style="color:var(--db1)">·</span>
                        <span>${a.prof}</span>
                        ${assetPlate ? `<span style="background:var(--dac1);color:var(--dac);font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:800;padding:1px 6px;border-radius:4px">${assetPlate}</span>` : ''}
                        ${a.miss && a.miss.length ? `<span style="color:var(--dw);font-weight:700">${a.miss.length} docs</span>` : ''}
                    </div>
                    <div style="font-size:9px;color:var(--dt3);margin-top:3px">${a.id} · ${a.submitted}</div>
                </div>
            </div>
        </div>`;
    }).join('') || `<div style="padding:40px;text-align:center;color:var(--dt3)"><div style="font-size:32px;margin-bottom:8px">📭</div><div>No applications found</div></div>`;


    const pg = document.getElementById('adm-pagination');
    if (pg) {
        pg.innerHTML = `
            <div style="font-size:var(--text-xs); color:var(--dt3); font-weight:600">
                Showing ${totalFiltered === 0 ? 0 : startIdx + 1} to ${Math.min(startIdx + state.admPageSize, totalFiltered)} of ${totalFiltered} entries
            </div>
            <div style="display:flex; gap:8px; align-items:center">
                <button class="btn" style="padding:6px 12px; font-size:var(--text-xs)" 
                        ${state.admPage === 1 ? 'disabled' : ''} 
                        onclick="window.rto.goToAdmPage(${state.admPage - 1})">Prev</button>
                <div style="display:flex; align-items:center; gap:4px; margin:0 4px">
                    ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                        <button class="btn ${state.admPage === p ? 'btn-primary' : ''}" 
                                style="width:28px; height:28px; padding:0; display:flex; align-items:center; justify-content:center; font-size:var(--text-xs); ${state.admPage === p ? 'background:var(--dac); color:#000; border:none;' : ''}"
                                onclick="window.rto.goToAdmPage(${p})">${p}</button>
                    `).join('')}
                </div>
                <button class="btn" style="padding:6px 12px; font-size:var(--text-xs)" 
                        ${state.admPage === totalPages ? 'disabled' : ''} 
                        onclick="window.rto.goToAdmPage(${state.admPage + 1})">Next</button>
            </div>
        `;
    }
}

function goToAdmPage(n) {
    state.admPage = n;
    admRTbl();
}

function admSel(id) {
    state.selApp = id;
    admRTbl();
    const a = state.admApps.find(x => x.id === id);
    if (!a) return;
    const ptn = PARTNERS[a.ptn] || { name: a.ptn, c: '#999' };
    const pr = MAIN_PROGS.find(p => p.id === a.prog) || { nm: a.prog, ty: '' };
    const ds = getDecStyle(a.dec);
    const sc = a.score + (a.adj || 0);

    // Ensure document state object exists
    if (!a.docStatus) a.docStatus = {};

    // Build document list (for Docs tab)
    const docsList = [...DOCS.id, ...DOCS.work, ...DOCS.boost].map(d => {
        const isMissing = (a.miss || []).includes(d.id);
        let st = 'verified';
        if (isMissing) st = 'missing';
        if (a.docStatus && a.docStatus[d.id]) {
            st = a.docStatus[d.id];
            if (st === 'pending') st = 'verified';
        }

        let thumbHtml = st !== 'missing' && d.img
            ? `<img src="${d.img}" class="doc-thumb" onclick="window.rto.previewImg('${d.img}')" alt="${d.n}">`
            : `<div class="doc-thumb" style="display:flex;align-items:center;justify-content:center;font-size:var(--text-xl);color:var(--dt3)"></div>`;

        let statusHtml = '', actionsHtml = '';
        if (st === 'missing') {
            statusHtml = `<span style="color:var(--dd);font-size:var(--text-xs);font-weight:700"> Missing</span>`;
            actionsHtml = `<button class="btn" style="padding:2px 8px;font-size:var(--text-3xs);background:var(--dw1);border:1px solid rgba(251,191,36,.25);color:var(--dw)" onclick="window.rto.uploadDoc('${a.id}','${d.id}')"> Upload</button>`;
        } else if (st === 'rejected') {
            const reason = a.docReasons?.[d.id] || 'Dokumen belum sesuai standar';
            statusHtml = `<span style="color:var(--dd);font-size:var(--text-xs);font-weight:700"> Rejected</span><div style="font-size:var(--text-3xs);color:var(--dt3);max-width:140px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap" title="${reason}">${reason}</div>`;
            actionsHtml = `<button class="btn" style="padding:2px 8px;font-size:var(--text-3xs)" onclick="window.rto.resubmitDoc('${a.id}','${d.id}')">Mock Resubmit</button>`;
        } else {
            statusHtml = `<span style="color:var(--dg);font-size:var(--text-xs);font-weight:700"> Verified</span>`;
            actionsHtml = `<button class="btn btn-danger" style="padding:2px 8px;font-size:var(--text-3xs)" onclick="window.rto.verifyDoc('${a.id}','${d.id}','rejected')">Reject</button>`;
        }

        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--db1)">
            <div style="display:flex;gap:12px;align-items:center">
                ${thumbHtml}
                <div style="font-size:var(--text-sm);color:var(--dt1);font-weight:600">${d.n}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">${statusHtml}</div>
                ${actionsHtml}
            </div>
        </div>`;
    }).join('');

    // === RENDER HEADER ===
    document.getElementById('dp-t').innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;width:100%">
            <div style="width:60px;height:60px;border-radius:50%;border:4px solid ${getScoreColor(sc)};display:flex;align-items:center;justify-content:center;flex-direction:column;background:${getScoreColor(sc)}11;flex-shrink:0">
                <span style="font-size:var(--text-2xl);font-weight:900;color:${getScoreColor(sc)}">${sc}</span>
                <span style="font-size:var(--text-3xs);color:var(--dt3);margin-top:-2px">SCORE</span>
            </div>
            <div style="flex:1;min-width:0">
                <div style="font-size:var(--text-xl);font-weight:800;color:var(--dt1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.nm}</div>
                <div style="font-size:var(--text-sm);color:var(--dt3)">${a.id} · ${a.prof}</div>
                <div style="margin-top:3px"><span class="dec-chip" style="background:${ds.bg};color:${ds.c};font-size:var(--text-2xs);font-weight:800">${ds.l}</span></div>
            </div>
            <button class="btn btn-secondary" onclick="window.rto.admWA()" style="font-size:var(--text-xs);flex-shrink:0"> WA</button>
        </div>
    `;

    // === OVERVIEW TAB ===
    const overviewEl = document.getElementById('dp-overview-content');
    if (overviewEl) {
        overviewEl.innerHTML = `
            <div class="dp-col"><div class="dp-sl">Applicant Details</div>
              ${[['Phone', a.ph], ['Area', a.area], ['Partner', ptn.name], ['Program', pr.nm], ['Income', 'Rp ' + a.inc.toLocaleString('id-ID')], ['Submitted', a.submitted]]
                .map(r => `<div class="dp-row" style="font-size:var(--text-base)"><div class="dp-k">${r[0]}</div><div class="dp-v" style="font-size:var(--text-lg)">${r[1]}</div></div>`)
                .join('')}
            </div>`;
    }

    // === DOCS TAB ===
    const docsEl = document.getElementById('dp-docs-content');
    if (docsEl) {
        docsEl.innerHTML = `<div class="dp-sl">Document Verification</div>${docsList}`;
    }

    // === SCORE TAB ===
    const dimKeys = ['id', 'inc', 'job', 'fam', 'crd', 'doc'];
    const dimLabels = ['Identitas', 'Penghasilan', 'Pekerjaan', 'Keluarga', 'Kredit', 'Dokumen'];
    const dimCols = ['var(--dac)', 'var(--dg)', 'var(--dbl)', 'var(--dp)', 'var(--dw)', '#14B8A6'];
    const dimMax = [18, 22, 15, 12, 18, 15];

    const spGrid = document.getElementById('sp-grid');
    if (spGrid) {
        spGrid.innerHTML = dimKeys.map((k, i) => {
            const v = Math.min(dimMax[i], Math.round(sc * dimMax[i] / 100));
            return `<div class="sp-d"><div class="sp-dl" style="font-size:var(--text-xs)">${dimLabels[i]}</div><div class="sp-bw"><div class="sp-bf" style="width:${v / dimMax[i] * 100}%;background:${dimCols[i]}"></div></div><div class="sp-vs"><div class="sp-v" style="color:${dimCols[i]};font-size:var(--text-lg)">${v}</div><div class="sp-m" style="font-size:var(--text-sm)">/${dimMax[i]}</div></div></div>`;
        }).join('');
    }

    // === MISSING DOCS SECTION (in Overview tab) ===
    const missSec = document.getElementById('dp-miss-sec');
    if (missSec) {
        if (a.miss && a.miss.length) {
            missSec.style.display = 'block';
            document.getElementById('dp-miss-items').innerHTML = a.miss.map(m =>
                `<span style="padding:4px 10px;border-radius:6px;background:var(--dw1);border:1px solid rgba(251,191,36,.15);font-size:var(--text-sm);color:var(--dw);font-weight:600;font-family:'IBM Plex Mono',monospace">${m}</span>`
            ).join('');
        } else {
            missSec.style.display = 'none';
        }
    }

    // === MANUAL OVERRIDE FIELDS ===
    const elNote = document.getElementById('ov-note');
    const elAdj = document.getElementById('ov-adj');
    const elLog = document.getElementById('ov-log');
    if (elNote) elNote.value = a.note || '';
    if (elAdj) elAdj.value = a.adj || '0';
    if (elLog) elLog.textContent = a.ovlog || '';

    // === DECISION AREA ===
    const decArea = document.getElementById('dp-decision-area');
    if (decArea) {
        // Find assigned asset from pickup orders
        const puOrder = (state.puOrders || []).find(o => o.appId === id);
        const assignedPlate = puOrder ? puOrder.plate : null;

        // Asset info card — only for approved apps
        let assetCardHtml = '';
        if (a.dec === 'approved') {
            assetCardHtml = assignedPlate
                ? `<div style="background:var(--dg1);border:1px solid var(--dg);border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-size:var(--text-2xs);font-weight:700;color:var(--dg);text-transform:uppercase;letter-spacing:.5px"> Assigned Vehicle</div>
                        <div style="font-weight:800;color:var(--dt1);font-family:'IBM Plex Mono',monospace;font-size:var(--text-base)">${assignedPlate}</div>
                    </div>
                    <button class="btn" style="font-size:var(--text-xs);padding:4px 10px" onclick="window.rto.openAssetAssignment('${id}')">🔄 Change</button>
                   </div>`
                : `<div style="background:var(--dac1);border:1px dashed var(--dac);border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
                    <div style="font-size:var(--text-sm);color:var(--dt2);font-weight:600"> No vehicle assigned yet</div>
                    <button class="btn btn-primary" style="font-size:var(--text-xs);padding:4px 12px" onclick="window.rto.openAssetAssignment('${id}')"> Assign Vehicle</button>
                   </div>`;
        }

        decArea.innerHTML = `
            ${assetCardHtml ? assetCardHtml + '<div style="border-top:1px solid var(--db1);margin:0 -16px"></div>' : ''}
            <div style="font-size:var(--text-xs);color:var(--dt3);font-weight:700;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px">
                <span></span> Final Decision
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div class="sc-cfg-card" style="padding:10px;cursor:pointer;text-align:center;border:1px solid var(--db1);transition:all 0.2s"
                     onmouseover="this.style.borderColor='var(--dg)';this.style.background='var(--dg1)'" onmouseout="this.style.borderColor='var(--db1)';this.style.background='transparent'"
                     onclick="window.rto.openApprovalConfirmation('${id}')">
                    <div style="font-size:18px;margin-bottom:3px">\u{2705}</div>
                    <div style="font-weight:800;color:var(--dg);font-size:var(--text-xs)">ACCEPT</div>
                </div>
                <div class="sc-cfg-card" style="padding:10px;cursor:pointer;text-align:center;border:1px solid var(--db1);transition:all 0.2s"
                     onmouseover="this.style.borderColor='var(--dd)';this.style.background='var(--dd1)'" onmouseout="this.style.borderColor='var(--db1)';this.style.background='transparent'"
                     onclick="window.rto.confirmReject('${id}')">
                    <div style="font-size:18px;margin-bottom:3px">\u{274C}</div>
                    <div style="font-weight:800;color:var(--dd);font-size:var(--text-xs)">REJECT</div>
                </div>
                <div class="sc-cfg-card" style="padding:10px;cursor:pointer;text-align:center;border:1px solid var(--db1);transition:all 0.2s"
                     onmouseover="this.style.borderColor='var(--dw)';this.style.background='var(--dw1)'" onmouseout="this.style.borderColor='var(--db1)';this.style.background='transparent'"
                     onclick="window.rto.confirmDocs('${id}')">
                    <div style="font-size:18px;margin-bottom:3px">\u{1F4C4}</div>
                    <div style="font-weight:800;color:var(--dw);font-size:var(--text-xs)">DOCS REQ.</div>
                </div>
                <div class="sc-cfg-card" style="padding:10px;cursor:pointer;text-align:center;border:1px solid var(--db1);transition:all 0.2s"
                     onmouseover="this.style.borderColor='var(--dp)';this.style.background='var(--dp1)'" onmouseout="this.style.borderColor='var(--db1)';this.style.background='transparent'"
                     onclick="window.rto.confirmReview('${id}')">
                    <div style="font-size:18px;margin-bottom:3px">\u{2696}\u{FE0F}</div>
                    <div style="font-weight:800;color:var(--dp);font-size:var(--text-xs)">REVIEW</div>
                </div>
            </div>
            <button class="btn btn-secondary" style="width:100%;font-size:var(--text-xs);background:var(--ds2)" onclick="window.rto.admWA()"> Contact via WhatsApp</button>
        `;
    }

    // Reset to Overview tab on each selection
    switchDpTab('overview');
    document.getElementById('detail-panel').classList.add('show');
}

// Tab switcher for detail panel
function switchDpTab(tab) {
    const tabs = ['overview', 'docs', 'score'];
    tabs.forEach(t => {
        const btn = document.getElementById('dpt-' + t);
        const body = document.getElementById('dp-tab-' + t);
        if (btn) btn.classList.toggle('on', t === tab);
        if (body) body.style.display = t === tab ? 'block' : 'none';
    });
}

function saveOv() {
    const a = state.admApps.find(x => x.id === state.selApp);
    if (!a) return;
    a.note = document.getElementById('ov-note').value;
    a.adj = parseInt(document.getElementById('ov-adj').value) || 0;
    a.ovlog = '[' + new Date().toLocaleTimeString('id-ID') + '] ' + document.getElementById('ov-note').value + ' (adj: ' + (a.adj > 0 ? '+' : '') + a.adj + ')';
    document.getElementById('ov-log').textContent = a.ovlog;
    admRTbl();
    admT(' Override saved');
}

// Redundant decision functions removed - use granular flows (confirmReject, etc) instead


function quickWA(id) {
    const oldSel = state.selApp;
    state.selApp = id;
    admWA();
    state.selApp = oldSel;
}

function verifyDoc(appId, docId, status) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    if (status === 'rejected') {
        const reason = prompt('Penyebab penolakan dokumen?', 'Buram / tidak terbaca');
        if (reason === null) return; // cancelled
        if (!a.docReasons) a.docReasons = {};
        a.docReasons[docId] = reason;
    }

    if (!a.docStatus) a.docStatus = {};
    a.docStatus[docId] = status;

    // Sync with 'miss' array
    if (status === 'rejected' && !a.miss.includes(docId)) {
        a.miss.push(docId);
    } else if (status === 'verified') {
        a.miss = a.miss.filter(m => m !== docId);
        if (a.docReasons) delete a.docReasons[docId];
    }

    admSel(appId);
    admT(`Doc ${status === 'verified' ? 'Verified ' : 'Rejected '}`);
}

function resubmitDoc(appId, docId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;
    if (!a.docStatus) a.docStatus = {};
    a.docStatus[docId] = 'pending';
    a.miss = a.miss.filter(m => m !== docId);

    admSel(appId);
    admT('User resubmitted document ');
}

function addToPickupQueue(appId, nm, ph, ptn, prog, model, vehicleId, plate) {
    state.puOrders.push({
        id: 'PU-' + String(state.puOrders.length + 1).padStart(3, '0'),
        appId, nm, ph, ptn, prog, model, vehicleId, plate,
        deadline: fmtPickupDate(14), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending'
    });
    const puBadge = document.getElementById('pickup-badge');
    if (puBadge) {
        puBadge.textContent = state.puOrders.filter(p => p.status === 'waiting' || p.status === 'overdue').length;
    }
}

function admT(msg) {
    const t = document.getElementById('adm-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function switchRtoTab(tab, el) {
    // Hide all views inside the RTO dashboard
    document.querySelectorAll('.adm-main .av').forEach(v => v.classList.remove('on'));
    // Deselect all sidebar items (targeting the horizontal nav in index.html)
    document.querySelectorAll('.adm-nav .adm-ni').forEach(i => i.classList.remove('on'));

    // Show target view mapping to new IDs in index.html
    const viewMap = {
        'apps': 'rto-applicationsView',
        'pickup': 'rto-pickupView',
        'score': 'rto-scoreView',
        'wa': 'rto-waView'
    };
    const targetView = document.getElementById(viewMap[tab] || ('adm-' + tab));
    if (targetView) targetView.classList.add('on');

    // Highlight sidebar item (handle case where el is not provided, e.g. from app.js)
    const targetEl = el || document.getElementById('adm-ni-' + tab);
    if (targetEl) targetEl.classList.add('on');

    // Trigger specific renders based on tab
    if (tab === 'apps') admRTbl();
    if (tab === 'pickup') {
        state.calYear = new Date().getFullYear();
        state.calMonth = new Date().getMonth();
        renderPUList();
    }
    if (tab === 'score') renderScoreCfg();
    if (tab === 'wa') {
        renderWAScens();
        const scens = window.rtoLogic ? window.rtoLogic.WA_SCENARIOS : WA_SCENARIOS;
        if (!state.selScen && scens && scens.length) {
            selWAScen(scens[0].k);
        }
    }
}

function previewImg(url) {
    const modal = document.getElementById('img-modal');
    const img = document.getElementById('img-preview-src');
    if (modal && img) {
        img.src = url;
        modal.style.display = 'flex';
    }
}

function closePreview() {
    const modal = document.getElementById('img-modal');
    if (modal) modal.style.display = 'none';
}

function uploadDoc(appId, docId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;
    a.miss = a.miss.filter(m => m !== docId);
    if (!a.docStatus) a.docStatus = {};
    a.docStatus[docId] = 'verified';
    if (a.docReasons) delete a.docReasons[docId];
    admSel(appId);
    admT('Doc Uploaded & Verified ');
}

function waContext(ctx) {
    if (!state.selApp) {
        admT('Pilih aplikasi terlebih dahulu!');
        return;
    }
    state.selScen = ctx;
    switchRtoTab('wa');
    // Ensure the sidebar reflects the 'wa' tab
    const el = document.querySelector('.adm-side .adm-ni[onclick="window.rto.switchRtoTab(\'wa\', this)"]');
    if (el) {
        document.querySelectorAll('.adm-side .adm-ni').forEach(i => i.classList.remove('on'));
        el.classList.add('on');
    }
}

function buildWAMsg(a, scenKey) {
    const scen = WA_SCENARIOS.find(s => s.k === scenKey);
    const pr = MAIN_PROGS.find(p => p.id === a.prog) || { nm: a.prog, dr: 0 };
    const ptn = PARTNERS[a.ptn] || { name: a.ptn };
    const dealer = DEALER_LOCATIONS[a.ptn] || { name: ptn.name };

    let tmpl = state.waTmpls[scenKey] || scen?.tmpl || 'Halo {nama}, terkait aplikasi {app_id} kami sedang meninjaunya.';

    // Legacy localStorage check if state.waTmpls is somehow not preferred
    try {
        const stored = localStorage.getItem('csn_wa_cfg');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed[scenKey]) tmpl = parsed[scenKey];
        }
    } catch (e) { }

    const sc = a.score + (a.adj || 0);
    const missStr = a.miss && a.miss.length ? a.miss.map(m => ' ' + m.toUpperCase()).join('\n') : '';

    return tmpl
        .replace(/{nama}/g, a.nm || '')
        .replace(/{app_id}/g, a.id)
        .replace(/{program}/g, pr.nm || '')
        .replace(/{score}/g, sc)
        .replace(/{dealer}/g, dealer.name)
        .replace(/{amount}/g, pr.dr ? 'Rp ' + (pr.dr * 7).toLocaleString('id-ID') : '')
        .replace(/{credits}/g, '3')
        .replace(/{grace_days}/g, '7')
        .replace(/{missing_docs}/g, missStr);
}

function admWA() {
    const a = state.admApps.find(x => x.id === state.selApp);
    if (!a) {
        admT(' Pilih aplikasi terlebih dahulu');
        return;
    }

    // Determine template based on decision
    let waScenKey = 'review';
    if (a.dec === 'approved') waScenKey = 'approved';
    else if (a.dec === 'declined') waScenKey = 'declined';
    else if (a.miss && a.miss.length > 0) waScenKey = 'missing_docs';
    else waScenKey = 'review';

    const msg = buildWAMsg(a, waScenKey);
    const cleanPhone = a.ph.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.startsWith('0')) finalPhone = '62' + finalPhone.substring(1);

    const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    admT(' WhatsApp Diverted!');
}



function showWAPreviewModal(phone, text, name) {
    let m = document.getElementById('wa-preview-mod');
    if (!m) {
        m = document.createElement('div');
        m.id = 'wa-preview-mod';
        m.className = 'modal-overlay';
        m.innerHTML = `
            <div class="modal" style="max-width:400px; padding:20px;">
                <div style="font-size: var(--text-xl); font-weight:800; color:var(--dt1); margin-bottom:12px;"> Kirim WhatsApp ke <span id="wa-mod-nm" style="color:var(--dac)"></span></div>
                <textarea id="wa-mod-txt" class="ov-in" style="width:100%; height:200px; resize:vertical; font-family:'IBM Plex Mono',monospace; font-size: var(--text-md); margin-bottom:12px; padding:10px;"></textarea>
                <div style="display:flex; gap:8px;">
                    <button class="ov-btn" style="flex:1; background:var(--dg1); color:var(--dg); border-color:var(--dg)" onclick="window.rto.sendWAModal()"> Kirim WA</button>
                    <button class="ov-btn" style="flex:1" onclick="document.getElementById('wa-preview-mod').classList.remove('active')">Batal</button>
                </div>
            </div>
        `;
        document.body.appendChild(m);
    }

    document.getElementById('wa-mod-nm').textContent = name;
    document.getElementById('wa-mod-txt').value = text;
    m.setAttribute('data-phone', phone);
    m.classList.add('active');
}

function sendWAModal() {
    const m = document.getElementById('wa-preview-mod');
    if (!m) return;
    const phone = m.getAttribute('data-phone');
    const txt = document.getElementById('wa-mod-txt').value;

    m.classList.remove('active');

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(txt)}`;
    window.open(waUrl, '_blank');
}

// Analytics 
const ANLY_DATA = {
    'all-all': {
        avg: 68.4, apr: 70, auto: 34, inc: '4.8Jt', doc: 73,
        score: [[80, 100, 34, 'var(--dg)'], [60, 79, 55, 'var(--dac)'], [41, 59, 23, 'var(--dw)'], [21, 40, 9, '#FB923C'], [0, 20, 6, 'var(--dd)']],
        income: [['7Jt', 15, 'var(--dg)'], ['57Jt', 29, 'var(--dac)'], ['3.55Jt', 48, 'var(--dbl)'], ['23.5Jt', 25, 'var(--dw)'], ['<2Jt', 10, 'var(--dd)']],
        prof: [['OJOL', 66, 'var(--dg)'], ['Karyawan', 28, 'var(--dbl)'], ['Wiraswasta', 18, 'var(--dw)'], ['PNS/TNI', 9, 'var(--dp)'], ['Lainnya', 6, 'var(--dt2)']],
        miss: [['Rekening Koran', 77, 'var(--dd)'], ['NPWP', 56, 'var(--dw)'], ['Surat Kerja', 48, 'var(--dw)'], ['BPJS TK', 39, 'var(--dbl)'], ['Selfie KTP', 28, '#FB923C']],
        total: 127
    },
    'tangkas-all': {
        avg: 74, apr: 75, auto: 18, inc: '5.2Jt', doc: 80,
        score: [[80, 100, 18, 'var(--dg)'], [60, 79, 22, 'var(--dac)'], [41, 59, 6, 'var(--dw)'], [21, 40, 3, '#FB923C'], [0, 20, 1, 'var(--dd)']],
        income: [['7Jt', 8, 'var(--dg)'], ['57Jt', 14, 'var(--dac)'], ['3.55Jt', 18, 'var(--dbl)'], ['23.5Jt', 9, 'var(--dw)'], ['<2Jt', 1, 'var(--dd)']],
        prof: [['OJOL', 29, 'var(--dg)'], ['Karyawan', 10, 'var(--dbl)'], ['Wiraswasta', 8, 'var(--dw)'], ['PNS/TNI', 2, 'var(--dp)'], ['Lainnya', 1, 'var(--dt2)']],
        miss: [['NPWP', 28, 'var(--dw)'], ['Rekening Koran', 24, 'var(--dd)'], ['Surat Kerja', 18, 'var(--dw)'], ['BPJS TK', 12, 'var(--dbl)'], ['Selfie KTP', 9, '#FB923C']],
        total: 50
    },
};

const ANLY_PROG = {
    'P-TK-RTO': { avg: 76, apr: 80, auto: 12, inc: '5.5Jt', total: 28 },
    'P-TK-RENT': { avg: 70, apr: 68, auto: 6, inc: '4.8Jt', total: 22 },
};

function renderAnalytics() {
    const ptnEl = document.getElementById('anly-ptn');
    const ptn = ptnEl ? ptnEl.value : 'all';
    const progEl = document.getElementById('anly-prog');
    const prog = progEl ? progEl.value : 'all';

    const key = ptn + '-all';
    const d = ANLY_DATA[key] || ANLY_DATA['all-all'];
    const pd = prog !== 'all' ? ANLY_PROG[prog] : null;
    const total = pd ? pd.total : d.total;

    const elCount = document.getElementById('anly-count');
    if (elCount) elCount.textContent = total + ' aplikasi';

    // KPI cards
    const elKpi = document.getElementById('anly-kpi');
    if (elKpi) {
        elKpi.innerHTML = [
            { l: 'Avg Score', v: pd ? pd.avg : d.avg, c: 'var(--dac)', s: 'dari 100' },
            { l: 'Approval Rate', v: (pd ? pd.apr : d.apr) + '%', c: 'var(--dg)', s: 'Target 65%' },
            { l: 'Auto-Approved', v: pd ? pd.auto : d.auto, c: 'var(--dp)', s: 'Score 80' },
            { l: 'Avg Income', v: pd ? pd.inc : d.inc, c: 'var(--dt1)', s: '/bulan', sm: 1 },
            { l: 'Doc Complete', v: d.doc + '%', c: 'var(--dw)', s: 'Required' },
        ].map(k => `<div class="kpi"><div class="kpi-l">${k.l}</div><div class="kpi-v" style="color:${k.c};${k.sm ? 'font-size: var(--text-xl)' : ''}">${k.v}</div><div class="kpi-d" style="color:var(--dt3)">${k.s}</div></div>`).join('');
    }

    const bcRow = (items, max) => items.map(([l, n, col]) => {
        const w = Math.round(n / max * 100);
        return `<div class="bc-row"><div class="bc-l">${l}</div><div class="bc-bw"><div class="bc-bf" style="width:${w}%;background:${col}">${n}</div></div><div class="bc-v" style="color:${col}">${w}%</div></div>`;
    }).join('');

    const dimStyle = pd ? 'opacity:.45;pointer-events:none' : '';
    const elCharts = document.getElementById('anly-charts');
    if (elCharts) {
        elCharts.innerHTML = `
          <div class="ch-c"><div class="ch-t">Score Distribution</div>${bcRow(d.score.map(([a, b, n, c]) => [`${a}-${b}`, n, c]), d.score.reduce((m, r) => Math.max(m, r[2]), 0))}</div>
          <div class="ch-c"><div class="ch-t">Income Distribution</div>${bcRow(d.income, d.income.reduce((m, r) => Math.max(m, r[1]), 0))}</div>
          <div class="ch-c" ${dimStyle ? 'style="' + dimStyle + '"' : ''}><div class="ch-t">Profession Breakdown</div>${bcRow(d.prof, d.prof.reduce((m, r) => Math.max(m, r[1]), 0))}</div>
          <div class="ch-c" ${dimStyle ? 'style="' + dimStyle + '"' : ''}><div class="ch-t">Top Missing Documents</div>${bcRow(d.miss, d.miss.reduce((m, r) => Math.max(m, r[1]), 0))}</div>
        `;
    }
}

//  SCORE CONFIG 
function renderScoreCfg() {
    const total = state.dimCfg.reduce((s, d) => s + d.max, 0);
    const elTot = document.getElementById('sc-total-disp');
    if (elTot) {
        elTot.textContent = total;
        elTot.style.color = total === 100 ? 'var(--dac)' : 'var(--dd)';
    }

    const scDim = document.getElementById('sc-dim-list');
    if (scDim) {
        scDim.innerHTML = state.dimCfg.map((d, i) => `
        <div class="sc-dim-row">
          <div class="sc-dim-lbl">${d.l}</div>
          <input class="sc-dim-inp" type="number" min="0" max="30" value="${d.max}" onchange="window.rto.updDimCfg(${i}, this.value)" style="color:${d.c}">
          <div class="sc-dim-bar"><div class="sc-dim-bf" style="width:${d.max / 30 * 100}%;background:${d.c}"></div></div>
          <span class="mono" style="font-size: var(--text-xs);color:var(--dt3);min-width:28px">/${d.max}</span>
        </div>`).join('');
    }

    const scThresh = document.getElementById('sc-thresh-list');
    if (scThresh) {
        scThresh.innerHTML = state.threshCfg.map((t, i) => `
        <div class="sc-thresh-row">
          <span class="sc-thresh-chip" style="background:${t.bg};color:${t.c}">${t.l}</span>
          <span style="font-size: var(--text-xs);color:var(--dt3);min-width:28px"></span>
          <input class="sc-thresh-inp" type="number" min="0" max="100" value="${t.min}" onchange="window.rto.updThreshCfg(${i}, this.value)">
          <span style="font-size: var(--text-xs);color:var(--dt3)">poin</span>
        </div>`).join('');
    }

    renderProgCfg();
    renderDSR();
}

function renderProgCfg() {
    const scProg = document.getElementById('sc-prog-cfg');
    if (!scProg) return;

    scProg.innerHTML = MAIN_PROGS.map(p => `
    <div class="sc-dim-row">
      <div class="sc-dim-lbl" style="width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nm}</div>
      <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: var(--text-xs); color: var(--dt3)">Rp</span>
        <input class="sc-thresh-inp" type="text" value="${Number(p.mi).toLocaleString('id-ID')}" style="width: 100px; text-align: left;" disabled>
      </div>
    </div>`).join('');
}

function renderDSR() {
    const el = document.getElementById('sc-dsr-cfg');
    if (!el) return;
    el.innerHTML = state.dsrCfg.map((d, i) => `
    <div class="sc-dsr-row">
        <span class="sc-dsr-lbl">${d.l}</span>
        <span style="font-size:var(--text-xs);color:var(--dt3)"></span>
        <input class="sc-thresh-inp" type="number" value="${d.v}" onchange="window.rto.updDSR(${i}, this.value)">
        <span style="font-size:var(--text-xs);color:var(--dt3)">%</span>
        <div style="width:10px;height:10px;border-radius:50%;background:${d.c};margin-left:auto"></div>
    </div>`).join('');
}

function updDSR(i, v) {
    state.dsrCfg[i].v = parseInt(v) || 0;
}

function updDimCfg(idx, val) {
    state.dimCfg[idx].max = parseInt(val) || 0;
    renderScoreCfg();
}

function updThreshCfg(idx, val) {
    state.threshCfg[idx].min = parseInt(val) || 0;
}

function saveCfg() {
    const total = state.dimCfg.reduce((s, d) => s + d.max, 0);
    if (total !== 100) {
        alert(' Total bobot harus 100 poin (sekarang ' + total + ')');
        return;
    }
    localStorage.setItem('casan_rto_cfg', JSON.stringify({
        dimCfg: state.dimCfg,
        threshCfg: state.threshCfg,
        dsrCfg: state.dsrCfg
    }));
    alert(' Konfigurasi skor & DSR berhasil disimpan!');
}

function resetCfg() {
    if (confirm('Yakin ingin reset semua konfigurasi ke default?')) {
        state.dimCfg = JSON.parse(JSON.stringify(DIM_DEFAULTS));
        state.threshCfg = JSON.parse(JSON.stringify(THRESH_DEFAULTS));
        state.dsrCfg = [
            { l: 'Batas Sehat', v: 50, c: 'var(--dg)' },
            { l: 'Batas Waspada', v: 70, c: 'var(--dw)' },
            { l: 'Penalty Waspada', v: 85, c: '#FB923C' },
            { l: 'Penalty Berat', v: 100, c: 'var(--dd)' }
        ];
        renderScoreCfg();
        localStorage.removeItem('casan_rto_cfg');
        alert(' Konfigurasi direset ke default');
    }
}

//  WA TEMPLATES 
function renderWAScens() {
    const el = document.getElementById('wa-scen-list');
    if (!el) return;
    el.innerHTML = WA_SCENARIOS.map(s => `
    <div class="wa-scen ${state.selScen === s.k ? 'sel' : ''}" onclick="window.rto.selWAScen('${s.k}')">
      <div class="wa-scen-ic">${s.ic}</div>
      <div class="wa-scen-nm">${s.nm}</div>
      <div class="wa-scen-desc">${s.desc}</div>
    </div>`).join('');
}

function selWAScen(k) {
    state.selScen = k;
    renderWAScens();
    const s = WA_SCENARIOS.find(x => x.k === k);
    if (!s) return;
    const scenName = document.getElementById('wa-scen-name');
    if (scenName) scenName.textContent = s.nm;

    const tmplTxt = document.getElementById('wa-tmpl-txt');
    if (tmplTxt) tmplTxt.value = state.waTmpls[k] || s.tmpl;

    const preview = document.getElementById('wa-preview');
    if (preview) preview.style.display = 'none';
}

function saveWA() {
    if (!state.selScen) { admT('Pilih skenario terlebih dahulu'); return; }
    state.waTmpls[state.selScen] = document.getElementById('wa-tmpl-txt').value;
    admT(' Template tersimpan!');
}

function previewWA() {
    if (!state.selScen) return;
    const tmpl = document.getElementById('wa-tmpl-txt').value;
    const preview = tmpl
        .replace(/{nama}/g, 'Ahmad Rizki')
        .replace(/{app_id}/g, 'CASAN-XY7Z2A')
        .replace(/{program}/g, 'Zeeho RTO')
        .replace(/{score}/g, '72')
        .replace(/{dealer}/g, 'Tangkas Motors')
        .replace(/{amount}/g, 'Rp 266.000')
        .replace(/{credits}/g, '3')
        .replace(/{grace_days}/g, '7')
        .replace(/{missing_docs}/g, ' KTP Asli\n Rekening Koran\n Slip Gaji');
    document.getElementById('wa-preview-txt').textContent = preview;
    document.getElementById('wa-preview').style.display = 'block';
}

function resetWA() {
    if (!state.selScen) return;
    const s = WA_SCENARIOS.find(x => x.k === state.selScen);
    state.waTmpls[state.selScen] = s.tmpl;
    document.getElementById('wa-tmpl-txt').value = s.tmpl;
    document.getElementById('wa-preview').style.display = 'none';
    admT(' Template direset ke default');
}



function copyWAMsg() {
    const txt = document.getElementById('wa-msg-txt')?.value;
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(() => admT(' Pesan disalin!')).catch(() => admT('Gagal menyalin'));
}

function openWALink(ph) {
    const msg = document.getElementById('wa-msg-txt')?.value || '';
    const clean = ph.replace(/[^0-9+]/g, '').replace(/^0/, '62').replace(/^\+/, '');
    const url = 'https://wa.me/' + clean + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
    admT(' WhatsApp dibuka!');
}


//  PICKUP SCHEDULE (ADMIN) 
function setPUF(f, btnId) {
    state.puFlt = f;
    document.querySelectorAll('[id^="puf-"]').forEach(b => b.classList.remove('on'));
    if (btnId) document.getElementById(btnId).classList.add('on');
    renderPUList();
}

function setPUProgFlt(val) {
    state.puProgFlt = val;
    renderPUList();
}

function renderPUList() {
    const el = document.getElementById('pu-list');
    if (!el) return;
    const filtered = state.puOrders.filter(p => {
        if (state.puFlt !== 'all' && p.status !== state.puFlt) return false;
        if (state.filter && state.filter.partner && state.filter.partner !== 'all') {
            if (p.ptn.toLowerCase() !== state.filter.partner.toLowerCase()) return false;
        }
        if (state.puProgFlt && state.puProgFlt !== 'all') {
            if (p.prog !== state.puProgFlt) return false;
        }
        return true;
    });

    // Populate Program Filter Options dynamically for Pickup Schedule based on selected partner
    const puProgSel = document.getElementById('pu-prog-filter');
    if (puProgSel) {
        let progsToKeep = MAIN_PROGS;
        if (state.filter && state.filter.partner && state.filter.partner !== 'all') {
            progsToKeep = MAIN_PROGS.filter(p => p.p.toLowerCase() === state.filter.partner.toLowerCase());
        }

        let opts = `<option value="all">🌐 All Programs</option>`;
        progsToKeep.forEach(p => {
            opts += `<option value="${p.id}" ${state.puProgFlt === p.id ? 'selected' : ''}>[${p.p.toUpperCase()}] ${p.nm}</option>`;
        });

        if (puProgSel.innerHTML !== opts) {
            puProgSel.innerHTML = opts;
            if (state.puProgFlt !== 'all' && !progsToKeep.find(p => p.id === state.puProgFlt)) {
                state.puProgFlt = 'all';
                puProgSel.value = 'all';
            }
        }
    }
    el.innerHTML = filtered.map(p => {
        const dl = daysLeft(p.deadline);
        const stMap = { waiting: { cls: 'pu-st-wait', l: ' Menunggu' }, scheduled: { cls: 'pu-st-sched', l: ' Terjadwal' }, done: { cls: 'pu-st-done', l: ' Selesai' }, overdue: { cls: 'pu-st-overdue', l: ' Terlambat' } };
        const st = stMap[p.status] || { cls: '', l: p.status };
        const loc = DEALER_LOCATIONS[p.ptn];
        return `<div class="pu-card ${state.selPU === p.id ? 'sel' : ''}" onclick="window.rto.selPUOrder('${p.id}')">
        <div class="pu-card-top">
          <div><div class="pu-name">${p.nm}</div><div class="pu-id">${p.appId}  ${p.model}</div></div>
          <span class="pu-st ${st.cls}">${st.l}</span>
        </div>
        <div class="pu-info">
          <span> ${loc ? loc.name : p.ptn}</span>
          ${p.schedDate ? `<span> ${p.schedDate} ${p.schedTime || ''}</span>` : ''}
        </div>
        <div class="pu-deadline" style="color:${dl < 0 ? 'var(--dd)' : dl <= 3 ? 'var(--dw)' : 'var(--dt3)'}">
          ${dl < 0 ? ' Melewati deadline' : dl === 0 ? ' Deadline HARI INI' : p.status === 'done' ? ' Selesai' : ' Deadline: ' + p.deadline + ' (' + dl + 'h lagi)'}
        </div>
      </div>`;
    }).join('') || '<div style="padding:20px;text-align:center;color:var(--dt3);font-size: var(--text-sm)">Tidak ada pickup</div>';

    // Update Badge
    const puBadge = document.getElementById('pickup-badge');
    if (puBadge) {
        puBadge.textContent = state.puOrders.filter(p => p.status === 'waiting' || p.status === 'overdue').length;
    }
}

function selPUOrder(id) {
    window.state.selPU = id;
    renderPUList();
    renderPUDetail();
}

function renderPUDetail() {
    const p = state.puOrders.find(x => x.id === state.selPU);
    if (!p) return;
    const loc = DEALER_LOCATIONS[p.ptn];
    const dl = daysLeft(p.deadline);
    const el = document.getElementById('pu-detail');
    if (!el) return;

    // Build calendar
    const now = new Date();
    if (!state.calYear) state.calYear = now.getFullYear();
    if (state.calMonth === undefined || state.calMonth === null) state.calMonth = now.getMonth();
    state.selDate = p.schedDate || null;
    state.selTime = p.schedTime || null;

    el.innerHTML = `
      <div class="pu-dh">
        <div class="pu-dt">${p.nm} <span style="font-size: var(--text-sm);color:var(--dt3)"> ${p.model}</span></div>
        <div class="pu-ds">${p.appId} · Deadline: <b style="color:${dl < 0 ? 'var(--dd)' : dl <= 3 ? 'var(--dw)' : 'var(--dac)'}">${p.deadline}</b></div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <div style="background:var(--ds2);border:1px solid var(--db1);border-radius:8px;padding:8px 12px;font-size:var(--text-xs)">
                <div style="color:var(--dt3);font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Asset</div>
                <div style="font-weight:800;color:var(--dt1);font-family:'IBM Plex Mono',monospace">${p.plate || '—'}</div>
                <div style="color:var(--dt3);font-size:10px">${p.vehicleId || '—'}</div>
            </div>
            ${p.status !== 'done' ? `<button class="btn" style="align-self:flex-end;font-size:var(--text-xs);padding:6px 14px;background:var(--ds2)" 
                onclick="window.rto.openAssetAssignment('${p.appId}')">🔄 Change Asset</button>` : ''}
        </div>
      </div>
  
      <!--Location -->
      <div class="pu-loc-card">
        <div class="pu-loc-t"> Lokasi Pickup Motor</div>
        <div class="pu-loc-addr">${loc ? loc.name : 'Dealer'}</div>
        <div class="pu-loc-sub">${loc ? loc.addr : ''}</div>
        <div class="pu-loc-map"> ${loc ? loc.addr : 'Peta lokasi'}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button onclick="window.rto.admT(' Alamat disalin!')" class="ov-btn" style="flex:1;font-size: var(--text-xs)"> Salin Alamat</button>
          <button onclick="window.rto.admT(' Membuka Google Maps...')" class="ov-btn" style="flex:1;font-size: var(--text-xs)"> Google Maps</button>
        </div>
      </div>
  
      <!--WA Notification to driver-->
    ${p.status === 'waiting' || p.status === 'overdue' ? `
      <div style="margin:0 16px 12px;padding:10px 12px;background:rgba(34,197,94,.06);border-radius:8px;border:1px solid rgba(34,197,94,.15)">
        <div style="font-size: var(--text-xs);font-weight:800;color:var(--dg);margin-bottom:6px"> Kirim Notifikasi ke Driver</div>
        <div style="font-size: var(--text-xs);color:var(--dt2);line-height:1.5;margin-bottom:8px">Minta driver untuk menjadwalkan pickup dalam <b>${dl > 0 ? dl + ' hari' : 'waktu segera'}</b></div>
        <button onclick="window.rto.sendPickupWA('${p.id}')" style="width:100%;padding:7px;background:linear-gradient(135deg,#16A34A,#15803D);color:#fff;border:none;border-radius:6px;font-size: var(--text-sm);font-weight:700;cursor:pointer">
           Kirim WA ke ${p.nm}
        </button>
      </div>` : ''
        }

      <!--Calendar(driver scheduling) -->
      <div class="cal-wrap" style="background:var(--s2); border:1px solid var(--b1); border-radius:12px; padding:20px; border:2px solid var(--ac)33">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; color:var(--ac)">
            <span style="font-size:20px">🗓️</span>
            <div style="font-size:var(--text-md); font-weight:800; letter-spacing:0.5px">ADMIN SCHEDULING ASSISTANT</div>
        </div>
        <div class="cal-t" style="color:var(--t2); font-size:var(--text-sm); margin-bottom:16px">Help driver select pickup date & time:</div>
        <div id="pu-cal" style="margin-bottom:16px"></div>
        <div style="font-size: var(--text-xs); font-weight:800; color:var(--ac); margin-bottom:8px; text-transform:uppercase; letter-spacing:1px">Available Slots</div>
        <div class="time-slots" id="pu-slots" style="margin-bottom:20px"></div>
        <button class="pu-confirm-btn" id="pu-confirm-btn" onclick="window.rto.confirmPickup('${p.id}')" ${state.selDate && state.selTime ? '' : 'disabled'} style="width:100%; padding:14px; border-radius:10px; font-weight:800; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor:pointer">
          ${state.selDate && state.selTime ? `✨ CONFIRM SCHEDULE: ${state.selDate} @ ${state.selTime}` : 'Choose Date & Time First'}
        </button>
      </div>
  
      <!--Handover Timeline-->
      <div style="margin:0 16px;font-size: var(--text-base);font-weight:800;color:var(--dt1);margin-bottom:8px"> Status Handover</div>
      <div class="handover-timeline">
        ${renderHOTimeline(p)}
      </div>
      
      ${p.hoStatus === 'dealer_confirmed' ? `
        <div style="margin: 16px; padding: 16px; background: var(--ds2); border: 1px solid var(--db1); border-radius: 8px;">
            <div style="font-size: var(--text-base); font-weight: 800; color: var(--dw); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                 Verifikasi & Bukti Serah Terima Kendaraan
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- SECTION 1: Checkboxes -->
                <div>
                    <div style="font-size: var(--text-sm); font-weight: 700; color: var(--dt1); margin-bottom: 8px;">1. Fisik & Kelengkapan</div>
                    <div style="display: flex; flex-direction: column; gap: 10px; font-size: var(--text-sm); color: var(--dt2); padding-left: 8px; border-left: 2px solid var(--db1);" id="ho-checklist-container">
                        <div style="background:var(--ds1); padding:10px; border-radius:8px; margin-bottom:4px; border:1px solid var(--db1); position:relative">
                            <div style="font-weight:800; color:var(--dw); margin-bottom:4px; font-size:var(--text-xs)">ASSET CONFIRMATION</div>
                            <div style="font-family:'IBM Plex Mono'; font-size: var(--text-sm); color:var(--dt1); font-weight:700">${p.plate}</div>
                            <div style="font-size: var(--text-xs); color:var(--dt3)">ID: ${p.vehicleId}</div>
                            ${p.status !== 'done' ? `<button class="btn" style="position:absolute; top:10px; right:10px; font-size:var(--text-xs); padding:4px 8px; background:var(--ds2); border:1px solid var(--db1); color:var(--dt1)" onclick="window.rto.openAssetAssignment('${p.appId}')">🔄 Change</button>` : ''}
                            <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start; margin-top:8px; color:var(--dt1); font-weight:700; background:rgba(0,229,195,0.05); padding:6px; border-radius:6px">
                                <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOPrepChecklist()"> Nopol/STNK Sesuai.
                            </label>
                        </div>
                        <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start;">
                            <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOPrepChecklist()"> Fisik kendaraan mulus.
                        </label>
                        <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start;">
                            <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOPrepChecklist()"> Baterai penuh (100%).
                        </label>
                        <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start;">
                            <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOPrepChecklist()"> Kunci Utama & Cadangan.
                        </label>
                        <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start;">
                            <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOPrepChecklist()"> Charger & Helm diserahkan.
                        </label>
                    </div>
                </div>

                <!-- SECTION 2: Photos -->
                <div>
                    <div style="font-size: var(--text-sm); font-weight: 700; color: var(--dt1); margin-bottom: 8px;">2. Bukti Foto Serah Terima</div>
                    <div style="display: flex; flex-direction: column; gap: 12px;" id="ho-photos-container">
                        
                        <div style="border: 2px dashed var(--db1); border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s;" id="ho-photo-1" onclick="window.rto.mockHOPrepUpload('ho-photo-1', 'Foto Serah Terima Kendaraan')">
                            <div style="font-size: 24px; margin-bottom: 4px;">📸</div>
                            <div style="font-size: var(--text-xs); color: var(--dt2); font-weight: 600;">Foto Serah Terima Kendaraan</div>
                            <div style="font-size: var(--text-3xs); color: var(--dt3); margin-top: 4px;">Klik untuk upload</div>
                        </div>

                        <div style="border: 2px dashed var(--db1); border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s;" id="ho-photo-2" onclick="window.rto.mockHOPrepUpload('ho-photo-2', 'Foto KTP & Driver dengan Motor')">
                            <div style="font-size: 24px; margin-bottom: 4px;">🤳</div>
                            <div style="font-size: var(--text-xs); color: var(--dt2); font-weight: 600;">Foto KTP & Driver dengan Motor</div>
                            <div style="font-size: var(--text-3xs); color: var(--dt3); margin-top: 4px;">Klik untuk upload</div>
                        </div>

                    </div>
                </div>
            </div>
            
            <button class="ho-complete-btn" id="btn-ho-complete" disabled style="margin-top:20px; width:100%; padding:14px; background:var(--dg1); color:var(--dg); border:none; border-radius:8px; font-weight:800; font-size:var(--text-sm); opacity: 0.5; cursor: not-allowed; transition: all 0.3s;" onclick="window.rto.markHandoverDone('${p.id}')">✨ Konfirmasi Serah Terima Selesai</button>
        </div>
      ` : ''}
      
      ${p.status === 'done' ? `<div style="margin:10px 16px;padding:12px;background:var(--dg1);border-radius:8px;border:1px solid rgba(52,211,153,.15);font-size: var(--text-base);color:var(--dg);font-weight:700;text-align:center"> Handover selesai  GPS diaktifkan  Rider aktif</div>` : ''}
    `;

    renderPUCal();
    renderPUSlots();
}

function renderHOTimeline(p) {
    const steps = [
        { k: 'approved', l: 'Aplikasi Disetujui', s: p.hoStatus !== 'pending' ? 'Approved' : 'Score Validated', done: true },
        { k: 'notified', l: 'Driver Diberitahu', s: 'WA notifikasi terkirim', done: p.status !== 'waiting' || p.hoStatus !== 'pending' },
        { k: 'scheduled', l: 'Jadwal Disepakati', s: p.schedDate ? p.schedDate + '  ' + p.schedTime : 'Belum dijadwalkan', done: !!p.schedDate },
        { k: 'dealer_confirmed', l: 'Dealer Siapkan Motor', s: 'Verifikasi unit & GPS', done: p.hoStatus === 'dealer_confirmed' || p.status === 'done' },
        { k: 'done', l: 'Serah Terima Selesai', s: p.status === 'done' ? 'GPS aktif, rider jalan!' : 'Menunggu konfirmasi', done: p.status === 'done' },
    ];
    return steps.map((st, i) => {
        const isActive = !st.done && (i === 0 || (steps[i - 1] && steps[i - 1].done));
        return `<div class="ho-step">
        <div class="ho-dot ${st.done ? 'done' : isActive ? 'active' : 'pending'}">${st.done ? 'DONE' : isActive ? '->' : i + 1}</div>
        <div class="ho-info">
          <div class="ho-t" style="color:${st.done ? 'var(--dg)' : isActive ? 'var(--dac)' : 'var(--dt3)'}">${st.l}</div>
          <div class="ho-s">${st.s}</div>
        </div>
      </div>`;
    }).join('');
}

function renderPUCal() {
    const p = state.puOrders.find(x => x.id === state.selPU);
    const now = new Date();
    const deadlineDate = p ? new Date(p.deadline) : null;
    const year = state.calYear, month = state.calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    let html = `<div class="cal-nav">
      <button class="cal-nb" onclick="window.rto.calNav(-1)"><</button>
      <span class="cal-nav-t">${months[month]} ${year}</span>
      <button class="cal-nb" onclick="window.rto.calNav(1)">></button>
    </div>
    <div class="cal-grid">
        ${days.map(d => `<div class="cal-dh">${d}</div>`).join('')}
        ${Array(firstDay).fill('<div class="cal-day cal-empty">-</div>').join('')}
        ${Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(year, month, d);
        const isPast = dateObj < new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const isDeadline = deadlineDate && dateStr === p.deadline;
        const isSel = dateStr === state.selDate;
        const dow = dateObj.getDay();
        const isWeekend = dow === 0; // Sunday closed
        let cls = 'cal-day';
        if (isPast || isWeekend) cls += ' cal-past';
        else if (isSel) cls += ' cal-sel';
        else if (isDeadline) cls += ' cal-deadline';
        return `<div class="${cls}" onclick="${!isPast && !isWeekend ? `window.rto.pickCalDay('${dateStr}','${state.selPU}')` : ''}">${d}</div>`;
    }).join('')}
    </div>`;

    document.getElementById('pu-cal').innerHTML = html;
}

function calNav(dir) {
    state.calMonth += dir;
    if (state.calMonth > 11) { state.calMonth = 0; state.calYear++ }
    if (state.calMonth < 0) { state.calMonth = 11; state.calYear-- }
    renderPUCal();
}

function pickCalDay(dateStr, puId) {
    state.selDate = dateStr; state.selTime = null;
    renderPUCal(); renderPUSlots();
}

function renderPUSlots() {
    const p = state.puOrders.find(x => x.id === state.selPU);
    if (!p) return;
    const loc = DEALER_LOCATIONS[p.ptn];
    const slots = loc ? loc.hours : ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];
    const fullSlots = ['11:00', '14:00'];
    const el = document.getElementById('pu-slots');
    if (!el) return;
    el.innerHTML = slots.map(t => `
      <div class="ts ${!state.selDate ? '' : ''}${state.selTime === t ? 'on' : ''} ${fullSlots.includes(t) && state.selDate ? 'full' : ''}"
        onclick="${state.selDate && !fullSlots.includes(t) ? `window.rto.pickSlot('${t}','${state.selPU}')` : ''}">${t}${fullSlots.includes(t) && state.selDate ? ' (Penuh)' : ''}</div>`).join('');
    const btn = document.getElementById('pu-confirm-btn');
    if (btn) {
        btn.disabled = !(state.selDate && state.selTime);
        btn.innerHTML = state.selDate && state.selTime ? `✨ CONFIRM SCHEDULE: ${state.selDate} @ ${state.selTime}` : 'Choose Date & Time First';
    }
}

function pickSlot(time, puId) {
    state.selTime = time;
    renderPUSlots();
}

function confirmPickup(puId) {
    if (!state.selDate || !state.selTime) { admT('Pilih tanggal & waktu terlebih dahulu', 'er'); return }
    const p = state.puOrders.find(x => x.id === puId);
    if (!p) return;
    p.schedDate = state.selDate; p.schedTime = state.selTime; p.status = 'scheduled'; p.hoStatus = 'dealer_confirmed';
    admT(`OK. Pickup confirmed: ${p.nm} - ${state.selDate} - ${state.selTime}`);
    renderPUList();
    renderPUDetail();
}

function sendPickupWA(puId) {
    const p = state.puOrders.find(x => x.id === puId);
    if (!p) return;
    admT(`WA sent to ${p.nm}(${p.ph})`);
    if (p.status === 'waiting') p.hoStatus = 'notified';
    renderPUList();
    renderPUDetail();
}


function openAssetAssignment(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    // Filter available vehicles from global state
    if (!window.state || !window.state.vehicles) {
        admT('Global vehicle state not found');
        return;
    }

    // Include currently-assigned vehicle (for swap cases) as selectable
    const puOrder = (state.puOrders || []).find(o => o.appId === appId);
    const currentVehicleId = puOrder ? puOrder.vehicleId : null;

    const available = window.state.vehicles.filter(v =>
        (v.status === 'available' && v.programId === a.prog) ||
        (v.id === currentVehicleId)
    );

    // Use pendingVehicle from app state, or fall back to currently assigned one
    const pending = a.pendingVehicle || (puOrder ? { id: puOrder.vehicleId, plate: puOrder.plate } : null);

    let listHtml = '';
    if (available.length === 0) {
        listHtml = `<div style="padding:40px;text-align:center;color:var(--dt3);border:2px dashed var(--db1);border-radius:12px">
            <div style="font-size:32px;margin-bottom:12px"></div>
            <div style="font-weight:700;color:var(--dt1)">No Assets Available</div>
            <div style="font-size:var(--text-xs)">There are no available vehicles for the <b>${a.prog}</b> program.</div>
        </div>`;
    } else {
        listHtml = `<div style="display:flex;flex-direction:column;gap:8px;max-height:380px;overflow-y:auto;padding-right:4px">
            ${available.map(v => {
            const isSelected = pending && pending.id === v.id;
            const isCurrent = currentVehicleId === v.id;
            return `<div style="background:${isSelected ? 'var(--dg1)' : 'var(--ds2)'};border:2px solid ${isSelected ? 'var(--dg)' : 'var(--db1)'};border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:all 0.15s"
                         onclick="window.rto.stageAssetSelection('${appId}','${v.id}','${v.plate}')">
                    <div>
                        <div style="font-weight:800;color:var(--dt1);font-size:var(--text-base)">${v.plate}</div>
                        <div style="font-size:var(--text-xs);color:var(--dt3)">${v.id} · ${v.model}${isCurrent ? ' <span style="color:var(--dac);font-weight:700">(current)</span>' : ''}</div>
                    </div>
                    <div style="color:${isSelected ? 'var(--dg)' : 'var(--dt3)'};font-weight:800;font-size:var(--text-xs)">${isSelected ? '✅ Selected' : 'Select'}</div>
                </div>`;
        }).join('')}
        </div>`;
    }

    // Confirm button — only visible when a vehicle is staged
    const confirmHtml = pending
        ? `<button class="btn btn-primary" style="padding:10px 20px;flex:1;font-weight:800;background:var(--dg);color:#fff;border:none"
                onclick="window.rto.assignAsset('${appId}','${pending.id}','${pending.plate}')">✅ Confirm Asset (${pending.plate})</button>`
        : `<button class="btn" style="padding:10px 20px;flex:1;opacity:0.5;cursor:not-allowed" disabled>Select a vehicle first</button>`;

    const html = `
        <div style="padding:4px">
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;background:var(--ds2);padding:14px;border-radius:10px;border:1px solid var(--db1)">
                <div style="width:44px;height:44px;border-radius:10px;background:var(--dac);color:#000;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0"></div>
                <div>
                    <div style="font-weight:800;color:var(--dt1);font-size:var(--text-base)">Pilih Asset Kendaraan</div>
                    <div style="font-size:var(--text-xs);color:var(--dt3)">Assigning asset to <b>${a.nm}</b> · ${a.prog}</div>
                </div>
            </div>

            ${listHtml}

            <div class="modal-actions" style="margin-top:16px;display:flex;gap:10px">
                ${confirmHtml}
                <button class="btn" style="padding:10px 16px" onclick="window.closeModals()">Cancel</button>
            </div>
        </div>
    `;

    const titleEl = document.getElementById('gpsModalTitle');
    const contentEl = document.getElementById('gpsModalContent');
    const overlay = document.getElementById('gpsModalOverlay');

    if (titleEl && contentEl && overlay) {
        titleEl.textContent = ' Asset Assignment';
        contentEl.innerHTML = html;
        overlay.classList.add('active');
    }
}

// Stage asset selection (highlight only, no commit)
function stageAssetSelection(appId, vehicleId, plate) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;
    a.pendingVehicle = { id: vehicleId, plate };
    // Re-render modal to show updated selection
    openAssetAssignment(appId);
}


function assignAsset(appId, vehicleId, plate, dontClose = false) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    // Clear staged selection
    delete a.pendingVehicle;

    // Check if there's already a pickup order for this app (Asset Swapping case)
    let order = state.puOrders.find(o => o.appId === appId);

    if (order) {
        // Un-reserve the previous vehicle if it was different
        if (order.vehicleId && order.vehicleId !== vehicleId) {
            const oldVehicle = window.state.vehicles.find(v => v.id === order.vehicleId);
            if (oldVehicle) oldVehicle.status = 'available';
        }

        // Update existing order
        order.vehicleId = vehicleId;
        order.plate = plate;
    } else {
        // Create new order
        const pr = MAIN_PROGS.find(p => p.id === a.prog);
        addToPickupQueue(appId, a.nm, a.ph, a.ptn, a.prog, pr ? pr.nm : 'Motor Listrik', vehicleId, plate);
    }

    // Reserve the new vehicle
    const vehicle = window.state.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
        vehicle.status = 'reserved';
    }

    a.dec = 'approved';
    window.closeModals(); // always close after confirm
    admRTbl();
    renderPUList(); // Refresh queue view
    admT(' Asset assigned!');
    // Refresh detail panel if this app is selected
    if (state.selApp === appId) admSel(appId);
    // Refresh pickup detail if this pickup is currently selected
    if (state.selPU) {
        const p = state.puOrders.find(x => x.id === state.selPU);
        if (p && p.appId === appId) renderPUDetail();
    }
}


function evalHOPrepChecklist() {
    const container = document.getElementById('ho-checklist-container');
    const photo1 = document.getElementById('ho-photo-1');
    const photo2 = document.getElementById('ho-photo-2');
    const btn = document.getElementById('btn-ho-complete');

    if (!container || !btn || !photo1 || !photo2) return;

    // 1. Check if all checkboxes are checked
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    // 2. Check if both photos are uploaded (indicated by the 'uploaded' class we will add)
    const photosDone = photo1.classList.contains('uploaded') && photo2.classList.contains('uploaded');

    // 3. Evaluate final state
    if (allChecked && photosDone) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }
}

function mockHOPrepUpload(elId, label) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (el.classList.contains('uploaded')) return; // Prevent double trigger

    // Simulate an upload delay
    el.innerHTML = `<div style="font-size: 24px; margin-bottom: 4px; animation: pulse 1s infinite;"></div>
                    <div style="font-size: var(--text-xs); color: var(--dt2); font-weight: 600;">Mengunggah...</div>`;

    setTimeout(() => {
        el.classList.add('uploaded');
        el.style.borderColor = 'var(--c-success)';
        el.style.background = 'var(--dg1)';
        el.innerHTML = `<div style="font-size: 24px; margin-bottom: 4px;"></div>
                        <div style="font-size: var(--text-xs); color: var(--c-success); font-weight: 700;">${label}</div>
                        <div style="font-size: var(--text-3xs); color: var(--c-success); margin-top: 4px;">Berhasil Diunggah</div>`;

        admT(` ${label} berhasil diunggah!`);
        evalHOPrepChecklist(); // Re-evaluate the Master button
    }, 800);
}

function openApprovalConfirmation(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    // Check if asset already assigned
    const order = state.puOrders.find(o => o.appId === appId);
    const hasAsset = !!(order && order.vehicleId);

    // Safe check for global state
    const vehicles = (window.state && window.state.vehicles) ? window.state.vehicles : [];
    const available = vehicles.filter(v => v.status === 'available' && v.programId === a.prog);

    let html = `
        <div style="padding:4px">
            <div style="background:var(--ds2); border:1px solid var(--db1); border-radius:12px; padding:16px; margin-bottom:20px; display:flex; align-items:center; gap:16px">
                <div style="width:50px; height:50px; border-radius:50%; background:var(--dg1); display:flex; align-items:center; justify-content:center; font-size:24px"></div>
                <div>
                    <div style="font-weight:800; color:var(--dt1); font-size:var(--text-lg)">Approve Application</div>
                    <div style="font-size:var(--text-xs); color:var(--dt3)">${a.nm}  ${a.id}</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px">
                <!-- Left: Asset Selection -->
                <div style="background:var(--ds1); border:1px solid var(--db1); border-radius:12px; padding:16px">
                    <h4 style="margin-top:0; margin-bottom:12px; font-size:var(--text-xs); color:var(--dac); text-transform:uppercase; letter-spacing:1px">1. Assignment Asset</h4>
                    ${hasAsset ? `
                        <div style="background:var(--dg1); border:1px solid var(--dg); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center">
                            <div>
                                <div style="font-weight:800; color:var(--dg)">${order.plate}</div>
                                <div style="font-size:var(--text-2xs); color:var(--dt3)">${order.vehicleId}  ${order.model}</div>
                            </div>
                            <button class="btn" style="padding:4px 8px; font-size:10px" onclick="window.rto.openAssetAssignment('${appId}')">Ubah Asset</button>
                        </div>
                    ` : `
                        ${available.length === 0 ? `
                            <div style="color:var(--dd); font-size:var(--text-sm); font-weight:700; text-align:center; padding:20px; border:1px dashed var(--dd); border-radius:8px">
                                 No assets available for ${a.prog}!
                            </div>
                        ` : `
                            <div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto; padding-right:8px">
                                ${available.slice(0, 5).map(v => `
                                    <div style="background:var(--ds2); border:1px solid var(--db1); border-radius:8px; padding:10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;" 
                                         onmouseover="this.style.borderColor='var(--dac)'" onmouseout="this.style.borderColor='var(--db1)'"
                                         onclick="window.rto.assignAsset('${appId}', '${v.id}', '${v.plate}', true); window.rto.openApprovalConfirmation('${appId}')">
                                        <div>
                                            <div style="font-weight:700; color:var(--dt1); font-size:var(--text-sm)">${v.plate}</div>
                                            <div style="font-size:var(--text-3xs); color:var(--dt3)">${v.model}</div>
                                        </div>
                                        <div style="color:var(--dac); font-size:10px; font-weight:800">Assign </div>
                                    </div>
                                `).join('')}
                                ${available.length > 5 ? `<div style="text-align:center; font-size:10px; color:var(--dt3)">And ${available.length - 5} more available...</div>` : ''}
                            </div>
                        `}
                    `}
                </div>

                <!-- Right: WA Preview -->
                <div style="background:var(--ds1); border:1px solid var(--db1); border-radius:12px; padding:16px">
                    <h4 style="margin-top:0; margin-bottom:12px; font-size:var(--text-xs); color:var(--dp); text-transform:uppercase; letter-spacing:1px">2. WhatsApp Notification</h4>
                    <div style="background:var(--ds3); border-radius:8px; padding:12px; height:180px; overflow-y:auto; margin-bottom:10px; position:relative">
                        <div id="wa-approval-preview" style="font-size:var(--text-xs); color:var(--dt2); line-height:1.4; white-space:pre-line">
                            ${buildWAMsg(a, 'approved')}
                        </div>
                        <div style="position:absolute; bottom:8px; right:8px; opacity:0.3; font-size:24px"></div>
                    </div>
                </div>
            </div>

            <div class="modal-actions" style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px">
                <button class="btn" style="padding:10px 20px" onclick="window.closeModals()">Batal</button>
                <button class="btn" style="padding:10px 24px; background:var(--dg1); color:var(--dg); border:1px solid var(--dg); font-weight:800; ${!hasAsset ? 'opacity:0.5; pointer-events:none' : ''}" 
                        onclick="window.rto.sendApprovedWA('${appId}')">Confirm & Send WA</button>
                <button class="btn" style="padding:10px 24px; background:var(--dac); color:#000; border:none; font-weight:800; ${!hasAsset ? 'opacity:0.5; pointer-events:none' : ''}" 
                        onclick="window.rto.assignAsset('${appId}', '${order ? order.vehicleId : ''}', '${order ? order.plate : ''}'); window.closeModals()">Confirm Only</button>
            </div>
        </div>
    `;

    const titleEl = document.getElementById('gpsModalTitle');
    const contentEl = document.getElementById('gpsModalContent');
    const overlay = document.getElementById('gpsModalOverlay');

    if (titleEl && contentEl && overlay) {
        titleEl.innerHTML = `<div style="display:flex; align-items:center; gap:12px; color:var(--dg)"><span></span> Konfirmasi Persetujuan</div>`;
        contentEl.innerHTML = html;
        overlay.classList.add('active');
    }
}

function sendApprovedWA(appId) {
    finalizeDecision(appId, 'approved', true, 'approved');
}


function openAppDecisionModal(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    const html = `
        <div style="padding:4px">
            <div style="background:var(--ds2); border:1px solid var(--db1); border-radius:12px; padding:16px; margin-bottom:24px; display:flex; align-items:center; gap:16px">
                <div style="width:40px; height:40px; border-radius:50%; background:var(--dac1); display:flex; align-items:center; justify-content:center; font-size:20px"></div>
                <div>
                    <div style="font-weight:800; color:var(--dt1); font-size:var(--text-lg)">Application Decision</div>
                    <div style="font-size:var(--text-xs); color:var(--dt3)">${a.nm}  ${a.id}</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:24px">
                <!-- Accept -->
                <div class="sc-cfg-card" style="padding:16px; cursor:pointer; text-align:center; border:2px solid transparent; transition:all 0.2s" 
                     onmouseover="this.style.borderColor='var(--dg)'" onmouseout="this.style.borderColor='transparent'"
                     onclick="window.rto.openApprovalConfirmation('${appId}')">
                    <div style="font-size:24px; margin-bottom:8px"></div>
                    <div style="font-weight:800; color:var(--dg)">ACCEPT</div>
                    <div style="font-size:var(--text-2xs); color:var(--dt3)">Assign asset & send WA</div>
                </div>

                <!-- Reject -->
                <div class="sc-cfg-card" style="padding:16px; cursor:pointer; text-align:center; border:2px solid transparent; transition:all 0.2s"
                     onmouseover="this.style.borderColor='var(--dd)'" onmouseout="this.style.borderColor='transparent'"
                     onclick="window.rto.confirmReject('${appId}')">
                    <div style="font-size:24px; margin-bottom:8px"></div>
                    <div style="font-weight:800; color:var(--dd)">REJECT</div>
                    <div style="font-size:var(--text-2xs); color:var(--dt3)">Select reasons for decline</div>
                </div>

                <!-- Required Docs -->
                <div class="sc-cfg-card" style="padding:16px; cursor:pointer; text-align:center; border:2px solid transparent; transition:all 0.2s"
                     onmouseover="this.style.borderColor='var(--dw)'" onmouseout="this.style.borderColor='transparent'"
                     onclick="window.rto.confirmDocs('${appId}')">
                    <div style="font-size:24px; margin-bottom:8px"></div>
                    <div style="font-weight:800; color:var(--dw)">DOCS REQ.</div>
                    <div style="font-size:var(--text-2xs); color:var(--dt3)">Mark missing documents</div>
                </div>

                <!-- Extend Review -->
                <div class="sc-cfg-card" style="padding:16px; cursor:pointer; text-align:center; border:2px solid transparent; transition:all 0.2s"
                     onmouseover="this.style.borderColor='var(--dp)'" onmouseout="this.style.borderColor='transparent'"
                     onclick="window.rto.confirmReview('${appId}')">
                    <div style="font-size:24px; margin-bottom:8px"></div>
                    <div style="font-weight:800; color:var(--dp)">REVIEW</div>
                    <div style="font-size:var(--text-2xs); color:var(--dt3)">Extend manual review time</div>
                </div>
            </div>

            <div style="text-align:right">
                <button class="btn" style="padding:8px 24px" onclick="window.closeModals()">Tutup</button>
            </div>
        </div>
    `;

    const titleEl = document.getElementById('gpsModalTitle');
    const contentEl = document.getElementById('gpsModalContent');
    const overlay = document.getElementById('gpsModalOverlay');

    if (titleEl && contentEl && overlay) {
        titleEl.textContent = 'Decide Application';
        contentEl.innerHTML = html;
        overlay.classList.add('active');
    }
}

function confirmReject(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    const reasons = ['Skor Terlalu Rendah (< 60)', 'Area di Luar Jangkauan', 'Dokumen tidak valid/palsu', 'Riwayat kredit buruk (ID Check)', 'Data tidak sinkron', 'Lainnya'];

    const html = `
        <div style="padding:4px">
            <h4 style="margin-top:0; color:var(--dd)">Select Rejection Reasons</h4>
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px; max-height:250px; overflow-y:auto">
                ${reasons.map(r => `<label style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--ds2); border-radius:8px; cursor:pointer">
                    <input type="checkbox" name="reject_reason" value="${r}">
                    <span style="font-size:var(--text-sm); color:var(--dt1)">${r}</span>
                </label>`).join('')}
            </div>
            <textarea id="reject-note" class="ov-in" style="width:100%; height:80px; margin-bottom:20px; padding:10px; font-size:var(--text-xs)" placeholder="Catatan tambahan (opsional)..."></textarea>
            
            <div class="modal-actions">
                <button class="btn" onclick="window.rto.openAppDecisionModal('${appId}')">Kembali</button>
                <button class="btn" style="background:var(--dd); color:#fff; border:none" onclick="window.rto.openStatusWAConfirmation('${appId}', 'declined')">Proceed to WA Confirmation </button>
            </div>
        </div>
    `;
    document.getElementById('gpsModalContent').innerHTML = html;
}

function confirmDocs(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    const allDocs = [...DOCS.id, ...DOCS.work];
    const html = `
        <div style="padding:4px">
            <h4 style="margin-top:0; color:var(--dw)">Select Missing Documents</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:20px">
                ${allDocs.map(d => `<label style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--ds2); border-radius:8px; cursor:pointer">
                    <input type="checkbox" name="missing_doc" value="${d.id}" ${a.miss && a.miss.includes(d.id) ? 'checked' : ''}>
                    <span style="font-size:var(--text-xs)">${d.ic} ${d.n}</span>
                </label>`).join('')}
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="window.rto.openAppDecisionModal('${appId}')">Kembali</button>
                <button class="btn" style="background:var(--dw); color:#fff; border:none" onclick="window.rto.openStatusWAConfirmation('${appId}', 'missing_docs')">Proceed to WA Confirmation </button>
            </div>
        </div>
    `;
    document.getElementById('gpsModalContent').innerHTML = html;
}

function confirmReview(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    const html = `
        <div style="padding:4px">
            <h4 style="margin-top:0; color:var(--dp)">Extend Manual Review</h4>
            <p style="font-size:var(--text-xs); color:var(--dt3); margin-bottom:16px">Move this application to manual review stage. Add notes for the analyst.</p>
            <textarea id="review-note" class="ov-in" style="width:100%; height:120px; margin-bottom:20px; padding:10px; font-size:var(--text-sm)" placeholder="Analyst report / investigation needed..."></textarea>
            
            <div class="modal-actions">
                <button class="btn" onclick="window.rto.openAppDecisionModal('${appId}')">Kembali</button>
                <button class="btn" style="background:var(--dp); color:#fff; border:none" onclick="window.rto.openStatusWAConfirmation('${appId}', 'review')">Proceed to WA Confirmation </button>
            </div>
        </div>
    `;
    document.getElementById('gpsModalContent').innerHTML = html;
}


function openStatusWAConfirmation(appId, scenKey) {
    const a = JSON.parse(JSON.stringify(state.admApps.find(x => x.id === appId))); // Clone for preview
    if (!a) return;

    // Capture temporary data based on scenario
    let summaryHtml = '';
    let status = '';

    if (scenKey === 'declined') {
        const checked = Array.from(document.querySelectorAll('input[name="reject_reason"]:checked')).map(i => i.value);
        const note = document.getElementById('reject-note').value;
        a.note = (checked.join(', ') + '. ' + note).trim();
        status = 'declined';
        summaryHtml = `<div style="color:var(--dd); font-weight:800; font-size:var(--text-sm); margin-bottom:10px"> REJECTION SUMMARY</div>
                       <div style="font-size:var(--text-xs); color:var(--dt2); line-height:1.5">${a.note || 'No reason provided.'}</div>`;
    } else if (scenKey === 'missing_docs') {
        a.miss = Array.from(document.querySelectorAll('input[name="missing_doc"]:checked')).map(i => i.value);
        status = 'pending_docs';
        summaryHtml = `<div style="color:var(--dw); font-weight:800; font-size:var(--text-sm); margin-bottom:10px"> MISSING DOCUMENTS</div>
                       <div style="font-size:var(--text-xs); color:var(--dt2); line-height:1.5">${a.miss.map(m => ' ' + m.toUpperCase()).join('<br>')}</div>`;
    } else if (scenKey === 'review') {
        a.note = document.getElementById('review-note').value;
        status = 'review';
        summaryHtml = `<div style="color:var(--dp); font-weight:800; font-size:var(--text-sm); margin-bottom:10px"> REVIEW NOTES</div>
                       <div style="font-size:var(--text-xs); color:var(--dt2); line-height:1.5">${a.note || 'Proceed with manual analysis.'}</div>`;
    }

    // Store temporary data for the finalizer to avoid massive strings in HTML
    if (!window.rto._tempDec) window.rto._tempDec = {};
    window.rto._tempDec[appId] = { note: a.note, miss: a.miss };

    const html = `
        <div style="padding:4px">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px">
                <!-- Left Side: Decision Summary -->
                <div style="background:var(--ds1); border:1px solid var(--db1); border-radius:12px; padding:16px">
                    <h4 style="margin-top:0; margin-bottom:16px; font-size:var(--text-xs); color:var(--dt3); text-transform:uppercase; letter-spacing:1px">1. Decision Review</h4>
                    <div style="background:var(--ds2); border-radius:8px; padding:12px; border:1px solid var(--db1)">
                        ${summaryHtml}
                    </div>
                </div>

                <!-- Right Side: WA Preview -->
                <div style="background:var(--ds1); border:1px solid var(--db1); border-radius:12px; padding:16px">
                    <h4 style="margin-top:0; margin-bottom:12px; font-size:var(--text-xs); color:var(--dt3); text-transform:uppercase; letter-spacing:1px">2. WhatsApp Notification</h4>
                    <div style="background:var(--ds3); border-radius:8px; padding:12px; height:200px; overflow-y:auto; border:1px solid var(--db1); position:relative">
                        <div style="font-size:var(--text-xs); color:var(--dt2); line-height:1.4; white-space:pre-line">
                            ${buildWAMsg(a, scenKey)}
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-actions" style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px">
                <button class="btn" style="padding:10px 20px" onclick="window.rto.openAppDecisionModal('${appId}')">Ubah Keputusan</button>
                <button class="btn" style="padding:10px 24px; background:var(--ds2); border:1px solid var(--db1); color:var(--dt1); font-weight:800"
                        onclick="window.rto.finalizeDecision('${appId}', '${status}', false)">Confirm Only</button>
                <button class="btn" style="padding:10px 24px; background:var(--dac); color:#000; border:none; font-weight:800"
                        onclick="window.rto.finalizeDecision('${appId}', '${status}', true, '${scenKey}')">Confirm & Send WA</button>
            </div>
        </div>
    `;

    document.getElementById('gpsModalTitle').textContent = 'Confirm & Notify';
    document.getElementById('gpsModalContent').innerHTML = html;
}

function finalizeDecision(appId, status, sendWA, scenKey) {
    const a = state.admApps.find(x => x.id === appId);
    const temp = window.rto._tempDec ? window.rto._tempDec[appId] : null;
    if (!a) return;

    a.dec = status;
    if (temp) {
        a.note = temp.note || '';
        a.miss = temp.miss || [];
        delete window.rto._tempDec[appId];
    }

    if (sendWA && scenKey) {
        const msg = buildWAMsg(a, scenKey);
        const cleanPh = a.ph.replace(/[^0-9]/g, '').replace(/^0/, '62');
        window.open(`https://wa.me/${cleanPh}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    window.closeModals();
    admRTbl();
    admT(' Decision applied to ' + appId);
}


function openHandoverConfirmation(puId) {
    const o = state.puOrders.find(x => x.id === puId);
    if (!o) return;

    const html = `
        <div style="padding:4px">
            <div style="background:var(--ds2); border:1px solid var(--db1); border-radius:12px; padding:16px; margin-bottom:20px; display:flex; align-items:center; gap:16px">
                <div style="width:50px; height:50px; border-radius:50%; background:var(--dg1); display:flex; align-items:center; justify-content:center; font-size:24px"></div>
                <div>
                    <div style="font-weight:800; color:var(--dt1); font-size:var(--text-lg)">Final Handover Check</div>
                    <div style="font-size:var(--text-xs); color:var(--dt3)">${o.nm}  ${o.id}</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px">
                <div style="background:var(--ds1); border:1px solid var(--db1); border-radius:12px; padding:16px">
                    <h4 style="margin-top:0; margin-bottom:12px; font-size:var(--text-xs); color:var(--dac); text-transform:uppercase; letter-spacing:1px">1. Physical Inspection</h4>
                    <div style="display:flex; flex-direction:column; gap:8px">
                        ${['Kondisi Body & Cat', 'Fungsi Lampu & Klakson', 'Tekanan Ban', 'Kapasitas Baterai 100%', 'Charger & STNK Tool'].map((item, idx) => `
                            <label style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--ds2); border-radius:8px; cursor:pointer">
                                <input type="checkbox" id="ho-check-${idx}" onchange="window.rto.evalHOFinalChecklist('${puId}')">
                                <span style="font-size:var(--text-xs); color:var(--dt2)">${item}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div style="background:var(--ds1); border:1px solid var(--db1); border-radius:12px; padding:16px">
                    <h4 style="margin-top:0; margin-bottom:12px; font-size:var(--text-xs); color:var(--dp); text-transform:uppercase; letter-spacing:1px">2. Documentation</h4>
                    <div style="display:flex; flex-direction:column; gap:12px">
                        <div style="border:1px dashed var(--db2); border-radius:8px; padding:20px; text-align:center; cursor:pointer" onclick="window.rto.mockHOFinalUpload('${puId}', 'unit')">
                            <div style="font-size:24px; margin-bottom:4px"></div>
                            <div style="font-size:var(--text-3xs); color:var(--dt3)">Foto Unit & Pelat</div>
                            <div id="ho-up-unit" style="margin-top:4px; font-size:9px; color:var(--dg); font-weight:800; display:none"> Terunggah</div>
                        </div>
                        <div style="border:1px dashed var(--db2); border-radius:8px; padding:20px; text-align:center; cursor:pointer" onclick="window.rto.mockHOFinalUpload('${puId}', 'sign')">
                            <div style="font-size:24px; margin-bottom:4px"></div>
                            <div style="font-size:var(--text-3xs); color:var(--dt3)">Tanda Tangan Digital</div>
                            <div id="ho-up-sign" style="margin-top:4px; font-size:9px; color:var(--dg); font-weight:800; display:none"> Terarsip</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-actions" style="display:flex; justify-content:flex-end; gap:12px">
                <button class="btn" style="padding:10px 20px" onclick="window.closeModals()">Batal</button>
                <button id="ho-complete-btn" class="btn" style="padding:10px 24px; background:var(--dg); color:#000; border:none; font-weight:800; opacity:0.5; pointer-events:none" 
                        onclick="window.rto.completeHandover('${puId}')">LENGKAPI SERAH TERIMA</button>
            </div>
        </div>
    `;

    const titleEl = document.getElementById('gpsModalTitle');
    const contentEl = document.getElementById('gpsModalContent');
    const overlay = document.getElementById('gpsModalOverlay');

    if (titleEl && contentEl && overlay) {
        titleEl.textContent = 'Serah Terima Unit';
        contentEl.innerHTML = html;
        overlay.classList.add('active');
    }
}

function evalHOFinalChecklist(puId) {
    const checks = document.querySelectorAll('input[id^="ho-check-"]:checked').length;
    const btn = document.getElementById('ho-complete-btn');
    if (!btn) return;

    if (checks === 5) {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    } else {
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
    }
}

function mockHOFinalUpload(puId, type) {
    const el = document.getElementById('ho-up-' + type);
    if (el) el.style.display = 'block';
    admT(' Photo stored successfully');
}

function markHandoverDone(puId) {
    const o = state.puOrders.find(x => x.id === puId);
    if (!o) return;

    // Trigger Handover Confirmation Modal in UI
    if (window.rto.openHandoverConfirmation) {
        window.rto.openHandoverConfirmation(puId);
    } else {
        // Fallback for direct completion if UI not ready (unlikely)
        completeHandover(puId);
    }
}

function completeHandover(puId) {
    const o = state.puOrders.find(x => x.id === puId);
    if (!o) return;

    // Update order status
    o.status = 'done';
    o.hoStatus = 'completed';
    o.hoDate = new Date().toISOString();

    // Link vehicle to customer in main state
    if (o.vehicleId) {
        const vehicle = window.state.vehicles.find(v => v.id === o.vehicleId);
        if (vehicle) {
            vehicle.status = 'active';
            vehicle.customer = o.nm;
            vehicle.customerPhone = o.ph;
            vehicle.owner = o.ptn;
            vehicle.programId = o.prog;
            vehicle.programType = MAIN_PROGS.find(p => p.id === o.prog)?.ty || 'RTO';
            // Set initial credits (e.g. 7 days from grace)
            vehicle.credits = 7;
        }
    }

    renderPUList();
    admT(` Handover completed for ${o.nm} (${o.id})`);

    // Refresh fleet UI if visible
    if (window.renderVehicleListView) window.renderVehicleListView();
}

// ── DECISION MODAL HELPERS ────────────────────────────────────────────────────
function _openModal(title, bodyHtml, footerHtml = '') {
    const titleEl = document.getElementById('gpsModalTitle');
    const contentEl = document.getElementById('gpsModalContent');
    const overlay = document.getElementById('gpsModalOverlay');
    if (!titleEl || !contentEl || !overlay) return;
    titleEl.textContent = title;
    contentEl.innerHTML = `<div style="padding:4px">${bodyHtml}</div>${footerHtml ? `<div class="modal-actions" style="margin-top:20px;display:flex;justify-content:flex-end;gap:10px">${footerHtml}</div>` : ''}`;
    overlay.classList.add('active');
}

function confirmReject(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    const reasons = [
        'Skor terlalu rendah (di bawah ambang batas)',
        'Dokumen wajib tidak lengkap',
        'DSR melebihi batas maksimal',
        'Penghasilan tidak memenuhi syarat minimum',
        'Riwayat kredit buruk / gagal bayar',
        'Data tidak konsisten / terindikasi palsu',
        'Area layanan tidak terjangkau',
        'Lainnya (lihat catatan analis)',
    ];

    _openModal('❌ Tolak Aplikasi', `
        <div style="background:var(--dd1);border:1px solid var(--dd);border-radius:10px;padding:14px;margin-bottom:18px;display:flex;gap:14px;align-items:center">
            <div style="font-size:32px">❌</div>
            <div>
                <div style="font-weight:800;color:var(--dd);font-size:var(--text-base)">Tolak Pengajuan</div>
                <div style="font-size:var(--text-xs);color:var(--dt2)">${a.nm} · ${a.id} · Score ${a.score}</div>
            </div>
        </div>
        <div style="font-size:var(--text-xs);font-weight:700;color:var(--dt1);margin-bottom:8px">Alasan Penolakan:</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px" id="rej-reasons">
            ${reasons.map((r, i) => `
                <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;padding:8px 10px;border-radius:6px;border:1px solid var(--db1);background:var(--ds2);transition:all 0.15s"
                       onmouseover="this.style.borderColor='var(--dd)'" onmouseout="this.style.borderColor='var(--db1)'">
                    <input type="radio" name="rejReason" value="${r}" style="margin-top:2px" ${i === 0 ? 'checked' : ''}>
                    <span style="font-size:var(--text-sm);color:var(--dt1)">${r}</span>
                </label>`).join('')}
        </div>
        <div style="font-size:var(--text-xs);font-weight:700;color:var(--dt1);margin-bottom:6px">Catatan Tambahan (opsional):</div>
        <textarea id="rej-note" class="ov-in" style="width:100%;height:70px;resize:none;font-size:var(--text-sm)" placeholder="Tulis catatan tambahan..."></textarea>
        <label style="display:flex;gap:10px;align-items:center;margin-top:12px;cursor:pointer">
            <input type="checkbox" id="rej-notify-wa" checked>
            <span style="font-size:var(--text-sm);color:var(--dt1)">Kirim notifikasi WhatsApp ke driver</span>
        </label>
    `, `
        <button class="btn" onclick="document.getElementById('gpsModalOverlay').classList.remove('active')">Batal</button>
        <button class="btn btn-danger" style="padding:10px 24px" onclick="
            const sel = document.querySelector('input[name=rejReason]:checked');
            const reason = sel ? sel.value : 'Tidak memenuhi syarat';
            const note = document.getElementById('rej-note').value;
            const notify = document.getElementById('rej-notify-wa').checked;
            window.rto._applyDecision('${appId}', 'declined', reason, note, notify);
        ">❌ Tolak Pengajuan</button>
    `);
}

function confirmReview(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    _openModal('⏳ Tunda ke Manual Review', `
        <div style="background:var(--dw1);border:1px solid var(--dw);border-radius:10px;padding:14px;margin-bottom:18px;display:flex;gap:14px;align-items:center">
            <div style="font-size:32px">⏳</div>
            <div>
                <div style="font-weight:800;color:var(--dw);font-size:var(--text-base)">Tandai untuk Review Manual</div>
                <div style="font-size:var(--text-xs);color:var(--dt2)">${a.nm} · ${a.id} · Score ${a.score}</div>
            </div>
        </div>
        <div style="font-size:var(--text-xs);font-weight:700;color:var(--dt1);margin-bottom:6px">Alasan Review (wajib diisi):</div>
        <textarea id="rev-note" class="ov-in" style="width:100%;height:80px;resize:none;font-size:var(--text-sm)" placeholder="Contoh: Perlu verifikasi tambahan dari supervisor..."></textarea>
        <label style="display:flex;gap:10px;align-items:center;margin-top:12px;cursor:pointer">
            <input type="checkbox" id="rev-notify-wa" checked>
            <span style="font-size:var(--text-sm);color:var(--dt1)">Kirim notifikasi WA 'masih dalam review' ke driver</span>
        </label>
    `, `
        <button class="btn" onclick="document.getElementById('gpsModalOverlay').classList.remove('active')">Batal</button>
        <button class="btn btn-secondary" style="padding:10px 24px;background:var(--dw1);border:1px solid var(--dw);color:var(--dw)" onclick="
            const note = document.getElementById('rev-note').value || 'Membutuhkan review manual';
            const notify = document.getElementById('rev-notify-wa').checked;
            window.rto._applyDecision('${appId}', 'review', note, '', notify);
        ">⏳ Tandai Review</button>
    `);
}

function confirmDocs(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;

    const allDocs = [...DOCS.id, ...DOCS.work, ...DOCS.boost];
    const missingDocs = a.miss && a.miss.length
        ? allDocs.filter(d => a.miss.includes(d.id))
        : allDocs.filter(d => d.tag === 'wajib');

    _openModal('📋 Minta Dokumen Tambahan', `
        <div style="background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.25);border-radius:10px;padding:14px;margin-bottom:18px;display:flex;gap:14px;align-items:center">
            <div style="font-size:32px">📋</div>
            <div>
                <div style="font-weight:800;color:var(--dw);font-size:var(--text-base)">Request Dokumen Tambahan</div>
                <div style="font-size:var(--text-xs);color:var(--dt2)">${a.nm} · ${a.id}</div>
            </div>
        </div>
        <div style="font-size:var(--text-xs);font-weight:700;color:var(--dt1);margin-bottom:10px">Pilih dokumen yang harus dilengkapi:</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;max-height:250px;overflow-y:auto;padding-right:4px">
            ${allDocs.map(d => {
        const isMissing = a.miss && a.miss.includes(d.id);
        return `
                <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;padding:8px 10px;border-radius:6px;border:1px solid ${isMissing ? 'rgba(251,191,36,.3)' : 'var(--db1)'};background:${isMissing ? 'var(--dw1)' : 'var(--ds2)'};transition:all 0.15s">
                    <input type="checkbox" name="reqDoc" value="${d.id}" ${isMissing ? 'checked' : ''} style="margin-top:2px">
                    <div>
                        <div style="font-size:var(--text-sm);color:var(--dt1);font-weight:${isMissing ? '700' : '400'}">${d.n} ${isMissing ? '<span style="color:var(--dw);font-size:10px">MISSING</span>' : ''}</div>
                        <div style="font-size:var(--text-3xs);color:var(--dt3)">${d.d} · ${d.tag}</div>
                    </div>
                </label>`;
    }).join('')}
        </div>
        <div style="font-size:var(--text-xs);font-weight:700;color:var(--dt1);margin-bottom:6px">Pesan ke Driver:</div>
        <textarea id="docs-note" class="ov-in" style="width:100%;height:60px;resize:none;font-size:var(--text-sm)" placeholder="Contoh: Harap upload dokumen dalam 3 hari kerja..."></textarea>
        <label style="display:flex;gap:10px;align-items:center;margin-top:12px;cursor:pointer">
            <input type="checkbox" id="docs-notify-wa" checked>
            <span style="font-size:var(--text-sm);color:var(--dt1)">Kirim reminder WhatsApp ke driver</span>
        </label>
    `, `
        <button class="btn" onclick="document.getElementById('gpsModalOverlay').classList.remove('active')">Batal</button>
        <button class="btn btn-secondary" style="padding:10px 24px;background:var(--dw1);border:1px solid rgba(251,191,36,.5);color:var(--dw)" onclick="
            const checked = [...document.querySelectorAll('input[name=reqDoc]:checked')].map(i => i.value);
            const note = document.getElementById('docs-note').value;
            const notify = document.getElementById('docs-notify-wa').checked;
            window.rto._applyDocRequest('${appId}', checked, note, notify);
        ">📋 Kirim Request Dokumen</button>
    `);
}

function openAppDecisionModal(appId) {
    // alias for backward compat
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;
    if (a.dec === 'declined') confirmReview(appId);
    else openApprovalConfirmation(appId);
}

function openStatusWAConfirmation(appId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;
    const waScenKey = a.dec === 'approved' ? 'approved' : a.dec === 'declined' ? 'declined' : a.miss && a.miss.length ? 'missing_docs' : 'review';
    const msg = buildWAMsg(a, waScenKey);
    const cleanPhone = a.ph.replace(/\D/g, '');
    let ph = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    showWAPreviewModal(ph, msg, a.nm);
}

// Apply a decision to an application
function _applyDecision(appId, dec, reason, note, notifyWA) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;
    a.dec = dec;
    if (note) a.note = note;
    if (reason) a.ovlog = `[${new Date().toLocaleTimeString('id-ID')}] ${reason}${note ? ' | ' + note : ''}`;
    document.getElementById('gpsModalOverlay').classList.remove('active');
    admRTbl();
    admSel(appId);
    admT(`✅ Decision: ${dec.toUpperCase()} applied for ${a.nm}`);
    if (notifyWA) {
        setTimeout(() => {
            const waScenKey = dec === 'approved' ? 'approved' : dec === 'declined' ? 'declined' : dec === 'review' ? 'review' : 'missing_docs';
            const msg = buildWAMsg(a, waScenKey);
            const ph = a.ph.replace(/\D/g, '').replace(/^0/, '62');
            window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`, '_blank');
        }, 500);
    }
}

// Apply required document request
function _applyDocRequest(appId, docIds, note, notifyWA) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;
    a.miss = docIds;
    a.dec = 'pending_docs';
    if (note) a.note = note;
    a.ovlog = `[${new Date().toLocaleTimeString('id-ID')}] Dokumen diminta: ${docIds.join(', ')}`;
    document.getElementById('gpsModalOverlay').classList.remove('active');
    admRTbl();
    admSel(appId);
    admT(`📋 ${docIds.length} dokumen diminta dari ${a.nm}`);
    if (notifyWA) {
        setTimeout(() => {
            const msg = buildWAMsg(a, 'missing_docs');
            const ph = a.ph.replace(/\D/g, '').replace(/^0/, '62');
            window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`, '_blank');
        }, 500);
    }
}

// Setup globally exposed functions for onclick handlers
// Bind everything to window for global access
window.rto = window.rto || {};
Object.assign(window.rto, {

    state, // Expose for debugging and cross-module access
    admSel,
    saveOv,
    openAssetAssignment,
    assignAsset,
    stageAssetSelection,
    switchDpTab,
    markHandoverDone,
    addToPickupQueue,
    renderAnalytics,
    switchRtoTab,
    admWA,
    sendWAModal,
    updDimCfg,
    updThreshCfg,
    updDSR,
    saveCfg,
    resetCfg,
    admRTbl,
    goToAdmPage,
    renderPUList,
    renderScoreCfg,
    renderWAScens,
    selWAScen,
    selPUOrder,
    setPUF,
    setPUProgFlt,
    waContext,
    previewImg,
    closePreview,
    uploadDoc,
    openHandoverConfirmation,
    completeHandover,
    evalHOPrepChecklist,
    evalHOFinalChecklist,
    mockHOPrepUpload,
    mockHOFinalUpload,
    openApprovalConfirmation,
    sendApprovedWA,
    buildWAMsg,
    openAppDecisionModal,
    confirmReject,
    confirmDocs,
    confirmReview,
    openStatusWAConfirmation,
    admSrch,
    setAdmFlt,
    setAdmProgFlt,
    sendPickupWA,
    admT,
    pickCalDay,
    pickSlot,
    calNav,
    confirmPickup,
    _applyDecision,
    _applyDocRequest,
    init: () => {
        console.log('RTO System Initializing...');
        admRTbl();
        renderPUList();
        renderScoreCfg();
        renderWAScens();
        renderAnalytics();
    },
    APPLICATIONS: ADMIN_APPS
});

// Also bind critical functions directly to window for legacy app.js support
window.admRTbl = admRTbl;
window.renderPUList = renderPUList;
window.renderScoreCfg = renderScoreCfg;
window.renderWAScens = renderWAScens;
window.selWAScen = selWAScen;
window.switchRtoTab = window.switchRtoTab || switchRtoTab;

// ──────────────────────────────────────────
// CREATE APPLICANT MODAL
// ──────────────────────────────────────────
window.openAddApplicantModal = () => {
    const programs = MAIN_PROGS.map(p => `<option value="${p.id}">${p.nm}</option>`).join('');
    const partners = Object.entries(PARTNERS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');

    const html = `
        <div class="modal-form modern-form" style="max-width:600px; margin:0 auto">
            <div style="background:var(--s2); border:1px solid var(--b1); border-radius:12px; padding:24px; margin-bottom:16px">
                <h4 style="margin:0 0 16px; color:var(--ac); font-size:var(--text-md); letter-spacing:1px; text-transform:uppercase">Personal Information</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" id="na-name" class="form-control" placeholder="e.g. Budi Santoso">
                    </div>
                    <div class="form-group">
                        <label>Phone *</label>
                        <input type="text" id="na-phone" class="form-control" placeholder="+62 812-xxxx-xxxx">
                    </div>
                    <div class="form-group">
                        <label>Profession</label>
                        <input type="text" id="na-prof" class="form-control" placeholder="e.g. OJOL, Karyawan">
                    </div>
                    <div class="form-group">
                        <label>Monthly Income (IDR)</label>
                        <input type="number" id="na-income" class="form-control" placeholder="e.g. 4500000">
                    </div>
                    <div class="form-group" style="grid-column: 1/-1">
                        <label>Area / City</label>
                        <input type="text" id="na-area" class="form-control" placeholder="e.g. Jakarta Selatan">
                    </div>
                </div>
            </div>

            <div style="background:var(--s2); border:1px solid var(--b1); border-radius:12px; padding:24px; margin-bottom:16px">
                <h4 style="margin:0 0 16px; color:var(--ac); font-size:var(--text-md); letter-spacing:1px; text-transform:uppercase">Program Selection</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
                    <div class="form-group">
                        <label>Partner *</label>
                        <select id="na-partner" class="form-control">${partners}</select>
                    </div>
                    <div class="form-group">
                        <label>Program *</label>
                        <select id="na-prog" class="form-control">${programs}</select>
                    </div>
                    <div class="form-group" style="grid-column: 1/-1">
                        <label>Initial Decision</label>
                        <select id="na-dec" class="form-control">
                            <option value="pending">Pending</option>
                            <option value="review">Review</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style="background:var(--s2); border:1px solid var(--b1); border-radius:12px; padding:24px">
                <h4 style="margin:0 0 16px; color:var(--dw); font-size:var(--text-md); letter-spacing:1px; text-transform:uppercase">Document Uploads</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="form-group">
                        <label style="font-size:var(--text-2xs)">KTP Asli</label>
                        <input type="file" id="na-doc-ktp" accept="image/*" class="form-control" style="padding:8px; font-size:11px">
                    </div>
                    <div class="form-group">
                        <label style="font-size:var(--text-2xs)">SIM C</label>
                        <input type="file" id="na-doc-sim" accept="image/*" class="form-control" style="padding:8px; font-size:11px">
                    </div>
                    <div class="form-group">
                        <label style="font-size:var(--text-2xs)">Kartu Keluarga</label>
                        <input type="file" id="na-doc-kk" accept="image/*" class="form-control" style="padding:8px; font-size:11px">
                    </div>
                    <div class="form-group">
                        <label style="font-size:var(--text-2xs)">Selfie + KTP</label>
                        <input type="file" id="na-doc-selfie" accept="image/*" class="form-control" style="padding:8px; font-size:11px">
                    </div>
                    <div class="form-group" style="grid-column: span 2;">
                        <label style="font-size:var(--text-2xs)">Slip Gaji / Screenshot Income</label>
                        <input type="file" id="na-doc-slip" accept="image/*" class="form-control" style="padding:8px; font-size:11px">
                    </div>
                </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px">
                <button class="vl-pill" onclick="window.closeGPSModal()">Cancel</button>
                <button onclick="window.saveNewApplicant()" style="background:var(--ac); color:#000; border:none; font-weight:800; padding:12px 32px; border-radius:10px; cursor:pointer; font-size:var(--text-base); transition: all 0.2s ease" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                    🚀 Create Application
                </button>
            </div>
        </div>
    `;

    document.getElementById('gpsModalTitle').innerHTML = `<div style="display:flex; align-items:center; gap:10px; color:var(--ac)"><span style="font-size:24px">📋</span> New Manual Application</div>`;
    document.getElementById('gpsModalContent').innerHTML = html;
    document.getElementById('gpsModalOverlay').classList.add('active');
};

window.saveNewApplicant = () => {
    const name = document.getElementById('na-name')?.value?.trim();
    const phone = document.getElementById('na-phone')?.value?.trim();
    const ptn = document.getElementById('na-partner')?.value;
    const prog = document.getElementById('na-prog')?.value;
    const prof = document.getElementById('na-prof')?.value?.trim() || '—';
    const inc = parseInt(document.getElementById('na-income')?.value || 0);
    const area = document.getElementById('na-area')?.value?.trim() || '—';
    const dec = document.getElementById('na-dec')?.value || 'pending';

    if (!name || !phone) {
        alert('Name and Phone are required.');
        return;
    }

    const newId = 'CASAN-M' + String(Date.now()).slice(-5);
    const now = new Date();
    const submitted = 'Baru saja';

    let miss = ['ktp', 'sim', 'kk', 'selfie', 'slip', 'rekening'];
    if (document.getElementById('na-doc-ktp')?.files.length > 0) miss = miss.filter(m => m !== 'ktp');
    if (document.getElementById('na-doc-sim')?.files.length > 0) miss = miss.filter(m => m !== 'sim');
    if (document.getElementById('na-doc-kk')?.files.length > 0) miss = miss.filter(m => m !== 'kk');
    if (document.getElementById('na-doc-selfie')?.files.length > 0) miss = miss.filter(m => m !== 'selfie');
    if (document.getElementById('na-doc-slip')?.files.length > 0) miss = miss.filter(m => m !== 'slip');

    const newApp = {
        id: newId, nm: name, ph: phone, ptn, prog, area, prof,
        inc, score: 0, dec, miss,
        submitted, adj: 0, note: '', ovlog: ''
    };

    state.admApps.push(newApp);
    window.closeGPSModal();
    admRTbl();

    const toast = document.getElementById('adm-toast');
    if (toast) { toast.textContent = `✅ Application ${newId} created for ${name}`; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
};

