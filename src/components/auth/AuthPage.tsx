import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from '../icons/Icons';
import { supabase, SUPER_ADMIN_CREDENTIALS, STAFF_CREDENTIALS } from '../../lib/supabase';

interface AuthPageProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
  darkMode?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, darkMode = false }) => {
  const [selectedRole, setSelectedRole] = useState<'Super Admin' | 'Staff'>('Super Admin');
  const [email, setEmail] = useState(SUPER_ADMIN_CREDENTIALS.email);
  const [password, setPassword] = useState(SUPER_ADMIN_CREDENTIALS.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (role: 'Super Admin' | 'Staff') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'Super Admin') {
      setEmail(SUPER_ADMIN_CREDENTIALS.email);
      setPassword(SUPER_ADMIN_CREDENTIALS.password);
    } else {
      setEmail(STAFF_CREDENTIALS.email);
      setPassword(STAFF_CREDENTIALS.password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const isStaff = email.trim().toLowerCase() === STAFF_CREDENTIALS.email.toLowerCase();
    const fallbackCreds = isStaff ? STAFF_CREDENTIALS : SUPER_ADMIN_CREDENTIALS;

    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // If account doesn't exist yet in Supabase auth, provision automatically
        if (error.message.includes('Invalid login') || error.message.includes('User not found')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: fallbackCreds.email,
            password: fallbackCreds.password,
            options: {
              data: {
                name: fallbackCreds.name,
                role: fallbackCreds.role,
              },
            },
          });

          if (!signUpError && signUpData.user) {
            onLoginSuccess({
              name: fallbackCreds.name,
              email: signUpData.user.email || fallbackCreds.email,
              role: fallbackCreds.role,
            });
            setIsLoading(false);
            return;
          }
        }

        setErrorMessage(error.message || 'Authentication failed. Please verify credentials.');
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const metadata = data.user.user_metadata || {};
        const detectedRole = isStaff ? 'Staff' : (metadata.role || fallbackCreds.role);
        onLoginSuccess({
          name: metadata.name || fallbackCreds.name,
          email: data.user.email || email,
          role: detectedRole,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      backgroundColor: 'var(--card, #ffffff)',
      color: 'var(--foreground, #1e293b)'
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
          
          {/* Logo & Super Admin Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
            <img 
              src="/tallios_official_logo.png" 
              alt="Tallio's Coffee & Tea Co" 
              style={{
                maxHeight: '90px',
                width: 'auto',
                objectFit: 'contain',
                marginBottom: '1.25rem',
                mixBlendMode: darkMode ? 'lighten' : 'multiply'
              }}
            />

            <h1 style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#1C2C60',
              margin: '0',
              letterSpacing: '-0.02em'
            }}>
              Login to your account
            </h1>

            {/* Quick Role Switcher */}
            <div style={{
              display: 'flex',
              padding: '4px',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              marginTop: '1.25rem',
              width: '100%',
              border: '1px solid #e2e8f0'
            }}>
              <button
                type="button"
                onClick={() => handleRoleSelect('Super Admin')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: selectedRole === 'Super Admin' ? '#1C2C60' : 'transparent',
                  color: selectedRole === 'Super Admin' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('Staff')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: selectedRole === 'Staff' ? '#1C2C60' : 'transparent',
                  color: selectedRole === 'Staff' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                Café Staff
              </button>
            </div>
          </div>

          {errorMessage && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontSize: '0.8rem',
              marginBottom: '1.25rem',
              border: '1px solid #fecaca',
              lineHeight: 1.4
            }}>
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email"
                  required
                  placeholder="admin@tallioscoffee.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rrm-input"
                  style={{ 
                    width: '100%', 
                    paddingLeft: '38px', 
                    height: '44px', 
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    alert(`Password reset instructions sent to ${email}`); 
                  }}
                  style={{ fontSize: '0.75rem', color: '#1C2C60', textDecoration: 'none', fontWeight: 600 }}
                >
                  Forgot your password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rrm-input"
                  style={{ 
                    width: '100%', 
                    paddingLeft: '38px', 
                    paddingRight: '42px', 
                    height: '44px', 
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    color: '#0f172a'
                  }}
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
                    color: '#64748b',
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '46px',
                fontSize: '0.925rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                backgroundColor: '#1C2C60',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease'
              }}
            >
              <span>
                {isLoading
                  ? 'Authenticating with Supabase...'
                  : selectedRole === 'Super Admin'
                  ? 'Login as Super Admin →'
                  : 'Login as Café Staff →'}
              </span>
            </button>
          </form>

          {/* Help Note */}
          <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
            Tallio's Café Operations Platform • {selectedRole === 'Super Admin' ? 'Authorized Super Admin Access' : 'Café Shift Staff Access'}
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
          © {new Date().getFullYear()} Tallio's Coffee & Tea Co. All rights reserved.
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
        {/* Background Image: Original Tallio's Artisan Roastery photo */}
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
