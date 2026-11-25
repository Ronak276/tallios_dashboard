import React, { useState } from 'react';
import type { PurchaseOrder } from '../../types';
import { X } from '../icons/Icons';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePO: (po: PurchaseOrder) => void;
}

export function CreatePOModal({ isOpen, onClose, onCreatePO }: CreatePOModalProps) {
  const [supplier, setSupplier] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [totalCost, setTotalCost] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplier,
      itemsSummary,
      totalCost: Number(totalCost),
      status: 'Sent to Supplier',
      orderDate: 'Today'
    };
    onCreatePO(po);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="rrm-card" style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--card)' }}>
        <div className="rrm-card-header">
          <h3 className="rrm-card-title uppercase font-bold text-sm">+ Create Supplier Purchase Order</h3>
          <button onClick={onClose} className="rrm-btn-outline" style={{ padding: '2px 6px' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Supplier / Importer Name</label>
              <input
                type="text"
                required
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="rrm-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Items &amp; Bags / Cartons</label>
              <textarea
                required
                rows={3}
                value={itemsSummary}
                onChange={(e) => setItemsSummary(e.target.value)}
                className="rrm-input"
                style={{ width: '100%', resize: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Estimated Cost ($)</label>
              <input
                type="number"
                step="any"
                required
                value={totalCost}
                onChange={(e) => setTotalCost(Number(e.target.value))}
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
              Dispatch PO to Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
