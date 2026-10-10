import { useState, type FormEvent } from "react";
import "./authScreens.css";

export interface RegistrationScreenProps {
  onLoginClick?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREVIEW_MESSAGE = "Form validated. Authentication is not connected yet.";

export function RegistrationScreen({ onLoginClick }: RegistrationScreenProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!fullName.trim()) nextErrors.fullName = "Enter your full name.";
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter a password.";
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
    setSubmitted(Object.keys(nextErrors).length === 0);
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="registration-heading">
        <p className="auth-card__brand">Langan Knowledge Bot</p>
        <h1 id="registration-heading">Create an account</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="registration-name">Full name</label>
            <input
              id="registration-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "registration-name-error" : undefined}
              onChange={(event) => {
                setFullName(event.target.value);
                setSubmitted(false);
              }}
            />
            {errors.fullName && (
              <p className="auth-field__error" id="registration-name-error">{errors.fullName}</p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="registration-email">Email</label>
            <input
              id="registration-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "registration-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                setSubmitted(false);
              }}
            />
            {errors.email && (
              <p className="auth-field__error" id="registration-email-error">{errors.email}</p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="registration-password">Password</label>
            <div className="auth-password">
              <input
                id="registration-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "registration-password-error" : undefined}
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
              <p className="auth-field__error" id="registration-password-error">{errors.password}</p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="registration-confirm-password">Confirm password</label>
            <div className="auth-password">
              <input
                id="registration-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? "registration-confirm-password-error" : undefined
                }
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setSubmitted(false);
                }}
              />
              <button
                type="button"
                className="auth-password__toggle"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((visible) => !visible)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="auth-field__error" id="registration-confirm-password-error">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button type="submit" className="auth-submit">Create account</button>
          {submitted && <p className="auth-feedback" role="status">{PREVIEW_MESSAGE}</p>}
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" disabled={!onLoginClick} onClick={onLoginClick}>
            Log in
          </button>
        </p>
        <p className="auth-note">Preview only. Login and registration are not connected yet.</p>
      </section>
    </main>
  );
}
