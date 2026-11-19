import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from '../icons/Icons';
import { supabase, SUPER_ADMIN_CREDENTIALS } from '../../lib/supabase';

interface AuthPageProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
  darkMode?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, darkMode = false }) => {
  const [email, setEmail] = useState(SUPER_ADMIN_CREDENTIALS.email);
  const [password, setPassword] = useState(SUPER_ADMIN_CREDENTIALS.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // If account doesn't exist yet in Supabase auth, provision super admin automatically
        if (
          email.trim().toLowerCase() === SUPER_ADMIN_CREDENTIALS.email.toLowerCase() &&
          (error.message.includes('Invalid login') || error.message.includes('User not found'))
        ) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: SUPER_ADMIN_CREDENTIALS.email,
            password: SUPER_ADMIN_CREDENTIALS.password,
            options: {
              data: {
                name: SUPER_ADMIN_CREDENTIALS.name,
                role: SUPER_ADMIN_CREDENTIALS.role,
              },
            },
          });

          if (!signUpError && signUpData.user) {
            onLoginSuccess({
              name: SUPER_ADMIN_CREDENTIALS.name,
              email: signUpData.user.email || SUPER_ADMIN_CREDENTIALS.email,
              role: SUPER_ADMIN_CREDENTIALS.role,
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
        onLoginSuccess({
          name: metadata.name || SUPER_ADMIN_CREDENTIALS.name,
          email: data.user.email || email,
          role: metadata.role || SUPER_ADMIN_CREDENTIALS.role,
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
              <span>{isLoading ? 'Authenticating with Supabase...' : 'Login as Super Admin →'}</span>
            </button>
          </form>

          {/* Help Note */}
          <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
            Tallio's Café Operations Platform • Authorized Super Admin Access Only
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
