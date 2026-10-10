import { useState, type FormEvent } from "react";
import "./authScreens.css";

export interface LoginScreenProps {
  onRegisterClick?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREVIEW_MESSAGE = "Form validated. Authentication is not connected yet.";

export function LoginScreen({ onRegisterClick }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    setSubmitted(Object.keys(nextErrors).length === 0);
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="login-heading">
        <p className="auth-card__brand">Langan Knowledge Bot</p>
        <h1 id="login-heading">Log in</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                setSubmitted(false);
              }}
            />
            {errors.email && <p className="auth-field__error" id="login-email-error">{errors.email}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-password">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setSubmitted(false);
                }}
              />
              <button
                type="button"
                className="auth-password__toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="auth-field__error" id="login-password-error">{errors.password}</p>
            )}
          </div>

          <button type="submit" className="auth-submit">Log in</button>
          {submitted && <p className="auth-feedback" role="status">{PREVIEW_MESSAGE}</p>}
        </form>

        <p className="auth-switch">
          Don’t have an account?{" "}
          <button type="button" disabled={!onRegisterClick} onClick={onRegisterClick}>
            Register
          </button>
        </p>
        <p className="auth-note">Preview only. Login and registration are not connected yet.</p>
      </section>
    </main>
  );
}
