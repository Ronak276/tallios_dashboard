import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { InventoryItem, KioskOrder, LocationId } from '../types';
import { LOCATIONS } from '../data/mockData';
import {
  Grid,
  List,
  MapPin,
  Plus,
  X,
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  DollarSign,
  Coffee,
  CreditCard,
  User,
  Phone,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
} from '../components/icons/Icons';
import './OrdersPage.css';

const channels = [
  'Mobile App',
  'Website',
  'Kiosk',
  'Counter',
] as const;

const stages = ['Incoming', 'Brewing / Prep', 'Ready for Pickup', 'Completed', 'Cancelled'] as const;
const labels = ['Incoming', 'In prep', 'Ready', 'Completed', 'Cancelled'];
const actions = ['Start prep', 'Mark ready', 'Complete'];
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const locationName = (id: LocationId) => LOCATIONS.find(location => location.id === id)?.name ?? id;

function formatOrderDateTime(createdAt: string) {
  const defaultDate = '11/25/2026';
  const defaultTime = '11:45 AM';
  if (!createdAt) return { date: defaultDate, time: defaultTime };

  // If already contains relative time text like "2 mins ago" or "just now"
  const raw = createdAt.trim().toLowerCase();
  if (raw.includes('ago') || raw.includes('just now')) {
    if (raw.includes('2 min')) return { date: defaultDate, time: '11:58 AM' };
    if (raw.includes('just now')) return { date: defaultDate, time: '12:00 PM' };
    if (raw.includes('6 min')) return { date: defaultDate, time: '11:54 AM' };
    if (raw.includes('4 min') || raw.includes('8 min')) return { date: defaultDate, time: '11:52 AM' };
    return { date: defaultDate, time: defaultTime };
  }

  try {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) {
      return { date: defaultDate, time: defaultTime };
    }
    // Strict USA Date Format: MM/DD/YYYY
    const date = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    // Strict USA Time Format: HH:MM AM/PM
    const time = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { date, time };
  } catch {
    return { date: defaultDate, time: defaultTime };
  }
}

