import Link from "next/link";

export default function RegisterPage() {
  return (
    <section className="stack">
      <form className="card form-stack" action="">
        <h1>Account setup (MVP)</h1>
        <p className="muted">
          Placeholder registration UI retained for future backend auth wiring.
        </p>
        <input id="reg-username" type="text" required placeholder="Username" />
        <input id="reg-email" type="email" required placeholder="Email" />
        <input
          id="reg-password"
          type="password"
          required
          placeholder="Create password"
        />
        <input
          id="reg-confirm-password"
          type="password"
          required
          placeholder="Confirm password"
        />
        <button className="btn btn-primary" type="submit">
          Register
        </button>
        <div className="register-link">
          <Link href="/">Back to homepage</Link>
        </div>
      </form>
      <div className="card">
        <h2>Next phase</h2>
        <p className="muted">
          Connect this form to NextAuth and Prisma once backend services are
          configured.
        </p>
      </div>
    </section>
  );
}
