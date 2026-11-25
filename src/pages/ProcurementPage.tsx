import type { PurchaseOrder } from '../types';
import { Plus } from '../components/icons/Icons';

interface ProcurementPageProps {
  purchaseOrders: PurchaseOrder[];
  onOpenCreatePO: () => void;
}

export function ProcurementPage({ purchaseOrders, onOpenCreatePO }: ProcurementPageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Coffee Supplier Purchase Orders</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>Replenishment orders sent to green coffee bean importers &amp; dairy distributors</p>
        </div>
        <button
          onClick={onOpenCreatePO}
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
  );
}
