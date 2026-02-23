/* Utility Functions */

export const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
};

export const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

export const timeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();

    if (diff < 60000) return 'Just now'; // < 1 min
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`; // < 1 hour
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`; // < 1 day
    return `${Math.floor(diff / 86400000)}d ago`; // > 1 day
};

export const getCountdown = (targetDate) => {
    const now = Date.now();
    const end = new Date(targetDate).getTime();
    const diff = end - now;

    if (diff <= 0) return { expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { expired: false, days, hours, minutes, seconds, total: diff };
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const downloadCSV = (filename, rows) => {
    const csvContent = "data:text/csv;charset=utf-8,"
        + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
