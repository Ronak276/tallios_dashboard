import React, { useState } from 'react';
import { Mail, Lock, Users } from '../icons/Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('ops@tallioscoffee.com');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState('Store Manager');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      name: mode === 'signup' ? (name || 'Head Barista') : 'Tallio\'s Ops',
      email: email || 'ops@tallioscoffee.com',
      role: role || 'Store Manager',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="rrm-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card)'
        }}
      >
        {/* Header */}
        <div className="rrm-card-header" style={{ padding: '1.25rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/tallios_official_logo.png" 
              alt="Tallio's Coffee & Tea Co" 
              style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>
              {mode === 'login' ? 'Sign in to Tallio\'s OS' : 'Create Staff & Operator Account'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
              {mode === 'login' 
                ? 'Roastery inventory, Kiosk terminal & Fleet management portal' 
                : 'Join the roastery team with role-based POS access'}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <Users size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rrm-input"
                  style={{ width: '100%', paddingLeft: '32px' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Work Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input
                type="email"
                required
                placeholder="name@tallioscoffee.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rrm-input"
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rrm-input"
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Store Role / Position
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rrm-input"
                style={{ width: '100%' }}
              >
                <option value="Store Manager">Store Manager (Full Admin)</option>
                <option value="Head Roaster">Head Roaster & Quality Control</option>
                <option value="Lead Barista">Lead Barista & Shift Lead</option>
                <option value="Food Truck Operator">Food Truck Operator</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Remember this session</span>
            </label>
            {mode === 'login' && (
              <a href="#reset" onClick={(e) => { e.preventDefault(); alert('Reset password email dispatched to ' + email); }} style={{ color: '#1C2C60', fontWeight: 600, textDecoration: 'none' }}>
                Forgot Password?
              </a>
            )}
          </div>

          <button
            type="submit"
            className="rrm-btn-primary"
            style={{ width: '100%', padding: '0.65rem', marginTop: '0.25rem', fontSize: '0.85rem' }}
          >
            {mode === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}
          </button>
        </form>

        {/* Footer / Switch Mode */}
        <div className="rrm-card-footer" style={{ padding: '0.85rem 1.5rem', justifyContent: 'center', fontSize: '0.75rem' }}>
          {mode === 'login' ? (
            <span>
              Don't have an operator account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: '#1C2C60', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', color: '#1C2C60', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
