import type { InventoryItem, LocationId } from '../types';
import { LOCATIONS } from '../data/mockData';

interface TrucksPageProps {
  inventory: InventoryItem[];
  onSelectLocationStock: (locationId: LocationId) => void;
}

export function TrucksPage({ inventory, onSelectLocationStock }: TrucksPageProps) {
  return (
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
                  ● GPS &amp; Food Truck POS Live
                </span>
                <button
                  onClick={() => onSelectLocationStock(loc.id)}
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
  );
}
