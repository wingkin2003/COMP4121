"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type User = {
  username: string;
  password: string;
  email: string;
};

export default function LoginPage() {
  const [users] = useState<User[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const storedUsers = JSON.parse(
      localStorage.getItem("users") || "[]",
    ) as User[];
    if (storedUsers.length === 0) {
      const defaultUser: User = {
        username: "1234567",
        password: "password123",
        email: "test@example.com",
      };
      localStorage.setItem("users", JSON.stringify([defaultUser]));
      return [defaultUser];
    }

    return storedUsers;
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
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

    if (username.length !== 7) {
      showTimedMessage("Account must be 7 characters", "error");
      return false;
    }

    if (password.length < 6) {
      showTimedMessage("Password must be at least 6 characters", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInput()) {
      return;
    }

    const user = users.find(
      (currentUser) =>
        currentUser.username === username && currentUser.password === password,
    );

    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("isLoggedIn", "true");
      showTimedMessage("Login success...", "success");
      setTimeout(() => {
        window.location.href = "supermarket.html";
      }, 2000);
      return;
    }

    showTimedMessage("Account or password error", "error");
    setShakeForm(true);
    setTimeout(() => {
      setShakeForm(false);
    }, 500);
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
        <h1 style={{ marginBottom: "1.5rem" }}>Welcome to log in</h1>

        <div className="form-group">
          <label htmlFor="username">Account</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            minLength={7}
            maxLength={7}
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
      </form>
    </>
  );
}
