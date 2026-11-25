import { SidebarToggle, Sun, Moon } from '../icons/Icons';
import type { TabType } from './Sidebar';

interface HeaderProps {
  activeTab: TabType;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export function Header({
  activeTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  darkMode,
  setDarkMode,
}: HeaderProps) {
  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview';
      case 'inventory':
        return 'Raw Ingredients & Stock';
      case 'orders':
        return 'Orders';
      case 'trucks':
        return 'Mobile Food Trucks & Units';
      case 'users':
        return 'Users & Customers';
      case 'roasting':
        return 'Roasting & Batch Logs';
      case 'loyalty':
        return 'Mug Club & Subscriptions';
      case 'procurement':
        return 'Purchase Orders & Suppliers';
      case 'analytics':
        return 'COGS & Profit Margins';
      case 'payments':
        return 'Payments & Revenue Settlement';
      case 'settings':
        return 'Cafe Settings';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Sidebar toggle button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Toggle Sidebar"
        >
          <SidebarToggle size={18} />
        </button>

        {/* Separator line */}
        <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border)' }} />

        {/* Breadcrumb title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'capitalize' }}>
            {getTabTitle(activeTab)}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rrm-btn-outline"
          style={{ padding: '4px 8px', color: '#1C2C60' }}
          title="Toggle Theme"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
