import Link from "next/link";

export default function RegisterPage() {
  return (
    <form className="login-container" action="">
      <h1>Create Account</h1>

      <div className="form-group">
        <label htmlFor="reg-username">Username</label>
        <input
          id="reg-username"
          type="text"
          required
          minLength={7}
          maxLength={7}
          placeholder="Enter 7 characters"
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-email">Email</label>
        <input
          id="reg-email"
          type="email"
          required
          placeholder="Enter your email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-password">Password</label>
        <input
          id="reg-password"
          type="password"
          required
          placeholder="Create password"
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-confirm-password">Confirm Password</label>
        <input
          id="reg-confirm-password"
          type="password"
          required
          placeholder="Confirm password"
        />
      </div>

      <div className="register-link">
        <Link href="/">Already have an account? Login here</Link>
      </div>

      <div className="login-reset">
        <input type="submit" value="Register" />
        <input type="reset" value="Clear" />
      </div>
    </form>
  );
}
