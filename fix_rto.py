import re

with open("js/modules/rto.js", "r", encoding="utf-8") as f:
    text = f.read()

# Fix `< div ` and `class= "something"` issues
text = text.replace('< div class= "sc-dim-row" >', '<div class="sc-dim-row">')
text = text.replace('< div class= "sc-thresh-row" >', '<div class="sc-thresh-row">')

# Add WA Preview Modal implementation inside admWA
wa_logic_old = """    const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(txt)}`;
    window.open(waUrl, '_blank');
}"""

wa_logic_new = """    // Instead of opening directly, show a preview
    showWAPreviewModal(finalPhone, txt, a.nm);
}

export function showWAPreviewModal(phone, text, name) {
    let m = document.getElementById('wa-preview-mod');
    if (!m) {
        m = document.createElement('div');
        m.id = 'wa-preview-mod';
        m.className = 'modal-overlay show';
        m.innerHTML = `
            <div class="modal" style="max-width:400px; padding:20px;">
                <div style="font-size:14px; font-weight:800; color:var(--dt1); margin-bottom:12px;">📱 Kirim WhatsApp ke <span id="wa-mod-nm"></span></div>
                <textarea id="wa-mod-txt" class="ov-in" style="width:100%; height:200px; resize:vertical; font-family:'IBM Plex Mono',monospace; font-size:11px; margin-bottom:12px; padding:10px;"></textarea>
                <div style="display:flex; gap:8px;">
                    <button class="ov-btn" style="flex:1; background:var(--dg1); color:var(--dg); border-color:var(--dg)" onclick="window.rto.sendWAModal()">🚀 Kirim WA</button>
                    <button class="ov-btn" style="flex:1" onclick="document.getElementById('wa-preview-mod').classList.remove('show')">Batal</button>
                </div>
            </div>
        `;
        document.body.appendChild(m);
    }
    
    document.getElementById('wa-mod-nm').textContent = name;
    document.getElementById('wa-mod-txt').value = text;
    m.setAttribute('data-phone', phone);
    m.classList.add('show');
}

export function sendWAModal() {
    const m = document.getElementById('wa-preview-mod');
    if (!m) return;
    const phone = m.getAttribute('data-phone');
    const txt = document.getElementById('wa-mod-txt').value;
    
    m.classList.remove('show');
    
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(txt)}`;
    window.open(waUrl, '_blank');
}"""

text = text.replace(wa_logic_old, wa_logic_new)

# Make sure sendWAModal is exported to window for UI usage
export_old = """        renderAnalytics,
        switchRtoTab,
        admWA
    };
}"""
export_new = """        renderAnalytics,
        switchRtoTab,
        admWA,
        sendWAModal
    };
}"""
text = text.replace(export_old, export_new)

with open("js/modules/rto.js", "w", encoding="utf-8") as f:
    f.write(text)

print("rto.js modified successfully.")
