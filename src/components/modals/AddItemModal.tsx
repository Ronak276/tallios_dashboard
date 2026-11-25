import React, { useState } from 'react';
import type { InventoryItem, ItemCategory, LocationId } from '../../types';
import { LOCATIONS } from '../../data/mockData';
import { X } from '../icons/Icons';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: InventoryItem) => void;
}

export function AddItemModal({ isOpen, onClose, onAddItem }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Beans & Roasts');
  const [stock, setStock] = useState<number>(10);
  const [unit, setUnit] = useState<InventoryItem['unit']>('kg');
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [costPerUnit, setCostPerUnit] = useState<number>(15.0);
  const [locationId, setLocationId] = useState<LocationId>('loc-main');
  const [batchNumber, setBatchNumber] = useState('LOT-2026-NEW');
  const [expiryDate, setExpiryDate] = useState('2027-01-01');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      name,
      sku: sku.toUpperCase(),
      category,
      stock: Number(stock),
      unit,
      minThreshold: Number(minThreshold),
      costPerUnit: Number(costPerUnit),
      locationId,
      batchNumber,
      expiryDate,
      lastUpdated: 'Just now',
      status: Number(stock) <= Number(minThreshold) ? 'Low Stock' : 'In Stock'
    };
    onAddItem(item);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="rrm-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--card)' }}>
        <div className="rrm-card-header">
          <h3 className="rrm-card-title uppercase font-bold text-sm">+ Add New Cafe Ingredient / Packaging SKU</h3>
          <button onClick={onClose} className="rrm-btn-outline" style={{ padding: '2px 6px' }}>
            <X size={15} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Item Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Kenya Nyeri Peaberry Light Roast"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rrm-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>SKU Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BN-KEN-005"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="rrm-input"
                  style={{ width: '100%', fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="rrm-input"
                  style={{ width: '100%' }}
                >
                  <option value="Beans & Roasts">Beans &amp; Roasts</option>
                  <option value="Dairy & Milk">Dairy &amp; Alternatives</option>
                  <option value="Syrups & Flavors">Syrups &amp; Flavors</option>
                  <option value="Bakery & Food">Bakery &amp; Food</option>
                  <option value="Packaging & Cups">Packaging &amp; Cups</option>
                  <option value="Tea & Chai">Tea &amp; Chai</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Starting Stock</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="rrm-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as InventoryItem['unit'])}
                  className="rrm-input"
                  style={{ width: '100%' }}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="units">units</option>
                  <option value="bottles">bottles</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Min Threshold</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(Number(e.target.value))}
                  className="rrm-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Assigned Location</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value as LocationId)}
                  className="rrm-input"
                  style={{ width: '100%' }}
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Cost Per Unit ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(Number(e.target.value))}
                  className="rrm-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Lot / Batch #</label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="rrm-input"
                  style={{ width: '100%', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Expiry / Best Before</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="rrm-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div className="rrm-card-footer" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} className="rrm-btn-outline">
              Cancel
            </button>
            <button type="submit" className="rrm-btn-primary">
              Save SKU to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
