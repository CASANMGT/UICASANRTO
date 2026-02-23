$htmlPath = "C:\Users\claux\.gemini\antigravity\scratch\casan_rto\index.html"
$html = Get-Content $htmlPath -Raw

# 1. Update Navigation Tabs
$oldNav = @"
        <nav class="nav-tabs">
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
        </nav>
"@

$newNav = @"
        <nav class="nav-tabs">
            <div class="nav-tab active" data-tab="users">👤 Users</div>
            <div class="nav-tab" data-tab="programs">🤝 Programs</div>
            <div class="nav-tab" data-tab="finance">💰 Finance</div>
            <div class="nav-tab" data-tab="vehicles">🏍️ Vehicles</div>
            <div class="nav-tab" data-tab="fleet">🗺️ Fleet Tracking</div>
            <div class="nav-tab" data-tab="gps">📡 GPS List</div>
            <div class="nav-tab" data-tab="rto-applications">📋 Application</div>
        </nav>
"@

$html = $html.Replace($oldNav, $newNav)

# 2. Extract inner contents
$rtoAppsStart = $html.IndexOf('<div class="kpi-row">')
$rtoAppsEnd = $html.IndexOf('</div>', $html.IndexOf('<div class="da-sec">')) + 6
$rtoAppsInner = $html.Substring($rtoAppsStart, $rtoAppsEnd - $rtoAppsStart)

$rtoPickupStart = $html.IndexOf('<div class="pu-layout">')
$rtoPickupEnd = $html.IndexOf('</div>', $html.IndexOf('<div class="pu-right" id="pu-detail">')) + 6
$rtoPickupInner = $html.Substring($rtoPickupStart, $rtoPickupEnd - $rtoPickupStart)
# Due to nesting, this regex/index search is risky.
# Let's do it cleanly by extracting the content between specific markers.
