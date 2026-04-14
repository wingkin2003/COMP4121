"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { loginUser, ApiError } from "@/lib/api-helpers";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showTimedMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const validateInput = () => {
    if (!username || !password) {
      showTimedMessage("Please fill in all fields", "error");
      return false;
    }

    if (username.length < 6 || username.length > 40) {
      showTimedMessage("Account must be 6-40 characters", "error");
      return false;
    }

    if (password.length < 6) {
      showTimedMessage("Password must be at least 6 characters", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInput()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await loginUser(username, password);
      showTimedMessage("Login success...", "success");
      setTimeout(() => {
        window.location.href = "/marketplace";
      }, 2000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Account or password error";
      showTimedMessage(msg, "error");
      setShakeForm(true);
      setTimeout(() => {
        setShakeForm(false);
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setMessage(null);
  };

  return (
    <>
      {message ? (
        <div className={`login-message ${message.type}`}>{message.text}</div>
      ) : null}

      <form
        className={`login-container ${shakeForm ? "shake" : ""}`}
        onSubmit={handleSubmit}
      >
        <h1 style={{ marginBottom: "1.5rem", fontSize: "18px", }}>Login</h1>

        <div className="form-group">
          <label htmlFor="username">Account</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="6-40 characters"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            minLength={6}
            maxLength={40}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((currentState) => !currentState)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="Register">
          <Link href="/register">Not have account?</Link>
        </div>

        <div className="login-reset">
          <input type="submit" value="Login" />
          <input type="reset" value="Reset" onClick={handleReset} />
        </div>
      </form >
    </>
  );
}
