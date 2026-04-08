"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username.length !== 7) {
      showTimedMessage("Account must be 7 characters", "error");
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

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.some((u: { username: string }) => u.username === username)) {
      showTimedMessage("Account already exists", "error");
      return;
    }

    users.push({ username, email, password });
    localStorage.setItem("users", JSON.stringify(users));
    showTimedMessage("Register success! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
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
        <h1 style={{ marginBottom: "1.5rem" }}>Create Account</h1>

        <div className="form-group">
          <label htmlFor="reg-username">Account</label>
          <input
            type="text"
            id="reg-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={7}
            maxLength={7}
          />
        </div>

        <div className="form-group">
          <label htmlFor="reg-email">Email</label>
          <input
            type="email"
            id="reg-email"
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="register-link">
          <Link href="/">Already have account?</Link>
        </div>

        <div className="login-reset">
          <input type="submit" value="Register" />
          <input type="reset" value="Reset" onClick={handleReset} />
        </div>
      </form>
    </>
  );
}
