#!/usr/bin/env python3
"""Adds ▶/▼ expand indicator to Renters table first column in ui.js"""
import re

with open('js/modules/ui.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = """                <td>
                    <div style="font-size: var(--text-sm); color:var(--p); font-weight:700; margin-bottom:2px">${programName}</div>
                    <div style="font-size: var(--text-md); font-weight:700; font-family:'IBM Plex Mono', monospace; color:var(--t1)">${v.rtoId}</div>
                </td>"""

new = """                <td style="padding:10px 8px 10px 12px">
                    <div style="display:flex; align-items:center; gap:8px">
                        <span style="color:var(--t3); font-size:var(--text-lg); flex-shrink:0">${isRenterExpanded ? '&#9660;' : '&#9654;'}</span>
                        <div>
                            <div style="font-size: var(--text-sm); color:var(--p); font-weight:700; margin-bottom:2px">${programName}</div>
                            <div style="font-size: var(--text-md); font-weight:700; font-family:'IBM Plex Mono', monospace; color:var(--t1)">${v.rtoId}</div>
                        </div>
                    </div>
                </td>"""

# Normalize line endings for comparison
old_normalized = old.replace('\r\n', '\n').replace('\r', '\n')
content_normalized = content.replace('\r\n', '\n')

if old_normalized in content_normalized:
    result = content_normalized.replace(old_normalized, new)
    with open('js/modules/ui.js', 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(result)
    print(f"SUCCESS - Fixed Renters expand indicator. Size: {len(result)}")
else:
    print("PATTERN NOT FOUND - searching nearby lines...")
    # Print lines around line 1903
    lines = content_normalized.split('\n')
    for i, line in enumerate(lines[1900:1912], start=1901):
        print(f"  {i}: {repr(line)}")
