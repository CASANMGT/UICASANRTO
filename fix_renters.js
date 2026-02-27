const fs = require('fs');
const content = fs.readFileSync('js/modules/ui.js', 'utf8');

const old = `                <td>\r\n                    <div style="font-size: var(--text-sm); color:var(--p); font-weight:700; margin-bottom:2px">\${programName}</div>\r\n                    <div style="font-size: var(--text-md); font-weight:700; font-family:'IBM Plex Mono', monospace; color:var(--t1)">\${v.rtoId}</div>\r\n                </td>`;

const newTd = `                <td style="padding:10px 8px 10px 12px">\r\n                    <div style="display:flex; align-items:center; gap:8px">\r\n                        <span style="color:var(--t3); font-size:var(--text-lg); flex-shrink:0">\${isRenterExpanded ? '&#9660;' : '&#9654;'}</span>\r\n                        <div>\r\n                            <div style="font-size: var(--text-sm); color:var(--p); font-weight:700; margin-bottom:2px">\${programName}</div>\r\n                            <div style="font-size: var(--text-md); font-weight:700; font-family:'IBM Plex Mono', monospace; color:var(--t1)">\${v.rtoId}</div>\r\n                        </div>\r\n                    </div>\r\n                </td>`;

if (content.includes(old)) {
    const result = content.replace(old, newTd);
    fs.writeFileSync('js/modules/ui.js', result, 'utf8');
    console.log('SUCCESS. Size:', result.length);
} else {
    // Try with \n only
    const oldLF = old.replace(/\r\n/g, '\n');
    const contentLF = content.replace(/\r\n/g, '\n');
    if (contentLF.includes(oldLF)) {
        const newLF = newTd.replace(/\r\n/g, '\n');
        const result = contentLF.replace(oldLF, newLF);
        fs.writeFileSync('js/modules/ui.js', result, 'utf8');
        console.log('SUCCESS (LF). Size:', result.length);
    } else {
        console.log('NOT FOUND. Lines 1901-1908:');
        content.split('\n').slice(1900, 1908).forEach((l, i) => console.log(1901 + i + ':', JSON.stringify(l)));
    }
}
