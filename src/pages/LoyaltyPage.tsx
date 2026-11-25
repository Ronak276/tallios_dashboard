import type { LoyaltyMember } from '../types';
import { Star } from '../components/icons/Icons';

interface LoyaltyPageProps {
  members: LoyaltyMember[];
  onAddStamp: (memberId: string) => void;
}

export function LoyaltyPage({ members, onAddStamp }: LoyaltyPageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="rrm-card">
        <div className="rrm-card-header">
          <div>
            <h3 className="rrm-card-title uppercase">Mug Club Memberships &amp; Stamp Punch Cards</h3>
            <p className="rrm-card-description">Customer subscription tiers, recurring rewards, and digital cup stamps</p>
          </div>
          <span className="rrm-badge rrm-badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Star size={12} /> {members.length} Active Mug Clubbers
          </span>
        </div>

        <div className="rrm-table-wrapper" style={{ border: 'none' }}>
          <table className="rrm-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Subscription Tier</th>
                <th>Digital Stamp Card</th>
                <th>Points Balance</th>
                <th>Monthly Spend</th>
                <th>Last Cafe Visit</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{member.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>{member.email}</div>
                  </td>
                  <td>
                    {member.tier === 'Gold Roaster' && (
                      <span className="rrm-badge rrm-badge-orange">{member.tier}</span>
                    )}
                    {member.tier === 'Silver Barista' && (
                      <span className="rrm-badge rrm-badge-valid">{member.tier}</span>
                    )}
                    {member.tier === 'Member' && (
                      <span className="rrm-badge rrm-badge-warning">{member.tier}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <span
                          key={idx}
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: idx < member.stampsCount ? '#1C2C60' : 'var(--muted)',
                            border: '1px solid var(--border)',
                            display: 'inline-block'
                          }}
                        />
                      ))}
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, marginLeft: '6px' }}>
                        {member.stampsCount}/10
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#C68A4C' }}>
                    {member.points} pts
                  </td>
                  <td style={{ fontWeight: 600, color: '#10b981' }}>
                    ${member.monthlySpend.toFixed(2)}/mo
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {member.lastVisit}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onAddStamp(member.id)}
                      className="rrm-btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.6875rem', borderColor: 'rgba(255, 78, 0, 0.4)', color: '#1C2C60' }}
                    >
                      + Stamp Cup
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
