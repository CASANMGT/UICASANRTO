/**
 * RTO Logic extracted from casan-driver-app-v11.html
 */

// ═══ CONSTANTS & DATA ═══
export const MAIN_PROGS = [
    { id: 'P-TK-RTO', p: 'tangkas', nm: 'Zeeho RTO', ty: 'RTO', dr: 38000, mi: 3500000, gd: 7, ic: '⚡', bg: '#f5f3ff', bc: '#7C3AED' },
    { id: 'P-TK-RENT', p: 'tangkas', nm: 'Tangkas Rental', ty: 'Rent', dr: 28000, mi: 2000000, gd: 5, ic: '🔵', bg: '#eff6ff', bc: '#2563EB' },
    { id: 'P-MK-RTO', p: 'maka', nm: 'Maka Cavalry RTO', ty: 'RTO', dr: 35000, mi: 3500000, gd: 7, ic: '🟢', bg: '#f0fdf4', bc: '#16A34A' },
    { id: 'P-MK-RENT', p: 'maka', nm: 'Maka Cavalry Rent', ty: 'Rent', dr: 25000, mi: 2000000, gd: 7, ic: '💚', bg: '#f0fdf4', bc: '#16A34A' },
    { id: 'P-UT-RTO', p: 'united', nm: 'United RTO', ty: 'RTO', dr: 32000, mi: 3500000, gd: 10, ic: '🟠', bg: '#fff7ed', bc: '#EA580C' },
    { id: 'P-UT-RENT', p: 'united', nm: 'United Share', ty: 'Rent', dr: 22000, mi: 2000000, gd: 5, ic: '🌊', bg: '#f0f9ff', bc: '#0284C7' },
];

export const PARTNERS = {
    tangkas: { name: 'Tangkas Motors', ic: '⚡', area: 'Jakarta Pusat', c: '#7C3AED' },
    maka: { name: 'Maka Motors', ic: '🟢', area: 'Jakarta Selatan', c: '#16A34A' },
    united: { name: 'United Motors', ic: '🟠', area: 'Jakarta Timur', c: '#EA580C' }
};

export const DEALER_LOCATIONS = {
    tangkas: { name: 'Tangkas Motors', addr: 'Jl. Kemayoran Baru No. 22, Jakarta Pusat', lat: -6.159, lng: 106.852, hours: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] },
    maka: { name: 'Maka Motors', addr: 'Jl. Fatmawati Raya No. 88, Jakarta Selatan', lat: -6.286, lng: 106.793, hours: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'] },
    united: { name: 'United Motors', addr: 'Jl. Raya Bekasi KM 18, Jakarta Timur', lat: -6.218, lng: 106.902, hours: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] },
};

export const DOCS = {
    id: [
        { id: 'ktp', n: 'KTP Asli', d: 'KTP aktif', tag: 'wajib', ic: '🪪', img: 'https://placehold.co/600x400/eeeeee/999999?text=KTP' },
        { id: 'kk', n: 'Kartu Keluarga', d: 'KK terbaru', tag: 'wajib', ic: '👨‍👩‍👧', img: 'https://placehold.co/600x800/eeeeee/999999?text=Kartu+Keluarga' },
        { id: 'sim', n: 'SIM C Aktif', d: 'SIM C motor', tag: 'wajib', ic: '🪪', img: 'https://placehold.co/600x400/eeeeee/999999?text=SIM+C' },
        { id: 'selfie', n: 'Selfie + KTP', d: 'Foto memegang KTP', tag: 'wajib', ic: '🤳', img: 'https://placehold.co/400x600/eeeeee/999999?text=Selfie' }
    ],
    work: [
        { id: 'slip', n: 'Slip Gaji / Screenshot Income', d: '3 bulan terakhir', tag: 'wajib', ic: '💰', img: 'https://placehold.co/600x800/eeeeee/999999?text=Slip+Gaji' },
        { id: 'rekening', n: 'Rekening Koran', d: 'Mutasi 3 bulan', tag: 'wajib', ic: '🏦', img: 'https://placehold.co/600x800/eeeeee/999999?text=Rekening+Koran' },
        { id: 'sktm', n: 'Surat Keterangan Kerja', d: 'Dari platform/perusahaan', tag: 'opt', ic: '📄', img: 'https://placehold.co/600x800/eeeeee/999999?text=Surat+Keterangan' },
        { id: 'npwp', n: 'NPWP', d: 'Jika ada', tag: 'opt', ic: '📋', img: 'https://placehold.co/600x400/eeeeee/999999?text=NPWP' }
    ],
    boost: [
        { id: 'tabungan', n: 'Bukti Tabungan >Rp 1 Jt', d: '+4 pts', tag: 'boost', ic: '💳', img: 'https://placehold.co/600x800/eeeeee/999999?text=Tabungan' },
        { id: 'bpjs_tk', n: 'BPJS Ketenagakerjaan', d: '+3 pts', tag: 'boost', ic: '🛡️', img: 'https://placehold.co/600x400/eeeeee/999999?text=BPJS' },
        { id: 'ref_ojol', n: 'Screenshot Rating OJOL ≥4.5', d: '+2 pts', tag: 'boost', ic: '⭐', img: 'https://placehold.co/600x800/eeeeee/999999?text=Rating+Ojol' },
        { id: 'gu_ktp', n: 'KTP Penjamin', d: '+5 pts', tag: 'boost', ic: '👤', img: 'https://placehold.co/600x400/eeeeee/999999?text=KTP+Penjamin' },
        { id: 'sertif', n: 'Sertifikat / BPKB Kendaraan', d: '+3 pts', tag: 'boost', ic: '📜', img: 'https://placehold.co/600x800/eeeeee/999999?text=BPKB' }
    ]
};

export const ADMIN_APPS = [
    { id: 'CASAN-A01', nm: 'Ahmad Rizki', ph: '+62 812-3456-7890', ptn: 'tangkas', prog: 'P-TK-RTO', area: 'Kemayoran', prof: 'OJOL', inc: 4800000, score: 78, dec: 'approved', miss: ['npwp'], submitted: '2 jam lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A02', nm: 'Budi Santoso', ph: '+62 821-9876-5432', ptn: 'maka', prog: 'P-MK-RENT', area: 'Tebet', prof: 'Wiraswasta', inc: 3200000, score: 55, dec: 'review', miss: ['rekening', 'sktm'], submitted: '4 jam lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A03', nm: 'Dewi Lestari', ph: '+62 857-1111-2222', ptn: 'united', prog: 'P-UT-RTO', area: 'Bekasi Barat', prof: 'Karyawan', inc: 6500000, score: 82, dec: 'approved', miss: [], submitted: '6 jam lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A04', nm: 'Eko Prasetyo', ph: '+62 813-3333-4444', ptn: 'tangkas', prog: 'P-TK-RENT', area: 'Ciputat', prof: 'Petani', inc: 1800000, score: 28, dec: 'declined', miss: ['slip', 'rekening', 'sktm'], submitted: '8 jam lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A05', nm: 'Fitri Handayani', ph: '+62 877-5555-6666', ptn: 'maka', prog: 'P-MK-RTO', area: 'Cakung', prof: 'OJOL', inc: 5200000, score: 71, dec: 'approved', miss: ['npwp'], submitted: '1 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A06', nm: 'Gunawan Wibowo', ph: '+62 811-7777-8888', ptn: 'united', prog: 'P-UT-RENT', area: 'Serpong', prof: 'Karyawan Kontrak', inc: 2900000, score: 49, dec: 'pending', miss: ['rekening'], submitted: '1 hari lalu', adj: 0, note: '', ovlog: '' },
    { id: 'CASAN-A07', nm: 'Hendra Kusuma', ph: '+62 896-9999-0000', ptn: 'tangkas', prog: 'P-TK-RTO', area: 'Penjaringan', prof: 'PNS', inc: 7200000, score: 88, dec: 'approved', miss: [], submitted: '2 hari lalu', adj: 0, note: '', ovlog: '' },
];

