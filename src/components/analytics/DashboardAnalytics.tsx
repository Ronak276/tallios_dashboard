import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell 
} from 'recharts';
import { DollarSign, TrendingUp, ShoppingBag, Coffee, ArrowUpRight } from '../icons/Icons';

interface AnalyticsProps {
  darkMode?: boolean;
}

export const DashboardAnalytics: React.FC<AnalyticsProps> = () => {
  // Hourly Revenue Data (Peak Espresso rush vs Afternoon)
  const hourlyRevenueData = [
    { hour: '6 AM', revenue: 180, orders: 32 },
    { hour: '7 AM', revenue: 460, orders: 78 },
    { hour: '8 AM', revenue: 780, orders: 135 },
    { hour: '9 AM', revenue: 890, orders: 154 },
    { hour: '10 AM', revenue: 640, orders: 110 },
    { hour: '11 AM', revenue: 490, orders: 84 },
    { hour: '12 PM', revenue: 580, orders: 96 },
    { hour: '1 PM', revenue: 510, orders: 82 },
    { hour: '2 PM', revenue: 390, orders: 65 },
    { hour: '3 PM', revenue: 440, orders: 74 },
    { hour: '4 PM', revenue: 320, orders: 52 },
    { hour: '5 PM', revenue: 210, orders: 36 },
  ];

  // Channel Breakdown
  const channelData = [
    { name: 'Self-Serve Kiosk', value: 48, amount: '$2,750', color: '#1C2C60' },
    { name: 'QR Table Ordering', value: 27, amount: '$1,540', color: '#C68A4C' },
    { name: 'Mobile Food Truck #1', value: 16, amount: '$910', color: '#8f6859' },
    { name: 'Food Truck #2 (Downtown)', value: 9, amount: '$510', color: '#baa096' },
  ];

  // Top Selling Items
  const topProducts = [
    { name: 'Caramel Macchiato (Signature Oat)', sold: 284, revenue: '$1,846.00', margin: '74%', trend: '+14%' },
    { name: 'Iced Vanilla Bean Latte', sold: 242, revenue: '$1,452.00', margin: '78%', trend: '+22%' },
    { name: 'Ethiopian Single-Origin Drip', sold: 198, revenue: '$891.00', margin: '84%', trend: '+8%' },
    { name: 'Matcha Green Tea Latte', sold: 145, revenue: '$942.50', margin: '71%', trend: '+18%' },
    { name: 'Almond Croissant & Pastry', sold: 112, revenue: '$560.00', margin: '62%', trend: '+5%' },
  ];

  // Roastery Batch Status
  const roastBatches = [
    { name: 'House Espresso Roast #104', progress: 85, output: '120 kg / 140 kg', temp: '215°C', status: 'Cooling Tray' },
    { name: 'Ethiopia Yirgacheffe Light #88', progress: 45, output: '45 kg / 100 kg', temp: '198°C', status: 'First Crack' },
    { name: 'Colombia Supremo Medium #92', progress: 100, output: '80 kg / 80 kg', temp: 'Ambient', status: 'Degassing Bins' },
  ];

  const totalTodayRevenue = hourlyRevenueData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalTodayOrders = hourlyRevenueData.reduce((acc, curr) => acc + curr.orders, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* 2-Column Grid: Hourly Revenue Chart & Sales Channels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        
        {/* Card 1: Today's Hourly Revenue & Rush Curve */}
        <div className="rrm-card">
          <div className="rrm-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} style={{ color: '#1C2C60' }} />
                <h3 className="rrm-card-title uppercase">Today's Hourly Revenue Performance</h3>
              </div>
              <p className="rrm-card-description">Total generated: ${totalTodayRevenue.toLocaleString()} across {totalTodayOrders} transactions</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1C2C60' }}>
                ${totalTodayRevenue.toLocaleString()}
              </span>
              <div style={{ fontSize: '0.625rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                <ArrowUpRight size={12} /> +18.4% vs last week
              </div>
            </div>
          </div>

          <div className="rrm-card-body" style={{ height: '230px', paddingTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" style={{ opacity: 0.1 }} vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="currentColor" 
                  style={{ fontSize: '10px', opacity: 0.7 }} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis 
                  stroke="currentColor" 
                  style={{ fontSize: '10px', opacity: 0.7 }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "0px",
                    fontSize: "12px",
                    color: "var(--foreground)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                  }}
                  formatter={(value: any) => [`$${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#1C2C60" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rrm-card-footer" style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            <span>Morning Rush Peak: 8:00 AM - 10:00 AM generated 38% of total gross</span>
            <span style={{ fontWeight: 600, color: '#C68A4C' }}>Avg Ticket: $6.12</span>
          </div>
        </div>

        {/* Card 2: Sales Channel Distribution */}
        <div className="rrm-card">
          <div className="rrm-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={16} style={{ color: '#C68A4C' }} />
                <h3 className="rrm-card-title uppercase">Sales by Channel & Fleet</h3>
              </div>
              <p className="rrm-card-description">Kiosk terminals vs QR codes & roaming food trucks</p>
            </div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
              LIVE SYNC
            </span>
          </div>

          <div className="rrm-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', minHeight: '230px' }}>
            {/* Pie Chart */}
            <div style={{ width: '45%', height: '190px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "0px",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Channel Legend & Stats */}
            <div style={{ width: '55%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {channelData.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', backgroundColor: c.color, flexShrink: 0 }}></span>
                    <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{c.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: '#1C2C60' }}>{c.amount}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', marginLeft: '6px' }}>({c.value}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rrm-card-footer" style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            <span>Stripe terminal gateway latency: 120ms</span>
            <span style={{ fontWeight: 600, color: '#1C2C60' }}>0 failed charges</span>
          </div>
        </div>

      </div>

      {/* 2-Column Bottom Grid: Best Selling Menu Items & Roasting Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        
        {/* Card 3: Top Selling Cafe Menu Items */}
        <div className="rrm-card">
          <div className="rrm-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} style={{ color: '#1C2C60' }} />
                <h3 className="rrm-card-title uppercase">Best Selling Coffee & Pastry Items</h3>
              </div>
              <p className="rrm-card-description">Highest grossing products and profit margins</p>
            </div>
          </div>

          <div className="rrm-card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="rrm-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>MENU ITEM</th>
                    <th style={{ textAlign: 'right' }}>UNITS SOLD</th>
                    <th style={{ textAlign: 'right' }}>REVENUE</th>
                    <th style={{ textAlign: 'right' }}>MARGIN</th>
                    <th style={{ textAlign: 'right' }}>TREND</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{p.sold}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#1C2C60' }}>{p.revenue}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontSize: '0.6875rem', 
                          fontWeight: 700, 
                          color: '#10b981', 
                          padding: '2px 6px', 
                          backgroundColor: 'rgba(16, 185, 129, 0.1)' 
                        }}>
                          {p.margin}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600, fontSize: '0.75rem' }}>
                        {p.trend}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rrm-card-footer" style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            <span>Oat milk alternative beverages now represent 46% of total espresso sales</span>
          </div>
        </div>

        {/* Card 4: Roastery Dial & Daily Batch Progress */}
        <div className="rrm-card">
          <div className="rrm-card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coffee size={16} style={{ color: '#C68A4C' }} />
                <h3 className="rrm-card-title uppercase">Roastery Dial-In & Batch Status</h3>
              </div>
              <p className="rrm-card-description">Live roasting drum status and degas schedule</p>
            </div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1C2C60', border: '1px solid #1C2C60', padding: '2px 8px' }}>
              DRUM #1 ACTIVE
            </span>
          </div>

          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {roastBatches.map((batch, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{batch.name}</span>
                    <span style={{ 
                      fontSize: '0.625rem', 
                      padding: '1px 5px', 
                      backgroundColor: 'var(--tertiary)', 
                      color: '#1C2C60', 
                      fontWeight: 700 
                    }}>
                      {batch.status}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#C68A4C' }}>{batch.output}</span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--muted)', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${batch.progress}%`, 
                    backgroundColor: batch.progress === 100 ? '#10b981' : '#1C2C60' 
                  }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>
                  <span>Target Temp: {batch.temp}</span>
                  <span>{batch.progress}% Completed</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rrm-card-footer" style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            <span>Next scheduled roast: Colombia Supremo Medium batch at 2:30 PM</span>
          </div>
        </div>

      </div>

    </div>
  );
};
