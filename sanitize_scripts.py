import os

def sanitize_file(filepath):
    mapping = {
        '✅': 'OK',
        '📱': 'WA',
        '📅': 'DATE',
        '⚠️': 'WARN',
        '🔒': 'LOCK',
        '👤': 'USER',
        '📥': 'EXP',
        '📦': 'ASSET',
        '📋': 'DOCS',
        '⚡': 'E',
        '🟢': 'G',
        '🟠': 'O',
        '🔵': 'B',
        '♂': 'M',
        '♀': 'F',
        '⚙️': 'CFG',
        '💾': 'SAVE',
        '📐': 'RULE',
        '✏️': 'EDIT',
        '🛵': 'BIKE',
        '🌊': 'W',
        '💚': 'G',
        '·': '-',
        '→': '->',
        '↑': '^',
        '↓': 'v',
        '‹': '<',
        '›': '>',
        '✓': 'DONE',
    }
    
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        for char, replacement in mapping.items():
            content = content.replace(char, replacement)
            
        # specifically targeted fixed for corrupted patterns observed in Get-Content
        content = content.replace('?', '*')
        content = content.replace('-', '->')
        content = content.replace('dY"', 'WA')
        content = content.replace('dY-?,?', 'Holiday')
        content = content.replace('dY"\'', 'Lock')
        content = content.replace('?"', '?')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Sanitized {filepath}")
    except Exception as e:
        print(f"Error sanitizing {filepath}: {e}")

files = [
    'js/modules/rto.js',
    'js/modules/ui.js',
    'js/modules/store.js',
    'js/modules/map.js',
    'js/modules/finance.js',
    'js/modules/gps.js',
    'js/modules/users.js',
    'js/modules/vehicle.js',
    'js/modules/utils.js',
    'js/app.js'
]

for f in files:
    if os.path.exists(f):
        sanitize_file(f)