export const WA_SCENARIOS = [
    {
        k: 'approved', ic: '🎉', nm: 'Approved — Selamat', desc: 'Pengajuan disetujui, info serah terima',
        tmpl: `Halo {nama}! 🎉\n\nKabar baik dari tim CASAN!\n\nPengajuan motor listrik kamu telah *DISETUJUI*.\n\n📋 App ID: *{app_id}*\n🛵 Program: *{program}*\n⭐ Skor: *{score}/100*\n🏪 Dealer: *{dealer}*\n\nLangkah selanjutnya:\n1. Konfirmasi jadwal serah terima\n2. Siapkan dokumen asli (KTP, SIM C, KK)\n3. Tanda tangan kontrak RTO\n\nHubungi kami untuk informasi lebih lanjut. Selamat bergabung! 🛵⚡`
    },
    {
        k: 'declined', ic: '❌', nm: 'Declined — Penolakan', desc: 'Pengajuan ditolak, saran perbaikan',
        tmpl: `Halo {nama},\n\nTerima kasih sudah mendaftar di CASAN.\n\nSayang sekali, pengajuan kamu belum bisa kami setujui saat ini.\n\n📋 App ID: *{app_id}*\n⭐ Skor: *{score}/100*\n\nAlasan utama & saran perbaikan:\n• Lengkapi dokumen wajib (KTP, SIM C, Rekening)\n• Tingkatkan skor dengan menambah penjamin\n• Pastikan DSR di bawah 70%\n\nKamu bisa mendaftar kembali dalam 30 hari setelah melengkapi persyaratan. 💪\n\nTim CASAN siap membantu: {dealer}`
    },
    {
        k: 'review', ic: '🔍', nm: 'Review/Pending — Proses', desc: 'Aplikasi masih dalam review manual',
        tmpl: `Halo {nama}! 👋\n\nPengajuan motor listrik kamu sudah kami terima.\n\n📋 App ID: *{app_id}*\n🛵 Program: *{program}*\n⭐ Skor: *{score}/100*\n\nSaat ini aplikasimu sedang dalam proses *review manual* oleh tim analis kami.\n\n⏰ Estimasi: 1–3 hari kerja\n\nKamu akan kami hubungi kembali setelah proses selesai. Pastikan nomor WhatsApp aktif ya!\n\nTim CASAN — {dealer}`
    },
    {
        k: 'missing_docs', ic: '📋', nm: 'Missing Docs — Reminder', desc: 'Pengingat dokumen yang masih kurang',
        tmpl: `Halo {nama}! 📋\n\nPengajuanmu (App ID: *{app_id}*) hampir lengkap!\n\nMasih ada beberapa dokumen yang perlu dilengkapi:\n\n{missing_docs}\n\nCara kirim:\n1. Foto/scan dokumen yang jelas\n2. Kirim via WhatsApp ke nomor ini\n3. Sebutkan App ID: *{app_id}*\n\nDokumen lengkap = proses lebih cepat! 🚀\n\nTim CASAN — {dealer}`
    },
];

export const DIM_DEFAULTS = [
    { k: 'id', l: 'Identitas', max: 18, c: '#14B8A6' }, { k: 'inc', l: 'Penghasilan', max: 22, c: '#16A34A' },
    { k: 'job', l: 'Pekerjaan', max: 15, c: '#2563EB' }, { k: 'fam', l: 'Keluarga', max: 12, c: '#7C3AED' },
    { k: 'crd', l: 'Kredit', max: 18, c: '#D97706' }, { k: 'doc', l: 'Dokumen', max: 15, c: '#0F766E' },
];

export const THRESH_DEFAULTS = [
    { k: 'auto', l: 'Auto-Approve', min: 80, bg: 'var(--dg1)', c: 'var(--dg)' },
    { k: 'approve', l: 'Approved', min: 60, bg: 'var(--dac1)', c: 'var(--dac)' },
    { k: 'review', l: 'Manual Review', min: 41, bg: 'var(--dw1)', c: 'var(--dw)' },
    { k: 'conditional', l: 'Conditional', min: 21, bg: 'rgba(251,146,60,.07)', c: '#FB923C' },
    { k: 'decline', l: 'Declined', min: 0, bg: 'var(--dd1)', c: 'var(--dd)' },
];

export function fmtPickupDate(daysFromNow) {
    const d = new Date(); d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
}

