import React, { useState } from 'react';
import type { InventoryItem, LocationId } from '../../types';
import { LOCATIONS } from '../../data/mockData';
import { X } from '../icons/Icons';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onTransfer: (fromLocation: LocationId, toLocation: LocationId, amount: number) => void;
}

export function TransferModal({ isOpen, onClose, item, onTransfer }: TransferModalProps) {
  const [fromLocation, setFromLocation] = useState<LocationId>(item?.locationId || 'loc-main');
  const [toLocation, setToLocation] = useState<LocationId>('loc-truck-1');
  const [amount, setAmount] = useState<number>(2);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromLocation === toLocation) {
      alert("Source and Destination units must be different!");
      return;
    }
    if (item.stock < Number(amount)) {
      alert("Insufficient stock at source unit!");
      return;
    }
    onTransfer(fromLocation, toLocation, Number(amount));
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="rrm-card" style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--card)' }}>
        <div className="rrm-card-header">
          <h3 className="rrm-card-title uppercase font-bold text-sm">
            Transfer: <span style={{ color: '#1C2C60' }}>{item.name}</span>
          </h3>
          <button onClick={onClose} className="rrm-btn-outline" style={{ padding: '2px 6px' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>From Location (Source)</label>
              <select
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value as LocationId)}
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
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value as LocationId)}
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
                Transfer Quantity ({item.unit})
              </label>
              <input
                type="number"
                step="any"
                required
                max={item.stock}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
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
              Dispatch Units
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
