import React, { useState } from 'react';
import type { InventoryItem } from '../../types';
import { X, Package } from '../icons/Icons';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (updatedItem: InventoryItem) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, item, onSave }) => {
  if (!isOpen || !item) return null;
  return <EditItemForm key={item.id} item={item} onClose={onClose} onSave={onSave} />;
};

function EditItemForm({ item, onClose, onSave }: Pick<EditItemModalProps, 'onClose' | 'onSave'> & { item: InventoryItem }) {
  const [formData, setFormData] = useState<InventoryItem>({ ...item });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="rrm-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '100%', backgroundColor: 'var(--card)' }}
      >
        <div className="rrm-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} style={{ color: '#1C2C60' }} />
            <div>
              <h3 className="rrm-card-title uppercase">Edit Ingredient & SKU Details</h3>
              <p className="rrm-card-description">Modify specification, supplier lot, minimum par, and unit cost</p>
            </div>
          </div>
          <button onClick={onClose} className="rrm-btn-outline" style={{ border: 'none', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Item Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rrm-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>SKU Code</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="rrm-input"
                style={{ width: '100%', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Current Stock</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                className="rrm-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                className="rrm-input"
                style={{ width: '100%' }}
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="L">L (Liters)</option>
                <option value="bottles">bottles</option>
                <option value="units">units / cups</option>
                <option value="bags">bags</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Min Par</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: parseFloat(e.target.value) || 0 })}
                className="rrm-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                className="rrm-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Batch / Lot Number</label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="rrm-input"
                style={{ width: '100%', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <label style={{ display: 'grid', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            Selling price ($)
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.sellingPrice ?? ''}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value === '' ? undefined : e.target.valueAsNumber })}
              className="rrm-input"
              placeholder="Leave blank for stock-only items"
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="rrm-btn-outline">
              Cancel
            </button>
            <button type="submit" className="rrm-btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ViewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onEditClick: (item: InventoryItem) => void;
  onAdjustClick: (item: InventoryItem) => void;
  onTransferClick: (item: InventoryItem) => void;
}

export const ViewItemModal: React.FC<ViewItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onEditClick,
  onAdjustClick,
  onTransferClick,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="rrm-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '100%', backgroundColor: 'var(--card)' }}
      >
        <div className="rrm-card-header">
          <div>
            <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: '#1C2C60', fontWeight: 700, letterSpacing: '0.05em' }}>
              {item.category}
            </span>
            <h3 className="rrm-card-title uppercase" style={{ fontSize: '1.1rem', marginTop: '2px' }}>
              {item.name}
            </h3>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              SKU: {item.sku}
            </span>
          </div>
          <button onClick={onClose} className="rrm-btn-outline" style={{ border: 'none', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--muted)' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Current Stock</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1C2C60' }}>
                {item.stock} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>{item.unit}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Unit Cost</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                ${item.costPerUnit.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Total Value</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#C68A4C' }}>
                ${(item.stock * item.costPerUnit).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Location ID:</span>
              <span style={{ fontWeight: 600 }}>{item.locationId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Batch / Lot:</span>
              <span style={{ fontFamily: 'monospace' }}>{item.batchNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Expiry Date:</span>
              <span>{item.expiryDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Minimum Safe Threshold:</span>
              <span>{item.minThreshold} {item.unit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Inventory Status:</span>
              <span style={{ 
                padding: '2px 8px', 
                fontSize: '0.6875rem', 
                fontWeight: 700,
                backgroundColor: item.stock <= item.minThreshold ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: item.stock <= item.minThreshold ? '#ef4444' : '#10b981'
              }}>
                {item.status}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
            <button 
              onClick={() => { onClose(); onEditClick(item); }} 
              className="rrm-btn-primary" 
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
            >
              Edit Item
            </button>
            <button 
              onClick={() => { onClose(); onAdjustClick(item); }} 
              className="rrm-btn-outline" 
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
            >
              Adjust / Dial-in
            </button>
            <button 
              onClick={() => { onClose(); onTransferClick(item); }} 
              className="rrm-btn-outline" 
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderColor: '#1C2C60', color: '#1C2C60' }}
            >
              Transfer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
