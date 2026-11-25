import { useState, useEffect } from 'react';
import type { 
  InventoryItem, KioskOrder, StockAdjustmentLog, 
  LocationId, LoyaltyMember, PurchaseOrder, PaymentTransaction, CustomerUser 
} from './types';
import { 
  INITIAL_INVENTORY, INITIAL_ORDERS, 
  RECENT_LOGS, LOYALTY_MEMBERS, INITIAL_PURCHASE_ORDERS, INITIAL_PAYMENTS, INITIAL_CUSTOMERS 
} from './data/mockData';
import { supabase } from './lib/supabase';

// Layout Components
import { Sidebar, type TabType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Modals
import { AuthPage } from './components/auth/AuthPage';
import { AddItemModal } from './components/modals/AddItemModal';
import { StockAdjustModal } from './components/modals/StockAdjustModal';
import { TransferModal } from './components/modals/TransferModal';
import { CreatePOModal } from './components/modals/CreatePOModal';
import { EditItemModal, ViewItemModal } from './components/modals/ItemActionModals';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { InventoryPage } from './pages/InventoryPage';
import { OrdersPage } from './pages/OrdersPage';
import { UsersPage } from './pages/UsersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { TrucksPage } from './pages/TrucksPage';
import { RoastingPage } from './pages/RoastingPage';
import { LoyaltyPage } from './pages/LoyaltyPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedLocation, setSelectedLocation] = useState<LocationId | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showViewItemModal, setShowViewItemModal] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<InventoryItem | null>(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('tallios_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // State collections
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('tallios_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  const [orders, setOrders] = useState<KioskOrder[]>(INITIAL_ORDERS);
  const [logs, setLogs] = useState<StockAdjustmentLog[]>(() => {
    const saved = localStorage.getItem('tallios_logs');
    return saved ? JSON.parse(saved) : RECENT_LOGS;
  });
  const [members, setMembers] = useState<LoyaltyMember[]>(() => {
    const saved = localStorage.getItem('tallios_members');
    return saved ? JSON.parse(saved) : LOYALTY_MEMBERS;
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('tallios_pos');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('tallios_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });
  const [customers, setCustomers] = useState<CustomerUser[]>(INITIAL_CUSTOMERS);

  // Persistence for inventory & logs
  useEffect(() => {
    localStorage.setItem('tallios_inventory', JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem('tallios_logs', JSON.stringify(logs));
  }, [logs]);

  // Supabase Database Real-time Sync for Customers
  useEffect(() => {
    const mapCustomer = (d: any): CustomerUser => ({
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
    });

    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setCustomers(data.map(mapCustomer));
        }
      } catch (err) {
        console.warn('Note on Supabase customers fetch:', err);
      }
    };
    fetchCustomers();

    const channel = supabase
      .channel('realtime_customers_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newCust = mapCustomer(payload.new);
          setCustomers(prev => prev.some(c => c.id === newCust.id || c.email === newCust.email) ? prev : [newCust, ...prev]);
          triggerToast(`New customer registered: ${payload.new.name || payload.new.email}`);
        } else if (payload.eventType === 'UPDATE') {
          const updatedCust = mapCustomer(payload.new);
          setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
        } else if (payload.eventType === 'DELETE') {
          setCustomers(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Supabase Database Real-time Sync for Orders
  useEffect(() => {
    const mapOrder = (d: any): KioskOrder => ({
      id: d.id,
      orderNumber: d.order_number,
      channel: d.channel || 'Walk-in / Counter',
      locationId: d.location_id || 'loc-main',
      customerName: d.customer_name || 'Walk-in',
      customerPhone: d.customer_phone || undefined,
      items: typeof d.items === 'string' ? JSON.parse(d.items) : (d.items || []),
      totalAmount: Number(d.total_amount || 0),
      stripeStatus: d.stripe_status || 'Paid',
      stripeChargeId: d.stripe_charge_id || '',
      orderStatus: d.order_status || 'Incoming',
      paymentMethod: d.payment_method || 'Card',
      createdAt: d.created_at || new Date().toISOString(),
    });

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setOrders(data.map(mapOrder));
        }
      } catch (err) {
        console.warn('Note on Supabase orders fetch:', err);
      }
    };
    fetchOrders();

    const channel = supabase
      .channel('realtime_orders_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrd = mapOrder(payload.new);
          setOrders(prev => prev.some(o => o.id === newOrd.id || o.orderNumber === newOrd.orderNumber) ? prev : [newOrd, ...prev]);
          triggerToast(`New Kiosk Order Received: ${payload.new.order_number}`);
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrd = mapOrder(payload.new);
          setOrders(prev => prev.map(o => o.id === updatedOrd.id ? updatedOrd : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handlers
  const handleStockAdjustment = (amount: number, type: 'Restock' | 'Wastage / Dial-in', reason: string) => {
    if (!selectedItemForAction) return;
    const diff = type === 'Restock' ? amount : -amount;
    const newStock = Math.max(0, selectedItemForAction.stock + diff);

    let newStatus: InventoryItem['status'] = 'In Stock';
    if (newStock === 0) newStatus = 'Out of Stock';
    else if (newStock <= selectedItemForAction.minThreshold * 0.5) newStatus = 'Critical';
    else if (newStock <= selectedItemForAction.minThreshold) newStatus = 'Low Stock';

    setInventory(prev => prev.map(item => item.id === selectedItemForAction.id ? {
      ...item,
      stock: Number(newStock.toFixed(2)),
      status: newStatus,
      lastUpdated: 'Just now'
    } : item));

    const newLog: StockAdjustmentLog = {
      id: `log-${Date.now()}`,
      itemId: selectedItemForAction.id,
      itemName: selectedItemForAction.name,
      type,
      amount: diff,
      unit: selectedItemForAction.unit,
      reason,
      timestamp: 'Just now',
      user: currentUser?.name || 'Chloe (Head Barista)',
    };
    setLogs(prev => [newLog, ...prev]);
    triggerToast(`Updated ${selectedItemForAction.name} (${diff > 0 ? '+' : ''}${diff} ${selectedItemForAction.unit})`);
  };

  const handleStockTransfer = (fromLocation: LocationId, toLocation: LocationId, amount: number) => {
    if (!selectedItemForAction) return;
    setInventory(prev => prev.map(item => {
      if (item.id === selectedItemForAction.id) {
        const remaining = item.stock - amount;
        return {
          ...item,
          stock: Number(remaining.toFixed(2)),
          status: remaining <= item.minThreshold ? 'Low Stock' : 'In Stock',
          lastUpdated: 'Just now'
        };
      }
      return item;
    }));

    const newLog: StockAdjustmentLog = {
      id: `log-${Date.now()}`,
      itemId: selectedItemForAction.id,
      itemName: selectedItemForAction.name,
      type: 'Inter-location Transfer',
      amount: -amount,
      unit: selectedItemForAction.unit,
      reason: `Transfer from ${fromLocation} to ${toLocation}`,
      timestamp: 'Just now',
      user: currentUser?.name || 'Fleet Ops',
    };
    setLogs(prev => [newLog, ...prev]);
    triggerToast(`Dispatched ${amount} ${selectedItemForAction.unit}!`);
  };

  // Auth gate
  if (!currentUser) {
    return (
      <AuthPage onLoginSuccess={(user) => {
        setCurrentUser(user);
        localStorage.setItem('tallios_user', JSON.stringify(user));
        triggerToast(`Welcome back, ${user.name}!`);
      }} />
    );
  }

  const chartData = [
    { time: '06:00', primary: 12, secondary: 8 },
    { time: '07:00', primary: 34, secondary: 22 },
    { time: '08:00', primary: 86, secondary: 64 },
    { time: '09:00', primary: 124, secondary: 92 },
    { time: '10:00', primary: 98, secondary: 76 },
    { time: '11:00', primary: 64, secondary: 48 },
    { time: '12:00', primary: 78, secondary: 58 },
    { time: '13:00', primary: 62, secondary: 44 },
    { time: '14:00', primary: 42, secondary: 30 },
    { time: '15:00', primary: 38, secondary: 26 },
  ];

  return (
    <div className={`app-shell ${darkMode ? 'dark' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* Modern Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        darkMode={darkMode}
        currentUser={currentUser}
        onLogout={async () => {
          await supabase.auth.signOut();
          setCurrentUser(null);
          localStorage.removeItem('tallios_user');
          triggerToast('Logged out successfully');
        }}
      />

      {/* Main Workspace Layout */}
      <div className="app-main">
        <Header
          activeTab={activeTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main className={activeTab === 'orders' ? 'app-content orders-content' : 'app-content'}>
          {activeTab === 'dashboard' && (
            <OverviewPage
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              onNavigateToOrders={() => setActiveTab('orders')}
              onNavigateToInventory={() => setActiveTab('inventory')}
              onNewOrder={() => setShowAddModal(true)}
              userRole={currentUser?.role}
              userLocation={currentUser?.assignedLocation}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPage
              inventory={inventory}
              setInventory={setInventory}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenAddModal={() => setShowAddModal(true)}
              onViewItem={(item: InventoryItem) => {
                setSelectedItemForAction(item);
                setShowViewItemModal(true);
              }}
              onEditItem={(item: InventoryItem) => {
                setSelectedItemForAction(item);
                setShowEditItemModal(true);
              }}
              onAdjustStock={(item: InventoryItem) => {
                setSelectedItemForAction(item);
                setShowAdjustModal(true);
              }}
              onTransferStock={(item: InventoryItem) => {
                setSelectedItemForAction(item);
                setShowTransferModal(true);
              }}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersPage
              orders={orders}
              inventory={inventory}
              isAdmin={currentUser?.role !== 'Staff'}
              assignedLocation={currentUser?.assignedLocation}
              onStatus={async (order, newStatus) => {
                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, orderStatus: newStatus } : o));
                try {
                  await supabase.from('orders').update({ order_status: newStatus }).eq('id', order.id);
                  triggerToast(`Order ${order.orderNumber} updated to ${newStatus}`);
                } catch (e) {
                  console.warn('Order status sync error:', e);
                }
              }}
              onCreate={async (newOrder) => {
                setOrders(prev => [newOrder, ...prev]);
                try {
                  await supabase.from('orders').insert([{
                    id: newOrder.id,
                    order_number: newOrder.orderNumber,
                    channel: newOrder.channel,
                    location_id: newOrder.locationId,
                    customer_name: newOrder.customerName,
                    customer_phone: newOrder.customerPhone || null,
                    items: newOrder.items,
                    total_amount: newOrder.totalAmount,
                    order_status: newOrder.orderStatus,
                    stripe_status: newOrder.stripeStatus,
                    payment_method: newOrder.paymentMethod,
                    stripe_charge_id: newOrder.stripeChargeId || null,
                  }]);
                  triggerToast(`Order ${newOrder.orderNumber} created!`);
                } catch (e) {
                  console.warn('Order create sync error:', e);
                }
              }}
              onUpdateOrder={async (updatedOrder) => {
                setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
                try {
                  await supabase.from('orders').update({
                    items: updatedOrder.items,
                    total_amount: updatedOrder.totalAmount,
                    customer_phone: updatedOrder.customerPhone || null,
                  }).eq('id', updatedOrder.id);
                  triggerToast(`Order ${updatedOrder.orderNumber} updated!`);
                } catch (e) {
                  console.warn('Order update sync error:', e);
                }
              }}
              onDeleteOrder={async (orderId) => {
                setOrders(prev => prev.filter(o => o.id !== orderId));
                try {
                  await supabase.from('orders').delete().eq('id', orderId);
                  triggerToast('Order permanently deleted.');
                } catch (e) {
                  console.warn('Order delete sync error:', e);
                }
              }}
            />
          )}

          {activeTab === 'users' && (
            <UsersPage
              customers={customers}
              userRole={currentUser?.role}
              userLocation={currentUser?.assignedLocation}
              onAddCustomer={async (newCust) => {
                setCustomers(prev => [newCust, ...prev]);
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
                  console.warn('Customer update sync note:', e);
                }
              }}
              onDeleteCustomer={async (id) => {
                setCustomers(prev => prev.filter(c => c.id !== id));
                try {
                  await supabase.from('customers').delete().eq('id', id);
                } catch (e) {
                  console.warn('Customer delete sync note:', e);
                }
              }}
              onDeleteMultipleCustomers={async (ids) => {
                setCustomers(prev => prev.filter(c => !ids.includes(c.id)));
                try {
                  await supabase.from('customers').delete().in('id', ids);
                } catch (e) {
                  console.warn('Customer bulk delete sync note:', e);
                }
              }}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'trucks' && (
            <TrucksPage
              inventory={inventory}
              onSelectLocationStock={(locId) => {
                setSelectedLocation(locId);
                setActiveTab('inventory');
              }}
            />
          )}

          {activeTab === 'roasting' && (
            <RoastingPage
              inventory={inventory}
              onAdjustItem={(item) => {
                setSelectedItemForAction(item);
                setShowAdjustModal(true);
              }}
            />
          )}

          {activeTab === 'loyalty' && (
            <LoyaltyPage
              members={members}
              onAddStamp={(memberId) => {
                setMembers(prev => prev.map(m => m.id === memberId ? { ...m, stampsCount: Math.min(10, m.stampsCount + 1), points: m.points + 15 } : m));
                triggerToast('Cup stamp added! (+15 pts)');
              }}
            />
          )}

          {activeTab === 'procurement' && (
            <ProcurementPage
              purchaseOrders={purchaseOrders}
              onOpenCreatePO={() => setShowPOModal(true)}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsPage
              payments={payments}
              onAddPayment={(newTx) => setPayments(prev => [newTx, ...prev])}
              onRefundPayment={(id) => setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'Refunded', netRevenue: 0 } : p))}
              onDeletePayment={(id) => setPayments(prev => prev.filter(p => p.id !== id))}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage
              darkMode={darkMode}
              chartData={chartData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddItem={(newItem) => {
          setInventory(prev => [newItem, ...prev]);
          triggerToast(`Added SKU: ${newItem.name}`);
        }}
      />

      <StockAdjustModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        item={selectedItemForAction}
        onAdjust={handleStockAdjustment}
      />

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        item={selectedItemForAction}
        onTransfer={handleStockTransfer}
      />

      <CreatePOModal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        onCreatePO={(po) => {
          setPurchaseOrders(prev => [po, ...prev]);
          triggerToast(`Purchase Order ${po.poNumber} dispatched to supplier!`);
        }}
      />

      <EditItemModal
        isOpen={showEditItemModal}
        onClose={() => setShowEditItemModal(false)}
        item={selectedItemForAction}
        onSave={(updated) => {
          setInventory(prev => prev.map(item => item.id === updated.id ? updated : item));
          triggerToast(`Updated item: ${updated.name}`);
        }}
      />

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
    </div>
  );
}

export default App;
