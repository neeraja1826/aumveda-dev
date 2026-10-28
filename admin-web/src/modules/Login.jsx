
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
          background: #f7f8f5;
          color: #202c25;
          font-family: Inter, system-ui, sans-serif;
        }
        .aum-login-brand {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          color: #fff;
          background: linear-gradient(145deg, #123d32, #071f1a);
        }
        .aum-login-brand h1 {
          max-width: 440px;
          font-family: Georgia, serif;
          font-size: clamp(38px, 4vw, 58px);
          font-weight: 500;
          line-height: 1.12;
        }
        .aum-login-brand p {
          max-width: 400px;
          color: #d4e1d7;
          line-height: 1.7;
        }
        .aum-login-logo {
          font-size: 25px;
          font-weight: 700;
          letter-spacing: 3px;
        }
        .aum-login-panel {
          display: grid;
          place-items: center;
          padding: 32px 24px;
        }
        .aum-login-card {
          width: 100%;
          max-width: 410px;
        }
        .aum-login-card h2 {
          margin: 0 0 10px;
          font-size: 30px;
        }
        .aum-login-muted {
          margin: 0 0 30px;
          color: #737c75;
          line-height: 1.6;
        }
        .aum-login-field {
          display: block;
          margin-bottom: 19px;
          font-size: 14px;
          font-weight: 600;
        }
        .aum-login-field input {
          box-sizing: border-box;
          width: 100%;
          margin-top: 9px;
          padding: 13px 14px;
          border: 1px solid #d9dfd8;
          border-radius: 9px;
          background: #fff;
          color: #202c25;
          font: inherit;
          outline: none;
        }
        .aum-login-field input:focus {
          border-color: #27634e;
          box-shadow: 0 0 0 3px #27634e18;
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
          margin-top: 9px;
          padding: 0 10px;
          border: 1px solid #d9dfd8;
          border-radius: 9px;
          background: #fff;
          cursor: pointer;
        }
        .aum-login-submit {
          width: 100%;
          padding: 14px;
          border: 0;
          border-radius: 9px;
          background: #174b3b;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }
        .aum-login-submit:disabled {
          opacity: .65;
          cursor: wait;
        }
        .aum-login-error {
          margin: 0 0 18px;
          padding: 12px;
          border-radius: 8px;
          background: #fff0ef;
          color: #a12b24;
          font-size: 14px;
          line-height: 1.5;
        }
        .aum-login-footer {
          margin-top: 26px;
          color: #7c857e;
          font-size: 12px;
          text-align: center;
        }
        @media (max-width: 760px) {
          .aum-login {
            grid-template-columns: 1fr;
          }
          .aum-login-brand {
            min-height: 160px;
            padding: 24px;
          }
          .aum-login-brand h1 {
            margin: 36px 0 8px;
            font-size: 34px;
          }
          .aum-login-brand p {
            margin-bottom: 0;
          }
          .aum-login-panel {
            padding: 35px 22px;
          }
        }
      `}</style>

      <section className="aum-login-brand">
        <div className="aum-login-logo">AUMVEDA</div>
        <div>
          <h1>Wellness begins with thoughtful care.</h1>
          <p>
            Manage products, orders, vendors and customer experiences
            from your AUMVEDA administration workspace.
          </p>
        </div>
        <small>© AUMVEDA · Admin workspace</small>
      </section>

      <section className="aum-login-panel">
        <form className="aum-login-card" onSubmit={handleSubmit}>
          <h2>Admin login</h2>
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
            Authorized administrators only
          </div>
        </form>
      </section>
    </div>
  );
}
