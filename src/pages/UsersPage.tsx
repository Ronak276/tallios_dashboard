import React, { useState } from 'react';
import type { CustomerUser, CustomerTier } from '../types';
import { 
  Users, Search, Plus, Download, Mail, Phone, 
  CheckCircle, Coffee, Star, X, Eye, MoreVertical, List, Grid,
  ChevronLeft, ChevronRight
} from '../components/icons/Icons';
import { supabase } from '../lib/supabase';

interface UsersPageProps {
  customers: CustomerUser[];
  onAddCustomer?: (customer: CustomerUser) => void;
  onUpdateCustomer?: (customer: CustomerUser) => void;
  onDeleteCustomer?: (id: string) => void;
  onDeleteMultipleCustomers?: (ids: string[]) => void;
  triggerToast: (msg: string) => void;
  userRole?: string;
  userLocation?: string;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onDeleteMultipleCustomers,
  triggerToast,
  userRole = 'Super Admin',
  userLocation,
}) => {
  const isStaff = userRole === 'Staff';
  const effectiveLocation = isStaff && userLocation ? userLocation : 'Bayview Café';

  const [searchQuery, setSearchQuery] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerUser | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form Validation Errors State
  const [addFormErrors, setAddFormErrors] = useState<{ [key: string]: string }>({});
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string }>({});

  // Validation Helper: Email format
  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  // New Customer Form State - staff automatically gets assigned location locked
  const [newCust, setNewCust] = useState({
    name: '',
    email: '',
    phone: '',
    membership: 'Regular' as CustomerTier,
    favoriteDrink: 'Drip Coffee',
    preferredLocation: effectiveLocation,
  });

  // Validation Helper: Phone format (allows digits, spaces, hyphens, parentheses, optional leading +)
  const isValidPhone = (phoneStr: string) => {
    if (!phoneStr.trim()) return true; // phone is optional
    return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/.test(phoneStr.trim());
  };

  // Location-scoped Customers: Staff sees ONLY their location's customers, Admin sees all
  const locationScopedCustomers = isStaff && userLocation
    ? customers.filter(c => c.preferredLocation.toLowerCase().includes(userLocation.toLowerCase()) || userLocation.toLowerCase().includes(c.preferredLocation.toLowerCase()))
    : customers;

  // KPI Calculations (scoped to visible location)
  const totalCustomers = locationScopedCustomers.length;
  const mugClubCount = locationScopedCustomers.filter(c => c.membership === 'Mug Club Member' || c.membership === 'VIP Gold').length;
  const activeCount = locationScopedCustomers.filter(c => c.status === 'Active').length;
  const totalSpend = locationScopedCustomers.reduce((sum, c) => sum + c.totalSpend, 0);

  // Filtered List based on location-scoped data
  const filteredCustomers = locationScopedCustomers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMembership = membershipFilter === 'all' || c.membership === membershipFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesMembership && matchesStatus;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 20 records per page

  // Reset to first page when search/filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, membershipFilter, statusFilter, userLocation]);

  // Total pages
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Membership', 'Status', 'Total Orders', 'Total Spend ($)', 'Points', 'Joined Date'];
    const rows = filteredCustomers.map(c => [
      c.id,
      `"${c.name}"`,
      c.email,
      c.phone,
      c.membership,
      c.status,
      c.totalOrders,
      c.totalSpend.toFixed(2),
      c.loyaltyPoints,
      c.joinedDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tallios_App_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Customer roster exported as CSV!');
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // 1. Full Name Validation
    if (!newCust.name.trim()) {
      errors.name = 'Full name is required';
    } else if (newCust.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // 2. Email Validation
    if (!newCust.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!isValidEmail(newCust.email)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com)';
    } else {
      // Duplicate Email Check
      const isDuplicate = customers.some(
        c => c.email.toLowerCase() === newCust.email.trim().toLowerCase()
      );
      if (isDuplicate) {
        errors.email = 'A customer with this email address already exists';
      }
    }

    // 3. Phone Validation (Optional, but if filled, must be valid)
    if (newCust.phone.trim() && !isValidPhone(newCust.phone)) {
      errors.phone = 'Please enter a valid phone number (e.g. +1 (415) 555-0199)';
    }

    if (Object.keys(errors).length > 0) {
      setAddFormErrors(errors);
      return;
    }

    setAddFormErrors({});

    const created: CustomerUser = {
      id: `cust-${Date.now().toString().slice(-4)}`,
      name: newCust.name.trim(),
      email: newCust.email.trim().toLowerCase(),
      phone: newCust.phone.trim() || '+1 (415) 555-0199',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newCust.name.trim())}&background=1C2C60&color=fff`,
      membership: newCust.membership,
      status: 'Active',
      totalOrders: 1,
      totalSpend: 15.00,
      loyaltyPoints: 0,
      favoriteDrink: newCust.favoriteDrink.trim() || 'Drip Coffee',
      preferredLocation: newCust.preferredLocation,
      lastOrderDate: 'Just now',
      joinedDate: 'Today',
    };

    // 1. Dispatch Supabase password reset / magic link invitation to customer's email
    try {
      await supabase.auth.resetPasswordForEmail(newCust.email.trim(), {
        redirectTo: `${window.location.origin}/#set-password`,
      });
    } catch (authErr) {
      console.warn('Note on sending invitation link:', authErr);
    }

    if (onAddCustomer) {
      onAddCustomer(created);
    }
    setShowAddModal(false);
    setNewCust({
      name: '',
      email: '',
      phone: '',
      membership: 'Regular',
      favoriteDrink: 'Drip Coffee',
      preferredLocation: effectiveLocation,
    });
    triggerToast(`Customer ${created.name} registered! Welcome & app password setup link sent to ${created.email}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* 1. Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>
            Users Management
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
            Registered café app customers, loyalty members & mobile kiosk shoppers
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isStaff && (
            <button
              onClick={handleExportCSV}
              className="rrm-btn-outline"
              style={{ borderRadius: '0px', padding: '7px 14px', fontSize: '0.8125rem' }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="rrm-btn-primary"
            style={{ borderRadius: '0px', padding: '7px 16px', fontSize: '0.8125rem' }}
          >
            <Plus size={15} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metric Cards */}
      <div className="stats-grid">
        {/* Card 1: Total Registered Customers */}
        <div className="rrm-card" style={{ borderRadius: '0px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Customers
              </span>
              <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(28, 44, 96, 0.08)', color: '#1C2C60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                {totalCustomers}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>
                ↑ 100% Mobile App users
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Mug Club Members */}
        <div className="rrm-card" style={{ borderRadius: '0px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mug Club Subscribers
              </span>
              <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(198, 138, 76, 0.15)', color: '#C68A4C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coffee size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                {mugClubCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                Active tiered subscriptions
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Active Shoppers */}
        <div className="rrm-card" style={{ borderRadius: '0px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Customers
              </span>
              <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                {activeCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                Active orders in past 30 days
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Total Customer Spend */}
        <div className="rrm-card" style={{ borderRadius: '0px' }}>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Customer Spend
              </span>
              <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(28, 44, 96, 0.08)', color: '#1C2C60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={16} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                ${totalSpend.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                App & kiosk lifetime spend
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar (Placed outside card directly on workspace) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        width: '100%'
      }}>
        {/* Compact Search Bar */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search customer name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rrm-input"
            style={{
              width: '100%',
              paddingLeft: '36px',
              height: '38px',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Bulk Delete Button when items are checked (Super Admin only) */}
          {!isStaff && selectedIds.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected customer(s)?`)) {
                  if (onDeleteMultipleCustomers) {
                    onDeleteMultipleCustomers(selectedIds);
                  } else if (onDeleteCustomer) {
                    selectedIds.forEach(id => onDeleteCustomer(id));
                  }
                  triggerToast(`${selectedIds.length} customer(s) deleted successfully.`);
                  setSelectedIds([]);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '38px',
                padding: '0 12px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: '1px solid #dc2626',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}

          {/* Membership Filter */}
          <select
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
            className="rrm-input"
            style={{
              height: '38px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)'
            }}
          >
            <option value="all">All Memberships</option>
            <option value="Regular">Regular Customer</option>
            <option value="Mug Club Member">Mug Club Member</option>
            <option value="VIP Gold">VIP Gold</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rrm-input"
            style={{
              height: '38px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)'
            }}
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Table vs Card View Toggle (Icon Only) */}
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                height: '36px',
                width: '36px',
                padding: 0,
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#1C2C60' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              style={{
                height: '36px',
                width: '36px',
                padding: 0,
                border: 'none',
                backgroundColor: viewMode === 'card' ? '#1C2C60' : 'transparent',
                color: viewMode === 'card' ? '#ffffff' : 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Card View"
            >
              <Grid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Customer Content: Table View (Default) vs Card Grid View */}
      {viewMode === 'table' ? (
        <div className="rrm-card" style={{ borderRadius: '0px' }}>
          <div className="rrm-table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="rrm-table">
              <thead>
                <tr>
                  {/* Select All Checkbox (Super Admin only) */}
                  {!isStaff && (
                    <th style={{ width: '42px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(filteredCustomers.map(c => c.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                        title="Select All"
                      />
                    </th>
                  )}
                  <th style={{ width: '180px' }}>Customer</th>
                  <th style={{ width: '220px' }}>Email Address</th>
                  <th style={{ width: '160px' }}>Contact Phone</th>
                  <th style={{ width: '150px' }}>Membership</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Orders</th>
                  <th style={{ width: '110px' }}>Total Spent</th>
                  <th style={{ width: '90px' }}>Points</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '130px' }}>Last Order</th>
                  <th style={{ width: '85px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={isStaff ? 10 : 11} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted-foreground)' }}>
                      No customer records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((cust) => {
                    const isChecked = selectedIds.includes(cust.id);
                    return (
                      <tr key={cust.id} style={{ backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.05)' : undefined }}>
                        {/* Checkbox Column (Super Admin only) */}
                        {!isStaff && (
                          <td style={{ textAlign: 'center', width: '42px' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(prev => [...prev, cust.id]);
                                } else {
                                  setSelectedIds(prev => prev.filter(id => id !== cust.id));
                                }
                              }}
                              style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                            />
                          </td>
                        )}

                        {/* Customer Name & Avatar */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={cust.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.name)}`}
                              alt={cust.name}
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                                border: '1px solid var(--border)',
                                flexShrink: 0
                              }}
                            />
                            <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                              {cust.name}
                            </span>
                          </div>
                        </td>

                        {/* Dedicated Email Address Column */}
                        <td>
                          <div style={{ fontSize: '0.78rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                            <span style={{ wordBreak: 'break-all' }}>{cust.email}</span>
                          </div>
                        </td>

                        {/* Contact Phone */}
                        <td style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                            <span>{cust.phone}</span>
                          </div>
                        </td>

                        {/* Membership Tier */}
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              backgroundColor: cust.membership === 'VIP Gold' 
                                ? 'rgba(234, 179, 8, 0.15)' 
                                : cust.membership === 'Mug Club Member'
                                ? 'rgba(198, 138, 76, 0.15)'
                                : 'var(--muted)',
                              color: cust.membership === 'VIP Gold'
                                ? '#ca8a04'
                                : cust.membership === 'Mug Club Member'
                                ? '#C68A4C'
                                : 'var(--foreground)',
                              border: `1px solid ${
                                cust.membership === 'VIP Gold'
                                  ? '#eab308'
                                  : cust.membership === 'Mug Club Member'
                                  ? '#C68A4C'
                                  : 'var(--border)'
                              }`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {cust.membership === 'Mug Club Member' && <Coffee size={11} />}
                            {cust.membership === 'VIP Gold' && <Star size={11} />}
                            {cust.membership}
                          </span>
                        </td>

                        {/* Total Orders */}
                        <td style={{ fontWeight: 600, textAlign: 'center' }}>
                          {cust.totalOrders}
                        </td>

                        {/* Total Spend */}
                        <td style={{ fontWeight: 700, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                          ${cust.totalSpend.toFixed(2)}
                        </td>

                        {/* Loyalty Points */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: '#C68A4C' }}>
                            {cust.loyaltyPoints} pts
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 6px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: cust.status === 'Active' ? '#10b981' : '#94a3b8',
                              backgroundColor: cust.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                              border: `1px solid ${cust.status === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ● {cust.status}
                          </span>
                        </td>

                        {/* Last Order */}
                        <td style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                          {cust.lastOrderDate}
                        </td>

                        {/* Action Column with Three Dots (...) Dropdown */}
                        <td style={{ textAlign: 'right', position: 'relative' }}>
                          <div style={{ display: 'inline-block', position: 'relative' }}>
                            <button
                              type="button"
                              onClick={() => setOpenDropdownId(openDropdownId === cust.id ? null : cust.id)}
                              className="rrm-btn-outline"
                              style={{
                                padding: '5px 8px',
                                border: '1px solid var(--border)',
                                backgroundColor: openDropdownId === cust.id ? 'var(--muted)' : 'transparent',
                                color: 'var(--foreground)',
                                cursor: 'pointer'
                              }}
                              title="Actions"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {/* Dropdown Menu */}
                            {openDropdownId === cust.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '100%',
                                  marginTop: '4px',
                                  width: '140px',
                                  backgroundColor: 'var(--card)',
                                  border: '1px solid var(--border)',
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                  zIndex: 50,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  textAlign: 'left'
                                }}
                              >
                                {/* View */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setSelectedCustomer(cust);
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    fontSize: '0.75rem',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    color: 'var(--foreground)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    textAlign: 'left',
                                    width: '100%'
                                  }}
                                >
                                  <Eye size={13} style={{ color: '#2888E6' }} />
                                  <span>View Profile</span>
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setEditingCustomer(cust);
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    fontSize: '0.75rem',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: !isStaff ? '1px solid var(--border)' : 'none',
                                    cursor: 'pointer',
                                    color: 'var(--foreground)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    textAlign: 'left',
                                    width: '100%'
                                  }}
                                >
                                  <Users size={13} style={{ color: '#C68A4C' }} />
                                  <span>Edit Details</span>
                                </button>

                                {/* Delete (Super Admin only) */}
                                {!isStaff && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      if (window.confirm(`Are you sure you want to remove customer "${cust.name}"?`)) {
                                        if (onDeleteCustomer) {
                                          onDeleteCustomer(cust.id);
                                        }
                                        triggerToast(`Customer "${cust.name}" removed successfully.`);
                                      }
                                    }}
                                    style={{
                                      padding: '8px 12px',
                                      fontSize: '0.75rem',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: '#ef4444',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      textAlign: 'left',
                                      width: '100%'
                                    }}
                                  >
                                    <X size={13} />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            backgroundColor: 'var(--card)'
          }}>
            <div>
              Showing <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span> to <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {Math.min(currentPage * pageSize, filteredCustomers.length)}
              </span> of <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                {filteredCustomers.length}
              </span> customers
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: currentPage <= 1 ? 'var(--muted-foreground)' : 'var(--foreground)',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage <= 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              <span style={{ padding: '0 8px', fontWeight: 600, color: 'var(--foreground)' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: currentPage >= totalPages ? 'var(--muted-foreground)' : 'var(--foreground)',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage >= totalPages ? 0.5 : 1
                }}
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Card Grid View matching reference layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '1.25rem',
          width: '100%'
        }}>
          {paginatedCustomers.length === 0 ? (
            <div className="rrm-card" style={{ gridColumn: '1 / -1', padding: '3rem 1rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              No customer records found matching your filters.
            </div>
          ) : (
            paginatedCustomers.map((cust) => {
              const isChecked = selectedIds.includes(cust.id);
              const initials = cust.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div
                  key={cust.id}
                  className="rrm-card"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: isChecked ? '1px solid #1C2C60' : '1px solid var(--border)',
                    boxShadow: isChecked ? '0 0 0 1px #1C2C60' : '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                    
                    {/* Top Row: Avatar Initials, Name, Membership Pill & Three Dots */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Tallio's Brand Royal Navy Initials Badge Avatar */}
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(28, 44, 96, 0.1)',
                          color: '#1C2C60',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: '1px solid rgba(28, 44, 96, 0.25)'
                        }}>
                          {initials}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>
                              {cust.name}
                            </span>
                            <Coffee size={14} style={{ color: '#1C2C60' }} />
                          </div>
                          
                          {/* Role / Membership Badge */}
                          <div style={{ marginTop: '3px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              borderRadius: '4px',
                              border: cust.membership === 'VIP Gold'
                                ? '1px solid #ca8a04'
                                : cust.membership === 'Mug Club Member'
                                ? '1px solid #1C2C60'
                                : '1px solid var(--border)',
                              color: cust.membership === 'VIP Gold'
                                ? '#ca8a04'
                                : cust.membership === 'Mug Club Member'
                                ? '#1C2C60'
                                : 'var(--foreground)',
                              backgroundColor: cust.membership === 'VIP Gold'
                                ? 'rgba(202, 138, 4, 0.08)'
                                : cust.membership === 'Mug Club Member'
                                ? 'rgba(28, 44, 96, 0.08)'
                                : 'var(--card)'
                            }}>
                              {cust.membership}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Three-Dot Menu */}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setOpenDropdownId(openDropdownId === cust.id ? null : cust.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted-foreground)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Options"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openDropdownId === cust.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: '2px',
                              width: '130px',
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                              zIndex: 50,
                              display: 'flex',
                              flexDirection: 'column',
                              borderRadius: '6px',
                              overflow: 'hidden'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => { setOpenDropdownId(null); setSelectedCustomer(cust); }}
                              style={{ padding: '8px 12px', fontSize: '0.75rem', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', color: 'var(--foreground)' }}
                            >
                              View Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => { setOpenDropdownId(null); setEditingCustomer(cust); }}
                              style={{ padding: '8px 12px', fontSize: '0.75rem', background: 'none', border: 'none', borderBottom: !isStaff ? '1px solid var(--border)' : 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--foreground)' }}
                            >
                              Edit Details
                            </button>
                            {!isStaff && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  if (window.confirm(`Are you sure you want to remove customer "${cust.name}"?`)) {
                                    if (onDeleteCustomer) onDeleteCustomer(cust.id);
                                    triggerToast(`Customer "${cust.name}" removed.`);
                                  }
                                }}
                                style={{ padding: '8px 12px', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#ef4444' }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Box: Brand, Email & Phone */}
                    <div style={{
                      backgroundColor: 'var(--muted)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      fontSize: '0.78rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 600, color: '#1C2C60' }}>
                        <Coffee size={14} style={{ color: '#1C2C60' }} />
                        <span>Tallio's Coffee & Tea Co</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--muted-foreground)' }}>
                        <Mail size={13} />
                        <span style={{ wordBreak: 'break-all' }}>{cust.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--muted-foreground)' }}>
                        <Phone size={13} />
                        <span>{cust.phone}</span>
                      </div>
                    </div>

                    {/* Preferred Café Section */}
                    <div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        PREFERRED PICK-UP CAFÉ
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)' }}>
                        <Coffee size={14} style={{ color: '#1C2C60' }} />
                        <span>{cust.preferredLocation}</span>
                      </div>
                    </div>

                    {/* Pills: Favorite drink + Records count */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{
                        padding: '3px 8px',
                        backgroundColor: 'var(--muted)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--foreground)',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        ☕ {cust.favoriteDrink}
                      </span>
                      <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>
                        {cust.totalOrders} orders (${cust.totalSpend.toFixed(0)})
                      </span>
                    </div>

                  </div>

                  {/* Bottom Footer Border Separator: Active Pill + View Profile Button (matching reference) */}
                  <div style={{
                    padding: '0.75rem 1.25rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--card)'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: cust.status === 'Active' ? '#16a34a' : '#64748b',
                      backgroundColor: cust.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                      border: cust.status === 'Active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                    }}>
                      ● {cust.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(cust)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={13} />
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Card View Pagination Footer */}
      {viewMode === 'card' && filteredCustomers.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          border: '1px solid var(--border)',
          fontSize: '0.75rem',
          color: 'var(--muted-foreground)',
          backgroundColor: 'var(--card)'
        }}>
          <div>
            Showing <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              {(currentPage - 1) * pageSize + 1}
            </span> to <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              {Math.min(currentPage * pageSize, filteredCustomers.length)}
            </span> of <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              {filteredCustomers.length}
            </span> customers
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: currentPage <= 1 ? 'var(--muted-foreground)' : 'var(--foreground)',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            <span style={{ padding: '0 8px', fontWeight: 600, color: 'var(--foreground)' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: currentPage >= totalPages ? 'var(--muted-foreground)' : 'var(--foreground)',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.5 : 1
              }}
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Customer Details Modal */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)',
            width: '100%',
            maxWidth: '520px',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>
                  Customer Profile & App Activity
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  ID: {selectedCustomer.id} · Joined {selectedCustomer.joinedDate}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
                <img
                  src={selectedCustomer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.name)}`}
                  alt={selectedCustomer.name}
                  style={{ width: '52px', height: '52px', borderRadius: '4px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedCustomer.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>{selectedCustomer.email}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>{selectedCustomer.phone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: '#1C2C60',
                    color: '#ffffff'
                  }}>
                    {selectedCustomer.membership}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Total Orders</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>{selectedCustomer.totalOrders}</div>
                </div>
                <div style={{ padding: '0.75rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Lifetime Spend</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>${selectedCustomer.totalSpend.toFixed(2)}</div>
                </div>
                <div style={{ padding: '0.75rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Loyalty Points</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#C68A4C', marginTop: '2px' }}>{selectedCustomer.loyaltyPoints}</div>
                </div>
              </div>

              {/* Preferences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Favorite Coffee Order:</span>
                  <span style={{ fontWeight: 600 }}>{selectedCustomer.favoriteDrink}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Preferred Pick-up Location:</span>
                  <span style={{ fontWeight: 600 }}>{selectedCustomer.preferredLocation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Last Order Placed:</span>
                  <span style={{ fontWeight: 600 }}>{selectedCustomer.lastOrderDate}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateCustomer) {
                    const toggledStatus = selectedCustomer.status === 'Active' ? 'Inactive' : 'Active';
                    onUpdateCustomer({ ...selectedCustomer, status: toggledStatus });
                    setSelectedCustomer({ ...selectedCustomer, status: toggledStatus });
                    triggerToast(`Customer status changed to ${toggledStatus}`);
                  }
                }}
                className="rrm-btn-outline"
                style={{ borderRadius: '0px' }}
              >
                Toggle {selectedCustomer.status === 'Active' ? 'Inactive' : 'Active'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rrm-btn-primary"
                style={{ borderRadius: '0px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Customer Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)',
            width: '100%',
            maxWidth: '460px',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Register New App Customer
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Full Name Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Smith"
                    value={newCust.name}
                    onChange={(e) => {
                      setNewCust({ ...newCust, name: e.target.value });
                      if (addFormErrors.name) setAddFormErrors({ ...addFormErrors, name: '' });
                    }}
                    className="rrm-input"
                    style={{
                      width: '100%',
                      height: '38px',
                      border: addFormErrors.name ? '1px solid #ef4444' : undefined
                    }}
                  />
                  {addFormErrors.name && (
                    <span style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {addFormErrors.name}
                    </span>
                  )}
                </div>

                {/* Email Address Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="jordan.smith@example.com"
                    value={newCust.email}
                    onChange={(e) => {
                      setNewCust({ ...newCust, email: e.target.value });
                      if (addFormErrors.email) setAddFormErrors({ ...addFormErrors, email: '' });
                    }}
                    className="rrm-input"
                    style={{
                      width: '100%',
                      height: '38px',
                      border: addFormErrors.email ? '1px solid #ef4444' : undefined
                    }}
                  />
                  {addFormErrors.email && (
                    <span style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {addFormErrors.email}
                    </span>
                  )}
                </div>

                {/* Phone Number Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+1 (415) 555-0199"
                    value={newCust.phone}
                    onChange={(e) => {
                      setNewCust({ ...newCust, phone: e.target.value });
                      if (addFormErrors.phone) setAddFormErrors({ ...addFormErrors, phone: '' });
                    }}
                    className="rrm-input"
                    style={{
                      width: '100%',
                      height: '38px',
                      border: addFormErrors.phone ? '1px solid #ef4444' : undefined
                    }}
                  />
                  {addFormErrors.phone && (
                    <span style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {addFormErrors.phone}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Membership Tier</label>
                    <select
                      value={newCust.membership}
                      onChange={(e) => setNewCust({ ...newCust, membership: e.target.value as CustomerTier })}
                      className="rrm-input"
                      style={{ width: '100%', height: '38px' }}
                    >
                      <option value="Regular">Regular Customer</option>
                      <option value="Mug Club Member">Mug Club Member</option>
                      <option value="VIP Gold">VIP Gold</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>
                      Location {isStaff ? '(Assigned Location)' : '(Select Location)'}
                    </label>
                    {isStaff ? (
                      /* Staff View: Locked read-only location badge with clean single-line alignment */
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '38px',
                        padding: '0 12px',
                        backgroundColor: 'var(--muted)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        gap: '8px',
                        overflow: 'hidden'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          flexShrink: 0
                        }}></span>
                        <span style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.8125rem'
                        }}>
                          {(userLocation || 'Bayview Café').split('(')[0].trim()}
                        </span>
                      </div>
                    ) : (
                      /* Super Admin View: Full Dropdown to assign to any location */
                      <select
                        value={newCust.preferredLocation}
                        onChange={(e) => setNewCust({ ...newCust, preferredLocation: e.target.value })}
                        className="rrm-input"
                        style={{ width: '100%', height: '38px' }}
                      >
                        <option value="Bayview Café">Bayview Café</option>
                        <option value="Mobile Food Truck #1">Mobile Food Truck #1</option>
                        <option value="Mobile Food Truck #2">Mobile Food Truck #2</option>
                        <option value="Tech Park Express Kiosk">Tech Park Express Kiosk</option>
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Favorite Coffee Drink</label>
                  <input
                    type="text"
                    placeholder="e.g. Vanilla Oat Latte"
                    value={newCust.favoriteDrink}
                    onChange={(e) => setNewCust({ ...newCust, favoriteDrink: e.target.value })}
                    className="rrm-input"
                    style={{ width: '100%', height: '38px' }}
                  />
                </div>

                {/* Option A Note: Password Setup Invitation info banner */}
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(28, 44, 96, 0.05)',
                  border: '1px solid rgba(28, 44, 96, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.75rem',
                  color: 'var(--foreground)'
                }}>
                  <Mail size={16} style={{ color: '#1C2C60', flexShrink: 0 }} />
                  <span>
                    <strong>App Password Setup:</strong> An invitation link will be sent to the customer's email so they can securely set their app password & login anytime.
                  </span>
                </div>
              </div>

              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rrm-btn-outline"
                  style={{ borderRadius: '0px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rrm-btn-primary"
                  style={{ borderRadius: '0px' }}
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Customer Modal */}
      {editingCustomer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)',
            width: '100%',
            maxWidth: '480px',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Edit Customer Details
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const errors: { [key: string]: string } = {};

              if (!editingCustomer.name.trim()) {
                errors.name = 'Full name is required';
              } else if (editingCustomer.name.trim().length < 2) {
                errors.name = 'Name must be at least 2 characters';
              }

              if (!editingCustomer.email.trim()) {
                errors.email = 'Email address is required';
              } else if (!isValidEmail(editingCustomer.email)) {
                errors.email = 'Please enter a valid email address';
              } else {
                // Duplicate email check excluding current customer
                const isDuplicate = customers.some(
                  c => c.id !== editingCustomer.id && c.email.toLowerCase() === editingCustomer.email.trim().toLowerCase()
                );
                if (isDuplicate) {
                  errors.email = 'Another customer already uses this email';
                }
              }

              if (editingCustomer.phone.trim() && !isValidPhone(editingCustomer.phone)) {
                errors.phone = 'Please enter a valid phone number';
              }

              if (Object.keys(errors).length > 0) {
                setEditFormErrors(errors);
                return;
              }

              setEditFormErrors({});
              if (onUpdateCustomer && editingCustomer) {
                onUpdateCustomer({
                  ...editingCustomer,
                  name: editingCustomer.name.trim(),
                  email: editingCustomer.email.trim().toLowerCase(),
                  phone: editingCustomer.phone.trim(),
                  favoriteDrink: editingCustomer.favoriteDrink.trim(),
                });
                triggerToast(`Customer ${editingCustomer.name} updated successfully!`);
              }
              setEditingCustomer(null);
            }}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={(e) => {
                      setEditingCustomer({ ...editingCustomer, name: e.target.value });
                      if (editFormErrors.name) setEditFormErrors({ ...editFormErrors, name: '' });
                    }}
                    className="rrm-input"
                    style={{
                      width: '100%',
                      height: '38px',
                      border: editFormErrors.name ? '1px solid #ef4444' : undefined
                    }}
                  />
                  {editFormErrors.name && (
                    <span style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {editFormErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editingCustomer.email}
                    onChange={(e) => {
                      setEditingCustomer({ ...editingCustomer, email: e.target.value });
                      if (editFormErrors.email) setEditFormErrors({ ...editFormErrors, email: '' });
                    }}
                    className="rrm-input"
                    style={{
                      width: '100%',
                      height: '38px',
                      border: editFormErrors.email ? '1px solid #ef4444' : undefined
                    }}
                  />
                  {editFormErrors.email && (
                    <span style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {editFormErrors.email}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Phone Number</label>
                  <input
                    type="tel"
                    value={editingCustomer.phone}
                    onChange={(e) => {
                      setEditingCustomer({ ...editingCustomer, phone: e.target.value });
                      if (editFormErrors.phone) setEditFormErrors({ ...editFormErrors, phone: '' });
                    }}
                    className="rrm-input"
                    style={{
                      width: '100%',
                      height: '38px',
                      border: editFormErrors.phone ? '1px solid #ef4444' : undefined
                    }}
                  />
                  {editFormErrors.phone && (
                    <span style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                      {editFormErrors.phone}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Membership Tier</label>
                    <select
                      value={editingCustomer.membership}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, membership: e.target.value as CustomerTier })}
                      className="rrm-input"
                      style={{ width: '100%', height: '38px' }}
                    >
                      <option value="Regular">Regular Customer</option>
                      <option value="Mug Club Member">Mug Club Member</option>
                      <option value="VIP Gold">VIP Gold</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Status</label>
                    <select
                      value={editingCustomer.status}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as any })}
                      className="rrm-input"
                      style={{ width: '100%', height: '38px' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Favorite Coffee Drink</label>
                  <input
                    type="text"
                    value={editingCustomer.favoriteDrink}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, favoriteDrink: e.target.value })}
                    className="rrm-input"
                    style={{ width: '100%', height: '38px' }}
                  />
                </div>
              </div>

              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="rrm-btn-outline"
                  style={{ borderRadius: '0px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rrm-btn-primary"
                  style={{ borderRadius: '0px' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
