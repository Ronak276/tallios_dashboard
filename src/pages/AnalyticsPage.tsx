import { GradientAreaChart } from '../components/charts/GradientAreaChart';
import { DashboardAnalytics } from '../components/analytics/DashboardAnalytics';

interface AnalyticsPageProps {
  darkMode: boolean;
  chartData: any[];
}

export function AnalyticsPage({ darkMode, chartData }: AnalyticsPageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="rrm-card">
        <div className="rrm-card-header">
          <div>
            <h3 className="rrm-card-title uppercase">Live Kiosk Orders &amp; Bean Depletions</h3>
            <p className="rrm-card-description">Daily customer kiosk orders vs roasted bean batch consumption</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#1C2C60', display: 'inline-block' }} />
              <span style={{ fontWeight: 600 }}>Kiosk Orders (#1C2C60 Primary)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#C68A4C', display: 'inline-block' }} />
              <span style={{ fontWeight: 600 }}>Bean Batches (#C68A4C Secondary)</span>
            </div>
          </div>
        </div>

        <div className="rrm-card-body" style={{ paddingTop: '1.25rem', paddingBottom: '0.5rem' }}>
          <GradientAreaChart
            data={chartData}
            primaryLabel="Kiosk Orders"
            secondaryLabel="Bean Depletions"
          />
        </div>

        <div className="rrm-card-footer" style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
          <span>Morning Rush Peak: 7:30 AM - 10:00 AM espresso volume up +28%</span>
          <span style={{ color: '#1C2C60', fontWeight: 600 }}>Stripe Instant Settlement Live</span>
        </div>
      </div>

      <DashboardAnalytics darkMode={darkMode} />

      <div className="two-col-grid">
        <div className="rrm-card">
          <div className="rrm-card-header">
            <h3 className="rrm-card-title uppercase">Drink Menu Profitability &amp; COGS</h3>
          </div>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { item: 'Oat Milk Flat White (12oz)', cogs: '$1.42', price: '$6.25', margin: '77%' },
              { item: 'Cold Brew w/ Salted Caramel', cogs: '$0.88', price: '$5.50', margin: '84%' },
              { item: 'Single Origin Espresso Shot', cogs: '$0.45', price: '$3.50', margin: '87%' },
              { item: 'Ceremonial Matcha Latte', cogs: '$1.85', price: '$6.75', margin: '72%' },
              { item: 'Fresh French Croissant', cogs: '$1.80', price: '$4.50', margin: '60%' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', fontSize: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{row.item}</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>COGS: {row.cogs} | Menu: {row.price}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.875rem' }}>{row.margin}</span>
                  <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>Gross Margin</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rrm-card">
          <div className="rrm-card-header">
            <h3 className="rrm-card-title uppercase">Hourly Foot Traffic &amp; Peak Windows</h3>
          </div>
          <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { time: '06:30 AM - 07:30 AM', orders: 28, pct: 45, label: 'Early Commute' },
              { time: '07:30 AM - 09:30 AM', orders: 114, pct: 95, label: 'Morning Peak Rush' },
              { time: '09:30 AM - 11:30 AM', orders: 62, pct: 60, label: 'Mid-Morning Brews' },
              { time: '11:30 AM - 01:30 PM', orders: 84, pct: 75, label: 'Lunch & Pastry Push' },
              { time: '01:30 PM - 04:00 PM', orders: 36, pct: 40, label: 'Afternoon Pick-me-up' },
            ].map((rush, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 500 }}>{rush.time} ({rush.label})</span>
                  <span style={{ fontWeight: 700, color: '#1C2C60' }}>{rush.orders} orders</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <div 
                    style={{ height: '100%', backgroundColor: '#1C2C60', width: `${rush.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
