/* Utility Functions */

function formatRupiah(number) {
    if (!number && number !== 0) return 'Rp. 0';
    return 'Rp. ' + Math.round(number).toLocaleString('id-ID');
}

function formatShortCurrency(number) {
    if (!number && number !== 0) return 'Rp 0';
    if (Math.abs(number) >= 1000000000) return `Rp ${(number / 1000000000).toFixed(2)}.B`;
    if (Math.abs(number) >= 1000000) return `Rp ${(number / 1000000).toFixed(2)}.M`;
    if (Math.abs(number) >= 1000) return `Rp ${(number / 1000).toFixed(2)}.K`;
    return `Rp ${Math.round(number)}`;
}


function formatDate(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function timeAgo(timestamp) {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

function getCountdown(targetDate) {
    const now = Date.now();
    const end = new Date(targetDate).getTime();
    const diff = end - now;

    if (diff <= 0) return { expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { expired: false, days, hours, minutes, seconds, total: diff };
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function downloadCSV(filename, rows) {
    const csvContent = "data:text/csv;charset=utf-8,"
        + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ─── GLOBAL EXPOSURE ──────────────────────────────────────────────────────────
window.formatRupiah = formatRupiah;
window.formatShortCurrency = formatShortCurrency;
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.getCountdown = getCountdown;
window.sleep = sleep;
window.downloadCSV = downloadCSV;
