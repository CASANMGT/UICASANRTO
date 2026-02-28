import { Select } from './select'

export function AppSidebar({
  mobileNavOpen,
  sidebarCollapsed,
  onOverlayClick,
  onToggleCollapse,
  navItems,
  activeTab,
  onSelectTab,
  counts,
  changelogItems,
}) {
  return (
    <>
      <div className={`app-sidebar-overlay ${mobileNavOpen ? 'open' : ''}`} onClick={onOverlayClick} />
      <aside className={`app-sidebar ${mobileNavOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="app-sidebar-header">
          <div className="app-sidebar-title-wrap">
            <div className="app-brand-title">CASAN Operations</div>
            <div className="app-brand-subtitle">RTO & Rental</div>
            <details className="app-changelog">
              <summary className="app-changelog-summary">📘 Changelog</summary>
              <div className="app-changelog-list">
                {changelogItems.map((item) => (
                  <div key={item.version} className="app-changelog-card">
                    <div className="app-changelog-head">
                      <div className="app-changelog-version">{item.version}</div>
                      <div className="app-changelog-date">{item.date}</div>
                    </div>
                    <ul>
                      {item.notes.map((note) => (
                        <li key={`${item.version}-${note}`} className="app-changelog-note">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </div>
          <button className="app-collapse-btn" type="button" onClick={onToggleCollapse}>
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav className="app-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`app-nav-item ${activeTab === item.key ? 'active' : ''}`}
              title={item.label}
              onClick={() => onSelectTab(item.key)}
            >
              <span className="app-nav-icon">{item.icon}</span>
              <span className="app-nav-label">{item.label}</span>
              <span className="app-nav-count">{counts[item.key] || 0}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}

export function AppTopbar({ activeLabel, onMenuToggle, ready, error, partner, onPartnerChange }) {
  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        <button className="app-menu-btn" type="button" onClick={onMenuToggle}>
          ☰
        </button>
        <h1 className="app-topbar-title">{activeLabel}</h1>
      </div>
      <div className="app-topbar-right">
        {!ready && !error && <span className="app-status-loading">Loading...</span>}
        {!!error && <span className="app-status-error">{error}</span>}
        <label className="app-partner-label" htmlFor="partnerFilter">
          Partner
        </label>
        <Select
          id="partnerFilter"
          variant="legacy"
          className="app-partner-select"
          value={partner}
          onChange={(e) => onPartnerChange(e.target.value)}
        >
          <option value="all">All Partners</option>
          <option value="tangkas">Tangkas</option>
          <option value="maka">Maka</option>
          <option value="united">United</option>
        </Select>
      </div>
    </header>
  )
}
