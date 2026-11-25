import type { InventoryItem } from '../types';
import { LOCATIONS } from '../data/mockData';

interface RoastingPageProps {
  inventory: InventoryItem[];
  onAdjustItem?: (item: InventoryItem) => void;
}

export function RoastingPage({ inventory, onAdjustItem }: RoastingPageProps) {
  const beans = inventory.filter(i => i.category === 'Beans & Roasts');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="rrm-card">
        <div className="rrm-card-header">
          <div>
            <h3 className="rrm-card-title uppercase">Coffee Bean Roasting &amp; Batch Logs</h3>
            <p className="rrm-card-description">Dial-in wastage records, roast date tracking, and lot origins</p>
          </div>
        </div>

        <div className="rrm-table-wrapper" style={{ border: 'none' }}>
          <table className="rrm-table">
            <thead>
              <tr>
                <th>Batch / Lot</th>
                <th>Origin &amp; Profile</th>
                <th>Location</th>
                <th>Current On-Hand</th>
                <th>Expiry / Best Before</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {beans.map(bean => (
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
                      onClick={() => onAdjustItem && onAdjustItem(bean)}
                      className="rrm-btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                    >
                      Log Dial-in Spoilage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
