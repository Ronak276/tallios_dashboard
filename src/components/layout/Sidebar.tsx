import { useState } from 'react';
import { 
  LayoutGrid, Users, ClipboardList, Cubes, MapPin, 
  MoreVertical, LogOut 
} from '../icons/Icons';

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
  const [showUserMenu, setShowUserMenu] = useState(false);

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

      {/* User Footer Profile & Dropdown */}
      <div style={{
        padding: '0.75rem 0.85rem',
        borderTop: '1px solid var(--sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            backgroundColor: darkMode 
              ? (currentUser?.role === 'Staff' ? 'rgba(2, 132, 199, 0.2)' : '#1E293B')
              : (currentUser?.role === 'Staff' ? '#e0f2fe' : '#fff0eb'),
            color: darkMode 
              ? (currentUser?.role === 'Staff' ? '#38bdf8' : '#60A5FA')
              : (currentUser?.role === 'Staff' ? '#0284c7' : '#1C2C60'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.75rem',
            border: darkMode 
              ? (currentUser?.role === 'Staff' ? '1px solid #0369a1' : '1px solid #334155')
              : (currentUser?.role === 'Staff' ? '1px solid #bae6fd' : '1px solid #ffd8cc')
          }}>
            {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'TO'}
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-user-details" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>{currentUser?.name || "Tallio's Ops"}</span>
                <span style={{
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  padding: '1px 4px',
                  backgroundColor: currentUser?.role === 'Staff' 
                    ? (darkMode ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe')
                    : (darkMode ? 'rgba(59, 130, 246, 0.2)' : '#fff0eb'),
                  color: currentUser?.role === 'Staff' 
                    ? (darkMode ? '#38bdf8' : '#0284c7')
                    : (darkMode ? '#60A5FA' : '#1C2C60'),
                  border: currentUser?.role === 'Staff' 
                    ? (darkMode ? '1px solid #0369a1' : '1px solid #bae6fd')
                    : (darkMode ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #ffd8cc'),
                  textTransform: 'uppercase'
                }}>{currentUser?.role || 'SUPER ADMIN'}</span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{currentUser?.email || 'admin@tallioscoffee.com'}</span>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="rrm-btn-outline" 
              style={{ border: 'none', padding: '4px', color: 'var(--muted-foreground)' }}
              title="Account Options"
            >
              <MoreVertical size={16} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: '8px',
                  width: '180px',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
