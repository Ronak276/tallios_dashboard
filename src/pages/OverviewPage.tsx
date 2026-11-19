import React from 'react';
import { 
  ClipboardList, CheckCircle, AlertTriangle, Wallet, 
  ArrowRight, ArrowDownLeft, Coffee, Plus, MapPin
} from '../components/icons/Icons';
import type { LocationId } from '../types';

interface OverviewPageProps {
  onNavigateToOrders?: () => void;
  onNavigateToInventory?: () => void;
  onNewOrder?: () => void;
  selectedLocation: LocationId | 'all';
  onLocationChange: (loc: LocationId | 'all') => void;
  userRole?: string;
  userLocation?: string;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  time: string;
  customerName: string;
  type: string;
  details: string;
  status: 'New' | 'Preparing' | 'Ready' | 'Completed';
  total: number;
  images: string[];
}

interface StockAlert {
  id: string;
  name: string;
  category: string;
  quantity: string;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateToOrders,
  onNavigateToInventory,
  onNewOrder,
  selectedLocation,
  onLocationChange,
  userRole = 'Super Admin',
  userLocation,
}) => {
  const isStaff = userRole === 'Staff';

  // Active Location Name display
  const activeLocationDisplayName = isStaff
    ? (userLocation || 'Bayview Café').split('(')[0].trim()
    : (selectedLocation === 'loc-truck-1' ? 'Downtown Food Truck #1' :
       selectedLocation === 'loc-truck-2' ? 'Harbor Marina Truck #2' :
       selectedLocation === 'loc-kiosk-tech' ? 'Tech Park Express Kiosk' :
       'Bayview Café (Roastery HQ)');

  // Location ID mapping helper
  const activeLocId = isStaff
    ? (userLocation?.toLowerCase().includes('truck1') || userLocation?.toLowerCase().includes('truck #1') ? 'loc-truck-1' :
       userLocation?.toLowerCase().includes('truck2') || userLocation?.toLowerCase().includes('truck #2') ? 'loc-truck-2' :
       userLocation?.toLowerCase().includes('kiosk') ? 'loc-kiosk-tech' : 'loc-main')
    : selectedLocation;

  // Mock orders with location tags
  const [ordersList, setOrdersList] = React.useState<(OrderItem & { locationId: LocationId })[]>([
    {
      id: 'ord-1039',
      orderNumber: '#1039',
      time: '10:48 AM',
      customerName: 'Nadia James',
      type: 'Take away',
      details: '1 × Paramaribo Spice Latte · 1 × Bojo',
      status: 'New',
      total: 12.00,
      images: ['/item_latte.jpg', '/item_pastry.jpg'],
      locationId: 'loc-main',
    },
    {
      id: 'ord-1038',
      orderNumber: '#1038',
      time: '10:45 AM',
      customerName: 'Darius Chen',
      type: 'Dine in',
      details: '1 × Cappuccino · 1 × Avocado Toast',
      status: 'Preparing',
      total: 16.00,
      images: ['/item_coffee.jpg', '/item_toast.jpg'],
      locationId: 'loc-kiosk-tech',
    },
    {
      id: 'ord-1037',
      orderNumber: '#1037',
      time: '10:38 AM',
      customerName: 'Marisol Vega',
      type: 'Take away',
      details: '2 × Paramaribo Cold Brew',
      status: 'Ready',
      total: 14.00,
      images: ['/item_coldbrew.jpg'],
      locationId: 'loc-truck-1',
    },
    {
      id: 'ord-1036',
      orderNumber: '#1036',
      time: '10:31 AM',
      customerName: 'Evan Brooks',
      type: 'Take away',
      details: '1 × Ginger Brew',
      status: 'Completed',
      total: 6.00,
      images: ['/item_ginger.jpg'],
      locationId: 'loc-main',
    },
    {
      id: 'ord-1035',
      orderNumber: '#1035',
      time: '10:20 AM',
      customerName: 'Chloe Kensington',
      type: 'Take away',
      details: '1 × Matcha Latte',
      status: 'Ready',
      total: 7.50,
      images: ['/item_latte.jpg'],
      locationId: 'loc-truck-2',
    },
  ]);

  const stockAlertsAll: (StockAlert & { locationId: LocationId })[] = [
    {
      id: 'stock-1',
      name: 'Oat milk',
      category: 'Dairy & alternatives',
      quantity: '4 cartons',
      locationId: 'loc-main',
    },
    {
      id: 'stock-2',
      name: 'Butter croissants',
      category: 'Bakery',
      quantity: '6 pcs',
      locationId: 'loc-truck-1',
    },
    {
      id: 'stock-3',
      name: 'Cold Brew Kegs',
      category: 'Beans & Roasts',
      quantity: '2 kegs',
      locationId: 'loc-truck-2',
    },
    {
      id: 'stock-4',
      name: '12oz Paper Cups',
      category: 'Packaging',
      quantity: '50 pcs',
      locationId: 'loc-kiosk-tech',
    },
  ];

  // Scoped Data by Location
  const scopedOrdersList = isStaff
    ? ordersList.filter(o => o.locationId === activeLocId)
    : (selectedLocation === 'all' ? ordersList : ordersList.filter(o => o.locationId === selectedLocation));

  const stockAlerts = isStaff
    ? stockAlertsAll.filter(s => s.locationId === activeLocId)
    : (selectedLocation === 'all' ? stockAlertsAll : stockAlertsAll.filter(s => s.locationId === selectedLocation));

  const handleAction = (orderId: string, currentStatus: OrderItem['status']) => {
    setOrdersList((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        if (currentStatus === 'New') return { ...o, status: 'Preparing' };
        if (currentStatus === 'Preparing') return { ...o, status: 'Ready' };
        if (currentStatus === 'Ready') return { ...o, status: 'Completed' };
        return o;
      })
    );
  };

  const openOrdersCount = scopedOrdersList.filter(o => o.status !== 'Completed').length;
  const readyForPickupCount = scopedOrdersList.filter(o => o.status === 'Ready').length;
  const lowStockCount = stockAlerts.length;
  const completedSalesTotal = scopedOrdersList
    .filter(o => o.status === 'Completed')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '100%' }}>
      
      {/* Top Header row (Operations overview + Location selector + New order button aligned in one single row) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '-0.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>
            Operations overview
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
            {activeLocationDisplayName}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Location Indicator: Staff gets locked direct location badge; Super Admin gets dropdown */}
          {isStaff ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0px',
              padding: '6px 12px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              <MapPin size={14} style={{ color: '#10b981' }} />
              <span>{userLocation || 'Bayview Café'}</span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
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
                value={selectedLocation === 'all' ? 'loc-main' : selectedLocation}
                onChange={(e) => onLocationChange(e.target.value as any)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  paddingRight: '4px'
                }}
              >
                <option value="loc-main">Bayview Café</option>
                <option value="loc-truck-1">Downtown Food Truck #1</option>
                <option value="loc-truck-2">Harbor Marina Truck #2</option>
                <option value="loc-kiosk-tech">Tech Park Express Kiosk</option>
              </select>
            </div>
          )}

          <button
            onClick={onNewOrder}
            className="rrm-btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: '0px',
              cursor: 'pointer'
            }}
          >
            <Plus size={15} />
            <span>+ New order</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: "A smooth shift starts here." (Theme styled, sharp 0px radius) */}
      <div
        style={{
          position: 'relative',
          borderRadius: '0px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          minHeight: '150px',
          display: 'flex',
          alignItems: 'center',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          backgroundImage: `
            linear-gradient(90deg, #101c38 0%, #1C2C60 55%, rgba(28, 44, 96, 0.85) 75%, rgba(28, 44, 96, 0.45) 100%),
            url('/banner_plant_bg.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundColor: '#1C2C60'
        }}
      >
        <div style={{ maxWidth: '600px', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#C68A4C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Coffee size={15} />
            <span>{activeLocationDisplayName}</span>
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 1.15 }}>
            A smooth shift starts here.
          </h2>

          <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 400 }}>
            See what's waiting, what's ready, and what needs restocking.
          </p>

          <div style={{ marginTop: '0.5rem' }}>
            <button
              onClick={onNavigateToOrders}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                color: '#1C2C60',
                border: '1px solid #ffffff',
                borderRadius: '0px',
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>View order queue</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards (Theme rrm-card style: 0px border-radius, crisp borders) */}
      <div className="stats-grid">
        {/* Metric 1: Open orders */}
        <div className="rrm-card" style={{ borderRadius: '0px', minHeight: '120px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Open orders</span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '0px',
                backgroundColor: 'rgba(28, 44, 96, 0.08)',
                color: '#1C2C60',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClipboardList size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                {openOrdersCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                1 new in queue
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Ready for pickup */}
        <div className="rrm-card" style={{ borderRadius: '0px', minHeight: '120px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ready for pickup</span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '0px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                {readyForPickupCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                Awaiting handoff
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Low stock */}
        <div className="rrm-card" style={{ borderRadius: '0px', minHeight: '120px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Low stock</span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '0px',
                backgroundColor: 'rgba(198, 138, 76, 0.15)',
                color: '#C68A4C',
                border: '1px solid rgba(198, 138, 76, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#C68A4C', lineHeight: 1 }}>
                {lowStockCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                Items to restock
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Completed sales */}
        <div className="rrm-card" style={{ borderRadius: '0px', minHeight: '120px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completed sales</span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '0px',
                backgroundColor: 'rgba(28, 44, 96, 0.08)',
                color: '#1C2C60',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wallet size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                ${completedSalesTotal.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                Completed orders
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2 Columns: Recent Orders Table (left) & Stock Alerts (right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '1.25rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Recent Orders Card with Table Listing (Theme Styled, 0px border-radius) */}
        <div className="rrm-card" style={{ borderRadius: '0px' }}>
          <div className="rrm-card-header" style={{ padding: '1rem 1.25rem' }}>
            <div>
              <h3 className="rrm-card-title uppercase" style={{ fontSize: '0.875rem' }}>Recent orders</h3>
              <p className="rrm-card-description">Latest orders at {activeLocationDisplayName}</p>
            </div>
            <button
              onClick={onNavigateToOrders}
              className="rrm-btn-outline"
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '0px'
              }}
            >
              <span>All orders</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Table Listing */}
          <div className="rrm-table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="rrm-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Order</th>
                  <th>Customer & Item Details</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '85px' }}>Total</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {scopedOrdersList.map((order) => {
                  let badgeClass = 'rrm-badge';
                  if (order.status === 'New') {
                    badgeClass = 'rrm-badge rrm-badge-coffee';
                  } else if (order.status === 'Preparing') {
                    badgeClass = 'rrm-badge rrm-badge-warning';
                  } else if (order.status === 'Ready') {
                    badgeClass = 'rrm-badge rrm-badge-valid';
                  } else {
                    badgeClass = 'rrm-badge';
                  }

                  return (
                    <tr key={order.id}>
                      {/* Order Column */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.8125rem' }}>{order.orderNumber}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>{order.time}</div>
                      </td>

                      {/* Customer Column with images */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            {order.images.map((imgSrc, i) => (
                              <img
                                key={i}
                                src={imgSrc}
                                alt="item"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '0px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--border)',
                                  backgroundColor: 'var(--muted)'
                                }}
                              />
                            ))}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.8125rem' }}>
                              {order.customerName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '1px' }}>
                              {order.type} · {order.details}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td>
                        <span className={badgeClass} style={{ borderRadius: '0px' }}>
                          ● {order.status}
                        </span>
                      </td>

                      {/* Total Column */}
                      <td style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                        ${order.total.toFixed(2)}
                      </td>

                      {/* Action Column */}
                      <td style={{ textAlign: 'right' }}>
                        {order.status === 'New' && (
                          <button
                            onClick={() => handleAction(order.id, 'New')}
                            className="rrm-btn-outline"
                            style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '0px' }}
                          >
                            Start
                          </button>
                        )}
                        {order.status === 'Preparing' && (
                          <button
                            onClick={() => handleAction(order.id, 'Preparing')}
                            className="rrm-btn-primary"
                            style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '0px' }}
                          >
                            Mark ready
                          </button>
                        )}
                        {order.status === 'Ready' && (
                          <button
                            onClick={() => handleAction(order.id, 'Ready')}
                            className="rrm-btn-outline"
                            style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '0px', color: '#10b981', borderColor: '#10b981' }}
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Stock Alerts Card (Theme Styled, 0px border-radius) */}
        <div className="rrm-card" style={{ borderRadius: '0px' }}>
          <div className="rrm-card-header" style={{ padding: '1rem 1.25rem' }}>
            <div>
              <h3 className="rrm-card-title uppercase" style={{ fontSize: '0.875rem' }}>Stock alerts</h3>
              <p className="rrm-card-description">Items at or below their threshold</p>
            </div>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '0px',
              backgroundColor: 'rgba(198, 138, 76, 0.15)',
              color: '#C68A4C',
              border: '1px solid rgba(198, 138, 76, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={15} />
            </div>
          </div>

          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
            {stockAlerts.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--muted)',
                  borderRadius: '0px',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '0px',
                    backgroundColor: 'rgba(198, 138, 76, 0.2)',
                    color: '#C68A4C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ArrowDownLeft size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--foreground)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{item.category}</div>
                  </div>
                </div>

                <div className="rrm-badge rrm-badge-warning" style={{ borderRadius: '0px' }}>
                  {item.quantity}
                </div>
              </div>
            ))}

            {/* View inventory button */}
            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={onNavigateToInventory}
                className="rrm-btn-outline"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  borderRadius: '0px'
                }}
              >
                <span>View inventory</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
