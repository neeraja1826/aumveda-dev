
import { useState } from 'react';
import { setAdminToken } from '../services/api.js';

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
      // Replace this placeholder with your confirmed login endpoint.
      const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8001/api/v1'
).replace(/\/+$/, '');

const response = await fetch(`${apiBaseUrl}/auth/login`, 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.detail || result.message || 'Login failed. Check your credentials.'
        );
      }

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
          grid-template-columns: 1fr 1fr;
          background: #F8FAF7;
          color: #123D2B;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .aum-login-brand {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px 54px;
          color: #FFFFFF;
          background: linear-gradient(155deg, #123D2B 0%, #173F1D 45%, #092116 100%);
          position: relative;
          overflow: hidden;
        }
        .aum-login-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(217, 165, 46, 0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .aum-login-brand h1 {
          max-width: 460px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 600;
          line-height: 1.16;
          color: #FFFFFF;
          margin: 0 0 16px;
        }
        .aum-login-brand p {
          max-width: 420px;
          color: #C6DBCF;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 400;
        }
        .aum-login-logo-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .aum-login-logo-mark {
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border-radius: 13px;
          background: #F5F4E7;
          border: 1.5px solid #D9A52E;
          color: #123D2B;
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
        }
        .aum-login-logo {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 3px;
          color: #FFFFFF;
        }
        .aum-login-tagline {
          display: inline-block;
          margin-bottom: 18px;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(217, 165, 46, 0.15);
          color: #D9A52E;
          border: 1px solid rgba(217, 165, 46, 0.35);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
        }
        .aum-login-panel {
          display: grid;
          place-items: center;
          padding: 40px 28px;
          background: #F8FAF7;
        }
        .aum-login-card {
          width: 100%;
          max-width: 420px;
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
          color: #123D2B;
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
          color: #123D2B;
        }
        .aum-login-field input {
          box-sizing: border-box;
          width: 100%;
          margin-top: 8px;
          padding: 13px 15px;
          border: 1px solid #D5E4D2;
          border-radius: 11px;
          background: #FFFFFF;
          color: #123D2B;
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
          background: #F8FAF7;
          color: #123D2B;
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
          background: linear-gradient(135deg, #173F1D 0%, #123D2B 100%);
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
          .aum-login {
            grid-template-columns: 1fr;
          }
          .aum-login-brand {
            min-height: 220px;
            padding: 34px 24px;
          }
          .aum-login-brand h1 {
            font-size: 28px;
            margin: 18px 0 8px;
          }
          .aum-login-panel {
            padding: 30px 18px;
          }
          .aum-login-card {
            padding: 28px 20px;
          }
        }
      `}</style>

      <section className="aum-login-brand">
        <div className="aum-login-logo-wrap">
          <span className="aum-login-logo-mark">A</span>
          <span className="aum-login-logo">AUMVEDA</span>
        </div>
        <div>
          <span className="aum-login-tagline">AYURVEDIC OPERATIONS CONSOLE</span>
          <h1>Wellness begins with thoughtful care.</h1>
          <p>
            Manage products, orders, vendors, and holistic customer experiences
            from your dedicated AUMVEDA administration workspace.
          </p>
        </div>
        <small style={{ color: '#8DA998' }}>© AUMVEDA · Premium Ayurvedic Care Admin</small>
      </section>

      <section className="aum-login-panel">
        <form className="aum-login-card" onSubmit={handleSubmit}>
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
      </section>
    </div>
  );
}
