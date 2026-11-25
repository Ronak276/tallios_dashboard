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
  assignedLocation?: LocationId;
  onDetails: (order: KioskOrder) => void;
  onStatus: (order: KioskOrder, status: KioskOrder['orderStatus']) => void;
  onCreate: (order: KioskOrder) => void;
}

export function OrdersPage({ orders, inventory, isAdmin, assignedLocation, onDetails, onStatus, onCreate }: Props) {
  const [location, setLocation] = useState<LocationId | 'all'>('all');
  const [stage, setStage] = useState<KioskOrder['orderStatus'] | 'all'>('all');
  const [channel, setChannel] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'cards'>('list');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [cancelOrder, setCancelOrder] = useState<KioskOrder>();
  const [items, setItems] = useState([{ key: 0, itemId: '', quantity: '1' }]);
  const [nextItem, setNextItem] = useState(1);
  const [counterLocation, setCounterLocation] = useState<LocationId | ''>('');
  
  const scope = isAdmin ? location : assignedLocation;
  const fulfillmentLocation = isAdmin ? counterLocation : assignedLocation;
  
  const offerings = inventory.filter(
    (item): item is InventoryItem & { sellingPrice: number } =>
      item.locationId === fulfillmentLocation && item.stock > 0 && item.status !== 'Out of Stock' &&
      typeof item.sellingPrice === 'number' && Number.isFinite(item.sellingPrice) && item.sellingPrice >= 0,
  );
  
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
  const canSave = Boolean(fulfillmentLocation) && orderItems.length === items.length;
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

  // KPI Calculations matching Users Module Style
  const totalOrdersCount = scoped.length;
  const pendingOrdersCount = scoped.filter(o => o.orderStatus === 'Incoming' || o.orderStatus === 'Brewing / Prep').length;
  const readyOrdersCount = scoped.filter(o => o.orderStatus === 'Ready for Pickup').length;
  const totalSalesRevenue = scoped.reduce((sum, o) => sum + (o.stripeStatus === 'Paid' ? o.totalAmount : 0), 0);

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!fulfillmentLocation || !canSave) return;
    const id = crypto.randomUUID();
    onCreate({
      id,
      orderNumber: `#TL-${id.slice(0, 8).toUpperCase()}`,
      channel: 'Walk-in / Counter',
      locationId: fulfillmentLocation,
      customerName: String(form.get('customer')).trim() || 'Walk-in Customer',
      items: orderItems,
      totalAmount: total,
      stripeStatus: 'Paid',
      stripeChargeId: '',
      orderStatus: 'Incoming',
      paymentMethod: (form.get('paymentMethod') as any) || 'Card',
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
    setCounterLocation(location === 'all' ? '' : location);
    setItems([{ key: 0, itemId: '', quantity: '1' }]);
    setNextItem(1);
    sheetRef.current?.showModal();
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
              <span>{assignedLocation ? locationName(assignedLocation) : 'Bayview Café'}</span>
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
        <div className="orders-kpi-card">
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
        <div className="orders-kpi-card">
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
        <div className="orders-kpi-card">
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
        <div className="orders-kpi-card">
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
          {/* Stage / Status Filter */}
          <select
            value={stage}
            onChange={e => setStage(e.target.value as any)}
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
            onChange={e => setChannel(e.target.value)}
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
                    <td colSpan={12} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted-foreground)' }}>
                      No orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  visible.map(order => {
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
                                  top: '100%',
                                  marginTop: '4px',
                                  width: '160px',
                                  backgroundColor: 'var(--card)',
                                  border: '1px solid var(--border)',
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                  zIndex: 50,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  textAlign: 'left',
                                  borderRadius: '0px',
                                }}
                              >
                                {/* Details Option */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onDetails(order);
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    fontSize: '0.75rem',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    color: 'var(--foreground)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    textAlign: 'left',
                                    width: '100%',
                                  }}
                                >
                                  <Eye size={13} style={{ color: '#2888E6' }} />
                                  <span>View Details</span>
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
                                      padding: '8px 12px',
                                      fontSize: '0.75rem',
                                      background: 'none',
                                      border: 'none',
                                      borderBottom: (isAdmin && index >= 0 && index < 3) ? '1px solid var(--border)' : 'none',
                                      cursor: 'pointer',
                                      color: '#1C2C60',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      textAlign: 'left',
                                      width: '100%',
                                    }}
                                  >
                                    <CheckCircle size={13} style={{ color: '#10B981' }} />
                                    <span>{actions[index]}</span>
                                  </button>
                                )}

                                {/* Cancel Option */}
                                {isAdmin && index >= 0 && index < 3 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      setCancelOrder(order);
                                    }}
                                    style={{
                                      padding: '8px 12px',
                                      fontSize: '0.75rem',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: '#DC2626',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      textAlign: 'left',
                                      width: '100%',
                                    }}
                                  >
                                    <X size={13} style={{ color: '#DC2626' }} />
                                    <span>Cancel Order</span>
                                  </button>
                                )}
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
        </div>
      ) : (
        /* Card Grid View (Sharp 0px matching Users Module) */
        <div className="orders-card-grid">
          {visible.map(order => {
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
                    <button onClick={() => onDetails(order)} className="orders-btn-details">
                      Details
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
      )}

      {/* New Counter Order Dialog */}
      <dialog ref={sheetRef} className="orders-sheet" aria-labelledby="orders-sheet-title">
        <form ref={formRef} onSubmit={create}>
          <header className="orders-sheet-header">
            <h2 id="orders-sheet-title">New Counter Order</h2>
            <button type="button" aria-label="Close" onClick={() => sheetRef.current?.close()} style={{ borderRadius: '0px' }}>
              <X size={18} />
            </button>
          </header>
          <div className="orders-sheet-body">
            <div className="orders-sheet-fields">
              {isAdmin ? (
                <label>
                  Fulfillment Location
                  <select
                    name="location"
                    value={counterLocation}
                    onChange={e => {
                      setCounterLocation(e.target.value as LocationId | '');
                      setItems(prev => prev.map(line => ({ ...line, itemId: '' })));
                    }}
                    required
                    style={{ borderRadius: '0px' }}
                  >
                    <option value="" disabled>Select Location</option>
                    {LOCATIONS.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                  </select>
                </label>
              ) : (
                assignedLocation && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <MapPin size={16} /> {locationName(assignedLocation)}
                  </p>
                )
              )}

              <label>
                Customer Name (Optional)
                <input name="customer" placeholder="e.g. Walk-in Customer" style={{ borderRadius: '0px' }} />
              </label>

              <label>
                Payment Method
                <select name="paymentMethod" defaultValue="Card" style={{ borderRadius: '0px' }}>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="Cash">Cash at Counter</option>
                </select>
              </label>
            </div>

            <section className="orders-sheet-items" aria-labelledby="orders-sheet-items-title">
              <h3 id="orders-sheet-items-title">Order Items</h3>
              {!fulfillmentLocation && <p>Select a location to see its inventory offerings.</p>}
              {fulfillmentLocation && !offerings.length && (
                <p>No in-stock items have a selling price at this location.</p>
              )}
              {offerings.length > 0 && draft.map(({ key, product, quantity }, idx) => (
                <div className="orders-sheet-item" key={key}>
                  <label className="orders-item-name">
                    Item {idx + 1}
                    <select
                      value={product?.id ?? ''}
                      required
                      onChange={e => {
                        const itemId = e.target.value;
                        setItems(prev => prev.map(line => line.key === key ? { ...line, itemId } : line));
                      }}
                      style={{ borderRadius: '0px' }}
                    >
                      <option value="" disabled>Select coffee or bakery item</option>
                      {offerings.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {money.format(item.sellingPrice)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Qty
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={quantity}
                      required
                      onChange={e => {
                        const value = e.target.value;
                        setItems(prev => prev.map(line => line.key === key ? { ...line, quantity: value } : line));
                      }}
                      style={{ borderRadius: '0px' }}
                    />
                  </label>

                  <div className="orders-item-price">
                    <span>Unit price</span>
                    <strong>{product ? money.format(product.sellingPrice) : '—'}</strong>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => setItems(items.filter(item => item.key !== key))}
                      style={{ borderRadius: '0px' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}

              {offerings.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setItems([...items, { key: nextItem, itemId: '', quantity: '1' }]);
                    setNextItem(nextItem + 1);
                  }}
                  style={{ borderRadius: '0px', padding: '6px 12px' }}
                >
                  <Plus size={16} /> Add Item
                </button>
              )}
            </section>
          </div>

          <footer className="orders-sheet-footer">
            <div className="orders-sheet-total">
              <span>Order Total</span>
              <strong>{money.format(total)}</strong>
            </div>
            <button type="button" onClick={() => sheetRef.current?.close()} style={{ borderRadius: '0px' }}>
              Discard
            </button>
            <button className="orders-primary" type="submit" disabled={!canSave} style={{ borderRadius: '0px' }}>
              Save Order
            </button>
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
    </div>
  );
}
