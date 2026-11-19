import React, { useState } from 'react';
import type { PaymentTransaction } from '../types';
import { 
  CreditCard, DollarSign, TrendingUp, Search, Plus, 
  MoreVertical, CheckCircle, X, List, Grid 
} from '../components/icons/Icons';

interface PaymentsPageProps {
  payments: PaymentTransaction[];
  onAddPayment: (payment: PaymentTransaction) => void;
  onRefundPayment: (id: string) => void;
  onDeletePayment: (id: string) => void;
  triggerToast: (msg: string) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({
  payments,
  onAddPayment,
  onRefundPayment,
  onDeletePayment,
  triggerToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<PaymentTransaction | null>(null);

  // New Transaction Form State
  const [newTx, setNewTx] = useState({
    customerName: '',
    channel: 'Self-Service Kiosk' as PaymentTransaction['channel'],
    amount: 12.50,
    method: 'Apple Pay' as PaymentTransaction['method'],
  });

  // KPI calculations
  const totalGross = payments.reduce((sum, p) => p.status !== 'Refunded' ? sum + p.amount : sum, 0);
  const totalNet = payments.reduce((sum, p) => p.status !== 'Refunded' ? sum + p.netRevenue : sum, 0);
  const totalFees = payments.reduce((sum, p) => p.status !== 'Refunded' ? sum + p.fee : sum, 0);
  const settledCount = payments.filter(p => p.status === 'Settled').length;

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionRef.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'all' || p.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const fee = Number((newTx.amount * 0.029 + 0.30).toFixed(2));
    const net = Number((newTx.amount - fee).toFixed(2));
    const created: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      transactionRef: `tx_stripe_${Math.random().toString(36).substring(7)}`,
      customerName: newTx.customerName || 'Walk-in Guest',
      channel: newTx.channel,
      amount: Number(newTx.amount),
      fee: fee,
      netRevenue: net,
      method: newTx.method,
      status: 'Settled',
      payoutStatus: 'Pending in Stripe',
      timestamp: 'Just now',
    };
    onAddPayment(created);
    setShowAddModal(false);
    setNewTx({
      customerName: '',
      channel: 'Self-Service Kiosk',
      amount: 12.50,
      method: 'Apple Pay',
    });
    triggerToast(`Payment settled: $${created.amount.toFixed(2)} via ${created.method}!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header with Title and Primary Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Payments & Revenue Settlement
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px', margin: 0 }}>
            Live Stripe gateway payouts, daily card settlements, and mobile truck gross revenue
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Table vs Card View Icon-only Toggle */}
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease'
              }}
              title="Table View (Default)"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderLeft: '1px solid var(--border)',
                background: viewMode === 'card' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'card' ? '#ffffff' : 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease'
              }}
              title="Card View"
            >
              <Grid size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="rrm-btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            <Plus size={14} /> + Record Manual Payment
          </button>
        </div>
      </div>

      {/* 4 Revenue KPI Metric Cards */}
      <div className="stats-grid">
        <div className="rrm-card">
          <div className="rrm-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted-foreground)' }}>Gross Revenue Today</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: 'var(--primary)' }}>${totalGross.toFixed(2)}</h3>
              <p style={{ fontSize: '0.625rem', color: '#10b981', marginTop: '2px' }}>● 100% Stripe Live Gateway</p>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--primary)' }}>
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="rrm-card">
          <div className="rrm-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted-foreground)' }}>Net Settlement</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#10b981' }}>${totalNet.toFixed(2)}</h3>
              <p style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>After Stripe interchange fee</p>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="rrm-card">
          <div className="rrm-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted-foreground)' }}>Gateway Processing Fees</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>${totalFees.toFixed(2)}</h3>
              <p style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>Avg 2.9% + 30¢ blend</p>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--neutral)' }}>
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        <div className="rrm-card">
          <div className="rrm-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted-foreground)' }}>Settled Charges</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{settledCount}</h3>
              <p style={{ fontSize: '0.625rem', color: '#10b981', marginTop: '2px' }}>0 disputes / 0 chargebacks</p>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--primary)' }}>
              <CheckCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="rrm-input"
            style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', minWidth: '170px' }}
          >
            <option value="all">💳 All Channels (Consolidated)</option>
            <option value="Self-Service Kiosk">Self-Service Kiosks</option>
            <option value="QR Code Table">QR Code Orders</option>
            <option value="Mobile Food Truck">Mobile Food Trucks</option>
            <option value="Mug Club Subscription">Mug Club Subscriptions</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rrm-input"
            style={{ padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', minWidth: '140px' }}
          >
            <option value="all">⚡ All Statuses</option>
            <option value="Settled">Settled</option>
            <option value="Processing">Processing</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search customer, transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rrm-input"
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>
      </div>

      {/* MAIN LISTING: DEFAULT CARD GRID LAYOUT */}
      {viewMode === 'card' ? (
        <div className="cards-three-grid">
          {filteredPayments.map(p => (
            <div 
              key={p.id} 
              className="rrm-card" 
              style={{
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                cursor: 'default'
              }}
            >
              {/* Card Header with Transaction Ref & Status Chip */}
              <div className="rrm-card-header" style={{ backgroundColor: 'var(--muted)', padding: '0.85rem 1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={15} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary)' }}>
                      {p.transactionRef}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: '2px', display: 'block' }}>
                    {p.timestamp}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                  <span className={`rrm-badge ${p.status === 'Settled' ? 'rrm-badge-valid' : p.status === 'Refunded' ? 'rrm-badge-expired' : 'rrm-badge-warning'}`}>
                    {p.status}
                  </span>

                  {/* 3-Dot Actions Menu */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === p.id ? null : p.id);
                      }}
                      className="rrm-btn-outline"
                      style={{ padding: '3px 5px', border: 'none', color: 'var(--muted-foreground)' }}
                      title="More Options"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openDropdownId === p.id && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: '4px',
                          width: '160px',
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
                          zIndex: 100,
                          display: 'flex',
                          flexDirection: 'column',
                          textAlign: 'left'
                        }}
                      >
                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            setSelectedPaymentForView(p);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.75rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: '1px solid var(--border)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: 'var(--foreground)'
                          }}
                        >
                          👁 View Receipt
                        </button>
                        {p.status !== 'Refunded' && (
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              onRefundPayment(p.id);
                              triggerToast(`Refund processed for ${p.transactionRef}`);
                            }}
                            style={{
                              padding: '8px 12px',
                              fontSize: '0.75rem',
                              background: 'none',
                              border: 'none',
                              borderBottom: '1px solid var(--border)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              color: '#d97706',
                              fontWeight: 600
                            }}
                          >
                            ↩️ Process Refund
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            onDeletePayment(p.id);
                            triggerToast(`Deleted transaction record ${p.transactionRef}`);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.75rem',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: '#ef4444',
                            fontWeight: 600
                          }}
                        >
                          🗑 Delete Record
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body with Amount and Breakdown */}
              <div className="rrm-card-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Customer:</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.customerName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: p.status === 'Refunded' ? '#ef4444' : 'var(--primary)' }}>
                      ${p.amount.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.625rem', color: '#10b981', fontWeight: 600 }}>Net: ${p.netRevenue.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Channel:</span>
                    <span style={{ fontWeight: 500 }}>{p.channel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Payment Method:</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.method}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Gateway Fee:</span>
                    <span>${p.fee.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Payout Status */}
              <div className="rrm-card-footer" style={{ padding: '0.65rem 1rem', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Payout: {p.payoutStatus}</span>
                <button
                  onClick={() => setSelectedPaymentForView(p)}
                  className="rrm-btn-outline"
                  style={{ padding: '2px 8px', fontSize: '0.6875rem' }}
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rrm-card">
          <div className="rrm-table-wrapper" style={{ border: 'none' }}>
            <table className="rrm-table">
              <thead>
                <tr>
                  <th>TRANSACTION</th>
                  <th>CUSTOMER</th>
                  <th>CHANNEL</th>
                  <th>METHOD</th>
                  <th style={{ textAlign: 'right' }}>GROSS</th>
                  <th style={{ textAlign: 'right' }}>NET</th>
                  <th>STATUS</th>
                  <th>PAYOUT</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                      {p.transactionRef}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.customerName}</td>
                    <td style={{ fontSize: '0.75rem' }}>{p.channel}</td>
                    <td>
                      <span style={{ fontSize: '0.6875rem', padding: '2px 6px', backgroundColor: 'var(--muted)', fontWeight: 600 }}>
                        {p.method}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: p.status === 'Refunded' ? '#ef4444' : 'var(--primary)' }}>
                      ${p.amount.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                      ${p.netRevenue.toFixed(2)}
                    </td>
                    <td>
                      <span className={`rrm-badge ${p.status === 'Settled' ? 'rrm-badge-valid' : p.status === 'Refunded' ? 'rrm-badge-expired' : 'rrm-badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{p.payoutStatus}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          onClick={() => setSelectedPaymentForView(p)}
                          className="rrm-btn-outline"
                          style={{ padding: '3px 8px', fontSize: '0.6875rem' }}
                        >
                          View
                        </button>
                        {p.status !== 'Refunded' && (
                          <button
                            onClick={() => {
                              onRefundPayment(p.id);
                              triggerToast(`Refunded ${p.transactionRef}`);
                            }}
                            className="rrm-btn-outline"
                            style={{ padding: '3px 8px', fontSize: '0.6875rem', borderColor: '#d97706', color: '#d97706' }}
                          >
                            Refund
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onDeletePayment(p.id);
                            triggerToast(`Deleted ${p.transactionRef}`);
                          }}
                          className="rrm-btn-outline"
                          style={{ padding: '3px 8px', fontSize: '0.6875rem', borderColor: '#ef4444', color: '#ef4444' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD MANUAL PAYMENT */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="rrm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%', backgroundColor: 'var(--card)' }}>
            <div className="rrm-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} style={{ color: 'var(--primary)' }} />
                <h3 className="rrm-card-title uppercase">Record Manual Customer Payment</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="rrm-btn-outline" style={{ border: 'none', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Customer Name / Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walk-in Guest or John Doe"
                  value={newTx.customerName}
                  onChange={(e) => setNewTx({ ...newTx, customerName: e.target.value })}
                  className="rrm-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Gross Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: parseFloat(e.target.value) || 0 })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Payment Method</label>
                  <select
                    value={newTx.method}
                    onChange={(e) => setNewTx({ ...newTx, method: e.target.value as any })}
                    className="rrm-input"
                    style={{ width: '100%' }}
                  >
                    <option value="Apple Pay">Apple Pay</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Google Pay">Google Pay</option>
                    <option value="Stripe Connect">Stripe Connect</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Sales Channel / Terminal</label>
                <select
                  value={newTx.channel}
                  onChange={(e) => setNewTx({ ...newTx, channel: e.target.value as any })}
                  className="rrm-input"
                  style={{ width: '100%' }}
                >
                  <option value="Self-Service Kiosk">Self-Service Kiosk Terminal</option>
                  <option value="QR Code Table">QR Code Table Ordering</option>
                  <option value="Mobile Food Truck">Mobile Food Truck Counter</option>
                  <option value="Mug Club Subscription">Mug Club Recurring Subscription</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="rrm-btn-outline">
                  Cancel
                </button>
                <button type="submit" className="rrm-btn-primary">
                  Process & Settle Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW PAYMENT RECEIPT */}
      {selectedPaymentForView && (
        <div className="modal-backdrop" onClick={() => setSelectedPaymentForView(null)}>
          <div className="rrm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '100%', backgroundColor: 'var(--card)' }}>
            <div className="rrm-card-header" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                  TALLIO'S OS REVENUE PROOF
                </span>
                <button onClick={() => setSelectedPaymentForView(null)} className="rrm-btn-outline" style={{ border: 'none', padding: '2px' }}>
                  <X size={15} />
                </button>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                ${selectedPaymentForView.amount.toFixed(2)}
              </h3>
              <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                {selectedPaymentForView.status} • {selectedPaymentForView.timestamp}
              </span>
            </div>

            <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Transaction Ref:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedPaymentForView.transactionRef}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Customer Name:</span>
                <span style={{ fontWeight: 600 }}>{selectedPaymentForView.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Channel:</span>
                <span>{selectedPaymentForView.channel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Method:</span>
                <span>{selectedPaymentForView.method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Stripe Interchange Fee:</span>
                <span>-${selectedPaymentForView.fee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#10b981' }}>
                <span>Net Revenue:</span>
                <span>${selectedPaymentForView.netRevenue.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Payout Status:</span>
                <span style={{ fontWeight: 600 }}>{selectedPaymentForView.payoutStatus}</span>
              </div>
            </div>

            <div className="rrm-card-footer" style={{ justifyContent: 'flex-end', gap: '6px' }}>
              {selectedPaymentForView.status !== 'Refunded' && (
                <button
                  onClick={() => {
                    onRefundPayment(selectedPaymentForView.id);
                    setSelectedPaymentForView(null);
                    triggerToast('Refund executed successfully');
                  }}
                  className="rrm-btn-outline"
                  style={{ borderColor: '#d97706', color: '#d97706', fontSize: '0.75rem' }}
                >
                  Refund Payment
                </button>
              )}
              <button
                onClick={() => setSelectedPaymentForView(null)}
                className="rrm-btn-primary"
                style={{ fontSize: '0.75rem' }}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
