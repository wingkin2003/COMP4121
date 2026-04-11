"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/marketplace/sell", label: "Marketplace" },
  { href: "/buy", label: "Buy" },
  { href: "/sell", label: "Sell" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/profile", label: "Profile" },
];

export function AppNav() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/";
  };

  return (
    <header className="site-header">
      <div className="site-shell nav-row">
        <Link href="/marketplace/sell" className="brand">
          SecondLife HK
        </Link>
        <nav className="site-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
          <button className="nav-logout" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

