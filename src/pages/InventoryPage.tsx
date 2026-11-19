import React from 'react';
import type { InventoryItem } from '../types';
import { LOCATIONS } from '../data/mockData';
import { 
  Search, Plus, List, Grid, MoreVertical, RefreshCw 
} from '../components/icons/Icons';

interface InventoryPageProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
  onViewItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onAdjustStock: (item: InventoryItem) => void;
  onTransferStock: (item: InventoryItem) => void;
  triggerToast: (msg: string) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  inventory,
  setInventory,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onViewItem,
  onEditItem,
  onAdjustStock,
  onTransferStock,
  triggerToast,
}) => {
  const [inventoryViewMode, setInventoryViewMode] = React.useState<'table' | 'card'>('table');
  const [openDropdownItemId, setOpenDropdownItemId] = React.useState<string | null>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = () => setOpenDropdownItemId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredInventory = React.useMemo(() => {
    return inventory.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  const exportInventoryCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Stock', 'Unit', 'Min Threshold', 'Cost Per Unit', 'Status'];
    const rows = filteredInventory.map(i => [
      i.sku,
      `"${i.name}"`,
      `"${i.category}"`,
      i.stock,
      i.unit,
      i.minThreshold,
      i.costPerUnit,
      i.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tallios_inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Inventory CSV exported successfully');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Category Dropdown & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
            Category Filter:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rrm-input"
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              backgroundColor: 'var(--card)',
              color: selectedCategory === 'all' ? 'var(--foreground)' : '#1C2C60',
              borderColor: selectedCategory === 'all' ? 'var(--border)' : '#1C2C60',
              cursor: 'pointer',
              minWidth: '180px'
            }}
          >
            <option value="all">☕ All Ingredients (Consolidated)</option>
            <option value="Beans & Roasts">Beans & Roasts</option>
            <option value="Dairy & Alternative Milk">Dairy & Alternative Milk</option>
            <option value="Syrups & Flavors">Syrups & Flavors</option>
            <option value="Bakery & Snacks">Bakery & Snacks</option>
            <option value="Packaging & Cups">Packaging & Cups</option>
            <option value="Tea & Matcha">Tea & Matcha</option>
          </select>
        </div>

        {/* Search Bar & Export & Add SKU Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search Bean, Milk, Syrup, Batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rrm-input"
              style={{ width: '100%', paddingLeft: '32px' }}
            />
          </div>
          <button
            onClick={exportInventoryCSV}
            className="rrm-btn-outline"
            title="Export as CSV spreadsheet"
          >
            Export CSV
          </button>
          <button
            onClick={onOpenAddModal}
            className="rrm-btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Plus size={14} /> + Add Ingredient
          </button>
        </div>
      </div>

      {/* Data Table / Card View */}
      <div className="rrm-card">
        <div className="rrm-card-header">
          <div>
            <h3 className="rrm-card-title uppercase tracking-wide">Live Cafe Ingredients & Stock Catalog</h3>
            <p className="rrm-card-description">Real-time inventory levels across roastery and food trucks</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Showing {filteredInventory.length} items</span>

            {/* Table vs Card Toggle */}
            <div style={{ display: 'inline-flex', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
              <button
                onClick={() => setInventoryViewMode('table')}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  background: inventoryViewMode === 'table' ? 'var(--primary)' : 'transparent',
                  color: inventoryViewMode === 'table' ? '#ffffff' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Table View (Default)"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setInventoryViewMode('card')}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderLeft: '1px solid var(--border)',
                  background: inventoryViewMode === 'card' ? 'var(--primary)' : 'transparent',
                  color: inventoryViewMode === 'card' ? '#ffffff' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Card View"
              >
                <Grid size={14} />
              </button>
            </div>
          </div>
        </div>

        {inventoryViewMode === 'table' ? (
          <div className="rrm-table-wrapper" style={{ border: 'none' }}>
            <table className="rrm-table">
              <thead>
                <tr>
                  <th>Item & SKU</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Current On-Hand</th>
                  <th>Batch / Lot</th>
                  <th>Unit Cost</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => {
                  const locName = LOCATIONS.find(l => l.id === item.locationId)?.name;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{item.sku}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.6875rem', padding: '2px 8px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>
                        <div style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={locName}>
                          {locName?.replace("Tallio's ", "")}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            {item.stock} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted-foreground)' }}>{item.unit}</span>
                          </span>
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>Min: {item.minThreshold} {item.unit}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                        {item.batchNumber}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        ${item.costPerUnit.toFixed(2)}
                      </td>
                      <td>
                        {item.status === 'In Stock' && (
                          <span className="rrm-badge rrm-badge-valid">● In Stock</span>
                        )}
                        {item.status === 'Low Stock' && (
                          <span className="rrm-badge rrm-badge-warning">▲ Low Stock</span>
                        )}
                        {(item.status === 'Critical' || item.status === 'Out of Stock') && (
                          <span className="rrm-badge rrm-badge-expired">✕ {item.status}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', position: 'relative' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownItemId(openDropdownItemId === item.id ? null : item.id);
                            }}
                            className="rrm-btn-outline"
                            style={{ padding: '4px 6px', color: 'var(--muted-foreground)' }}
                            title="Actions Menu"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* 3-Dot Action Dropdown Menu */}
                          {openDropdownItemId === item.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                zIndex: 50,
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                minWidth: '150px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                padding: '4px 0',
                                display: 'flex',
                                flexDirection: 'column'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  onViewItem(item);
                                  setOpenDropdownItemId(null);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  textAlign: 'left',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--foreground)'
                                }}
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  onEditItem(item);
                                  setOpenDropdownItemId(null);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  textAlign: 'left',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--foreground)'
                                }}
                              >
                                Edit Stock Item
                              </button>
                              <button
                                onClick={() => {
                                  onAdjustStock(item);
                                  setOpenDropdownItemId(null);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  textAlign: 'left',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--foreground)'
                                }}
                              >
                                Quick Adjustment (±)
                              </button>
                              <button
                                onClick={() => {
                                  onTransferStock(item);
                                  setOpenDropdownItemId(null);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  textAlign: 'left',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--foreground)'
                                }}
                              >
                                Transfer Location
                              </button>
                              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }}></div>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete ${item.name}?`)) {
                                    setInventory(prev => prev.filter(i => i.id !== item.id));
                                    triggerToast(`Deleted ${item.name}`);
                                  }
                                  setOpenDropdownItemId(null);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  textAlign: 'left',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  fontWeight: 600
                                }}
                              >
                                Delete SKU
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cards-three-grid" style={{ padding: '1.25rem' }}>
            {filteredInventory.map(item => {
              const locName = LOCATIONS.find(l => l.id === item.locationId)?.name;
              return (
                <div key={item.id} className="rrm-card" style={{ border: '1px solid var(--border)' }}>
                  <div className="rrm-card-header" style={{ padding: '0.75rem 1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.name}</h4>
                      <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', color: 'var(--muted-foreground)' }}>{item.sku}</span>
                    </div>
                    {item.status === 'In Stock' && <span className="rrm-badge rrm-badge-valid">In Stock</span>}
                    {item.status === 'Low Stock' && <span className="rrm-badge rrm-badge-warning">Low Stock</span>}
                    {(item.status === 'Critical' || item.status === 'Out of Stock') && <span className="rrm-badge rrm-badge-expired">{item.status}</span>}
                  </div>

                  <div className="rrm-card-body" style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Category:</span>
                      <span style={{ fontWeight: 600 }}>{item.category}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Quantity on hand:</span>
                      <span style={{ fontWeight: 700, color: item.status === 'In Stock' ? 'var(--foreground)' : '#ef4444' }}>
                        {item.stock} {item.unit}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Unit Cost:</span>
                      <span style={{ fontWeight: 600 }}>${item.costPerUnit.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Assigned Unit:</span>
                      <span>{locName?.replace("Tallio's ", "")}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Lot:</span>
                      <span style={{ fontFamily: 'monospace' }}>{item.batchNumber}</span>
                    </div>
                  </div>

                  <div className="rrm-card-footer" style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                    <button
                      onClick={() => onViewItem(item)}
                      className="rrm-btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.6875rem', flex: 1 }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEditItem(item)}
                      className="rrm-btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.6875rem', flex: 1 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${item.name}?`)) {
                          setInventory(prev => prev.filter(i => i.id !== item.id));
                          triggerToast(`Deleted ${item.name}`);
                        }
                      }}
                      className="rrm-btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.6875rem', color: '#ef4444', borderColor: '#ef4444' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rrm-card-footer" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          <span>Audit log synced: Recipe deduction automatic</span>
          <button 
            onClick={() => triggerToast("Refreshed all stock sensors")}
            className="rrm-btn-outline"
            style={{ padding: '2px 8px', fontSize: '0.6875rem' }}
          >
            <RefreshCw size={11} /> Sync Stock
          </button>
        </div>
      </div>
    </div>
  );
};
