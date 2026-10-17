"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const destinations = [
  { href: "/paper", label: "Today’s Paper" },
  { href: "/archive", label: "Archive" },
  { href: "/settings", label: "Preferences" },
];

export function ReaderNavigation() {
  const pathname = usePathname();
  return (
    <nav className="masthead-nav" aria-label="Main Navigation">
      {destinations.map(({ href, label }) => (
        <Link key={href} className="header-nav-link" href={href}
          aria-current={pathname === href || pathname.startsWith(href + "/") ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}