export const PU_ORDERS = [
    { id: 'PU-001', appId: 'CASAN-A01', nm: 'Ahmad Rizki', ph: '+62 812-3456-7890', ptn: 'tangkas', prog: 'P-TK-RTO', model: 'Zeeho Aegis', deadline: fmtPickupDate(7), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending' },
    { id: 'PU-002', appId: 'CASAN-A03', nm: 'Dewi Lestari', ph: '+62 857-1111-2222', ptn: 'united', prog: 'P-UT-RTO', model: 'United T3', deadline: fmtPickupDate(3), status: 'scheduled', schedDate: fmtPickupDate(2), schedTime: '10:00', hoStatus: 'pending' },
    { id: 'PU-003', appId: 'CASAN-A05', nm: 'Fitri Handayani', ph: '+62 877-5555-6666', ptn: 'maka', prog: 'P-MK-RTO', model: 'Maka M1 Pro', deadline: fmtPickupDate(14), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending' },
    { id: 'PU-004', appId: 'CASAN-A07', nm: 'Hendra Kusuma', ph: '+62 896-9999-0000', ptn: 'tangkas', prog: 'P-TK-RTO', model: 'Zeeho AE8', deadline: fmtPickupDate(-1), status: 'overdue', schedDate: null, schedTime: null, hoStatus: 'pending' },
];

// Formatting
export const fRp = n => 'Rp ' + Number(n).toLocaleString('id-ID');

// State
export let state = {
    admApps: [...ADMIN_APPS],
    puOrders: [...PU_ORDERS],
    admFlt: 'all',
    admQ: '',
    selApp: null,
    waTmpls: Object.fromEntries(WA_SCENARIOS.map(s => [s.k, s.tmpl])),
    selScen: null,
    puFlt: 'all',
    selPU: null,
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    selDate: null,
    selTime: null,
    calMonth: new Date().getMonth(),
    selDate: null,
    selTime: null,
    dimCfg: JSON.parse(JSON.stringify(DIM_DEFAULTS)),
    threshCfg: JSON.parse(JSON.stringify(THRESH_DEFAULTS)),
    dsrCfg: [
        { l: 'Batas Sehat', v: 50, c: 'var(--dg)' },
        { l: 'Batas Waspada', v: 70, c: 'var(--dw)' },
        { l: 'Penalty Waspada', v: 85, c: '#FB923C' },
        { l: 'Penalty Berat', v: 100, c: 'var(--dd)' }
    ]
};

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
export function getDecStyle(dec) {
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

export function getScoreColor(s) {
    if (s >= 80) return 'var(--dg)';
    if (s >= 60) return 'var(--dac)';
    if (s >= 41) return 'var(--dw)';
    if (s >= 21) return '#FB923C';
    return 'var(--dd)';
}


export function daysLeft(dateStr) {
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

// Admin Functions
export function admV(view, elId) {
    document.querySelectorAll('.av').forEach(v => v.classList.remove('on'));
    document.getElementById('adm-' + view).classList.add('on');
    document.querySelectorAll('.adm-ni').forEach(n => n.classList.remove('on'));
    if (elId) document.getElementById(elId).classList.add('on');

    document.getElementById('adm-tb-t').textContent = {
        apps: 'Applications', analytics: 'Analytics', fleet: 'Fleet', pickup: 'Pickup Schedule', score: 'Score Config', wa: 'WA Templates'
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

export function setAdmFlt(f, el) {
    state.admFlt = f;
    document.querySelectorAll('.afb').forEach(b => b.classList.remove('on'));
    if (el) el.classList.add('on');
    admRTbl();
}

export function admSrch(q) {
    state.admQ = q.toLowerCase();
    admRTbl();
}

export function admRTbl() {
    let apps = state.admApps.filter(a => {
        if (state.admFlt !== 'all' && a.dec !== state.admFlt) return false;
        if (state.admQ && !a.nm.toLowerCase().includes(state.admQ) && !a.id.toLowerCase().includes(state.admQ) && !a.area.toLowerCase().includes(state.admQ)) return false;
        return true;
    });

    const tot = state.admApps.length;
    const pnd = state.admApps.filter(a => a.dec === 'pending' || a.dec === 'pending_docs').length;
    const apr = state.admApps.filter(a => a.dec === 'approved').length;
    const dec = state.admApps.filter(a => a.dec === 'declined').length;
    const rev = state.admApps.filter(a => a.dec === 'review').length;
    const avg = Math.round(state.admApps.reduce((s, a) => s + a.score, 0) / state.admApps.length) || 0;

    const elTot = document.getElementById('kpi-tot');
    if (elTot) elTot.textContent = tot;
    const elPnd = document.getElementById('kpi-pnd');
    if (elPnd) elPnd.textContent = pnd;
    const elApr = document.getElementById('kpi-apr');
    if (elApr) elApr.textContent = apr;
    const elDec = document.getElementById('kpi-dec');
    if (elDec) elDec.textContent = dec;
    const elAvg = document.getElementById('kpi-avg');
    if (elAvg) elAvg.textContent = avg;

    // Filter badges
    const bAll = document.getElementById('cnt-all'); if (bAll) bAll.textContent = tot;
    const bPnd = document.getElementById('cnt-pnd'); if (bPnd) bPnd.textContent = pnd;
    const bRev = document.getElementById('cnt-rev'); if (bRev) bRev.textContent = rev;
    const bApr = document.getElementById('cnt-apr'); if (bApr) bApr.textContent = apr;
    const bDec = document.getElementById('cnt-dec'); if (bDec) bDec.textContent = dec;

    const pendBadge = document.getElementById('pend-badge');
    if (pendBadge) pendBadge.textContent = pnd;

    // Sidebar Notification Dots
    const sideApps = document.getElementById('side-cnt-apps');
    if (sideApps) {
        sideApps.textContent = pnd;
        sideApps.style.display = pnd > 0 ? 'flex' : 'none';
    }

    const puCount = state.puApps ? state.puApps.filter(a => a.s === 'waiting').length : 0;
    const sidePU = document.getElementById('side-cnt-pickup');
    if (sidePU) {
        sidePU.textContent = puCount;
        sidePU.style.display = puCount > 0 ? 'flex' : 'none';
    }

    const tbody = document.getElementById('adm-tbody');
    if (!tbody) return;

    tbody.innerHTML = apps.map((a) => {
        const ptn = PARTNERS[a.ptn] || { name: a.ptn, ic: '🏢', c: '#999' };
        const pr = MAIN_PROGS.find(p => p.id === a.prog) || { nm: a.prog, ty: '—' };
        const ds = getDecStyle(a.dec);
        const sc = getScoreColor(a.score + (a.adj || 0));
        return `<tr class="${state.selApp === a.id ? 'sel-r' : ''}" onclick="window.rto.admSel('${a.id}')">
          <td><span style="font-size: var(--text-base);font-weight:800;color:var(--dt1);font-family:'IBM Plex Mono',monospace">${a.id}</span></td>
          <td><div style="font-size: var(--text-lg);font-weight:700;color:var(--dt1)">${a.nm}</div><div style="font-size: var(--text-sm);color:var(--dt3)">${a.ph}</div></td>
          <td><span style="color:${ptn.c};font-weight:600;font-size: var(--text-base)">${ptn.name}</span></td>
          <td><span style="font-size: var(--text-sm)">${pr.nm}</span></td>
          <td style="font-size: var(--text-base)">${a.prof}</td>
          <td class="mono" style="font-size: var(--text-base)">${fRp(a.inc)}</td>
          <td><span class="sc-chip" style="background:${sc}20;color:${sc};font-size: var(--text-lg);font-weight:700">${a.score + (a.adj || 0)}</span></td>
          <td><span class="dec-chip" style="background:${ds.bg};color:${ds.c};font-size: var(--text-sm);font-weight:800">${ds.l}</span></td>
          <td style="font-size: var(--text-base);color:${a.miss && a.miss.length ? 'var(--dw)' : 'var(--dt3)'}">${a.miss && a.miss.length ? a.miss.length + ' docs' : '—'}</td>
          <td style="font-size: var(--text-sm);color:var(--dt3)">${a.submitted}</td>
          <td>
            <button class="act-btn" style="border-color:var(--db1);color:var(--dt2)" onclick="event.stopPropagation();window.rto.quickWA('${a.id}')">📱</button>
            <button class="act-btn" style="border-color:rgba(52,211,153,.25);color:var(--dg)" onclick="event.stopPropagation();window.rto.quickDec('${a.id}','approved')">✅</button>
            <button class="act-btn" style="border-color:rgba(248,113,113,.25);color:var(--dd)" onclick="event.stopPropagation();window.rto.quickDec('${a.id}','declined')">❌</button>
          </td>
        </tr>`;
    }).join('') || '<tr><td colspan="11" style="padding:24px;text-align:center;color:var(--dt3);font-size: var(--text-base)">No applications found</td></tr>';
}

export function admSel(id) {
    state.selApp = id;
    admRTbl();
    const a = state.admApps.find(x => x.id === id);
    if (!a) return;
    const ptn = PARTNERS[a.ptn] || { name: a.ptn, c: '#999' };
    const pr = MAIN_PROGS.find(p => p.id === a.prog) || { nm: a.prog, ty: '—' };
    const ds = getDecStyle(a.dec);
    const sc = a.score + (a.adj || 0);

    // Ensure document state object exists
    if (!a.docStatus) a.docStatus = {};

    const docsList = [...DOCS.id, ...DOCS.work, ...DOCS.boost].map(d => {
        const isMissing = (a.miss || []).includes(d.id);
        let st = 'verified'; // Default to verified
        if (isMissing) st = 'missing';
        if (a.docStatus && a.docStatus[d.id]) {
            st = a.docStatus[d.id];
            if (st === 'pending') st = 'verified'; // treat explicitly pending as verified since default is verified
        }

        let thumbHtml = '';
        if (st !== 'missing' && d.img) {
            thumbHtml = `<img src="${d.img}" class="doc-thumb" onclick="window.rto.previewImg('${d.img}')" alt="${d.n}">`;
        } else {
            thumbHtml = `<div class="doc-thumb" style="display:flex;align-items:center;justify-content:center;font-size:var(--text-xl);color:var(--dt3)">📄</div>`;
        }

        let statusHtml = '';
        let actionsHtml = '';

        if (st === 'missing') {
            statusHtml = `<span style="color:var(--dd); font-size:var(--text-xs); font-weight:700">✕ Missing</span>`;
            actionsHtml = `<button class="btn" style="padding:2px 8px; font-size:var(--text-3xs); background:var(--dw1); border:1px solid rgba(251,191,36,.25); color:var(--dw)" onclick="window.rto.uploadDoc('${a.id}', '${d.id}')">📤 Upload</button>`;
        } else if (st === 'rejected') {
            const reason = a.docReasons?.[d.id] || 'Dokumen belum sesuai standar';
            statusHtml = `<span style="color:var(--dd); font-size:var(--text-xs); font-weight:700">❌ Rejected</span><div style="font-size:var(--text-3xs); color:var(--dt3); max-width:140px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap" title="${reason}">${reason}</div>`;
            actionsHtml = `<button class="btn" style="padding:2px 8px; font-size:var(--text-3xs)" onclick="window.rto.resubmitDoc('${a.id}', '${d.id}')">Mock Resubmit</button>`;
        } else {
            statusHtml = `<span style="color:var(--dg); font-size:var(--text-xs); font-weight:700">✅ Verified</span>`;
            actionsHtml = `
                <button class="btn btn-danger" style="padding:2px 8px; font-size:var(--text-3xs)" onclick="window.rto.verifyDoc('${a.id}', '${d.id}', 'rejected')">Reject</button>
            `;
        }

        return `<div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom:1px solid var(--db1)">
            <div style="display:flex; gap:12px; align-items:center">
                ${thumbHtml}
                <div style="font-size:var(--text-sm); color:var(--dt1); font-weight:600">${d.n}</div>
            </div>
            <div style="display:flex; gap:8px; align-items:center">
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px">
                    ${statusHtml}
                </div>
                ${actionsHtml}
            </div>
        </div>`;
    }).join('');

    // Highlight Score layout
    document.getElementById('dp-t').innerHTML = `
        <div style="display:flex; align-items:center; gap:20px; width:100%">
            <div style="width: 70px; height: 70px; border-radius: 50%; border: 4px solid ${getScoreColor(sc)}; display:flex; align-items:center; justify-content:center; flex-direction:column; background: ${getScoreColor(sc)}11;">
                <span style="font-size: var(--text-2xl); font-weight:900; color:${getScoreColor(sc)}">${sc}</span>
                <span style="font-size: var(--text-3xs); color:var(--dt3); margin-top:-2px">SCORE</span>
            </div>
            <div style="flex:1">
                <div style="font-size: var(--text-2xl); font-weight:800; color:var(--dt1)">${a.nm}</div>
                <div style="font-size: var(--text-sm); color:var(--dt3)">${a.id} • ${a.prof} • Rp ${a.inc.toLocaleString('id-ID')}</div>
                <div style="margin-top:4px"><span class="dec-chip" style="background:${ds.bg};color:${ds.c};font-size: var(--text-2xs);font-weight:800">${ds.l}</span></div>
            </div>
            <div>
                <button class="btn btn-secondary" onclick="window.rto.admWA()" style="font-size: var(--text-xs)">📱 WA Driver</button>
            </div>
        </div>
    `;

    document.getElementById('dp-grid').innerHTML = `
      <div class="dp-col"><div class="dp-sl">Applicant Details</div>${[['Phone', a.ph], ['Area', a.area], ['Partner', ptn.name], ['Program', pr.nm], ['Submitted', a.submitted]].map(r => `<div class="dp-row" style="font-size:var(--text-base)"><div class="dp-k">${r[0]}</div><div class="dp-v" style="font-size:var(--text-lg)">${r[1]}</div></div>`).join('')}</div>
      <div class="dp-col" style="grid-column: span 2"><div class="dp-sl">Document Verification</div>${docsList}</div>`;


    const dimKeys = ['id', 'inc', 'job', 'fam', 'crd', 'doc'];
    const dimLabels = ['Identitas', 'Penghasilan', 'Pekerjaan', 'Keluarga', 'Kredit', 'Dokumen'];
    const dimCols = ['var(--dac)', 'var(--dg)', 'var(--dbl)', 'var(--dp)', 'var(--dw)', '#14B8A6'];
    const dimMax = [18, 22, 15, 12, 18, 15];
    const baseScore = sc;

    document.getElementById('sp-grid').innerHTML = dimKeys.map((k, i) => {
        const v = Math.min(dimMax[i], Math.round(baseScore * dimMax[i] / 100));
        return `<div class="sp-d"><div class="sp-dl" style="font-size:var(--text-xs)">${dimLabels[i]}</div><div class="sp-bw"><div class="sp-bf" style="width:${v / dimMax[i] * 100}%;background:${dimCols[i]}"></div></div><div class="sp-vs"><div class="sp-v" style="color:${dimCols[i]}; font-size:var(--text-lg)">${v}</div><div class="sp-m" style="font-size:var(--text-sm)">/${dimMax[i]}</div></div></div>`;
    }).join('');

    if (a.miss && a.miss.length) {
        document.getElementById('dp-miss-sec').style.display = 'block';
        document.getElementById('dp-miss-items').innerHTML = a.miss.map(m => `<span style="padding:4px 10px;border-radius:6px;background:var(--dw1);border:1px solid rgba(251,191,36,.15);font-size: var(--text-sm);color:var(--dw);font-weight:600;font-family:'IBM Plex Mono',monospace">${m}</span>`).join('');
    } else {
        document.getElementById('dp-miss-sec').style.display = 'none';
    }

    document.getElementById('ov-note').value = a.note || '';
    document.getElementById('ov-adj').value = a.adj || 0;
    document.getElementById('ov-log').textContent = a.ovlog || '';
    document.getElementById('detail-panel').classList.add('show');
}

export function saveOv() {
    const a = state.admApps.find(x => x.id === state.selApp);
    if (!a) return;
    a.note = document.getElementById('ov-note').value;
    a.adj = parseInt(document.getElementById('ov-adj').value) || 0;
    a.ovlog = '[' + new Date().toLocaleTimeString('id-ID') + '] ' + document.getElementById('ov-note').value + ' (adj: ' + (a.adj > 0 ? '+' : '') + a.adj + ')';
    document.getElementById('ov-log').textContent = a.ovlog;
    admRTbl();
    admT('✅ Override saved');
}

export function admDec(dec) {
    const a = state.admApps.find(x => x.id === state.selApp);
    if (!a) return;
    const newDec = dec === 'auto' ? 'approved' : dec;
    a.dec = newDec;
    admRTbl();
    admSel(state.selApp);
    admT('Decision → ' + dec.toUpperCase());

    if ((dec === 'approved' || dec === 'auto') && !state.puOrders.find(p => p.appId === a.id)) {
        const pr = MAIN_PROGS.find(p => p.id === a.prog);
        addToPickupQueue(a.id, a.nm, a.ph, a.ptn, a.prog, pr ? pr.nm : 'Motor Listrik');
        admT('✅ Approved → ditambahkan ke Pickup Queue!');
    }
}

export function quickDec(id, dec) {
    const a = state.admApps.find(x => x.id === id);
    if (!a) return;
    a.dec = dec;
    admRTbl();
    admT(id + ' → ' + dec.toUpperCase());
    if (dec === 'approved' && !state.puOrders.find(p => p.appId === a.id)) {
        const pr = MAIN_PROGS.find(p => p.id === a.prog);
        addToPickupQueue(a.id, a.nm, a.ph, a.ptn, a.prog, pr ? pr.nm : 'Motor Listrik');
    }
}

export function quickWA(id) {
    const oldSel = state.selApp;
    state.selApp = id;
    admWA();
    state.selApp = oldSel;
}

export function verifyDoc(appId, docId, status) {
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
    admT(`Doc ${status === 'verified' ? 'Verified ✅' : 'Rejected ❌'}`);
}

export function resubmitDoc(appId, docId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;
    if (!a.docStatus) a.docStatus = {};
    a.docStatus[docId] = 'pending';
    a.miss = a.miss.filter(m => m !== docId);

    admSel(appId);
    admT('User resubmitted document 🔄');
}

export function addToPickupQueue(appId, nm, ph, ptn, prog, model) {
    state.puOrders.push({
        id: 'PU-' + String(state.puOrders.length + 1).padStart(3, '0'),
        appId, nm, ph, ptn, prog, model,
        deadline: fmtPickupDate(14), status: 'waiting', schedDate: null, schedTime: null, hoStatus: 'pending'
    });
    const puBadge = document.getElementById('pickup-badge');
    if (puBadge) {
        puBadge.textContent = state.puOrders.filter(p => p.status === 'waiting' || p.status === 'overdue').length;
    }
}

export function admT(msg) {
    const t = document.getElementById('adm-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

export function switchRtoTab(tab, el) {
    // Hide all views inside the RTO dashboard
    document.querySelectorAll('.adm-main .av').forEach(v => v.classList.remove('on'));
    // Deselect all sidebar items
    document.querySelectorAll('.adm-side .adm-ni').forEach(i => i.classList.remove('on'));

    // Show target view
    const viewId = 'adm-' + tab;
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('on');

    // Highlight sidebar item
    if (el) el.classList.add('on');

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
        if (!state.selScen && window.rtoLogic && window.rtoLogic.WA_SCENARIOS.length) {
            selWAScen(window.rtoLogic.WA_SCENARIOS[0].k);
        } else if (!state.selScen && WA_SCENARIOS.length) {
            selWAScen(WA_SCENARIOS[0].k);
        }
    }
}

export function previewImg(url) {
    const modal = document.getElementById('img-modal');
    const img = document.getElementById('img-preview-src');
    if (modal && img) {
        img.src = url;
        modal.style.display = 'flex';
    }
}

export function closePreview() {
    const modal = document.getElementById('img-modal');
    if (modal) modal.style.display = 'none';
}

export function uploadDoc(appId, docId) {
    const a = state.admApps.find(x => x.id === appId);
    if (!a) return;
    a.miss = a.miss.filter(m => m !== docId);
    if (!a.docStatus) a.docStatus = {};
    a.docStatus[docId] = 'verified';
    if (a.docReasons) delete a.docReasons[docId];
    admSel(appId);
    admT('Doc Uploaded & Verified 📤✅');
}

export function waContext(ctx) {
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

export function admWA() {
    const a = state.admApps.find(x => x.id === state.selApp);
    if (!a) {
        admT('⚠ Pilih aplikasi terlebih dahulu');
        return;
    }

    // Determine template based on decision
    let waScenKey = 'review';
    if (a.dec === 'approved') waScenKey = 'approved';
    else if (a.dec === 'declined') waScenKey = 'declined';
    else if (a.miss && a.miss.length > 0) waScenKey = 'missing_docs';
    else waScenKey = 'review';

    const scen = WA_SCENARIOS.find(s => s.k === waScenKey);
    let tmpl = scen ? scen.tmpl : 'Halo {nama}, terkait aplikasi {app_id} kami sedang meninjaunya.';

    // Try to load user custom template if exists
    try {
        const stored = localStorage.getItem('csn_wa_cfg');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed[waScenKey]) tmpl = parsed[waScenKey];
        }
    } catch (e) { }

    // Parse variables
    const pr = MAIN_PROGS.find(p => p.id === a.prog);
    const ptn = PARTNERS[a.ptn] || { name: a.ptn };
    const sc = a.score + (a.adj || 0);

    let txt = tmpl
        .replace(/{nama}/g, a.nm)
        .replace(/{app_id}/g, a.id)
        .replace(/{program}/g, pr ? pr.nm : a.prog)
        .replace(/{score}/g, sc)
        .replace(/{dealer}/g, ptn.name);

    if (a.miss && a.miss.length > 0) {
        txt = txt.replace(/{missing_docs}/g, '\\n- ' + a.miss.join('\\n- '));
    } else {
        txt = txt.replace(/{missing_docs}/g, '');
    }

    // Process phone number formatting for wa.me
    const cleanPhone = a.ph.replace(/\\D/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.startsWith('0')) finalPhone = '62' + finalPhone.substring(1);

    // Instead of opening directly, show a preview
    showWAPreviewModal(finalPhone, txt, a.nm);
}

export function showWAPreviewModal(phone, text, name) {
    let m = document.getElementById('wa-preview-mod');
    if (!m) {
        m = document.createElement('div');
        m.id = 'wa-preview-mod';
        m.className = 'modal-overlay';
        m.innerHTML = `
            <div class="modal" style="max-width:400px; padding:20px;">
                <div style="font-size: var(--text-xl); font-weight:800; color:var(--dt1); margin-bottom:12px;">📱 Kirim WhatsApp ke <span id="wa-mod-nm" style="color:var(--dac)"></span></div>
                <textarea id="wa-mod-txt" class="ov-in" style="width:100%; height:200px; resize:vertical; font-family:'IBM Plex Mono',monospace; font-size: var(--text-md); margin-bottom:12px; padding:10px;"></textarea>
                <div style="display:flex; gap:8px;">
                    <button class="ov-btn" style="flex:1; background:var(--dg1); color:var(--dg); border-color:var(--dg)" onclick="window.rto.sendWAModal()">🚀 Kirim WA</button>
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

export function sendWAModal() {
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
        income: [['≥7Jt', 15, 'var(--dg)'], ['5–7Jt', 29, 'var(--dac)'], ['3.5–5Jt', 48, 'var(--dbl)'], ['2–3.5Jt', 25, 'var(--dw)'], ['<2Jt', 10, 'var(--dd)']],
        prof: [['OJOL', 66, 'var(--dg)'], ['Karyawan', 28, 'var(--dbl)'], ['Wiraswasta', 18, 'var(--dw)'], ['PNS/TNI', 9, 'var(--dp)'], ['Lainnya', 6, 'var(--dt2)']],
        miss: [['Rekening Koran', 77, 'var(--dd)'], ['NPWP', 56, 'var(--dw)'], ['Surat Kerja', 48, 'var(--dw)'], ['BPJS TK', 39, 'var(--dbl)'], ['Selfie KTP', 28, '#FB923C']],
        total: 127
    },
    'tangkas-all': {
        avg: 74, apr: 75, auto: 18, inc: '5.2Jt', doc: 80,
        score: [[80, 100, 18, 'var(--dg)'], [60, 79, 22, 'var(--dac)'], [41, 59, 6, 'var(--dw)'], [21, 40, 3, '#FB923C'], [0, 20, 1, 'var(--dd)']],
        income: [['≥7Jt', 8, 'var(--dg)'], ['5–7Jt', 14, 'var(--dac)'], ['3.5–5Jt', 18, 'var(--dbl)'], ['2–3.5Jt', 9, 'var(--dw)'], ['<2Jt', 1, 'var(--dd)']],
        prof: [['OJOL', 29, 'var(--dg)'], ['Karyawan', 10, 'var(--dbl)'], ['Wiraswasta', 8, 'var(--dw)'], ['PNS/TNI', 2, 'var(--dp)'], ['Lainnya', 1, 'var(--dt2)']],
        miss: [['NPWP', 28, 'var(--dw)'], ['Rekening Koran', 24, 'var(--dd)'], ['Surat Kerja', 18, 'var(--dw)'], ['BPJS TK', 12, 'var(--dbl)'], ['Selfie KTP', 9, '#FB923C']],
        total: 50
    },
};

const ANLY_PROG = {
    'P-TK-RTO': { avg: 76, apr: 80, auto: 12, inc: '5.5Jt', total: 28 },
    'P-TK-RENT': { avg: 70, apr: 68, auto: 6, inc: '4.8Jt', total: 22 },
};

export function renderAnalytics() {
    const ptnEl = document.getElementById('anly-ptn');
    const ptn = ptnEl ? ptnEl.value : 'all';
    const progEl = document.getElementById('anly-prog');
    const prog = progEl ? progEl.value : 'all';

    const key = ptn + '-all';
    const d = ANLY_DATA[key] || ANLY_DATA['all-all'];
    const pd = prog !== 'all' ? ANLY_PROG[prog] : null;
    const total = pd ? pd.total : d.total;

    document.getElementById('anly-count').textContent = total + ' aplikasi';

    // KPI cards
    document.getElementById('anly-kpi').innerHTML = [
        { l: 'Avg Score', v: pd ? pd.avg : d.avg, c: 'var(--dac)', s: 'dari 100' },
        { l: 'Approval Rate', v: (pd ? pd.apr : d.apr) + '%', c: 'var(--dg)', s: 'Target 65%' },
        { l: 'Auto-Approved', v: pd ? pd.auto : d.auto, c: 'var(--dp)', s: 'Score ≥80' },
        { l: 'Avg Income', v: pd ? pd.inc : d.inc, c: 'var(--dt1)', s: '/bulan', sm: 1 },
        { l: 'Doc Complete', v: d.doc + '%', c: 'var(--dw)', s: 'Required' },
    ].map(k => `<div class="kpi"><div class="kpi-l">${k.l}</div><div class="kpi-v" style="color:${k.c};${k.sm ? 'font-size: var(--text-xl)' : ''}">${k.v}</div><div class="kpi-d" style="color:var(--dt3)">${k.s}</div></div>`).join('');

    const bcRow = (items, max) => items.map(([l, n, col]) => {
        const w = Math.round(n / max * 100);
        return `<div class="bc-row"><div class="bc-l">${l}</div><div class="bc-bw"><div class="bc-bf" style="width:${w}%;background:${col}">${n}</div></div><div class="bc-v" style="color:${col}">${w}%</div></div>`;
    }).join('');

    const dimStyle = pd ? 'opacity:.45;pointer-events:none' : '';
    document.getElementById('anly-charts').innerHTML = `
      <div class="ch-c"><div class="ch-t">Score Distribution</div>${bcRow(d.score.map(([a, b, n, c]) => [`${a}-${b}`, n, c]), d.score.reduce((m, r) => Math.max(m, r[2]), 0))}</div>
      <div class="ch-c"><div class="ch-t">Income Distribution</div>${bcRow(d.income, d.income.reduce((m, r) => Math.max(m, r[1]), 0))}</div>
      <div class="ch-c" ${dimStyle ? 'style="' + dimStyle + '"' : ''}><div class="ch-t">Profession Breakdown</div>${bcRow(d.prof, d.prof.reduce((m, r) => Math.max(m, r[1]), 0))}</div>
      <div class="ch-c" ${dimStyle ? 'style="' + dimStyle + '"' : ''}><div class="ch-t">Top Missing Documents</div>${bcRow(d.miss, d.miss.reduce((m, r) => Math.max(m, r[1]), 0))}</div>
    `;
}

// ═══ SCORE CONFIG ═══
export function renderScoreCfg() {
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
          <span style="font-size: var(--text-xs);color:var(--dt3);min-width:28px">≥</span>
          <input class="sc-thresh-inp" type="number" min="0" max="100" value="${t.min}" onchange="window.rto.updThreshCfg(${i}, this.value)">
          <span style="font-size: var(--text-xs);color:var(--dt3)">poin</span>
        </div>`).join('');
    }

    renderProgCfg();
    renderDSR();
}

export function renderProgCfg() {
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

export function renderDSR() {
    const el = document.getElementById('sc-dsr-cfg');
    if (!el) return;
    el.innerHTML = state.dsrCfg.map((d, i) => `
    <div class="sc-dsr-row">
        <span class="sc-dsr-lbl">${d.l}</span>
        <span style="font-size:var(--text-xs);color:var(--dt3)">≤</span>
        <input class="sc-thresh-inp" type="number" value="${d.v}" onchange="window.rto.updDSR(${i}, this.value)">
        <span style="font-size:var(--text-xs);color:var(--dt3)">%</span>
        <div style="width:10px;height:10px;border-radius:50%;background:${d.c};margin-left:auto"></div>
    </div>`).join('');
}

export function updDSR(i, v) {
    state.dsrCfg[i].v = parseInt(v) || 0;
}

export function updDimCfg(idx, val) {
    state.dimCfg[idx].max = parseInt(val) || 0;
    renderScoreCfg();
}

export function updThreshCfg(idx, val) {
    state.threshCfg[idx].min = parseInt(val) || 0;
}

export function saveCfg() {
    const total = state.dimCfg.reduce((s, d) => s + d.max, 0);
    if (total !== 100) {
        alert('⚠ Total bobot harus 100 poin (sekarang ' + total + ')');
        return;
    }
    localStorage.setItem('casan_rto_cfg', JSON.stringify({
        dimCfg: state.dimCfg,
        threshCfg: state.threshCfg,
        dsrCfg: state.dsrCfg
    }));
    alert('✅ Konfigurasi skor & DSR berhasil disimpan!');
}

export function resetCfg() {
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
        alert('↺ Konfigurasi direset ke default');
    }
}

// ═══ WA TEMPLATES ═══
export function renderWAScens() {
    const el = document.getElementById('wa-scen-list');
    if (!el) return;
    el.innerHTML = WA_SCENARIOS.map(s => `
    <div class="wa-scen ${state.selScen === s.k ? 'sel' : ''}" onclick="window.rto.selWAScen('${s.k}')">
      <div class="wa-scen-ic">${s.ic}</div>
      <div class="wa-scen-nm">${s.nm}</div>
      <div class="wa-scen-desc">${s.desc}</div>
    </div>`).join('');
}

export function selWAScen(k) {
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

export function saveWA() {
    if (!state.selScen) { admT('Pilih skenario terlebih dahulu'); return; }
    state.waTmpls[state.selScen] = document.getElementById('wa-tmpl-txt').value;
    admT('✅ Template tersimpan!');
}

export function previewWA() {
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
        .replace(/{missing_docs}/g, '• KTP Asli\n• Rekening Koran\n• Slip Gaji');
    document.getElementById('wa-preview-txt').textContent = preview;
    document.getElementById('wa-preview').style.display = 'block';
}

export function resetWA() {
    if (!state.selScen) return;
    const s = WA_SCENARIOS.find(x => x.k === state.selScen);
    state.waTmpls[state.selScen] = s.tmpl;
    document.getElementById('wa-tmpl-txt').value = s.tmpl;
    document.getElementById('wa-preview').style.display = 'none';
    admT('↺ Template direset ke default');
}

export function buildWAMsg(a, scenKey) {
    const ptn = PARTNERS[a.ptn] || { name: a.ptn };
    const pr = MAIN_PROGS.find(p => p.id === a.prog) || { nm: a.prog, dr: 0 };
    const tmpl = state.waTmpls[scenKey] || (WA_SCENARIOS.find(s => s.k === scenKey) || {}).tmpl || '';
    const missStr = a.miss && a.miss.length ? a.miss.map(m => '• ' + m).join('\n') : '(tidak ada)';
    return tmpl
        .replace(/{nama}/g, a.nm || '—')
        .replace(/{app_id}/g, a.id)
        .replace(/{program}/g, pr.nm || '—')
        .replace(/{score}/g, (a.score + (a.adj || 0)))
        .replace(/{dealer}/g, ptn.name)
        .replace(/{amount}/g, pr.dr ? 'Rp ' + (pr.dr * 7).toLocaleString('id-ID') : '—')
        .replace(/{credits}/g, '3')
        .replace(/{grace_days}/g, '7')
        .replace(/{missing_docs}/g, missStr);
}

export function copyWAMsg() {
    const txt = document.getElementById('wa-msg-txt')?.value;
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(() => admT('📋 Pesan disalin!')).catch(() => admT('Gagal menyalin'));
}

export function openWALink(ph) {
    const msg = document.getElementById('wa-msg-txt')?.value || '';
    const clean = ph.replace(/[^0-9+]/g, '').replace(/^0/, '62').replace(/^\+/, '');
    const url = 'https://wa.me/' + clean + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
    admT('📱 WhatsApp dibuka!');
}


// ═══ PICKUP SCHEDULE (ADMIN) ═══
export function setPUF(f, btnId) {
    state.puFlt = f;
    document.querySelectorAll('[id^="puf-"]').forEach(b => b.classList.remove('on'));
    if (btnId) document.getElementById(btnId).classList.add('on');
    renderPUList();
}

export function renderPUList() {
    const el = document.getElementById('pu-list');
    if (!el) return;
    const filtered = state.puOrders.filter(p => state.puFlt === 'all' || p.status === state.puFlt);
    el.innerHTML = filtered.map(p => {
        const dl = daysLeft(p.deadline);
        const stMap = { waiting: { cls: 'pu-st-wait', l: '⏳ Menunggu' }, scheduled: { cls: 'pu-st-sched', l: '📅 Terjadwal' }, done: { cls: 'pu-st-done', l: '✅ Selesai' }, overdue: { cls: 'pu-st-overdue', l: '🔴 Terlambat' } };
        const st = stMap[p.status] || { cls: '', l: p.status };
        const loc = DEALER_LOCATIONS[p.ptn];
        return `<div class="pu-card ${state.selPU === p.id ? 'sel' : ''}" onclick="window.rto.selPUOrder('${p.id}')">
        <div class="pu-card-top">
          <div><div class="pu-name">${p.nm}</div><div class="pu-id">${p.appId} · ${p.model}</div></div>
          <span class="pu-st ${st.cls}">${st.l}</span>
        </div>
        <div class="pu-info">
          <span>🏪 ${loc ? loc.name : p.ptn}</span>
          ${p.schedDate ? `<span>📅 ${p.schedDate} ${p.schedTime || ''}</span>` : ''}
        </div>
        <div class="pu-deadline" style="color:${dl < 0 ? 'var(--dd)' : dl <= 3 ? 'var(--dw)' : 'var(--dt3)'}">
          ${dl < 0 ? '⚠ Melewati deadline' : dl === 0 ? '⚠ Deadline HARI INI' : p.status === 'done' ? '✅ Selesai' : '📅 Deadline: ' + p.deadline + ' (' + dl + 'h lagi)'}
        </div>
      </div>`;
    }).join('') || '<div style="padding:20px;text-align:center;color:var(--dt3);font-size: var(--text-sm)">Tidak ada pickup</div>';

    // Update Badge
    const puBadge = document.getElementById('pickup-badge');
    if (puBadge) {
        puBadge.textContent = state.puOrders.filter(p => p.status === 'waiting' || p.status === 'overdue').length;
    }
}

export function selPUOrder(id) {
    state.selPU = id;
    renderPUList();
    renderPUDetail();
}

export function renderPUDetail() {
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
        <div class="pu-dt">${p.nm} <span style="font-size: var(--text-sm);color:var(--dt3)">· ${p.model}</span></div>
        <div class="pu-ds">${p.appId} · Deadline: <b style="color:${dl < 0 ? 'var(--dd)' : dl <= 3 ? 'var(--dw)' : 'var(--dac)'}">${p.deadline}</b></div>
      </div>
  
      <!--Location -->
      <div class="pu-loc-card">
        <div class="pu-loc-t">📍 Lokasi Pickup Motor</div>
        <div class="pu-loc-addr">${loc ? loc.name : 'Dealer'}</div>
        <div class="pu-loc-sub">${loc ? loc.addr : ''}</div>
        <div class="pu-loc-map">🗺️ ${loc ? loc.addr : 'Peta lokasi'}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button onclick="window.rto.admT('📍 Alamat disalin!')" class="ov-btn" style="flex:1;font-size: var(--text-xs)">📋 Salin Alamat</button>
          <button onclick="window.rto.admT('🔗 Membuka Google Maps...')" class="ov-btn" style="flex:1;font-size: var(--text-xs)">🗺️ Google Maps</button>
        </div>
      </div>
  
      <!--WA Notification to driver-->
    ${p.status === 'waiting' || p.status === 'overdue' ? `
      <div style="margin:0 16px 12px;padding:10px 12px;background:rgba(34,197,94,.06);border-radius:8px;border:1px solid rgba(34,197,94,.15)">
        <div style="font-size: var(--text-xs);font-weight:800;color:var(--dg);margin-bottom:6px">📱 Kirim Notifikasi ke Driver</div>
        <div style="font-size: var(--text-xs);color:var(--dt2);line-height:1.5;margin-bottom:8px">Minta driver untuk menjadwalkan pickup dalam <b>${dl > 0 ? dl + ' hari' : 'waktu segera'}</b></div>
        <button onclick="window.rto.sendPickupWA('${p.id}')" style="width:100%;padding:7px;background:linear-gradient(135deg,#16A34A,#15803D);color:#fff;border:none;border-radius:6px;font-size: var(--text-sm);font-weight:700;cursor:pointer">
          📱 Kirim WA ke ${p.nm}
        </button>
      </div>` : ''
        }

      <!--Calendar(driver scheduling) -->
      <div class="cal-wrap">
        <div class="cal-t">📅 Jadwal Pickup — Pilih Tanggal & Waktu</div>
        <div id="pu-cal"></div>
        <div style="font-size: var(--text-xs);font-weight:700;color:var(--dt2);margin-bottom:6px">⏰ Slot Tersedia</div>
        <div class="time-slots" id="pu-slots"></div>
        <button class="pu-confirm-btn" id="pu-confirm-btn" onclick="window.rto.confirmPickup('${p.id}')" ${state.selDate && state.selTime ? '' : 'disabled'}>
          ${state.selDate && state.selTime ? `✅ Konfirmasi: ${state.selDate} · ${state.selTime}` : '← Pilih tanggal & waktu dulu'}
        </button>
      </div>
  
      <!--Handover Timeline-->
      <div style="margin:0 16px;font-size: var(--text-base);font-weight:800;color:var(--dt1);margin-bottom:8px">📋 Status Handover</div>
      <div class="handover-timeline">
        ${renderHOTimeline(p)}
      </div>
      
      ${p.hoStatus === 'dealer_confirmed' ? `
        <div style="margin: 16px; padding: 16px; background: var(--ds2); border: 1px solid var(--db1); border-radius: 8px;">
            <div style="font-size: var(--text-base); font-weight: 800; color: var(--dw); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                ⚠️ Verifikasi & Bukti Serah Terima Kendaraan
            </div>
            
            <!-- SECTION 1: Checkboxes -->
            <div style="font-size: var(--text-sm); font-weight: 700; color: var(--dt1); margin-bottom: 8px;">1. Verifikasi Fisik & Kelengkapan</div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: var(--text-sm); color: var(--dt2); margin-bottom: 20px; padding-left: 8pxborder-left: 2px solid var(--db1);" id="ho-checklist-container">
                <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start;">
                    <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOChecklist()"> Fisik kendaraan mulus tanpa baret/kerusakan.
                </label>
                <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start;">
                    <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOChecklist()"> Baterai terisi penuh (100%).
                </label>
                <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start;">
                    <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOChecklist()"> Kunci Utama & Kunci Cadangan lengkap.
                </label>
                <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start;">
                    <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOChecklist()"> STNK Mobil/Motor tersedia.
                </label>
                <label style="display: flex; gap: 10px; cursor: pointer; align-items: flex-start;">
                    <input type="checkbox" style="margin-top:2px" onchange="window.rto.evalHOChecklist()"> Charger & Helm diserahkan ke Driver.
                </label>
            </div>

            <!-- SECTION 2: Photos -->
            <div style="font-size: var(--text-sm); font-weight: 700; color: var(--dt1); margin-bottom: 8px;">2. Bukti Serah Terima (Foto)</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;" id="ho-photos-container">
                
                <div style="border: 2px dashed var(--db1); border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s;" id="ho-photo-1" onclick="window.rto.mockHOUpload('ho-photo-1', 'Foto Serah Terima Kendaraan')">
                    <div style="font-size: 24px; margin-bottom: 4px;">📸</div>
                    <div style="font-size: var(--text-xs); color: var(--dt2); font-weight: 600;">Foto Serah Terima Kendaraan</div>
                    <div style="font-size: var(--text-3xs); color: var(--dt3); margin-top: 4px;">Klik untuk upload</div>
                </div>

                <div style="border: 2px dashed var(--db1); border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s;" id="ho-photo-2" onclick="window.rto.mockHOUpload('ho-photo-2', 'Foto KTP & Driver dengan Motor')">
                    <div style="font-size: 24px; margin-bottom: 4px;">📸</div>
                    <div style="font-size: var(--text-xs); color: var(--dt2); font-weight: 600;">Foto KTP & Driver dengan Motor</div>
                    <div style="font-size: var(--text-3xs); color: var(--dt3); margin-top: 4px;">Klik untuk upload</div>
                </div>

            </div>
        </div>
        <button class="ho-complete-btn green" id="btn-ho-complete" disabled style="opacity: 0.5; cursor: not-allowed; transition: all 0.3s;" onclick="window.rto.markHandoverDone('${p.id}')">✅ Konfirmasi Serah Terima Selesai</button>
      ` : ''}
      
      ${p.status === 'done' ? `<div style="margin:10px 16px;padding:12px;background:var(--dg1);border-radius:8px;border:1px solid rgba(52,211,153,.15);font-size: var(--text-base);color:var(--dg);font-weight:700;text-align:center">✅ Handover selesai · GPS diaktifkan · Rider aktif</div>` : ''}
    `;

    renderPUCal();
    renderPUSlots();
}

export function renderHOTimeline(p) {
    const steps = [
        { k: 'approved', l: 'Aplikasi Disetujui', s: 'Score ' + p.hoStatus !== 'pending' ? 'Approved' : '—', done: true },
        { k: 'notified', l: 'Driver Diberitahu', s: 'WA notifikasi terkirim', done: p.status !== 'waiting' || p.hoStatus !== 'pending' },
        { k: 'scheduled', l: 'Jadwal Disepakati', s: p.schedDate ? p.schedDate + ' · ' + p.schedTime : 'Belum dijadwalkan', done: !!p.schedDate },
        { k: 'dealer_confirmed', l: 'Dealer Siapkan Motor', s: 'Verifikasi unit & GPS', done: p.hoStatus === 'dealer_confirmed' || p.status === 'done' },
        { k: 'done', l: 'Serah Terima Selesai', s: p.status === 'done' ? 'GPS aktif, rider jalan!' : 'Menunggu konfirmasi', done: p.status === 'done' },
    ];
    return steps.map((st, i) => {
        const isActive = !st.done && (i === 0 || (steps[i - 1] && steps[i - 1].done));
        return `<div class="ho-step">
        <div class="ho-dot ${st.done ? 'done' : isActive ? 'active' : 'pending'}">${st.done ? '✓' : isActive ? '→' : i + 1}</div>
        <div class="ho-info">
          <div class="ho-t" style="color:${st.done ? 'var(--dg)' : isActive ? 'var(--dac)' : 'var(--dt3)'}">${st.l}</div>
          <div class="ho-s">${st.s}</div>
        </div>
      </div>`;
    }).join('');
}

export function renderPUCal() {
    const p = state.puOrders.find(x => x.id === state.selPU);
    const now = new Date();
    const deadlineDate = p ? new Date(p.deadline) : null;
    const year = state.calYear, month = state.calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    let html = `<div class="cal-nav">
      <button class="cal-nb" onclick="window.rto.calNav(-1)">‹</button>
      <span class="cal-nav-t">${months[month]} ${year}</span>
      <button class="cal-nb" onclick="window.rto.calNav(1)">›</button>
    </div>
    <div class="cal-grid">
        ${days.map(d => `<div class="cal-dh">${d}</div>`).join('')}
        ${Array(firstDay).fill('<div class="cal-day cal-empty">·</div>').join('')}
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

export function calNav(dir) {
    state.calMonth += dir;
    if (state.calMonth > 11) { state.calMonth = 0; state.calYear++ }
    if (state.calMonth < 0) { state.calMonth = 11; state.calYear-- }
    renderPUCal();
}

export function pickCalDay(dateStr, puId) {
    state.selDate = dateStr; state.selTime = null;
    renderPUCal(); renderPUSlots();
}

export function renderPUSlots() {
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
        btn.textContent = state.selDate && state.selTime ? `✅ Konfirmasi: ${state.selDate} · ${state.selTime}` : '← Pilih tanggal & waktu dulu';
    }
}

export function pickSlot(time, puId) {
    state.selTime = time;
    renderPUSlots();
}

export function confirmPickup(puId) {
    if (!state.selDate || !state.selTime) { admT('Pilih tanggal & waktu terlebih dahulu', 'er'); return }
    const p = state.puOrders.find(x => x.id === puId);
    if (!p) return;
    p.schedDate = state.selDate; p.schedTime = state.selTime; p.status = 'scheduled'; p.hoStatus = 'dealer_confirmed';
    admT(`✅ Pickup dikonfirmasi: ${p.nm} · ${state.selDate} · ${state.selTime}`);
    renderPUList(); renderPUDetail();
}

export function sendPickupWA(puId) {
    const p = state.puOrders.find(x => x.id === puId);
    if (!p) return;
    admT(`📱 WA terkirim ke ${p.nm}(${p.ph})`);
    if (p.status === 'waiting') p.hoStatus = 'notified';
    renderPUList(); renderPUDetail();
}

export function markHandoverDone(puId) {
    const p = state.puOrders.find(x => x.id === puId);
    if (!p) return;
    p.status = 'done'; p.hoStatus = 'done';
    const app = state.admApps.find(a => a.id === p.appId);
    if (app) app.dec = 'active';
    admT('🎉 Serah terima selesai! GPS diaktifkan → ' + p.nm);
    renderPUList(); renderPUDetail();
    admRTbl();
}

export function evalHOChecklist() {
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

export function mockHOUpload(elId, label) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (el.classList.contains('uploaded')) return; // Prevent double trigger

    // Simulate an upload delay
    el.innerHTML = `<div style="font-size: 24px; margin-bottom: 4px; animation: pulse 1s infinite;">⏳</div>
                    <div style="font-size: var(--text-xs); color: var(--dt2); font-weight: 600;">Mengunggah...</div>`;

    setTimeout(() => {
        el.classList.add('uploaded');
        el.style.borderColor = 'var(--c-success)';
        el.style.background = 'var(--dg1)';
        el.innerHTML = `<div style="font-size: 24px; margin-bottom: 4px;">✅</div>
                        <div style="font-size: var(--text-xs); color: var(--c-success); font-weight: 700;">${label}</div>
                        <div style="font-size: var(--text-3xs); color: var(--c-success); margin-top: 4px;">Berhasil Diunggah</div>`;

        admT(`✅ ${label} berhasil diunggah!`);
        evalHOChecklist(); // Re-evaluate the Master button
    }, 800);
}



// Setup globally exposed functions for onclick handlers
export function extendGlobalWindow() {
    window.rto = Object.assign(window.rto || {}, {
        admV,
        setAdmFlt,
        admSrch,
        admSel,
        saveOv,
        admDec,
        quickDec,
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
        renderPUList,
        renderScoreCfg,
        renderWAScens,
        selWAScen,
        selPUOrder,
        setPUF,
        waContext,
        previewImg,
        closePreview,
        uploadDoc
    });

    // Also bind directly to window for compatibility with app.js
    window.admRTbl = admRTbl;
    window.renderPUList = renderPUList;
    window.renderScoreCfg = renderScoreCfg;
    window.renderWAScens = renderWAScens;
    window.selWAScen = selWAScen;
    window.switchRtoTab = switchRtoTab;
}
