import React from 'react';
import { 
  ClipboardList, CheckCircle, AlertTriangle, Wallet, 
  ArrowRight, Plus, MapPin, Coffee
} from '../components/icons/Icons';
import type { LocationId, KioskOrder, InventoryItem } from '../types';

interface OverviewPageProps {
  orders?: KioskOrder[];
  inventory?: InventoryItem[];
  onNavigateToOrders?: () => void;
  onNavigateToInventory?: () => void;
  onNewOrder?: () => void;
  selectedLocation: LocationId | 'all';
  onLocationChange: (loc: LocationId | 'all') => void;
  onStatusChange?: (order: KioskOrder, status: KioskOrder['orderStatus']) => void;
  userRole?: string;
  userLocation?: string;
}

function resolveOverviewLocationId(loc?: string): LocationId | 'all' {
  if (!loc || loc === 'all' || loc === 'All Locations') return 'all';
  const l = loc.toLowerCase();
  if (l === 'loc-main' || l.includes('bayview') || l.includes('main street') || l.includes('roastery')) return 'loc-main';
  if (l === 'loc-truck-1' || l.includes('truck #1') || l.includes('truck 1') || l.includes('downtown')) return 'loc-truck-1';
  if (l === 'loc-truck-2' || l.includes('truck #2') || l.includes('truck 2') || l.includes('farmers') || l.includes('marina')) return 'loc-truck-2';
  if (l === 'loc-kiosk-tech' || l.includes('kiosk') || l.includes('tech park')) return 'loc-kiosk-tech';
  return 'all';
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  orders = [],
  inventory = [],
  onNavigateToOrders,
  onNavigateToInventory,
  onNewOrder,
  selectedLocation,
  onLocationChange,
  onStatusChange,
  userRole = 'Super Admin',
  userLocation,
}) => {
  const isStaff = userRole === 'Staff';

  // Resolved Location ID for Staff
  const resolvedStaffLocId = resolveOverviewLocationId(userLocation);
  const activeLocId = isStaff
    ? (resolvedStaffLocId === 'all' ? 'loc-main' : resolvedStaffLocId)
    : selectedLocation;

  // Active Location Name display
  const activeLocationDisplayName = isStaff
    ? (userLocation || 'Bayview Café').split('(')[0].trim()
    : (selectedLocation === 'loc-truck-1' ? 'Mobile Food Truck #1' :
       selectedLocation === 'loc-truck-2' ? 'Mobile Food Truck #2' :
       selectedLocation === 'loc-kiosk-tech' ? 'Tech Park Express Kiosk' :
       'Bayview Café (Roastery HQ)');

  // Scoped Data by Location (100% Live DB Sync)
  const scopedOrders = isStaff
    ? orders.filter(o => o.locationId === activeLocId)
    : (selectedLocation === 'all' ? orders : orders.filter(o => o.locationId === selectedLocation));

  const scopedInventory = isStaff
    ? inventory.filter(i => i.locationId === activeLocId)
    : (selectedLocation === 'all' ? inventory : inventory.filter(i => i.locationId === selectedLocation));

  // Low Stock Items derived directly from real live inventory
  const lowStockAlerts = scopedInventory.filter(
    item => item.status === 'Low Stock' || item.status === 'Critical' || item.stock <= item.minThreshold
  );

  const openOrdersCount = scopedOrders.filter(o => o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled').length;
  const readyForPickupCount = scopedOrders.filter(o => o.orderStatus === 'Ready for Pickup').length;
  const lowStockCount = lowStockAlerts.length;
  const completedSalesTotal = scopedOrders
    .filter(o => o.orderStatus === 'Completed' && o.stripeStatus === 'Paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleNextStatus = (order: KioskOrder) => {
    if (!onStatusChange) return;
    if (order.orderStatus === 'Incoming') onStatusChange(order, 'Brewing / Prep');
    else if (order.orderStatus === 'Brewing / Prep') onStatusChange(order, 'Ready for Pickup');
    else if (order.orderStatus === 'Ready for Pickup') onStatusChange(order, 'Completed');
  };

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
              gap: '0.4rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              <MapPin size={13} style={{ color: '#10b981' }} />
              <span>{userLocation || 'Bayview Café'}</span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              <MapPin size={13} style={{ color: '#2888E6', flexShrink: 0 }} />
              <select
                value={selectedLocation === 'all' ? 'loc-main' : selectedLocation}
                onChange={(e) => onLocationChange(e.target.value as any)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  paddingRight: '2px'
                }}
              >
                <option value="loc-main">Bayview Café (Roastery HQ)</option>
                <option value="loc-truck-1">Mobile Food Truck #1</option>
                <option value="loc-truck-2">Mobile Food Truck #2</option>
                <option value="loc-kiosk-tech">Tech Park Express Kiosk</option>
              </select>
            </div>
          )}

          <button
            onClick={onNewOrder}
            className="rrm-btn-primary"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '0px',
              cursor: 'pointer'
            }}
          >
            <Plus size={13} />
            <span>New order</span>
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
        <div className="rrm-card kpi-card-hover kpi-card-primary" style={{ borderRadius: '0px', minHeight: '120px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Open orders</span>
              <div className="kpi-icon-box" style={{
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
        <div className="rrm-card kpi-card-hover kpi-card-emerald" style={{ borderRadius: '0px', minHeight: '120px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ready for pickup</span>
              <div className="kpi-icon-box" style={{
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
        <div className="rrm-card kpi-card-hover kpi-card-gold" style={{ borderRadius: '0px', minHeight: '120px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Low stock</span>
              <div className="kpi-icon-box" style={{
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
        <div className="rrm-card kpi-card-hover kpi-card-purple" style={{ borderRadius: '0px', minHeight: '120px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completed sales</span>
              <div className="kpi-icon-box" style={{
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
                {scopedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--muted-foreground)' }}>
                      No active orders found at {activeLocationDisplayName}.
                    </td>
                  </tr>
                ) : (
                  scopedOrders.slice(0, 5).map((order) => {
                    let badgeClass = 'rrm-badge';
                    let displayStatus = 'Incoming';
                    let nextActionLabel = 'Start';
                    
                    if (order.orderStatus === 'Incoming') {
                      badgeClass = 'rrm-badge rrm-badge-coffee';
                      displayStatus = 'New';
                      nextActionLabel = 'Start';
                    } else if (order.orderStatus === 'Brewing / Prep') {
                      badgeClass = 'rrm-badge rrm-badge-warning';
                      displayStatus = 'Preparing';
                      nextActionLabel = 'Mark ready';
                    } else if (order.orderStatus === 'Ready for Pickup') {
                      badgeClass = 'rrm-badge rrm-badge-valid';
                      displayStatus = 'Ready';
                      nextActionLabel = 'Complete';
                    } else if (order.orderStatus === 'Completed') {
                      badgeClass = 'rrm-badge';
                      displayStatus = 'Completed';
                    } else if (order.orderStatus === 'Cancelled') {
                      badgeClass = 'rrm-badge';
                      displayStatus = 'Cancelled';
                    }

                    const itemsText = order.items.map(i => `${i.quantity} × ${i.name}`).join(' · ');

                    return (
                      <tr key={order.id}>
                        {/* Order Column */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.8125rem' }}>{order.orderNumber}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Customer Column */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '0px',
                              backgroundColor: 'rgba(28, 44, 96, 0.08)',
                              color: '#1C2C60',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              fontWeight: 700,
                              fontSize: '0.75rem'
                            }}>
                              <Coffee size={14} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {order.customerName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {order.channel} · {itemsText}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td>
                          <span className={badgeClass} style={{ borderRadius: '0px' }}>
                            ● {displayStatus}
                          </span>
                        </td>

                        {/* Total Column */}
                        <td style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                          ${order.totalAmount.toFixed(2)}
                        </td>

                        {/* Action Column */}
                        <td style={{ textAlign: 'right' }}>
                          {order.orderStatus !== 'Completed' && order.orderStatus !== 'Cancelled' ? (
                            <button
                              onClick={() => handleNextStatus(order)}
                              className={order.orderStatus === 'Brewing / Prep' ? 'rrm-btn-primary' : 'rrm-btn-outline'}
                              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '0px' }}
                            >
                              {nextActionLabel}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Done</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
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
            {lowStockAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#10b981', fontSize: '0.8125rem', fontWeight: 600 }}>
                ✓ All items healthy &amp; well stocked
              </div>
            ) : (
              lowStockAlerts.slice(0, 4).map((item) => (
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
                      <AlertTriangle size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--foreground)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{item.category}</div>
                    </div>
                  </div>

                  <div className="rrm-badge rrm-badge-warning" style={{ borderRadius: '0px' }}>
                    {item.stock} {item.unit}
                  </div>
                </div>
              ))
            )}

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
