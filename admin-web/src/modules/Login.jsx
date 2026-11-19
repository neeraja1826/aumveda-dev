
import { useState } from 'react';
import { apiRequest, setAdminToken } from '../services/api.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!result.access_token) {
        throw new Error('The login response did not contain an access token.');
      }

      setAdminToken(result.access_token);
      onLogin();
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="aum-login">
      <style>{`
        .aum-login {
          min-height: 100vh;
          display: grid;
          place-items: center;
          box-sizing: border-box;
          padding: 24px;
          background: var(--page-background);
          color: var(--brand-primary);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .aum-login-header {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
        }
        .aum-login-logo {
          display: block;
          width: 160px;
          max-width: 70%;
          height: auto;
        }
        .aum-login-card {
          width: 100%;
          max-width: 420px;
          box-sizing: border-box;
          background: #FFFFFF;
          padding: 40px;
          border-radius: 20px;
          border: 1px solid #E2ECE0;
          box-shadow: 0 16px 44px -8px rgba(18, 61, 43, 0.08), 0 4px 12px rgba(18, 61, 43, 0.03);
        }
        .aum-login-card h2 {
          margin: 0 0 8px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--brand-primary);
        }
        .aum-login-muted {
          margin: 0 0 28px;
          color: #716F68;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .aum-login-field {
          display: block;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 600;
          color: var(--brand-primary);
        }
        .aum-login-field input {
          box-sizing: border-box;
          width: 100%;
          margin-top: 8px;
          padding: 13px 15px;
          border: 1px solid #D5E4D2;
          border-radius: 11px;
          background: #FFFFFF;
          color: var(--brand-primary);
          font: inherit;
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .aum-login-field input:focus {
          border-color: #276345;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.15);
        }
        .aum-login-password {
          display: flex;
          gap: 8px;
        }
        .aum-login-password input {
          flex: 1;
          min-width: 0;
        }
        .aum-login-show {
          margin-top: 8px;
          padding: 0 14px;
          border: 1px solid #D5E4D2;
          border-radius: 11px;
          background: var(--page-background);
          color: var(--brand-primary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .aum-login-show:hover {
          background: #E8F2E7;
        }
        .aum-login-submit {
          width: 100%;
          padding: 14px;
          margin-top: 8px;
          border: 0;
          border-radius: 11px;
          background: linear-gradient(135deg, var(--brand-deep) 0%, var(--brand-primary) 100%);
          color: #FFFFFF;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(18, 61, 43, 0.22);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .aum-login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(18, 61, 43, 0.3);
        }
        .aum-login-submit:disabled {
          opacity: 0.65;
          cursor: wait;
        }
        .aum-login-error {
          margin: 0 0 18px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #FDF1F0;
          border: 1px solid #F8CECA;
          color: #A3332A;
          font-size: 13px;
          line-height: 1.5;
        }
        .aum-login-footer {
          margin-top: 24px;
          color: #716F68;
          font-size: 11.5px;
          text-align: center;
          letter-spacing: 0.2px;
        }
        @media (max-width: 820px) {
          .aum-login-card {
            padding: 28px 20px;
          }
        }
      `}</style>

      <form className="aum-login-card" onSubmit={handleSubmit}>
        <div className="aum-login-header">
          <img
            className="aum-login-logo"
            src="/aumveda-logo.png"
            alt="Aumveda Wellness LLP"
          />
        </div>

        <h2>Admin sign in</h2>
        <p className="aum-login-muted">
          Sign in with your authorized administrator account.
        </p>

        <label className="aum-login-field">
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            autoComplete="username"
            required
          />
        </label>

        <label className="aum-login-field">
          Password
          <div className="aum-login-password">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              className="aum-login-show"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        {error && <p className="aum-login-error" role="alert">{error}</p>}

        <button className="aum-login-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="aum-login-footer">
          Authorized administrators only · Secured access
        </div>
      </form>
    </div>
  );
}