interface Props {
  orders: KioskOrder[];
  inventory: InventoryItem[];
  isAdmin: boolean;
  assignedLocation?: string;
  onUpdateOrder?: (order: KioskOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
  onStatus: (order: KioskOrder, status: KioskOrder['orderStatus']) => void;
  onCreate: (order: KioskOrder) => void;
}

// Helper to convert any location display string or ID into a canonical LocationId
function resolveLocationId(loc?: string): LocationId | 'all' {
  if (!loc || loc === 'all' || loc === 'All Locations') return 'all';
  const l = loc.toLowerCase();
  if (l === 'loc-main' || l.includes('bayview') || l.includes('main street') || l.includes('roastery')) return 'loc-main';
  if (l === 'loc-truck-1' || l.includes('truck #1') || l.includes('truck 1') || l.includes('downtown')) return 'loc-truck-1';
  if (l === 'loc-truck-2' || l.includes('truck #2') || l.includes('truck 2') || l.includes('farmers') || l.includes('marina')) return 'loc-truck-2';
  if (l === 'loc-kiosk-tech' || l.includes('kiosk') || l.includes('tech park')) return 'loc-kiosk-tech';
  return 'all';
}

export function OrdersPage({ orders, inventory, isAdmin, assignedLocation, onUpdateOrder, onDeleteOrder, onStatus, onCreate }: Props) {
  const [location, setLocation] = useState<LocationId | 'all'>('all');
  const [stage, setStage] = useState<KioskOrder['orderStatus'] | 'all'>('all');
  const [channel, setChannel] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'cards'>('list');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 20 lines per page global standard
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<KioskOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<KioskOrder | null>(null);
  const [editingItems, setEditingItems] = useState<KioskOrder['items']>([]);
  const [orderToDelete, setOrderToDelete] = useState<KioskOrder | null>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [cancelOrder, setCancelOrder] = useState<KioskOrder>();
  const [items, setItems] = useState([{ key: 0, itemId: '', quantity: '1' }]);
  const [nextItem, setNextItem] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'Apple Pay' | 'Google Pay' | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | ''>('');
  const [counterLocation, setCounterLocation] = useState<LocationId | ''>('');
  
  const resolvedAssignedLocationId = resolveLocationId(assignedLocation);
  const scope = isAdmin ? location : resolvedAssignedLocationId;
  const fulfillmentLocation = isAdmin ? counterLocation : (resolvedAssignedLocationId === 'all' ? 'loc-main' : resolvedAssignedLocationId);
  
  // Available offerings: items at this location that are in stock with either a selling price or derived sell price
  const offerings = inventory
    .filter(item => Boolean(fulfillmentLocation) && item.locationId === fulfillmentLocation && item.stock > 0 && item.status !== 'Out of Stock')
    .map(item => ({
      ...item,
      sellingPrice: typeof item.sellingPrice === 'number' && Number.isFinite(item.sellingPrice) && item.sellingPrice > 0
        ? item.sellingPrice
        : Number((Math.max(item.costPerUnit * 1.5, 3.50)).toFixed(2)),
    }));
  
  const draft = items.map(line => ({
    ...line,
    product: offerings.find(item => item.id === line.itemId),
    count: Number(line.quantity),
  }));
  
  const orderItems = draft.flatMap(({ product, count }) =>
    product && Number.isInteger(count) && count >= 1 && count <= 999
      ? [{ inventoryItemId: product.id, name: product.name, quantity: count, price: product.sellingPrice }]
      : [],
  );
  
  const total = orderItems.reduce((sum, item) => sum + item.quantity * Math.round(item.price * 100), 0) / 100;
  const canSave = Boolean(fulfillmentLocation) && orderItems.length > 0 && orderItems.length === items.filter(i => i.itemId).length && Boolean(paymentMethod) && Boolean(paymentStatus);
  const scoped = orders.filter(order => scope === 'all' || order.locationId === scope);
  const query = search.trim().toLowerCase();
  
  const visible = scoped.filter(order => {
    const matchesStage = stage === 'all' || order.orderStatus === stage;
    let matchesChannel = channel === 'all';
    if (!matchesChannel) {
      if (channel === 'Mobile App') {
        matchesChannel = order.channel === 'Mobile App';
      } else if (channel === 'Website') {
        matchesChannel = order.channel === 'Website' || order.channel === 'QR Code Table';
      } else if (channel === 'Kiosk') {
        matchesChannel = order.channel === 'Self-Service Kiosk' || order.channel === 'Tablet';
      } else if (channel === 'Counter') {
        matchesChannel = order.channel === 'Walk-in / Counter' || order.channel === 'Mobile Food Truck Counter';
      }
    }
    const matchesQuery = [order.orderNumber, order.customerName, ...order.items.map(item => item.name)]
      .some(value => value.toLowerCase().includes(query));
    return matchesStage && matchesChannel && matchesQuery;
  });

  const totalPages = Math.ceil(visible.length / pageSize) || 1;
  const paginatedOrders = visible.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // KPI Calculations matching Users Module Style
  const totalOrdersCount = scoped.length;
  const pendingOrdersCount = scoped.filter(o => o.orderStatus === 'Incoming' || o.orderStatus === 'Brewing / Prep').length;
  const readyOrdersCount = scoped.filter(o => o.orderStatus === 'Ready for Pickup').length;
  const totalSalesRevenue = scoped.reduce((sum, o) => sum + (o.stripeStatus === 'Paid' ? o.totalAmount : 0), 0);

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!fulfillmentLocation || !canSave || !paymentMethod || !paymentStatus) return;
    const id = crypto.randomUUID();
    onCreate({
      id,
      orderNumber: `#TL-${id.slice(0, 8).toUpperCase()}`,
      channel: 'Walk-in / Counter',
      locationId: fulfillmentLocation,
      customerName: String(form.get('customer')).trim() || 'Walk-in Customer',
      customerPhone: String(form.get('customerPhone')).trim() || undefined,
      items: orderItems,
      totalAmount: total,
      stripeStatus: paymentStatus,
      stripeChargeId: paymentStatus === 'Paid' ? `ch_${id.slice(0, 14)}` : '',
      orderStatus: 'Incoming',
      paymentMethod: paymentMethod,
      createdAt: new Date().toISOString(),
    });
    if (isAdmin && location !== 'all') setLocation(fulfillmentLocation);
    setStage('all');
    setChannel('all');
    setSearch('');
    sheetRef.current?.close();
  }

  function openSheet() {
    formRef.current?.reset();
    setCounterLocation('');
    setPaymentMethod('');
    setPaymentStatus('');
    setItems([{ key: 0, itemId: '', quantity: '1' }]);
    setNextItem(1);
    sheetRef.current?.showModal();
  }

  function startEditOrder(order: KioskOrder) {
    setEditingOrder(order);
    setEditingItems(order.items.map(item => ({ ...item })));
  }
  function handleSelectProduct(key: number, newItemId: string) {
    if (!newItemId) {
      setItems(prev => prev.map(line => line.key === key ? { ...line, itemId: '' } : line));
      return;
    }

    setItems(prev => {
      const existingIndex = prev.findIndex(line => line.key !== key && line.itemId === newItemId);
      if (existingIndex !== -1) {
        // Same item already exists elsewhere in the list!
        // Automatically merge: increase existing item quantity and remove this extra duplicate row
        const currentQty = Number(prev[existingIndex].quantity) || 1;
        const addQty = Number(prev.find(line => line.key === key)?.quantity) || 1;
        const mergedQty = String(currentQty + addQty);
        
        const updated = prev
          .map((line, idx) => idx === existingIndex ? { ...line, quantity: mergedQty } : line)
          .filter(line => line.key !== key);
        
        return updated.length > 0 ? updated : [{ key: 0, itemId: newItemId, quantity: '1' }];
      }

      // Fresh selection on this line
      return prev.map(line => line.key === key ? { ...line, itemId: newItemId } : line);
    });
  }

  const getStatusBadgeClass = (status: KioskOrder['orderStatus']) => {
    switch (status) {
      case 'Incoming': return 'orders-badge-incoming';
      case 'Brewing / Prep': return 'orders-badge-prep';
      case 'Ready for Pickup': return 'orders-badge-ready';
      case 'Completed': return 'orders-badge-completed';
      case 'Cancelled': return 'orders-badge-cancelled';
      default: return '';
    }
  };

  return (
    <div className="orders-page-container">
      {/* 1. Header & Quick Actions */}
      <div className="orders-header-row">
        <div>
          <h1 className="orders-header-title">Order Management</h1>
          <p className="orders-header-subtitle">
            Live café kiosk orders, mobile app queues, counter fulfillment & roastery baristas
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Location Selector (Super Admin: Dropdown, Staff: Locked Badge) */}
          {isAdmin ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0px',
              padding: '6px 12px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              <MapPin size={14} style={{ color: '#2888E6' }} />
              <select
                value={location}
                onChange={e => setLocation(e.target.value as LocationId | 'all')}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Locations</option>
                {LOCATIONS.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
              </select>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0px',
              padding: '6px 12px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              <MapPin size={14} style={{ color: '#10B981' }} />
              <span>{resolvedAssignedLocationId !== 'all' ? locationName(resolvedAssignedLocationId) : (assignedLocation || 'Bayview Café (Roastery HQ)')}</span>
            </div>
          )}

          {(isAdmin || assignedLocation) && (
            <button
              onClick={openSheet}
              className="rrm-btn-primary"
              style={{ borderRadius: '0px', padding: '7px 16px', fontSize: '0.8125rem', cursor: 'pointer' }}
            >
              <Plus size={15} />
              <span>New Counter Order</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Metric Cards matching Users Module */}
      <div className="orders-stats-grid">
        {/* Card 1: Total Orders */}
        <div className="orders-kpi-card orders-kpi-primary">
          <div className="orders-kpi-body">
            <div className="orders-kpi-header">
              <span className="orders-kpi-label">Total Orders</span>
              <div className="orders-kpi-icon-box" style={{ backgroundColor: 'rgba(28, 44, 96, 0.08)', color: '#1C2C60' }}>
                <ShoppingBag size={16} />
              </div>
            </div>
            <div>
              <div className="orders-kpi-value">{totalOrdersCount}</div>
              <div className="orders-kpi-sub" style={{ color: '#10B981' }}>
                ↑ Live Kiosk &amp; App Sales
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: In Prep / Active */}
        <div className="orders-kpi-card orders-kpi-amber">
          <div className="orders-kpi-body">
            <div className="orders-kpi-header">
              <span className="orders-kpi-label">In Kitchen Prep</span>
              <div className="orders-kpi-icon-box" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#D97706' }}>
                <Coffee size={16} />
              </div>
            </div>
            <div>
              <div className="orders-kpi-value">{pendingOrdersCount}</div>
              <div className="orders-kpi-sub" style={{ color: '#D97706' }}>
                Active barista queue
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Ready for Pickup */}
        <div className="orders-kpi-card orders-kpi-emerald">
          <div className="orders-kpi-body">
            <div className="orders-kpi-header">
              <span className="orders-kpi-label">Ready for Pickup</span>
              <div className="orders-kpi-icon-box" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                <CheckCircle size={16} />
              </div>
            </div>
            <div>
              <div className="orders-kpi-value">{readyOrdersCount}</div>
              <div className="orders-kpi-sub" style={{ color: '#10B981' }}>
                At pickup counter
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Total Shift Revenue */}
        <div className="orders-kpi-card orders-kpi-gold">
          <div className="orders-kpi-body">
            <div className="orders-kpi-header">
              <span className="orders-kpi-label">Shift Revenue</span>
              <div className="orders-kpi-icon-box" style={{ backgroundColor: 'rgba(198, 138, 76, 0.15)', color: '#C68A4C' }}>
                <DollarSign size={16} />
              </div>
            </div>
            <div>
              <div className="orders-kpi-value">{money.format(totalSalesRevenue)}</div>
              <div className="orders-kpi-sub" style={{ color: '#64748B' }}>
                Gross settled payments
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search, Channel, Stage Filters & View Toggle (matching Users Module) */}
      <div className="orders-toolbar-row">
        {/* Search */}
        <div className="orders-search-wrapper">
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="search"
            aria-label="Search orders"
            placeholder="Search order #, customer, item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="orders-search-input"
          />
        </div>

        {/* Right side controls */}
        <div className="orders-filters-right">
          {/* Location Filter (Admin Only) */}
          {isAdmin && (
            <select
              value={location}
              onChange={e => {
                setLocation(e.target.value as LocationId | 'all');
                setCurrentPage(1);
              }}
              className="orders-select-filter"
              title="Filter by Location"
            >
              <option value="all">All Locations</option>
              {LOCATIONS.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          )}

          {/* Stage / Status Filter */}
          <select
            value={stage}
            onChange={e => {
              setStage(e.target.value as any);
              setCurrentPage(1);
            }}
            className="orders-select-filter"
          >
            <option value="all">All Order Statuses</option>
            {stages.map((val, idx) => (
              <option key={val} value={val}>{labels[idx]}</option>
            ))}
          </select>

          {/* Sales Channel Filter */}
          <select
            value={channel}
            onChange={e => {
              setChannel(e.target.value);
              setCurrentPage(1);
            }}
            className="orders-select-filter"
          >
            <option value="all">All Channels</option>
            {channels.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          {/* Table vs Card View Toggle (Pixel-perfect Users Module style) */}
          <div className="orders-view-toggle">
            <button
              type="button"
              onClick={() => setView('list')}
              className="orders-view-btn"
              style={{
                backgroundColor: view === 'list' ? '#1C2C60' : 'transparent',
                color: view === 'list' ? '#ffffff' : 'var(--muted-foreground)',
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView('cards')}
              className="orders-view-btn"
              style={{
                backgroundColor: view === 'cards' ? '#1C2C60' : 'transparent',
                color: view === 'cards' ? '#ffffff' : 'var(--muted-foreground)',
              }}
              title="Card View"
            >
              <Grid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Table View (Matching Users Module Structure & Spacing) */}
      {view === 'list' ? (
        <div className="orders-card-table">
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Order #</th>
                  <th style={{ width: '150px' }}>Customer</th>
                  <th style={{ width: '130px' }}>Mobile / Phone</th>
                  <th style={{ width: '95px' }}>Date</th>
                  <th style={{ width: '95px' }}>Time</th>
                  <th style={{ width: '120px' }}>Channel</th>
                  <th style={{ width: '150px' }}>Location</th>
                  <th style={{ width: '220px' }}>Items Ordered</th>
                  <th style={{ width: '200px' }}>Special Notes &amp; Customization</th>
                  <th style={{ width: '85px' }}>Total</th>
                  <th style={{ width: '105px' }}>Status</th>
                  <th style={{ width: '125px' }}>Payment</th>
                  <th style={{ width: '55px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted-foreground)' }}>
                      No orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map(order => {
                    const timeInfo = formatOrderDateTime(order.createdAt);
                    const index = stages.indexOf(order.orderStatus);
                    return (
                      <tr key={order.id}>
                        {/* 1. Order # */}
                        <td>
                          <span style={{ fontWeight: 700, color: '#1C2C60', fontSize: '0.85rem' }}>
                            {order.orderNumber}
                          </span>
                        </td>

                        {/* 2. Customer Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.8125rem' }}>
                              {order.customerName}
                            </span>
                          </div>
                        </td>

                        {/* 2b. Customer Mobile / Phone */}
                        <td>
                          {order.customerPhone ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', color: '#1C2C60', fontWeight: 500 }}>
                              <Phone size={12} style={{ color: '#2563EB', flexShrink: 0 }} />
                              <span>{order.customerPhone}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontStyle: 'italic' }}>
                              Walk-in Guest
                            </span>
                          )}
                        </td>

                        {/* 3. Order Date */}
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--foreground)', fontWeight: 500 }}>
                            {timeInfo.date}
                          </span>
                        </td>

                        {/* 4. Order Time */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)' }}>
                            <Clock size={13} style={{ color: '#D97706' }} />
                            <span>{timeInfo.time}</span>
                          </div>
                        </td>

                        {/* 5. Channel */}
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(28, 44, 96, 0.06)',
                            color: '#1C2C60',
                            border: '1px solid rgba(28, 44, 96, 0.15)',
                            borderRadius: '0px',
                            whiteSpace: 'nowrap'
                          }}>
                            {order.channel}
                          </span>
                        </td>

                        {/* 6. Location */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--foreground)', fontWeight: 500 }}>
                            <MapPin size={12} style={{ color: '#2888E6', flexShrink: 0 }} />
                            <span>{locationName(order.locationId)}</span>
                          </div>
                        </td>

                        {/* 7. Dedicated Column: Items Ordered (Name + Quantity) */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {order.items.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '22px',
                                  height: '19px',
                                  padding: '0 4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: '#1C2C60',
                                  color: '#FFFFFF',
                                  borderRadius: '0px',
                                  lineHeight: 1
                                }}>
                                  {item.quantity}×
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                                  {item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* 8. Dedicated Column: Special Notes & Customization Tags */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {order.items.map((item, idx) => (
                              <div key={idx} style={{ minHeight: '19px', display: 'flex', alignItems: 'center' }}>
                                {item.options ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {item.options.split(',').map((opt, optIdx) => (
                                      <span
                                        key={optIdx}
                                        style={{
                                          fontSize: '0.6875rem',
                                          fontWeight: 600,
                                          padding: '1px 6px',
                                          backgroundColor: '#FEF3C7',
                                          color: '#92400E',
                                          border: '1px solid #FDE68A',
                                          borderRadius: '0px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        • {opt.trim()}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                    Standard Recipe
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* 9. Total Amount */}
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.875rem' }}>
                            {money.format(order.totalAmount)}
                          </span>
                        </td>

                        {/* 10. Order Fulfillment Status */}
                        <td>
                          <span className={`orders-status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                            {labels[index] || order.orderStatus}
                          </span>
                        </td>

                        {/* 11. Payment & Method */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <span className={`orders-pay-badge ${order.stripeStatus === 'Paid' ? '' : 'orders-pay-unpaid'}`}>
                              {order.stripeStatus}
                            </span>
                            <span className="orders-pay-method">
                              <CreditCard size={11} />
                              {order.paymentMethod || 'Card'}
                            </span>
                          </div>
                        </td>

                        {/* Actions (3-dot Dropdown Menu matching Users Module) */}
                        <td style={{ textAlign: 'right', position: 'relative' }}>
                          <div style={{ display: 'inline-block', position: 'relative' }}>
                            <button
                              type="button"
                              onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                              className="rrm-btn-outline"
                              style={{
                                padding: '5px 8px',
                                border: '1px solid var(--border)',
                                borderRadius: '0px',
                                backgroundColor: openDropdownId === order.id ? 'var(--muted)' : 'transparent',
                                color: 'var(--foreground)',
                                cursor: 'pointer',
                              }}
                              title="Actions"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {openDropdownId === order.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 'calc(100% + 4px)',
                                  width: '168px',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #E2E8F0',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                                  zIndex: 100,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  textAlign: 'left',
                                  borderRadius: '0px',
                                  padding: '5px 0',
                                }}
                              >
                                {/* Details Option */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setSelectedOrderDetails(order);
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#334155',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'background 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Eye size={14} style={{ color: '#2563EB' }} />
                                  <span>View Details</span>
                                </button>

                                {/* Edit Order Option */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    startEditOrder(order);
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#334155',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'background 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Edit3 size={14} style={{ color: '#D97706' }} />
                                  <span>Edit Order</span>
                                </button>

                                {/* Next Stage Action (Start Prep / Mark Ready / Complete) */}
                                {actions[index] && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onStatus(order, stages[index + 1]);
                                    }}
                                    style={{
                                      padding: '8px 14px',
                                      fontSize: '0.8125rem',
                                      fontWeight: 600,
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: '#059669',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      textAlign: 'left',
                                      width: '100%',
                                      transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ECFDF5')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <CheckCircle size={14} style={{ color: '#059669' }} />
                                    <span>{actions[index]}</span>
                                  </button>
                                )}

                                <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 0' }} />

                                {/* Cancel Option */}
                                {isAdmin && index >= 0 && index < 3 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      setCancelOrder(order);
                                    }}
                                    style={{
                                      padding: '8px 14px',
                                      fontSize: '0.8125rem',
                                      fontWeight: 500,
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: '#64748B',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      textAlign: 'left',
                                      width: '100%',
                                      transition: 'background 0.15s ease, color 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#FFF1F2';
                                      e.currentTarget.style.color = '#E11D48';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = '#64748B';
                                    }}
                                  >
                                    <X size={14} style={{ color: '#94A3B8' }} />
                                    <span>Cancel Order</span>
                                  </button>
                                )}

                                {/* Delete Order Option */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setOrderToDelete(order);
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#DC2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'background 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Trash2 size={14} style={{ color: '#DC2626' }} />
                                  <span>Delete Order</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Global Pagination Footer (20 lines per page matching Users module) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderTop: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            backgroundColor: 'var(--card)'
          }}>
            <div>
              Showing <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {visible.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span> to <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {Math.min(currentPage * pageSize, visible.length)}
              </span> of <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {visible.length}
              </span> orders
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  color: currentPage <= 1 ? 'var(--muted-foreground)' : '#1C2C60',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  borderRadius: '0px',
                  opacity: currentPage <= 1 ? 0.45 : 1
                }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span style={{ padding: '0 10px', fontWeight: 700, color: '#1C2C60' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  color: currentPage >= totalPages ? 'var(--muted-foreground)' : '#1C2C60',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  borderRadius: '0px',
                  opacity: currentPage >= totalPages ? 0.45 : 1
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Card Grid View (Sharp 0px matching Users Module) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="orders-card-grid">
            {paginatedOrders.map(order => {
              const timeInfo = formatOrderDateTime(order.createdAt);
              const index = stages.indexOf(order.orderStatus);
              return (
                <div key={order.id} className="orders-order-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#1C2C60', fontSize: '0.92rem' }}>
                      {order.orderNumber}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {money.format(order.totalAmount)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                        {order.channel} • {locationName(order.locationId)}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} style={{ color: '#D97706' }} />
                      {timeInfo.time}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8125rem' }}>
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.quantity}× {item.name}
                          {item.options && <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}> ({item.options})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className={`orders-status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                        {labels[index] || order.orderStatus}
                      </span>
                      <span className="orders-pay-method">
                        {order.paymentMethod || 'Card'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => setSelectedOrderDetails(order)} className="orders-btn-details">
                        Details
                      </button>
                      <button onClick={() => startEditOrder(order)} className="orders-btn-details" style={{ backgroundColor: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A' }}>
                        Edit
                      </button>
                      {actions[index] && (
                        <button onClick={() => onStatus(order, stages[index + 1])} className="orders-btn-action">
                          {actions[index]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card View Pagination Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            backgroundColor: 'var(--card)'
          }}>
            <div>
              Showing <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {visible.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span> to <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {Math.min(currentPage * pageSize, visible.length)}
              </span> of <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {visible.length}
              </span> orders
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  color: currentPage <= 1 ? 'var(--muted-foreground)' : '#1C2C60',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  borderRadius: '0px',
                  opacity: currentPage <= 1 ? 0.45 : 1
                }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span style={{ padding: '0 10px', fontWeight: 700, color: '#1C2C60' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  color: currentPage >= totalPages ? 'var(--muted-foreground)' : '#1C2C60',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  borderRadius: '0px',
                  opacity: currentPage >= totalPages ? 0.45 : 1
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Counter Order Sliding Sheet / Drawer */}
      <dialog ref={sheetRef} className="orders-sheet" aria-labelledby="orders-sheet-title">
        <form ref={formRef} onSubmit={create} className="orders-drawer-form">
          {/* Drawer Header */}
          <header className="orders-sheet-header">
            <div>
              <h2 id="orders-sheet-title">New Counter Order</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                Fulfill an instant walk-in order directly from café inventory
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => sheetRef.current?.close()}
              className="orders-drawer-close-btn"
            >
              <X size={16} />
            </button>
          </header>

          {/* Drawer Scrollable Body */}
          <div className="orders-sheet-body">
            {/* Top Order Meta Fields */}
            <div className="orders-sheet-fields">
              {isAdmin ? (
                <div className="orders-sheet-field-group">
                  <label>Fulfillment Location *</label>
                  <select
                    name="location"
                    value={counterLocation}
                    onChange={e => {
                      setCounterLocation(e.target.value as LocationId | '');
                      setItems(prev => prev.map(line => ({ ...line, itemId: '' })));
                    }}
                    required
                  >
                    <option value="" disabled>Select Café Store / Food Truck</option>
                    {LOCATIONS.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                  </select>
                </div>
              ) : (
                assignedLocation && (
                  <div className="orders-sheet-field-group">
                    <label>Fulfillment Location</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#1C2C60', padding: '8px 12px', background: '#F1F5F9', border: '1px solid var(--border)' }}>
                      <MapPin size={15} style={{ color: '#10B981' }} />
                      <span>{resolvedAssignedLocationId !== 'all' ? locationName(resolvedAssignedLocationId) : (assignedLocation || 'Bayview Café (Roastery HQ)')}</span>
                    </div>
                  </div>
                )
              )}

              <div className="orders-sheet-field-group">
                <label>Customer Name (Optional)</label>
                <input name="customer" placeholder="e.g. Walk-in Customer" />
              </div>

              <div className="orders-sheet-field-group">
                <label>Mobile Number (Optional)</label>
                <input name="customerPhone" type="tel" placeholder="e.g. +1 (555) 234-5678" />
              </div>
            </div>

            {/* 1. ORDER ITEMS SECTION (FIRST) */}
            <section className="orders-sheet-items" aria-labelledby="orders-sheet-items-title">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 id="orders-sheet-items-title">Order Items</h3>
                {offerings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setItems([...items, { key: nextItem, itemId: '', quantity: '1' }]);
                      setNextItem(nextItem + 1);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #1C2C60',
                      color: '#1C2C60',
                      borderRadius: '0px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} /> Add Item
                  </button>
                )}
              </div>

              {!fulfillmentLocation && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', border: '1px dashed var(--border)', fontSize: '0.8125rem' }}>
                  Please select a fulfillment location above to view live in-stock inventory items.
                </div>
              )}

              {fulfillmentLocation && !offerings.length && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: '0.8125rem' }}>
                  No in-stock sellable items found at this location. Please check Inventory.
                </div>
              )}

              {offerings.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {draft.map(({ key, product, quantity }, idx) => (
                    <div className="orders-sheet-item" key={key}>
                      <div className="orders-sheet-item-row">
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Item #{idx + 1}
                          </span>
                          <select
                            value={product?.id ?? ''}
                            required
                            onChange={e => handleSelectProduct(key, e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <option value="">Select coffee or pastry</option>
                            {offerings.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} (${item.sellingPrice?.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px', textAlign: 'center' }}>
                            Qty
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={quantity}
                            required
                            onChange={e => {
                              const value = e.target.value;
                              setItems(prev => prev.map(line => line.key === key ? { ...line, quantity: value } : line));
                            }}
                            style={{ width: '100%', textAlign: 'center' }}
                          >
                          </input>
                        </div>

                        <div className="orders-item-price">
                          <span>Subtotal</span>
                          <strong>{product ? money.format(product.sellingPrice * (Number(quantity) || 1)) : '$0.00'}</strong>
                        </div>

                        <div>
                          {items.length > 1 ? (
                            <button
                              type="button"
                              aria-label="Remove item"
                              onClick={() => setItems(items.filter(item => item.key !== key))}
                              style={{
                                width: '32px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                borderRadius: '0px',
                                cursor: 'pointer',
                                marginTop: '16px'
                              }}
                            >
                              <X size={15} />
                            </button>
                          ) : (
                            <div style={{ width: '32px' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 2. PAYMENT SECTION (LAST, RIGHT BEFORE TOTAL & CONFIRM) */}
            <section className="orders-sheet-payment-box">
              <h3>Payment &amp; Billing</h3>

              {/* Payment Method Quick Selector */}
              <div className="orders-sheet-field-group">
                <label>Payment Method</label>
                <div className="orders-payment-methods-grid">
                  {(['Card', 'Cash', 'Apple Pay', 'Google Pay'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className="orders-payment-btn"
                      style={{
                        border: paymentMethod === method ? '2px solid #1C2C60' : '1px solid var(--border)',
                        background: paymentMethod === method ? '#1C2C60' : '#FFFFFF',
                        color: paymentMethod === method ? '#FFFFFF' : '#334155',
                      }}
                    >
                      {method === 'Card' ? '💳 Card' : method === 'Cash' ? '💵 Cash' : method === 'Apple Pay' ? '🍎 Apple Pay' : '📱 G-Pay'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Status Selector */}
              <div className="orders-sheet-field-group">
                <label>Payment Status</label>
                <div className="orders-payment-status-grid">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Paid')}
                    className="orders-status-btn"
                    style={{
                      border: paymentStatus === 'Paid' ? '2px solid #059669' : '1px solid var(--border)',
                      background: paymentStatus === 'Paid' ? '#ECFDF5' : '#FFFFFF',
                      color: paymentStatus === 'Paid' ? '#065F46' : '#64748B',
                    }}
                  >
                    <CheckCircle size={15} style={{ color: paymentStatus === 'Paid' ? '#059669' : '#94A3B8' }} />
                    <span>Paid (Completed)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Unpaid')}
                    className="orders-status-btn"
                    style={{
                      border: paymentStatus === 'Unpaid' ? '2px solid #D97706' : '1px solid var(--border)',
                      background: paymentStatus === 'Unpaid' ? '#FFFBEB' : '#FFFFFF',
                      color: paymentStatus === 'Unpaid' ? '#92400E' : '#64748B',
                    }}
                  >
                    <Clock size={15} style={{ color: paymentStatus === 'Unpaid' ? '#D97706' : '#94A3B8' }} />
                    <span>Pay at Counter / Unpaid</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Drawer Sticky Footer */}
          <footer className="orders-sheet-footer">
            <div className="orders-sheet-total">
              <span>Total Payable</span>
              <strong>{money.format(total)}</strong>
            </div>

            <div className="orders-drawer-actions">
              <button
                type="button"
                onClick={() => sheetRef.current?.close()}
                className="rrm-btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.8125rem', borderRadius: '0px', cursor: 'pointer' }}
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="rrm-btn-primary"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.8125rem',
                  borderRadius: '0px',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  opacity: canSave ? 1 : 0.6
                }}
              >
                Confirm &amp; Place Order
              </button>
            </div>
          </footer>
        </form>
      </dialog>

      {/* Cancel Order Confirmation Modal */}
      {cancelOrder && (
        <div className="orders-form orders-confirm" role="alert" style={{ borderRadius: '0px' }}>
          <strong>Cancel {cancelOrder.orderNumber}?</strong>
          <p>The order will be marked as Cancelled in the roastery history.</p>
          <div className="orders-action-group" style={{ justifyContent: 'flex-start' }}>
            <button onClick={() => setCancelOrder(undefined)} style={{ borderRadius: '0px' }}>
              No, keep order
            </button>
            <button
              className="orders-danger"
              onClick={() => { onStatus(cancelOrder, 'Cancelled'); setCancelOrder(undefined); }}
              style={{ borderRadius: '0px' }}
            >
              Yes, cancel order
            </button>
          </div>
        </div>
      )}

      {/* Permanent Delete Order Confirmation Modal (Centered Modal Popup) */}
      {orderToDelete && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1400,
            padding: '1rem',
          }}
          onClick={() => setOrderToDelete(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              width: '100%',
              maxWidth: '420px',
              border: '1px solid var(--border)',
              borderRadius: '0px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              backgroundColor: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} style={{ color: '#DC2626' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#991B1B' }}>
                  Delete Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#991B1B',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1E293B', fontWeight: 600 }}>
                Are you sure you want to delete order <span style={{ color: '#DC2626', fontWeight: 800 }}>{orderToDelete.orderNumber}</span>?
              </p>
              <span style={{ fontSize: '0.78125rem', color: '#64748B', lineHeight: '1.4' }}>
                This action is permanent and cannot be undone.
              </span>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="rrm-btn-outline"
                style={{ padding: '8px 18px', fontSize: '0.8125rem', borderRadius: '0px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOrder) {
                    onDeleteOrder(orderToDelete.id);
                  }
                  setOrderToDelete(null);
                }}
                style={{
                  padding: '8px 20px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  borderRadius: '0px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: '1px solid #DC2626',
                  cursor: 'pointer'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS SLIDING SHEET / DRAWER (IDENTICAL COMPONENT TO NEW COUNTER ORDER) */}
      {selectedOrderDetails && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'stretch'
          }}
          onClick={() => setSelectedOrderDetails(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(100vw, 560px)',
              height: '100vh',
              backgroundColor: 'var(--card)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.25)',
              borderLeft: '1px solid var(--border)',
              borderRadius: '0px',
              animation: 'orders-drawer-slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Drawer Header */}
            <header className="orders-sheet-header">
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  ORDER DETAILS
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1C2C60', margin: '2px 0 0 0' }}>
                  {selectedOrderDetails.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                className="orders-drawer-close-btn"
                onClick={() => setSelectedOrderDetails(null)}
                aria-label="Close details"
              >
                <X size={16} />
              </button>
            </header>

            {/* Drawer Scrollable Body */}
            <div className="orders-sheet-body">
              {/* Order Meta Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Customer
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <User size={14} style={{ color: '#1C2C60' }} />
                    <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>
                      {selectedOrderDetails.customerName}
                    </strong>
                  </div>
                  {selectedOrderDetails.customerPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}>
                      <Phone size={12} />
                      <span>{selectedOrderDetails.customerPhone}</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Sales Channel
                  </span>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '0px',
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    border: '1px solid #BFDBFE'
                  }}>
                    {selectedOrderDetails.channel}
                  </span>
                </div>

                <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Fulfillment Location
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.8125rem', color: '#1C2C60', fontWeight: 600 }}>
                    <MapPin size={13} style={{ color: '#10B981' }} />
                    <span>{locationName(selectedOrderDetails.locationId)}</span>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Payment Info
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '0px',
                      backgroundColor: selectedOrderDetails.stripeStatus === 'Paid' ? '#ECFDF5' : '#FFFBEB',
                      color: selectedOrderDetails.stripeStatus === 'Paid' ? '#047857' : '#B45309',
                      border: selectedOrderDetails.stripeStatus === 'Paid' ? '1px solid #A7F3D0' : '1px solid #FDE68A'
                    }}>
                      {selectedOrderDetails.stripeStatus === 'Paid' ? '✓ Paid' : '⏳ ' + selectedOrderDetails.stripeStatus}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                      ({selectedOrderDetails.paymentMethod || 'Card'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Ordered Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1C2C60', margin: 0 }}>
                    Items Ordered ({selectedOrderDetails.items.length})
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                    Price &amp; Subtotal
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrderDetails.items.map((it, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: '#F8FAFC',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px',
                          height: '28px',
                          background: '#1C2C60',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {it.quantity}×
                        </span>
                        <div>
                          <strong style={{ fontSize: '0.875rem', color: '#0F172A', display: 'block' }}>
                            {it.name}
                          </strong>
                          {it.options && (
                            <span style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              padding: '2px 8px',
                              background: '#FFFBEB',
                              border: '1px solid #FDE68A',
                              color: '#92400E',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              fontStyle: 'italic'
                            }}>
                              • {it.options}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                          ${it.price.toFixed(2)} each
                        </span>
                        <strong style={{ fontSize: '0.9375rem', color: '#1C2C60' }}>
                          ${(it.price * it.quantity).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Status Timeline / Quick Actions */}
              <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                  Update Order Stage
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {stages.map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        onStatus(selectedOrderDetails, st);
                        setSelectedOrderDetails({ ...selectedOrderDetails, orderStatus: st });
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: selectedOrderDetails.orderStatus === st ? '2px solid #1C2C60' : '1px solid var(--border)',
                        background: selectedOrderDetails.orderStatus === st ? '#1C2C60' : '#FFFFFF',
                        color: selectedOrderDetails.orderStatus === st ? '#FFFFFF' : '#334155',
                        borderRadius: '0px',
                        cursor: 'pointer'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Sticky Footer */}
            <footer className="orders-sheet-footer">
              <div className="orders-sheet-total">
                <span>Total Bill Amount</span>
                <strong>${selectedOrderDetails.totalAmount.toFixed(2)}</strong>
              </div>

              <div className="orders-drawer-actions">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = selectedOrderDetails;
                    setSelectedOrderDetails(null);
                    startEditOrder(toEdit);
                  }}
                  className="rrm-btn-outline"
                  style={{ padding: '9px 18px', fontSize: '0.8125rem', borderRadius: '0px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit3 size={14} style={{ color: '#D97706' }} />
                  <span>Edit Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="rrm-btn-primary"
                  style={{ padding: '9px 24px', fontSize: '0.8125rem', borderRadius: '0px', cursor: 'pointer' }}
                >
                  Close Details
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* EDIT ORDER SLIDING SHEET / DRAWER */}
      {editingOrder && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'stretch'
          }}
          onClick={() => setEditingOrder(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(100vw, 560px)',
              height: '100vh',
              backgroundColor: 'var(--card)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.25)',
              borderLeft: '1px solid var(--border)',
              borderRadius: '0px',
              animation: 'orders-drawer-slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Drawer Header */}
            <header className="orders-sheet-header">
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D97706' }}>
                  EDIT ORDER
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1C2C60', margin: '2px 0 0 0' }}>
                  {editingOrder.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                className="orders-drawer-close-btn"
                onClick={() => setEditingOrder(null)}
                aria-label="Close edit drawer"
              >
                <X size={16} />
              </button>
            </header>

            {/* Edit Drawer Form */}
            <form 
              onSubmit={e => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const computedTotal = editingItems.reduce((sum, it) => sum + it.quantity * Math.round(it.price * 100), 0) / 100;
                const updated: KioskOrder = {
                  ...editingOrder,
                  customerName: String(form.get('customerName') || '').trim() || editingOrder.customerName,
                  customerPhone: String(form.get('customerPhone') || '').trim() || undefined,
                  orderStatus: (form.get('orderStatus') as any) || editingOrder.orderStatus,
                  stripeStatus: (form.get('stripeStatus') as any) || editingOrder.stripeStatus,
                  paymentMethod: (form.get('paymentMethod') as any) || editingOrder.paymentMethod,
                  items: editingItems,
                  totalAmount: computedTotal,
                };
                if (onUpdateOrder) {
                  onUpdateOrder(updated);
                }
                setEditingOrder(null);
              }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
            >
              {/* Drawer Scrollable Body */}
              <div className="orders-sheet-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="orders-sheet-fields">
                  <div className="orders-sheet-field-group">
                    <label>Customer Name</label>
                    <input 
                      name="customerName" 
                      defaultValue={editingOrder.customerName} 
                      required 
                      placeholder="e.g. Marcus Vance" 
                    />
                  </div>

                  <div className="orders-sheet-field-group">
                    <label>Customer Phone / Mobile</label>
                    <input 
                      name="customerPhone" 
                      type="tel"
                      defaultValue={editingOrder.customerPhone || ''} 
                      placeholder="e.g. +1 (555) 234-8910" 
                    />
                  </div>

                  <div className="orders-sheet-field-group">
                    <label>Order Status Stage</label>
                    <select name="orderStatus" defaultValue={editingOrder.orderStatus}>
                      {stages.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="orders-sheet-field-group">
                    <label>Payment Status</label>
                    <select name="stripeStatus" defaultValue={editingOrder.stripeStatus}>
                      <option value="Paid">Paid (Completed)</option>
                      <option value="Unpaid">Unpaid / Pay at Pickup</option>
                      <option value="Processing">Processing</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="orders-sheet-field-group">
                    <label>Payment Method</label>
                    <select name="paymentMethod" defaultValue={editingOrder.paymentMethod || 'Card'}>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Cash">Cash at Counter</option>
                      <option value="Apple Pay">Apple Pay</option>
                      <option value="Google Pay">Google Pay</option>
                      <option value="App Wallet">App Wallet</option>
                    </select>
                  </div>
                </div>

                {/* Editable Order Items Section */}
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1C2C60' }}>
                      Edit Order Items ({editingItems.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        // Get available items from order's location or global list
                        const candidate = inventory.find(i => i.locationId === editingOrder.locationId && i.stock > 0) || inventory[0];
                        const prodPrice = candidate?.sellingPrice || (candidate?.costPerUnit ? Number((candidate.costPerUnit * 1.5).toFixed(2)) : 5.00);
                        const prodName = candidate?.name || 'Handcrafted Latte';
                        const prodId = candidate?.id || 'temp-id';
                        setEditingItems(prev => [
                          ...prev,
                          {
                            inventoryItemId: prodId,
                            name: prodName,
                            quantity: 1,
                            price: prodPrice,
                          }
                        ]);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#1C2C60',
                        border: '1px solid #1C2C60',
                        color: '#FFFFFF',
                        borderRadius: '0px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={13} /> Add Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {editingItems.map((it, idx) => {
                      // List all inventory items that can be sold
                      const menuOptions = inventory.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: typeof item.sellingPrice === 'number' && item.sellingPrice > 0 
                          ? item.sellingPrice 
                          : Number((Math.max(item.costPerUnit * 1.5, 3.50)).toFixed(2)),
                      }));

                      return (
                        <div 
                          key={idx}
                          style={{
                            padding: '10px 12px',
                            background: '#F8FAFC',
                            border: '1px solid var(--border)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 65px 80px 32px',
                            gap: '8px',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <select
                              value={menuOptions.find(o => o.name.toLowerCase() === it.name.toLowerCase())?.id || ''}
                              onChange={e => {
                                const selected = menuOptions.find(o => o.id === e.target.value);
                                if (selected) {
                                  setEditingItems(editingItems.map((item, i) => i === idx ? {
                                    ...item,
                                    inventoryItemId: selected.id,
                                    name: selected.name,
                                    price: selected.price
                                  } : item));
                                }
                              }}
                              style={{ width: '100%', height: '36px', fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: '0px', padding: '0 8px', background: '#FFFFFF', color: '#0F172A' }}
                            >
                              {menuOptions.map(prod => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} (${prod.price.toFixed(2)})
                                </option>
                              ))}
                              {!menuOptions.some(o => o.name.toLowerCase() === it.name.toLowerCase()) && (
                                <option value="">{it.name} (${it.price.toFixed(2)})</option>
                              )}
                            </select>
                          </div>

                          <div>
                            <input 
                              type="number"
                              min="1"
                              max="99"
                              value={it.quantity}
                              onChange={e => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setEditingItems(editingItems.map((item, i) => i === idx ? { ...item, quantity: val } : item));
                              }}
                              style={{ width: '100%', height: '36px', textAlign: 'center', fontSize: '0.8125rem', border: '1px solid var(--border)', borderRadius: '0px', background: '#FFFFFF', color: '#0F172A' }}
                            />
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '0.625rem', color: '#64748B', textTransform: 'uppercase' }}>Subtotal</span>
                            <strong style={{ fontSize: '0.875rem', color: '#1C2C60' }}>
                              ${(it.price * (Number(it.quantity) || 1)).toFixed(2)}
                            </strong>
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItems(prev => prev.filter((_, i) => i !== idx));
                              }}
                              style={{
                                width: '32px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                borderRadius: '0px',
                                cursor: 'pointer'
                              }}
                              title="Delete Item"
                              aria-label="Delete Item"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {editingItems.length === 0 && (
                      <div style={{ padding: '1.5rem', textAlign: 'center', background: '#FEF2F2', border: '1px dashed #FCA5A5', color: '#DC2626', fontSize: '0.8125rem' }}>
                        No items in this order. Click <strong>+ Add Item</strong> above to add coffee or food items.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Sticky Footer */}
              <footer className="orders-sheet-footer">
                <div className="orders-sheet-total">
                  <span>Updated Order Total</span>
                  <strong>${(editingItems.reduce((sum, it) => sum + it.quantity * Math.round(it.price * 100), 0) / 100).toFixed(2)}</strong>
                </div>

                <div className="orders-drawer-actions">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="rrm-btn-outline"
                    style={{ padding: '9px 18px', fontSize: '0.8125rem', borderRadius: '0px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editingItems.length === 0}
                    className="rrm-btn-primary"
                    style={{ padding: '9px 24px', fontSize: '0.8125rem', borderRadius: '0px', cursor: 'pointer', backgroundColor: '#1C2C60' }}
                  >
                    Save Changes
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
