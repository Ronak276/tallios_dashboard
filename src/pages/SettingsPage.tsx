export function SettingsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="rrm-card">
        <div className="rrm-card-header">
          <h3 className="rrm-card-title uppercase">Tallio's Cafe &amp; Kiosk Configuration</h3>
        </div>
        <div className="rrm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--muted)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Stripe Terminal Connect</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Paired with 4 Kiosk Card Readers (BBPOS Chipper)</div>
            </div>
            <span className="rrm-badge rrm-badge-valid">Connected</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--muted)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Barista Kitchen Display System (KDS)</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Instant audio chime on incoming QR &amp; Kiosk orders</div>
            </div>
            <span className="rrm-badge rrm-badge-valid">Enabled</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--muted)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Automatic Dial-in Spoilage Deduction</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Auto-deduct 350g daily for morning espresso grinder calibration</div>
            </div>
            <span className="rrm-badge rrm-badge-valid">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
