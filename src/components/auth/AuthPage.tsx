import React, { useState } from 'react';
import { Mail, Lock, Users, Eye, EyeOff } from '../icons/Icons';

interface AuthPageProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
  darkMode?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, darkMode = false }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@tallioscoffee.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('Super Admin');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      name: isSignUp ? (name || 'Head Roaster & Operator') : "Tallio's Super Admin",
      email: email || 'admin@tallioscoffee.com',
      role: role || 'Super Admin',
    });
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      backgroundColor: 'var(--card)',
      color: 'var(--foreground)'
    }}>
      {/* LEFT COLUMN: 50% Clean White Auth Form */}
      <div style={{
        flex: '1 1 50%',
        maxWidth: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem 4rem',
        overflowY: 'auto'
      }}>
        {/* Top spacer */}
        <div></div>

        {/* Center Auth Form Container */}
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          
          {/* Logo & Super Admin Pill */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.75rem' }}>
            <img 
              src="/tallios_official_logo.png" 
              alt="Tallio's Coffee & Tea Co" 
              style={{
                maxHeight: '85px',
                width: 'auto',
                objectFit: 'contain',
                marginBottom: '1rem',
                mixBlendMode: darkMode ? 'lighten' : 'multiply'
              }}
            />

            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#1C2C60',
              margin: '0',
              letterSpacing: '-0.02em'
            }}>
              {isSignUp ? 'Create your account' : 'Login to your account'}
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Jordan Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rrm-input"
                    style={{ width: '100%', paddingLeft: '36px', height: '42px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                <input
                  type="email"
                  required
                  placeholder="admin@tallioscoffee.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rrm-input"
                  style={{ width: '100%', paddingLeft: '36px', height: '42px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Password
                </label>
                {!isSignUp && (
                  <a
                    href="#forgot"
                    onClick={(e) => { e.preventDefault(); alert(`Reset link dispatched to ${email}`); }}
                    style={{ fontSize: '0.75rem', color: '#1C2C60', textDecoration: 'none', fontWeight: 500 }}
                  >
                    Forgot your password?
                  </a>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rrm-input"
                  style={{ width: '100%', paddingLeft: '36px', paddingRight: '42px', height: '42px', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>
                  Role & Authorization
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="rrm-input"
                  style={{ width: '100%', height: '42px', fontSize: '0.85rem' }}
                >
                  <option value="Super Admin">Super Admin (HQ Operator)</option>
                  <option value="Head Roaster">Head Roaster & Quality Control</option>
                  <option value="Lead Barista">Lead Barista (Shift Lead)</option>
                  <option value="Food Truck Operator">Food Truck Operator</option>
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="rrm-btn-primary"
              style={{
                width: '100%',
                height: '44px',
                fontSize: '0.875rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                backgroundColor: '#1C2C60',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>{isSignUp ? 'Create Operator Account →' : 'Login as Super Admin →'}</span>
            </button>
          </form>

          {/* Switch Mode Footer */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
            {isSignUp ? (
              <span>
                Already have an operator account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  style={{ background: 'none', border: 'none', color: '#1C2C60', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Login here
                </button>
              </span>
            ) : null}
          </div>
        </div>

        {/* Footer Copyright */}
        <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--muted-foreground)', marginTop: '2rem' }}>
          © 2026 Tallio's Coffee & Tea Co • Operating System • Stripe POS Certified
        </div>
      </div>

      {/* RIGHT COLUMN: 50% Full-Bleed High-Res Coffee Roastery Photo with Overlay */}
      <div style={{
        flex: '1 1 50%',
        maxWidth: '50%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#181412',
        overflow: 'hidden'
      }}>
        {/* Background Image */}
        <img
          src="/tallios_login_hero.jpg"
          alt="Tallio's Artisan Roastery & Espresso Bar"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block'
          }}
        />

        {/* Dark Roast & Caramel Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(24, 20, 18, 0.95) 0%, rgba(24, 20, 18, 0.45) 50%, rgba(24, 20, 18, 0.15) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Bottom Promotional Pill & Tagline */}
        <div style={{
          position: 'absolute',
          bottom: '3rem',
          left: '3rem',
          right: '3rem',
          color: '#ffffff',
          zIndex: 10
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-block',
            padding: '3px 10px',
            backgroundColor: '#1C2C60',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.6875rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            COFFEE OPERATIONS 2.0
          </div>

          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#ffffff',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            Empowering Artisan Roasters & Mobile Fleet Operations
          </h2>

          <p style={{
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: '#f5ede6',
            opacity: 0.9,
            maxWidth: '540px',
            margin: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            Real-time batch roast dial-in, automated dial-in waste tracking, instant self-service kiosk settlement, and multi-truck fleet sync.
          </p>
        </div>
      </div>
    </div>
  );
};
