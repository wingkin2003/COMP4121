"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/lib/api-helpers";

const links = [
  { href: "/marketplace/sell", label: "Marketplace" },
  { href: "/order/sell", label: "Order" },
  { href: "/mystery-box", label: "Mystery Box" },
  { href: "/messages", label: "Messages" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/profile", label: "Profile" },
];

export function AppNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/marketplace/sell") {
      return pathname.startsWith("/marketplace");
    }
    if (href === "/order/sell") {
      return pathname.startsWith("/order") || pathname === "/buy" || pathname === "/sell";
    }
    if (href === "/mystery-box") {
      return pathname.startsWith("/mystery-box");
    }
    return pathname === href;
  };

  const handleLogout = () => {
    logoutUser();
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
              className={isActive(link.href) ? "active" : ""}
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

