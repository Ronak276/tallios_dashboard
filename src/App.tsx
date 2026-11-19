import React from 'react';
import type { 
  InventoryItem, KioskOrder, StockAdjustmentLog, 
  LocationId, ItemCategory, LoyaltyMember, PurchaseOrder, PaymentTransaction, CustomerUser 
} from './types';
import { 
  INITIAL_INVENTORY, LOCATIONS, INITIAL_ORDERS, 
  RECENT_LOGS, LOYALTY_MEMBERS, INITIAL_PURCHASE_ORDERS, INITIAL_PAYMENTS, INITIAL_CUSTOMERS 
} from './data/mockData';
import { 
  LayoutGrid, Package, 
  Users, SidebarToggle, 
  Sun, Moon, MoreVertical, Plus, 
  CheckCircle, DollarSign, AlertTriangle, X, List, Grid,
  ClipboardList, Cubes, MapPin
} from './components/icons/Icons';
import { GradientAreaChart } from './components/charts/GradientAreaChart';
import { DashboardAnalytics } from './components/analytics/DashboardAnalytics';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { EditItemModal, ViewItemModal } from './components/modals/ItemActionModals';
import { OverviewPage } from './pages/OverviewPage';
import { InventoryPage } from './pages/InventoryPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { UsersPage } from './pages/UsersPage';
import { LogOut } from './components/icons/Icons';
import { supabase, SUPER_ADMIN_CREDENTIALS, STAFF_CREDENTIALS } from './lib/supabase';

