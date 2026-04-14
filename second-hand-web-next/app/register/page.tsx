"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { registerUser, ApiError } from "@/lib/api-helpers";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showTimedMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      showTimedMessage("Please fill in all fields", "error");
      return;
    }
    if (username.length < 6 || username.length > 40) {
      showTimedMessage("Account must be 6-40 characters", "error");
      return;
    }
    if (password.length < 6) {
      showTimedMessage("Password must be at least 6 characters", "error");
      return;
    }
    if (password !== confirmPassword) {
      showTimedMessage("Passwords do not match", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser(username, email, password);
      showTimedMessage("Account created! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/marketplace";
      }, 1500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Registration failed";
      showTimedMessage(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage(null);
  };

  return (
    <>
      {message && (
        <div className={`login-message ${message.type}`}>{message.text}</div>
      )}

      <form className="login-container" onSubmit={handleSubmit}>
        <h1 style={{ marginBottom: "1.5rem", fontSize: "18px" }}>Create Account</h1>

        <div className="form-group">
          <label htmlFor="reg-username">Account</label>
          <input
            type="text"
            id="reg-username"
            placeholder="6-40 characters"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={6}
            maxLength={40}
          />
        </div>

        <div className="form-group">
          <label htmlFor="reg-email">Email</label>
          <input
            type="email"
            id="reg-email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reg-password">Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="reg-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reg-confirm">Confirm</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="reg-confirm"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="register-link">
          <Link href="/">Already have an account?</Link>
        </div>

        <div className="login-reset">
          <input type="submit" value="Register" />
          <input type="reset" value="Reset" onClick={handleReset} />
        </div>
      </form>
    </>
  );
}
