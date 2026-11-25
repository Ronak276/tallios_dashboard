import React, { useState } from 'react';
import type { InventoryItem } from '../../types';
import { X } from '../icons/Icons';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onAdjust: (amount: number, type: 'Restock' | 'Wastage / Dial-in', reason: string) => void;
}

export function StockAdjustModal({ isOpen, onClose, item, onAdjust }: StockAdjustModalProps) {
  const [type, setType] = useState<'Restock' | 'Wastage / Dial-in'>('Restock');
  const [amount, setAmount] = useState<number>(1);
  const [reason, setReason] = useState('Weekly shipment received');

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdjust(Number(amount), type, reason);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="rrm-card" style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--card)' }}>
        <div className="rrm-card-header">
          <h3 className="rrm-card-title uppercase font-bold text-sm">
            Adjust Stock: <span style={{ color: '#1C2C60' }}>{item.name}</span>
          </h3>
          <button onClick={onClose} className="rrm-btn-outline" style={{ padding: '2px 6px' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Adjustment Action</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="rrm-input"
                style={{ width: '100%' }}
              >
                <option value="Restock">+ Restock Stock (Inbound Shipment)</option>
                <option value="Wastage / Spoilage">- Spoilage / Dial-in Spoilage / Expired</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Quantity ({item.unit})
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="rrm-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Reason / Notes</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rrm-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="rrm-card-footer" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} className="rrm-btn-outline">
              Cancel
            </button>
            <button type="submit" className="rrm-btn-primary">
              Confirm Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