export function App() {
  const [darkMode, setDarkMode] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'inventory' | 'orders' | 'trucks' | 'users' | 'roasting' | 'loyalty' | 'procurement' | 'payments' | 'analytics' | 'settings'>('dashboard');
  const [selectedLocation, setSelectedLocation] = React.useState<LocationId | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // State for inventory, orders, members, purchase orders, payments, and customers
  const [inventory, setInventory] = React.useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('tallios_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [orders, setOrders] = React.useState<KioskOrder[]>(() => {
    const saved = localStorage.getItem('tallios_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [logs, setLogs] = React.useState<StockAdjustmentLog[]>(() => {
    const saved = localStorage.getItem('tallios_logs');
    return saved ? JSON.parse(saved) : RECENT_LOGS;
  });

  const [members, setMembers] = React.useState<LoyaltyMember[]>(() => {
    const saved = localStorage.getItem('tallios_members');
    return saved ? JSON.parse(saved) : LOYALTY_MEMBERS;
  });

  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('tallios_pos');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [payments, setPayments] = React.useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('tallios_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [customers, setCustomers] = React.useState<CustomerUser[]>(() => {
    const saved = localStorage.getItem('tallios_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // Supabase Database Real-time Sync for Customers
  React.useEffect(() => {
    // 1. Fetch initial customers from Supabase table
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: CustomerUser[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            email: d.email,
            phone: d.phone || '+1 (415) 555-0199',
            avatar: d.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=1C2C60&color=fff`,
            membership: d.membership || 'Regular',
            status: d.status || 'Active',
            totalOrders: d.total_orders || 0,
            totalSpend: Number(d.total_spend || 0),
            loyaltyPoints: d.loyalty_points || 0,
            favoriteDrink: d.favorite_drink || 'Drip Coffee',
            preferredLocation: d.preferred_location || 'Bayview Café',
            lastOrderDate: d.last_order_at ? new Date(d.last_order_at).toLocaleDateString() : 'Just now',
            joinedDate: d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Today',
          }));
          setCustomers(mapped);
          localStorage.setItem('tallios_customers', JSON.stringify(mapped));
        }
      } catch (err) {
        console.warn('Note on Supabase table fetch:', err);
      }
    };

    fetchCustomers();
  }, []);

  React.useEffect(() => {
    localStorage.setItem('tallios_customers', JSON.stringify(customers));
  }, [customers]);
  
  // Modals & Action States
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showAdjustModal, setShowAdjustModal] = React.useState(false);
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [showPOModal, setShowPOModal] = React.useState(false);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authMode] = React.useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = React.useState<{ name: string; email: string; role: string; assignedLocation?: string } | null>(() => {
    const saved = localStorage.getItem('tallios_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Supabase Auth listener to restore/sync sessions
  React.useEffect(() => {
    // Check initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const isStaff = (session.user.email || '').toLowerCase() === STAFF_CREDENTIALS.email.toLowerCase();
        const fallbackCreds = isStaff ? STAFF_CREDENTIALS : SUPER_ADMIN_CREDENTIALS;
        const userObj = {
          name: metadata.name || fallbackCreds.name,
          email: session.user.email || fallbackCreds.email,
          role: metadata.role || fallbackCreds.role,
          assignedLocation: metadata.assignedLocation || fallbackCreds.assignedLocation,
        };
        setCurrentUser(userObj);
        localStorage.setItem('tallios_user', JSON.stringify(userObj));
      }
    });

    // Listen to Auth State changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const isStaff = (session.user.email || '').toLowerCase() === STAFF_CREDENTIALS.email.toLowerCase();
        const fallbackCreds = isStaff ? STAFF_CREDENTIALS : SUPER_ADMIN_CREDENTIALS;
        const userObj = {
          name: metadata.name || fallbackCreds.name,
          email: session.user.email || fallbackCreds.email,
          role: metadata.role || fallbackCreds.role,
          assignedLocation: metadata.assignedLocation || fallbackCreds.assignedLocation,
        };
        setCurrentUser(userObj);
        localStorage.setItem('tallios_user', JSON.stringify(userObj));
      } else {
        setCurrentUser(null);
        localStorage.removeItem('tallios_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const [showEditItemModal, setShowEditItemModal] = React.useState(false);
  const [showViewItemModal, setShowViewItemModal] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  // Per-module View Mode States (Default: 'table')
  const [ordersViewMode, setOrdersViewMode] = React.useState<'table' | 'card'>('table');

  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = React.useState<KioskOrder | null>(null);
  const [selectedItemForAction, setSelectedItemForAction] = React.useState<InventoryItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Sync to local storage
  React.useEffect(() => {
    localStorage.setItem('tallios_inventory', JSON.stringify(inventory));
  }, [inventory]);

  React.useEffect(() => {
    localStorage.setItem('tallios_orders', JSON.stringify(orders));
  }, [orders]);

  React.useEffect(() => {
    localStorage.setItem('tallios_logs', JSON.stringify(logs));
  }, [logs]);

  React.useEffect(() => {
    localStorage.setItem('tallios_members', JSON.stringify(members));
  }, [members]);

  React.useEffect(() => {
    localStorage.setItem('tallios_pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  React.useEffect(() => {
    localStorage.setItem('tallios_payments', JSON.stringify(payments));
  }, [payments]);

  // New Item Form State
  const [newItem, setNewItem] = React.useState({
    name: '',
    sku: '',
    category: 'Beans & Roasts' as ItemCategory,
    stock: 10,
    unit: 'kg' as InventoryItem['unit'],
    minThreshold: 5,
    costPerUnit: 15.0,
    locationId: 'loc-main' as LocationId,
    batchNumber: 'LOT-2026-NEW',
    expiryDate: '2027-01-01',
  });

  // Adjust Stock Form State
  const [adjustData, setAdjustData] = React.useState({
    amount: 1,
    type: 'Wastage / Dial-in' as StockAdjustmentLog['type'],
    reason: 'Dial-in grinder calibration',
  });

  // Transfer Form State
  const [transferData, setTransferData] = React.useState({
    fromLocation: 'loc-main' as LocationId,
    toLocation: 'loc-truck-1' as LocationId,
    amount: 5,
  });

  // New PO State
  const [newPO, setNewPO] = React.useState({
    supplier: 'Red Star Coffee Roasters',
    itemsSummary: '2x 25kg Organic Espresso Beans + 10x Monin Syrups',
    totalCost: 540.00,
  });

  // Recharts Data: Daily Kiosk & QR Orders vs Ingredient Batch Depletions
  const chartData = [
    { date: "Sep 25", checklists: 42, talks: 28 },
    { date: "Sep 26", checklists: 48, talks: 32 },
    { date: "Sep 27", checklists: 55, talks: 30 },
    { date: "Sep 28", checklists: 60, talks: 35 },
    { date: "Sep 29", checklists: 68, talks: 38 },
    { date: "Sep 30", checklists: 74, talks: 42 },
    { date: "Oct 01", checklists: 82, talks: 45 },
  ];

  // Apply dark mode class to html
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Location ID mapping helper
  const getEffectiveLocationId = (locName?: string): LocationId | 'all' => {
    if (!locName || currentUser?.role !== 'Staff') return selectedLocation;
    const lower = locName.toLowerCase();
    if (lower.includes('truck #1') || lower.includes('truck1') || lower.includes('downtown')) return 'loc-truck-1';
    if (lower.includes('truck #2') || lower.includes('truck2') || lower.includes('harbor') || lower.includes('farmers')) return 'loc-truck-2';
    if (lower.includes('kiosk') || lower.includes('tech park')) return 'loc-kiosk-tech';
    return 'loc-main';
  };

  const activeScopeLocationId = getEffectiveLocationId(currentUser?.assignedLocation);

  // Scoped Data by User Role & Location
  const scopedInventory = currentUser?.role === 'Staff'
    ? inventory.filter(item => item.locationId === activeScopeLocationId)
    : (selectedLocation === 'all' ? inventory : inventory.filter(item => item.locationId === selectedLocation));

  const scopedOrders = currentUser?.role === 'Staff'
    ? orders.filter(order => order.locationId === activeScopeLocationId)
    : (selectedLocation === 'all' ? orders : orders.filter(order => order.locationId === selectedLocation));

  // KPI Calculations (Scoped)
  const totalSKUs = scopedInventory.length;
  const lowStockCount = scopedInventory.filter(i => i.status === 'Low Stock' || i.status === 'Critical').length;
  const totalValuation = scopedInventory.reduce((sum, item) => sum + (item.stock * item.costPerUnit), 0);
  const totalSubscriptionRevenue = members
    .filter(m => m.subscriptionPlan !== 'None')
    .reduce((sum, m) => sum + m.monthlySpend, 0);

  // Actions
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sku) return;
    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: newItem.sku.toUpperCase(),
      name: newItem.name,
      category: newItem.category,
      stock: Number(newItem.stock),
      unit: newItem.unit,
      minThreshold: Number(newItem.minThreshold),
      costPerUnit: Number(newItem.costPerUnit),
      locationId: newItem.locationId,
      batchNumber: newItem.batchNumber,
      expiryDate: newItem.expiryDate,
      lastUpdated: 'Just now',
      status: Number(newItem.stock) <= Number(newItem.minThreshold) ? 'Low Stock' : 'In Stock',
    };

    setInventory(prev => [item, ...prev]);
    setShowAddModal(false);
    triggerToast(`Added ${item.name} to coffee inventory!`);
    setNewItem({
      name: '',
      sku: '',
      category: 'Beans & Roasts',
      stock: 10,
      unit: 'kg',
      minThreshold: 5,
      costPerUnit: 15.0,
      locationId: 'loc-main',
      batchNumber: 'LOT-2026-NEW',
      expiryDate: '2027-01-01',
    });
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAction) return;

    const diff = adjustData.type === 'Restock' ? Number(adjustData.amount) : -Number(adjustData.amount);
    const newStock = Math.max(0, selectedItemForAction.stock + diff);
    
    let newStatus: InventoryItem['status'] = 'In Stock';
    if (newStock === 0) newStatus = 'Out of Stock';
    else if (newStock <= selectedItemForAction.minThreshold * 0.5) newStatus = 'Critical';
    else if (newStock <= selectedItemForAction.minThreshold) newStatus = 'Low Stock';

    setInventory(prev => prev.map(item => {
      if (item.id === selectedItemForAction.id) {
        return {
          ...item,
          stock: Number(newStock.toFixed(2)),
          status: newStatus,
          lastUpdated: 'Just now'
        };
      }
      return item;
    }));

    // Add to logs
    const newLog: StockAdjustmentLog = {
      id: `log-${Date.now()}`,
      itemId: selectedItemForAction.id,
      itemName: selectedItemForAction.name,
      type: adjustData.type,
      amount: diff,
      unit: selectedItemForAction.unit,
      reason: adjustData.reason,
      timestamp: 'Just now',
      user: 'Head Barista (Chloe)',
    };
    setLogs(prev => [newLog, ...prev]);

    setShowAdjustModal(false);
    triggerToast(`Updated ${selectedItemForAction.name} (${diff > 0 ? '+' : ''}${diff} ${selectedItemForAction.unit})`);
  };

  const handleTransferStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAction) return;
    if (transferData.fromLocation === transferData.toLocation) {
      alert("Source and Destination units must be different!");
      return;
    }

    const transferAmount = Number(transferData.amount);
    if (selectedItemForAction.stock < transferAmount) {
      alert("Insufficient stock at source unit!");
      return;
    }

    setInventory(prev => prev.map(item => {
      if (item.id === selectedItemForAction.id) {
        const remaining = item.stock - transferAmount;
        return {
          ...item,
          stock: Number(remaining.toFixed(2)),
          status: remaining <= item.minThreshold ? 'Low Stock' : 'In Stock',
          lastUpdated: 'Just now'
        };
      }
      return item;
    }));

    const fromLocName = LOCATIONS.find(l => l.id === transferData.fromLocation)?.name;
    const toLocName = LOCATIONS.find(l => l.id === transferData.toLocation)?.name;

    const newLog: StockAdjustmentLog = {
      id: `log-${Date.now()}`,
      itemId: selectedItemForAction.id,
      itemName: selectedItemForAction.name,
      type: 'Inter-location Transfer',
      amount: -transferAmount,
      unit: selectedItemForAction.unit,
      reason: `Transfer from ${fromLocName} to ${toLocName}`,
      timestamp: 'Just now',
      user: 'Fleet Ops Supervisor',
    };
    setLogs(prev => [newLog, ...prev]);

    setShowTransferModal(false);
    triggerToast(`Dispatched ${transferAmount} ${selectedItemForAction.unit} to ${toLocName}!`);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplier: newPO.supplier,
      itemsSummary: newPO.itemsSummary,
      totalCost: Number(newPO.totalCost),
      status: 'Sent to Supplier',
      orderDate: 'Today, Just now',
    };
    setPurchaseOrders(prev => [po, ...prev]);
    setShowPOModal(false);
    triggerToast(`Purchase Order ${po.poNumber} sent to coffee roaster/supplier!`);
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: KioskOrder['orderStatus']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: nextStatus } : o));
    triggerToast(`Order status updated to ${nextStatus}!`);
  };

  const handleAddStamp = (memberId: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const nextStamps = (m.stampsCount + 1) % 11;
        const pts = m.points + 25;
        return {
          ...m,
          stampsCount: nextStamps === 0 ? 1 : nextStamps,
          points: pts,
          lastVisit: 'Just now'
        };
      }
      return m;
    }));
    triggerToast(`10-Cup punch card stamp recorded (+25 points)!`);
  };

  // If user is logged out, render the Full-Screen Login / Signup Page
  if (!currentUser) {
    return (
      <AuthPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('tallios_user', JSON.stringify(user));
          triggerToast(`Welcome back, ${user.name}!`);
        }}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className="app-container">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#1C2C60',
          color: '#ffffff',
          padding: '8px 14px',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 4px 14px rgba(255, 78, 0, 0.4)'
        }}>
          <CheckCircle size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TALLIO'S OS DEDICATED COFFEE SIDEBAR */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div>
          {/* Logo Brand Header matching Tallio's Cafe Operations exactly */}
          <div style={{
            padding: sidebarCollapsed ? '0.75rem 0.5rem' : '1.25rem 1.25rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid var(--sidebar-border)',
            marginBottom: '0.5rem'
          }}>
            {sidebarCollapsed ? (
              <div style={{
                width: '42px',
                height: '42px',
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
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
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
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
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

          {/* Dedicated Navigation Items matching Image 2 */}
          <nav style={{ padding: '0.25rem 0' }}>
            {/* 1. Overview */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`rrm-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutGrid size={18} />
              <span>Overview</span>
            </button>

            {/* 2. Users (App Customers) - Placed directly after Overview */}
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

        {/* User Footer Profile: Store Manager / Head Barista & Dropdown */}
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
                    onClick={async () => {
                      setShowUserMenu(false);
                      await supabase.auth.signOut();
                      setCurrentUser(null);
                      localStorage.removeItem('tallios_user');
                      triggerToast('Logged out successfully');
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

      {/* MAIN VIEW */}
      <div className="app-main">
        
        {/* TOPBAR NAVBAR */}
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
                alignItems: 'center'
              }}
              title="Toggle Sidebar"
            >
              <SidebarToggle size={18} />
            </button>

            {/* Separator line */}
            <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border)' }}></div>

            {/* Breadcrumb title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'capitalize' }}>
                {activeTab === 'dashboard' ? 'Overview' : 
                 activeTab === 'inventory' ? 'Raw Ingredients & Stock' : 
                 activeTab === 'orders' ? 'Live Kiosk & QR Orders' : 
                 activeTab === 'trucks' ? 'Mobile Food Trucks & Units' : 
                 activeTab === 'users' ? 'Users & Customers' :
                 activeTab === 'roasting' ? 'Roasting & Batch Logs' : 
                 activeTab === 'loyalty' ? 'Mug Club & Subscriptions' : 
                 activeTab === 'procurement' ? 'Purchase Orders & Suppliers' : 
                 activeTab === 'analytics' ? 'COGS & Profit Margins' : 'Cafe Settings'}
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

        {/* WORKSPACE CONTENT BODY */}
        <main className="app-content">
          
          {/* TAB 0: DASHBOARD OVERVIEW (PICTURE-PERFECT TO THE DESIGN) */}
          {activeTab === 'dashboard' && (
            <OverviewPage
              selectedLocation={selectedLocation}
              onLocationChange={(loc) => setSelectedLocation(loc)}
              onNavigateToOrders={() => setActiveTab('orders')}
              onNavigateToInventory={() => setActiveTab('inventory')}
              onNewOrder={() => setShowAddModal(true)}
              userRole={currentUser?.role}
              userLocation={currentUser?.assignedLocation}
            />
          )}

          {/* STATS OVERVIEW CARDS (FOR OTHER TABS) */}
          {activeTab !== 'dashboard' && activeTab !== 'users' && (
            <div className="stats-grid">
              <div className="rrm-card">
                <div className="rrm-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>Total Coffee SKUs</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{totalSKUs}</h3>
                    <p style={{ fontSize: '0.625rem', color: '#10b981', marginTop: '2px' }}>● 100% active cafe catalog</p>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', color: '#1C2C60' }}>
                    <Package size={20} />
                  </div>
                </div>
              </div>

              <div className="rrm-card">
                <div className="rrm-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>Low Stock Warnings</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#1C2C60' }}>{lowStockCount}</h3>
                    <p style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>Below safe replenishment point</p>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </div>

              <div className="rrm-card">
                <div className="rrm-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>Inventory Valuation</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <p style={{ fontSize: '0.625rem', color: '#10b981', marginTop: '2px' }}>At wholesale cost base</p>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', color: '#1C2C60' }}>
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>

              <div className="rrm-card">
                <div className="rrm-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>Mug Club MRR</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>${totalSubscriptionRevenue.toFixed(2)}</h3>
                    <p style={{ fontSize: '0.625rem', color: '#10b981', marginTop: '2px' }}>Monthly recurring coffee club</p>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', color: '#1C2C60' }}>
                    <Users size={20} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: RAW INGREDIENTS & COFFEE STOCK */}
          {activeTab === 'inventory' && (
            <InventoryPage
              inventory={scopedInventory}
              setInventory={setInventory}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenAddModal={() => setShowAddModal(true)}
              onViewItem={(item) => {
                setSelectedItemForAction(item);
                setShowViewItemModal(true);
              }}
              onEditItem={(item) => {
                setSelectedItemForAction(item);
                setShowEditItemModal(true);
              }}
              onAdjustStock={(item) => {
                setSelectedItemForAction(item);
                setShowAdjustModal(true);
              }}
              onTransferStock={(item) => {
                setSelectedItemForAction(item);
                setShowTransferModal(true);
              }}
              triggerToast={triggerToast}
            />
          )}

          {/* TAB 2: LIVE KIOSK & QR ORDERS */}
          {activeTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Kiosk & QR Order Feed</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>Self-service terminal orders synced with Stripe charge authorization</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Table vs Card Icon-only Toggle */}
                  <div style={{ display: 'inline-flex', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
                    <button
                      onClick={() => setOrdersViewMode('table')}
                      style={{
                        padding: '5px 9px',
                        border: 'none',
                        background: ordersViewMode === 'table' ? 'var(--primary)' : 'transparent',
                        color: ordersViewMode === 'table' ? '#ffffff' : 'var(--muted-foreground)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Table View (Default)"
                    >
                      <List size={15} />
                    </button>
                    <button
                      onClick={() => setOrdersViewMode('card')}
                      style={{
                        padding: '5px 9px',
                        border: 'none',
                        borderLeft: '1px solid var(--border)',
                        background: ordersViewMode === 'card' ? 'var(--primary)' : 'transparent',
                        color: ordersViewMode === 'card' ? '#ffffff' : 'var(--muted-foreground)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Card View"
                    >
                      <Grid size={15} />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const newOrd: KioskOrder = {
                        id: `ord-${Date.now()}`,
                        orderNumber: `#TL-${Math.floor(4000 + Math.random() * 1000)}`,
                        channel: 'Self-Service Kiosk',
                        locationId: 'loc-main',
                        customerName: 'Guest Terminal #2',
                        items: [
                          { name: 'Iced Vanilla Oat Latte', quantity: 1, price: 6.50 },
                          { name: 'Fresh Croissant', quantity: 1, price: 4.50 },
                        ],
                        totalAmount: 11.00,
                        stripeStatus: 'Paid',
                        stripeChargeId: `ch_${Math.random().toString(36).substring(7)}`,
                        orderStatus: 'Incoming',
                        createdAt: 'Just now',
                      };
                      setOrders(prev => [newOrd, ...prev]);
                      triggerToast(`Incoming order received: ${newOrd.orderNumber}!`);
                    }}
                    className="rrm-btn-primary"
                  >
                    <Plus size={14} /> + Simulate Incoming Kiosk Order
                  </button>
                </div>
              </div>

              {ordersViewMode === 'table' ? (
                <div className="rrm-card">
                  <div className="rrm-table-wrapper" style={{ border: 'none' }}>
                    <table className="rrm-table">
                      <thead>
                        <tr>
                          <th>ORDER</th>
                          <th>CUSTOMER</th>
                          <th>CHANNEL</th>
                          <th>ITEMS SUMMARY</th>
                          <th style={{ textAlign: 'right' }}>TOTAL</th>
                          <th>PAYMENT</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scopedOrders.map(order => (
                          <tr key={order.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                              {order.orderNumber}
                            </td>
                            <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                            <td style={{ fontSize: '0.75rem' }}>{order.channel}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                              {order.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                              ${order.totalAmount.toFixed(2)}
                            </td>
                            <td>
                              <span className="rrm-badge rrm-badge-valid">✓ {order.stripeStatus}</span>
                            </td>
                            <td>
                              <span style={{ 
                                fontSize: '0.6875rem', 
                                fontWeight: 700,
                                padding: '2px 8px',
                                backgroundColor: order.orderStatus === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(28, 44, 96, 0.08)',
                                color: order.orderStatus === 'Completed' ? '#10b981' : 'var(--primary)',
                                border: '1px solid var(--border)'
                              }}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setSelectedOrderForReceipt(order);
                                    setShowReceiptModal(true);
                                  }}
                                  className="rrm-btn-outline"
                                  style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                                >
                                  Receipt
                                </button>
                                {order.orderStatus === 'Incoming' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'Brewing / Prep')}
                                    className="rrm-btn-primary"
                                    style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                                  >
                                    Prep
                                  </button>
                                )}
                                {order.orderStatus === 'Brewing / Prep' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'Ready for Pickup')}
                                    className="rrm-btn-primary"
                                    style={{ padding: '3px 8px', fontSize: '0.6875rem', backgroundColor: '#10b981', borderColor: '#10b981' }}
                                  >
                                    Ready
                                  </button>
                                )}
                                {order.orderStatus === 'Ready for Pickup' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'Completed')}
                                    className="rrm-btn-outline"
                                    style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                                  >
                                    Done
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm(`Remove order ${order.orderNumber}?`)) {
                                      setOrders(prev => prev.filter(o => o.id !== order.id));
                                      triggerToast(`Order removed`);
                                    }
                                  }}
                                  className="rrm-btn-outline"
                                  style={{ padding: '3px 6px', fontSize: '0.6875rem', borderColor: '#ef4444', color: '#ef4444' }}
                                  title="Delete order"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="cards-three-grid">
                {scopedOrders.map(order => {
                  const loc = LOCATIONS.find(l => l.id === order.locationId);
                  return (
                    <div key={order.id} className="rrm-card">
                      <div className="rrm-card-header" style={{ backgroundColor: 'var(--muted)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C2C60', fontFamily: 'monospace' }}>{order.orderNumber}</span>
                            <span style={{ fontSize: '0.625rem', padding: '2px 6px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', fontWeight: 600 }}>
                              {order.channel}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>{order.customerName}</p>
                        </div>
                        <span className="rrm-badge rrm-badge-valid">
                          ✓ {order.stripeStatus}
                        </span>
                      </div>

                      <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Location: {loc?.name.replace("Tallio's ", "")}</span>
                          <span>{order.createdAt}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
                          {order.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                              <div>
                                <span style={{ fontWeight: 600 }}>{it.quantity}x</span> {it.name}
                                {it.options && <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', paddingLeft: '12px' }}>{it.options}</div>}
                              </div>
                              <span style={{ fontWeight: 500 }}>${(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 700 }}>Total Paid:</span>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C2C60' }}>${order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Stripe ID: {order.stripeChargeId}
                        </div>
                      </div>

                      <div className="rrm-card-footer" style={{ backgroundColor: 'var(--card)' }}>
                        <button
                          onClick={() => {
                            setSelectedOrderForReceipt(order);
                            setShowReceiptModal(true);
                          }}
                          className="rrm-btn-outline"
                          style={{ padding: '2px 6px', fontSize: '0.6875rem' }}
                        >
                          Receipt
                        </button>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {order.orderStatus === 'Incoming' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Brewing / Prep')}
                              className="rrm-btn-primary"
                              style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                            >
                              Start Prep
                            </button>
                          )}
                          {order.orderStatus === 'Brewing / Prep' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Ready for Pickup')}
                              className="rrm-btn-primary"
                              style={{ padding: '3px 8px', fontSize: '0.6875rem', backgroundColor: '#10b981', borderColor: '#10b981' }}
                            >
                              Ready
                            </button>
                          )}
                          {order.orderStatus === 'Ready for Pickup' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'Completed')}
                              className="rrm-btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                            >
                              Complete
                            </button>
                          )}
                          {order.orderStatus === 'Completed' && (
                            <span style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 600 }}>Done ✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* TAB 3: FOOD TRUCKS & UNITS */}
          {activeTab === 'trucks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="two-col-grid">
                {LOCATIONS.map(loc => {
                  const locStock = inventory.filter(i => i.locationId === loc.id);
                  const locLowStock = locStock.filter(i => i.status !== 'In Stock').length;
                  return (
                    <div key={loc.id} className="rrm-card">
                      <div className="rrm-card-header">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{loc.name}</span>
                            <span style={{ fontSize: '0.625rem', padding: '2px 6px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', textTransform: 'uppercase', fontWeight: 600 }}>
                              {loc.type}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>{loc.address}</p>
                        </div>
                        <span className="rrm-badge rrm-badge-orange">
                          {loc.activeOrders} Active Orders
                        </span>
                      </div>

                      <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.75rem' }}>
                          <div style={{ padding: '8px 12px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Tracked SKUs</span>
                            <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>{locStock.length}</span>
                          </div>
                          <div style={{ padding: '8px 12px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Items Low/Critical</span>
                            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1C2C60' }}>{locLowStock}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Key Supplies On Unit:</div>
                          {locStock.slice(0, 3).map(it => (
                            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                              <span>{it.name}</span>
                              <span style={{ fontWeight: 600 }}>{it.stock} {it.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rrm-card-footer">
                        <span style={{ fontSize: '0.6875rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                          ● GPS & Food Truck POS Live
                        </span>
                        <button
                          onClick={() => {
                            setSelectedLocation(loc.id);
                            setActiveTab('inventory');
                          }}
                          className="rrm-btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.6875rem' }}
                        >
                          View Unit Stock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ROASTING & BATCHES */}
          {activeTab === 'roasting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rrm-card">
                <div className="rrm-card-header">
                  <div>
                    <h3 className="rrm-card-title uppercase">Coffee Bean Roasting & Batch Logs</h3>
                    <p className="rrm-card-description">Dial-in wastage records, roast date tracking, and lot origins</p>
                  </div>
                </div>

                <div className="rrm-table-wrapper" style={{ border: 'none' }}>
                  <table className="rrm-table">
                    <thead>
                      <tr>
                        <th>Batch / Lot</th>
                        <th>Origin & Profile</th>
                        <th>Location</th>
                        <th>Current On-Hand</th>
                        <th>Expiry / Best Before</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.filter(i => i.category === 'Beans & Roasts').map(bean => (
                        <tr key={bean.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1C2C60' }}>
                            {bean.batchNumber}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{bean.name}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Single Origin / Espresso Blend</div>
                          </td>
                          <td style={{ fontSize: '0.75rem' }}>
                            {LOCATIONS.find(l => l.id === bean.locationId)?.name}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {bean.stock} {bean.unit}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                            {bean.expiryDate}
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setSelectedItemForAction(bean);
                                setShowAdjustModal(true);
                              }}
                              className="rrm-btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                            >
                              Log Dial-in Waste
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RECENT WASTAGE LOGS */}
              <div className="rrm-card">
                <div className="rrm-card-header">
                  <h3 className="rrm-card-title uppercase">Recent Dial-in Grinder Calibrations</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {logs.map(log => (
                    <div key={log.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: log.amount > 0 ? '#10b981' : '#1C2C60' }}>
                          {log.amount > 0 ? `+${log.amount}` : log.amount} {log.unit}
                        </span>
                        <span style={{ marginLeft: '6px' }}>— {log.itemName} ({log.reason})</span>
                      </div>
                      <span style={{ color: 'var(--muted-foreground)', fontSize: '0.6875rem' }}>{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MUG CLUB & LOYALTY */}
          {activeTab === 'loyalty' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rrm-card">
                <div className="rrm-card-header">
                  <div>
                    <h3 className="rrm-card-title uppercase">Tallio's Mug Club Subscribers & Loyalty</h3>
                    <p className="rrm-card-description">Recurring coffee club memberships & digital 10-cup punch cards</p>
                  </div>
                </div>

                <div className="rrm-table-wrapper" style={{ border: 'none' }}>
                  <table className="rrm-table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>VIP Tier</th>
                        <th>Subscription Plan</th>
                        <th>Stamp Card (10 Cups)</th>
                        <th>Points Balance</th>
                        <th>Monthly Spend</th>
                        <th>Last Visit</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(member => (
                        <tr key={member.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{member.name}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{member.email}</div>
                          </td>
                          <td>
                            <span className={`rrm-badge ${
                              member.tier === 'Gold Roaster' 
                                ? 'rrm-badge-warning'
                                : 'rrm-badge-valid'
                            }`}>
                              ★ {member.tier}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: 500 }}>{member.subscriptionPlan}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '90px', height: '8px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                <div 
                                  style={{ height: '100%', backgroundColor: '#1C2C60', width: `${(member.stampsCount / 10) * 100}%` }}
                                />
                              </div>
                              <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace' }}>{member.stampsCount}/10</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                            {member.points} pts
                          </td>
                          <td style={{ fontWeight: 600, color: '#10b981' }}>
                            ${member.monthlySpend.toFixed(2)}/mo
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                            {member.lastVisit}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleAddStamp(member.id)}
                              className="rrm-btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.6875rem', borderColor: 'rgba(255, 78, 0, 0.4)', color: '#1C2C60' }}
                            >
                              + Stamp Cup
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PROCUREMENT / PURCHASE ORDERS */}
          {activeTab === 'procurement' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Coffee Supplier Purchase Orders</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>Replenishment orders sent to green coffee bean importers & dairy distributors</p>
                </div>
                <button
                  onClick={() => setShowPOModal(true)}
                  className="rrm-btn-primary"
                >
                  <Plus size={14} /> + Draft New PO
                </button>
              </div>

              <div className="rrm-card">
                <div className="rrm-table-wrapper" style={{ border: 'none' }}>
                  <table className="rrm-table">
                    <thead>
                      <tr>
                        <th>PO Number</th>
                        <th>Supplier</th>
                        <th>Items Summary</th>
                        <th>Total Cost</th>
                        <th>Status</th>
                        <th>Order Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map(po => (
                        <tr key={po.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1C2C60' }}>
                            {po.poNumber}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {po.supplier}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                            {po.itemsSummary}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            ${po.totalCost.toFixed(2)}
                          </td>
                          <td>
                            {po.status === 'Delivered' && (
                              <span className="rrm-badge rrm-badge-valid">✓ Delivered</span>
                            )}
                            {po.status === 'Sent to Supplier' && (
                              <span className="rrm-badge rrm-badge-orange">● Sent to Supplier</span>
                            )}
                            {po.status === 'Draft' && (
                              <span className="rrm-badge rrm-badge-warning">Draft</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                            {po.orderDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PAYMENTS & REVENUE SETTLEMENT */}
          {activeTab === 'payments' && (
            <PaymentsPage
              payments={payments}
              onAddPayment={(newTx) => {
                setPayments(prev => [newTx, ...prev]);
              }}
              onRefundPayment={(id) => {
                setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'Refunded', netRevenue: 0 } : p));
              }}
              onDeletePayment={(id) => {
                setPayments(prev => prev.filter(p => p.id !== id));
              }}
              triggerToast={triggerToast}
            />
          )}

          {/* TAB 8: USERS (APP CUSTOMERS MANAGEMENT) */}
          {activeTab === 'users' && (
            <UsersPage
              customers={customers}
              userRole={currentUser?.role}
              userLocation={currentUser?.assignedLocation}
              onAddCustomer={async (newCust) => {
                setCustomers(prev => [newCust, ...prev]);
                // Sync direct to Supabase
                try {
                  await supabase.from('customers').insert([{
                    id: newCust.id,
                    name: newCust.name,
                    email: newCust.email,
                    phone: newCust.phone,
                    avatar: newCust.avatar,
                    membership: newCust.membership,
                    status: newCust.status,
                    total_orders: newCust.totalOrders,
                    total_spend: newCust.totalSpend,
                    loyalty_points: newCust.loyaltyPoints,
                    favorite_drink: newCust.favoriteDrink,
                    preferred_location: newCust.preferredLocation,
                  }]);
                } catch (e) {
                  console.warn('Supabase customer insert sync note:', e);
                }
              }}
              onUpdateCustomer={async (updatedCust) => {
                setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
                // Sync direct to Supabase
                try {
                  await supabase.from('customers').update({
                    name: updatedCust.name,
                    email: updatedCust.email,
                    phone: updatedCust.phone,
                    membership: updatedCust.membership,
                    status: updatedCust.status,
                    favorite_drink: updatedCust.favoriteDrink,
                  }).eq('id', updatedCust.id);
                } catch (e) {
                  console.warn('Supabase customer update sync note:', e);
                }
              }}
              onDeleteCustomer={async (id) => {
                setCustomers(prev => prev.filter(c => c.id !== id));
                try {
                  await supabase.from('customers').delete().eq('id', id);
                } catch (e) {
                  console.warn('Supabase customer delete sync note:', e);
                }
              }}
              onDeleteMultipleCustomers={async (ids) => {
                setCustomers(prev => prev.filter(c => !ids.includes(c.id)));
                try {
                  await supabase.from('customers').delete().in('id', ids);
                } catch (e) {
                  console.warn('Supabase customer bulk delete sync note:', e);
                }
              }}
              triggerToast={triggerToast}
            />
          )}

          {/* TAB 8: COGS & MARGINS ANALYTICS */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rrm-card">
                <div className="rrm-card-header">
                  <div>
                    <h3 className="rrm-card-title uppercase">Live Kiosk Orders & Bean Depletions</h3>
                    <p className="rrm-card-description">Daily customer kiosk orders vs roasted bean batch consumption</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', backgroundColor: '#1C2C60', display: 'inline-block' }}></span>
                      <span style={{ fontWeight: 600 }}>Kiosk Orders (#1C2C60 Primary)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', backgroundColor: '#C68A4C', display: 'inline-block' }}></span>
                      <span style={{ fontWeight: 600 }}>Bean Batches (#C68A4C Secondary)</span>
                    </div>
                  </div>
                </div>

                <div className="rrm-card-body" style={{ paddingTop: '1.25rem', paddingBottom: '0.5rem' }}>
                  <GradientAreaChart
                    data={chartData}
                    primaryLabel="Kiosk Orders"
                    secondaryLabel="Bean Depletions"
                  />
                </div>

                <div className="rrm-card-footer" style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                  <span>Morning Rush Peak: 7:30 AM - 10:00 AM espresso volume up +28%</span>
                  <span style={{ color: '#1C2C60', fontWeight: 600 }}>Stripe Instant Settlement Live</span>
                </div>
              </div>

              <DashboardAnalytics darkMode={darkMode} />

              <div className="two-col-grid">
                <div className="rrm-card">
                  <div className="rrm-card-header">
                    <h3 className="rrm-card-title uppercase">Drink Menu Profitability & COGS</h3>
                  </div>
                  <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { item: 'Oat Milk Flat White (12oz)', cogs: '$1.42', price: '$6.25', margin: '77%' },
                      { item: 'Cold Brew w/ Salted Caramel', cogs: '$0.88', price: '$5.50', margin: '84%' },
                      { item: 'Single Origin Espresso Shot', cogs: '$0.45', price: '$3.50', margin: '87%' },
                      { item: 'Ceremonial Matcha Latte', cogs: '$1.85', price: '$6.75', margin: '72%' },
                      { item: 'Fresh French Croissant', cogs: '$1.80', price: '$4.50', margin: '60%' },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', fontSize: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{row.item}</div>
                          <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>COGS: {row.cogs} | Menu: {row.price}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.875rem' }}>{row.margin}</span>
                          <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>Gross Margin</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rrm-card">
                  <div className="rrm-card-header">
                    <h3 className="rrm-card-title uppercase">Hourly Foot Traffic & Peak Windows</h3>
                  </div>
                  <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { time: '06:30 AM - 07:30 AM', orders: 28, pct: 45, label: 'Early Commute' },
                      { time: '07:30 AM - 09:30 AM', orders: 114, pct: 95, label: 'Morning Peak Rush' },
                      { time: '09:30 AM - 11:30 AM', orders: 62, pct: 60, label: 'Mid-Morning Brews' },
                      { time: '11:30 AM - 01:30 PM', orders: 84, pct: 75, label: 'Lunch & Pastry Push' },
                      { time: '01:30 PM - 04:00 PM', orders: 36, pct: 40, label: 'Afternoon Pick-me-up' },
                    ].map((rush, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 500 }}>{rush.time} ({rush.label})</span>
                          <span style={{ fontWeight: 700, color: '#1C2C60' }}>{rush.orders} orders</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                          <div 
                            style={{ height: '100%', backgroundColor: '#1C2C60', width: `${rush.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: CAFE SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rrm-card">
                <div className="rrm-card-header">
                  <h3 className="rrm-card-title uppercase">Tallio's Cafe & Kiosk Configuration</h3>
                </div>
                <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--muted)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Stripe Terminal Connect</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Paired with 4 Kiosk Card Readers (BBPOS Chipper)</div>
                    </div>
                    <span className="rrm-badge rrm-badge-valid">Connected</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--muted)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Barista Kitchen Display System (KDS)</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Instant audio chime on incoming QR & Kiosk orders</div>
                    </div>
                    <span className="rrm-badge rrm-badge-valid">Enabled</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--muted)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Automatic Dial-in Spoilage Deduction</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Auto-deduct 350g daily for morning espresso grinder calibration</div>
                    </div>
                    <span className="rrm-badge rrm-badge-valid">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: RECEIPT VIEW */}
      {showReceiptModal && selectedOrderForReceipt && (
        <div className="modal-backdrop">
          <div className="rrm-card" style={{ width: '100%', maxWidth: '380px', padding: '1.25rem', gap: '1rem', backgroundColor: 'var(--card)' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TALLIO'S OS ROASTERY</h2>
              <p style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>Order Receipt & Stripe Proof</p>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#1C2C60', marginTop: '4px' }}>{selectedOrderForReceipt.orderNumber}</div>
            </div>

            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                <span>Customer:</span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{selectedOrderForReceipt.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                <span>Channel:</span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{selectedOrderForReceipt.channel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                <span>Stripe Charge ID:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.625rem' }}>{selectedOrderForReceipt.stripeChargeId}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {selectedOrderForReceipt.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>{it.quantity}x {it.name}</span>
                    <span style={{ fontWeight: 600 }}>${(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', fontWeight: 700, paddingTop: '4px' }}>
                <span>Total Amount:</span>
                <span style={{ color: '#1C2C60' }}>${selectedOrderForReceipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ paddingTop: '0.5rem' }}>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="rrm-btn-primary"
                style={{ width: '100%' }}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW INGREDIENT / SKU */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="rrm-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--card)' }}>
            <div className="rrm-card-header">
              <h3 className="rrm-card-title uppercase font-bold text-sm">+ Add New Cafe Ingredient / Packaging SKU</h3>
              <button onClick={() => setShowAddModal(false)} className="rrm-btn-outline" style={{ padding: '2px 6px' }}>
                <X size={15} />
              </button>
            </div>
            
            <form onSubmit={handleAddItem}>
              <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kenya Nyeri Peaberry Light Roast"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>SKU Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BN-KEN-005"
                      value={newItem.sku}
                      onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                      className="rrm-input"
                      style={{ width: '100%', fontFamily: 'monospace', textTransform: 'uppercase' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                      className="rrm-input"
                      style={{ width: '100%' }}
                    >
                      <option value="Beans & Roasts">Beans & Roasts</option>
                      <option value="Dairy & Alternative Milk">Dairy & Alternative Milk</option>
                      <option value="Syrups & Flavors">Syrups & Flavors</option>
                      <option value="Bakery & Snacks">Bakery & Snacks</option>
                      <option value="Packaging & Cups">Packaging & Cups</option>
                      <option value="Tea & Matcha">Tea & Matcha</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Initial Stock</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newItem.stock}
                      onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })}
                      className="rrm-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Unit</label>
                    <select
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as any })}
                      className="rrm-input"
                      style={{ width: '100%' }}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="units">units</option>
                      <option value="bottles">bottles</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Min Threshold</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newItem.minThreshold}
                      onChange={(e) => setNewItem({ ...newItem, minThreshold: Number(e.target.value) })}
                      className="rrm-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Wholesale Cost ($/unit)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newItem.costPerUnit}
                      onChange={(e) => setNewItem({ ...newItem, costPerUnit: Number(e.target.value) })}
                      className="rrm-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Location Assigned</label>
                    <select
                      value={newItem.locationId}
                      onChange={(e) => setNewItem({ ...newItem, locationId: e.target.value as any })}
                      className="rrm-input"
                      style={{ width: '100%' }}
                    >
                      {LOCATIONS.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rrm-card-footer" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="rrm-btn-outline">
                  Cancel
                </button>
                <button type="submit" className="rrm-btn-primary">
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST STOCK / LOG WASTE */}
      {showAdjustModal && selectedItemForAction && (
        <div className="modal-backdrop">
          <div className="rrm-card" style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--card)' }}>
            <div className="rrm-card-header">
              <div>
                <h3 className="rrm-card-title uppercase font-bold text-sm">Adjust Stock / Log Wastage</h3>
                <p className="rrm-card-description">{selectedItemForAction.name} ({selectedItemForAction.sku})</p>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="rrm-btn-outline" style={{ padding: '2px 6px' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAdjustStock}>
              <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Current Stock Level:</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{selectedItemForAction.stock} {selectedItemForAction.unit}</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Action Type</label>
                  <select
                    value={adjustData.type}
                    onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value as any })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  >
                    <option value="Wastage / Dial-in">Wastage / Morning Dial-in Grinder Loss (Deduct)</option>
                    <option value="Restock">Incoming Supplier Drop Restock (Add)</option>
                    <option value="Sale Deduction">Manual Spoilage / Broken Jar (Deduct)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Amount ({selectedItemForAction.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={adjustData.amount}
                    onChange={(e) => setAdjustData({ ...adjustData, amount: Number(e.target.value) })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Reason / Note</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning dial-in grind test / dropped bag"
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="rrm-card-footer" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} className="rrm-btn-outline">
                  Cancel
                </button>
                <button type="submit" className="rrm-btn-primary">
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INTER-LOCATION STOCK TRANSFER */}
      {showTransferModal && selectedItemForAction && (
        <div className="modal-backdrop">
          <div className="rrm-card" style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--card)' }}>
            <div className="rrm-card-header">
              <div>
                <h3 className="rrm-card-title uppercase font-bold text-sm">Inter-Unit Stock Dispatch</h3>
                <p className="rrm-card-description">Transfer {selectedItemForAction.name} between trucks/stores</p>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="rrm-btn-outline" style={{ padding: '2px 6px' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleTransferStock}>
              <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Available at Source:</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{selectedItemForAction.stock} {selectedItemForAction.unit}</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>From Unit / Roastery</label>
                  <select
                    value={transferData.fromLocation}
                    onChange={(e) => setTransferData({ ...transferData, fromLocation: e.target.value as any })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  >
                    {LOCATIONS.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>To Destination (Mobile Truck / Kiosk)</label>
                  <select
                    value={transferData.toLocation}
                    onChange={(e) => setTransferData({ ...transferData, toLocation: e.target.value as any })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  >
                    {LOCATIONS.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Transfer Quantity ({selectedItemForAction.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    max={selectedItemForAction.stock}
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: Number(e.target.value) })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="rrm-card-footer" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} className="rrm-btn-outline">
                  Cancel
                </button>
                <button type="submit" className="rrm-btn-primary">
                  Dispatch Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE PURCHASE ORDER */}
      {showPOModal && (
        <div className="modal-backdrop">
          <div className="rrm-card" style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--card)' }}>
            <div className="rrm-card-header">
              <h3 className="rrm-card-title uppercase font-bold text-sm">+ Create Supplier Purchase Order</h3>
              <button onClick={() => setShowPOModal(false)} className="rrm-btn-outline" style={{ padding: '2px 6px' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreatePO}>
              <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Supplier / Importer Name</label>
                  <input
                    type="text"
                    required
                    value={newPO.supplier}
                    onChange={(e) => setNewPO({ ...newPO, supplier: e.target.value })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Items & Bags / Cartons</label>
                  <textarea
                    required
                    rows={3}
                    value={newPO.itemsSummary}
                    onChange={(e) => setNewPO({ ...newPO, itemsSummary: e.target.value })}
                    className="rrm-input"
                    style={{ width: '100%', resize: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newPO.totalCost}
                    onChange={(e) => setNewPO({ ...newPO, totalCost: Number(e.target.value) })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="rrm-card-footer" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowPOModal(false)} className="rrm-btn-outline">
                  Cancel
                </button>
                <button type="submit" className="rrm-btn-primary">
                  Dispatch PO to Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT INGREDIENT / SKU */}
      <EditItemModal
        isOpen={showEditItemModal}
        onClose={() => setShowEditItemModal(false)}
        item={selectedItemForAction}
        onSave={(updated) => {
          setInventory(prev => prev.map(item => item.id === updated.id ? updated : item));
          triggerToast(`Updated item: ${updated.name}`);
        }}
      />

      {/* MODAL 6: VIEW INGREDIENT DETAILS */}
      <ViewItemModal
        isOpen={showViewItemModal}
        onClose={() => setShowViewItemModal(false)}
        item={selectedItemForAction}
        onEditClick={(item) => {
          setSelectedItemForAction(item);
          setShowEditItemModal(true);
        }}
        onAdjustClick={(item) => {
          setSelectedItemForAction(item);
          setShowAdjustModal(true);
        }}
        onTransferClick={(item) => {
          setSelectedItemForAction(item);
          setShowTransferModal(true);
        }}
      />

      {/* MODAL 7: AUTH (LOGIN / SIGNUP) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('tallios_user', JSON.stringify(user));
          triggerToast(`Welcome back, ${user.name}!`);
        }}
      />

    </div>
  );
}

export default App;
