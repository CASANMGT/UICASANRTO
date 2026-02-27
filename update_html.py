import os
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update Navigation Tabs
old_nav = """        <nav class="nav-tabs">
            <div class="nav-tab active" data-tab="users">👤 Users</div>
            <div class="nav-tab" data-tab="programs">🤝 Programs</div>
            <div class="nav-tab" data-tab="finance">💰 Finance</div>
            <div class="nav-tab" data-tab="vehicles">🏍️ Vehicles</div>
            <div class="nav-tab" data-tab="fleet">🗺️ Fleet Tracking</div>
            <div class="nav-tab" data-tab="gps">📡 GPS List</div>
            <div class="nav-tab" data-tab="rto-applications">📋 RTO Apps</div>
            <div class="nav-tab" data-tab="rto-pickup">🛵 Pickup</div>
            <div class="nav-tab" data-tab="rto-score">⚙️ Score Config</div>
            <div class="nav-tab" data-tab="rto-wa">📱 WA Templates</div>
        </nav>"""

new_nav = """        <nav class="nav-tabs">
            <div class="nav-tab active" data-tab="users">👤 Users</div>
            <div class="nav-tab" data-tab="programs">🤝 Programs</div>
            <div class="nav-tab" data-tab="finance">💰 Finance</div>
            <div class="nav-tab" data-tab="vehicles">🏍️ Vehicles</div>
            <div class="nav-tab" data-tab="fleet">🗺️ Fleet Tracking</div>
            <div class="nav-tab" data-tab="gps">📡 GPS List</div>
            <div class="nav-tab" data-tab="rto-applications">📋 Application</div>
        </nav>"""

html = html.replace(old_nav, new_nav)

# 2. Extract inner contents
def extract_inner(html, start_marker, end_marker):
    start_idx = html.find(start_marker)
    if start_idx == -1: return ""
    start_idx += len(start_marker)
    end_idx = html.find(end_marker, start_idx)
    chunk = html[start_idx:end_idx]
    
    # The chunk contains the inner HTML + </div></div>
    # We want to remove the last 2 </div> tags (viewContent and viewContainer)
    # So we split by </div> and drop the last 3 items (since splitting "</div></div> " yields ["", "", " "])
    parts = chunk.rsplit('</div>', 2)
    return parts[0].strip()

apps_inner = extract_inner(html, 'id="rto-applicationsContent"\n                    style="overflow-y:auto; flex:1; min-height:0; padding:24px; box-sizing:border-box;">', '<!-- RTO Pickup Tab -->')
pickup_inner = extract_inner(html, 'id="rto-pickupContent"\n                    style="overflow-y:auto; flex:1; min-height:0; padding:24px; box-sizing:border-box;">', '<!-- RTO Score Config Tab -->')
score_inner = extract_inner(html, 'id="rto-scoreContent"\n                    style="overflow-y:auto; flex:1; min-height:0; padding:24px; box-sizing:border-box;">', '<!-- RTO WA Templates Tab -->')
wa_inner = extract_inner(html, 'id="rto-waContent"\n                    style="overflow-y:auto; flex:1; min-height:0; padding:24px; box-sizing:border-box;">', '</main>')

new_rto_block = f"""
            <!-- RTO Applications Tab (Now a combined sidebar layout) -->
            <div id="rto-applicationsView" class="view-container hidden">
                <div class="adm" style="flex:1; width:100%; height:100%; border-radius:0;">
                    <!-- Admin Sidebar -->
                    <div class="adm-side">
                        <div class="adm-nav">
                            <div class="adm-ns">Menu</div>
                            <div class="adm-ni on" id="adm-ni-apps" onclick="window.switchRtoTab('apps', this)"><div class="adm-ni-ic">📋</div><div class="adm-ni-l">Applications</div></div>
                            <div class="adm-ni" id="adm-ni-pickup" onclick="window.switchRtoTab('pickup', this)"><div class="adm-ni-ic">🛵</div><div class="adm-ni-l">Pickup Schedule</div></div>
                            <div class="adm-ni" id="adm-ni-score" onclick="window.switchRtoTab('score', this)"><div class="adm-ni-ic">⚙️</div><div class="adm-ni-l">Score Config</div></div>
                            <div class="adm-ni" id="adm-ni-wa" onclick="window.switchRtoTab('wa', this)"><div class="adm-ni-ic">📱</div><div class="adm-ni-l">WA Templates</div></div>
                        </div>
                    </div>

                    <!-- Admin Main Content -->
                    <div class="adm-main">
                        <div class="adm-cnt" style="padding: 24px;">
                            <!-- Applications View -->
                            <div class="av on" id="adm-apps">
{apps_inner}
                            </div>

                            <!-- Pickup Schedule View -->
                            <div class="av" id="adm-pickup">
{pickup_inner}
                            </div>

                            <!-- Score Config View -->
                            <div class="av" id="adm-score">
{score_inner}
                            </div>

                            <!-- WA Templates View -->
                            <div class="av" id="adm-wa">
{wa_inner}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
"""

full_replace_start = html.find('<!-- RTO Applications Tab -->')
full_replace_end = html.find('</main>')

html = html[:full_replace_start] + new_rto_block.strip() + "\n        " + html[full_replace_end:]

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Updated index.html successfully!")
