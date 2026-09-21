import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data?.session) {
          navigate('/dashboard');
        } else {
          setMessage('Account created! Please check your email if confirmation is required, or sign in now.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data?.user || data?.session) {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Background ambient lighting effects */}
      <div style={ambientGlowTop} />
      <div style={ambientGlowBottom} />

      <div style={cardWrapperStyle} className="animate-fade-in">
        {/* Branding Header */}
        <div style={headerStyle}>
          <div style={iconBadgeStyle}>
            <TrendingUp size={26} color="#38bdf8" />
          </div>
          <h1 style={titleStyle}>Sales Performance Hub</h1>
          <p style={subtitleStyle}>
            {isSignUp
              ? 'Create your credentials to access live sales metrics'
              : 'Sign in to access real-time business performance analytics'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={tabContainerStyle}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMessage('');
              setMessage('');
            }}
            style={{
              ...tabButtonStyle,
              ...(isSignUp ? {} : activeTabStyle),
            }}
          >
            <LogIn size={15} style={{ marginRight: '6px' }} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMessage('');
              setMessage('');
            }}
            style={{
              ...tabButtonStyle,
              ...(isSignUp ? activeTabStyle : {}),
            }}
          >
            <UserPlus size={15} style={{ marginRight: '6px' }} />
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Email Input */}
          <div style={inputGroupStyle}>
            <label htmlFor="email" style={labelStyle}>
              Email Address
            </label>
            <div style={inputWrapperStyle}>
              <Mail size={18} color="#7dd3fc" style={inputIconStyle} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={inputGroupStyle}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <div style={inputWrapperStyle}>
              <Lock size={18} color="#7dd3fc" style={inputIconStyle} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{ ...inputStyle, paddingRight: '42px' }}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={eyeToggleStyle}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={errorBannerStyle} className="animate-fade-in">
              <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', lineHeight: '1.4' }}>{errorMessage}</span>
            </div>
          )}

          {/* Success / Info Message */}
          {message && (
            <div style={successBannerStyle} className="animate-fade-in">
              <CheckCircle2 size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', lineHeight: '1.4' }}>{message}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...primaryButtonStyle,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                <span>{isSignUp ? 'Creating Account...' : 'Authenticating...'}</span>
              </>
            ) : (
              <>
                {isSignUp ? (
                  <UserPlus size={18} style={{ marginRight: '8px' }} />
                ) : (
                  <LogIn size={18} style={{ marginRight: '8px' }} />
                )}
                <span>{isSignUp ? 'Create Account' : 'Sign In to Dashboard'}</span>
              </>
            )}
          </button>
        </form>

        {/* Feature Highlights Footer */}
        <div style={footerBadgesContainer}>
          <div style={badgeItemStyle}>
            <Zap size={13} color="#38bdf8" style={{ marginRight: '5px' }} />
            <span>Real-Time Sync</span>
          </div>
          <div style={badgeItemStyle}>
            <BarChart3 size={13} color="#38bdf8" style={{ marginRight: '5px' }} />
            <span>KPI Analytics</span>
          </div>
          <div style={badgeItemStyle}>
            <ShieldCheck size={13} color="#38bdf8" style={{ marginRight: '5px' }} />
            <span>Secure Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------- STYLES (Navy, Sky-Blue Accents, Monochrome Blue, White Text) -----------------

const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#070d18',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const ambientGlowTop = {
  position: 'absolute',
  top: '-15%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '500px',
  height: '350px',
  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(7, 13, 24, 0) 70%)',
  pointerEvents: 'none',
  filter: 'blur(40px)',
};

const ambientGlowBottom = {
  position: 'absolute',
  bottom: '-10%',
  right: '20%',
  width: '400px',
  height: '300px',
  background: 'radial-gradient(circle, rgba(2, 132, 199, 0.08) 0%, rgba(7, 13, 24, 0) 70%)',
  pointerEvents: 'none',
  filter: 'blur(50px)',
};

const cardWrapperStyle = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: '440px',
  backgroundColor: '#0f1a30',
  borderRadius: '16px',
  border: '1px solid #1b2f56',
  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(56, 189, 248, 0.1)',
  padding: '36px 32px',
  boxSizing: 'border-box',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '28px',
};

const iconBadgeStyle = {
  width: '52px',
  height: '52px',
  borderRadius: '14px',
  backgroundColor: 'rgba(56, 189, 248, 0.12)',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
  boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
};

const titleStyle = {
  margin: '0 0 8px 0',
  fontSize: '24px',
  fontWeight: '700',
  color: '#ffffff',
  letterSpacing: '-0.3px',
};

const subtitleStyle = {
  margin: 0,
  fontSize: '14px',
  color: '#94a3b8',
  lineHeight: '1.5',
};

const tabContainerStyle = {
  display: 'flex',
  backgroundColor: '#091224',
  borderRadius: '10px',
  padding: '4px',
  marginBottom: '24px',
  border: '1px solid #1b2f56',
};

const tabButtonStyle = {
  flex: 1,
  padding: '10px 14px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '7px',
  color: '#94a3b8',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const activeTabStyle = {
  backgroundColor: '#1b2f56',
  color: '#ffffff',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#cbd5e1',
  letterSpacing: '0.2px',
};

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const inputIconStyle = {
  position: 'absolute',
  left: '12px',
  pointerEvents: 'none',
  opacity: 0.85,
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px 12px 38px',
  backgroundColor: '#091224',
  border: '1px solid #1b2f56',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
};

const eyeToggleStyle = {
  position: 'absolute',
  right: '10px',
  background: 'none',
  border: 'none',
  padding: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const errorBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '8px',
  color: '#fca5a5',
};

const successBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  backgroundColor: 'rgba(56, 189, 248, 0.12)',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  borderRadius: '8px',
  color: '#7dd3fc',
};

const primaryButtonStyle = {
  marginTop: '6px',
  width: '100%',
  padding: '12px 20px',
  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
};

const footerBadgesContainer = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px',
  marginTop: '28px',
  paddingTop: '20px',
  borderTop: '1px solid #162648',
  flexWrap: 'wrap',
};

const badgeItemStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '12px',
  color: '#94a3b8',
  backgroundColor: '#091224',
  padding: '5px 10px',
  borderRadius: '6px',
  border: '1px solid #1b2f56',
};
