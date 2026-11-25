import { LayoutGrid, Users, ClipboardList, Cubes, MapPin, LogOut } from '../icons/Icons';

export type TabType = 
  | 'dashboard' 
  | 'inventory' 
  | 'orders' 
  | 'trucks' 
  | 'users' 
  | 'roasting' 
  | 'loyalty' 
  | 'procurement' 
  | 'payments' 
  | 'analytics' 
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  currentUser: any;
  onLogout: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  darkMode,
  currentUser,
  onLogout
}: SidebarProps) {
  return (
    <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Brand Header */}
        <div style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          minHeight: '74px'
        }}>
          {sidebarCollapsed ? (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              padding: '4px'
            }}>
              <img
                src="/tallios_brand_logo.png"
                alt="Tallio's Icon"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                border: '1px solid #dbeafe',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                flexShrink: 0
              }}>
                <img
                  src="/tallios_brand_logo.png"
                  alt="Tallio's Coffee & Tea Co"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: darkMode ? '#ffffff' : '#172B44',
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em'
                }}>
                  Tallio’s
                </span>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#2888E6',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginTop: '3px',
                  lineHeight: 1
                }}>
                  CAFÉ OPERATIONS
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '0.25rem 0' }}>
          {/* 1. Overview */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`rrm-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutGrid size={18} />
            <span>Overview</span>
          </button>

          {/* 2. Users (App Customers) */}
          <button
            onClick={() => setActiveTab('users')}
            className={`rrm-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Users</span>
          </button>

          {/* 3. Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`rrm-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <ClipboardList size={18} />
            <span>Orders</span>
          </button>

          {/* 4. Inventory */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`rrm-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            <Cubes size={18} />
            <span>Inventory</span>
          </button>

          {/* 5. Locations */}
          <button
            onClick={() => setActiveTab('trucks')}
            className={`rrm-nav-item ${activeTab === 'trucks' ? 'active' : ''}`}
          >
            <MapPin size={18} />
            <span>Locations</span>
          </button>
        </nav>
      </div>

      <footer className="sidebar-account">
        <div className="sidebar-account-profile">
          <span className="sidebar-account-avatar" aria-hidden="true">
            {currentUser?.name?.slice(0, 2).toUpperCase() || 'TO'}
          </span>
          {!sidebarCollapsed && (
            <div className="sidebar-user-details">
              <strong title={currentUser?.name}>{currentUser?.name || "Tallio's Ops"}</strong>
              <span>{currentUser?.role || 'Super Admin'}</span>
              {currentUser?.email && <span title={currentUser.email}>{currentUser.email}</span>}
            </div>
          )}
        </div>
        <button type="button" className="sidebar-sign-out" onClick={onLogout} aria-label="Sign out" title="Sign out">
          <LogOut size={17} />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
      </footer>
    </aside>
  );
}
