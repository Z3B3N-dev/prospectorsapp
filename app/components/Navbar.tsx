"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FakeAuthUser } from "@/lib/fake-auth";
import { logoutAction } from "@/app/login/actions";

const NAV_LINKS = [
  { href: "/organizations", label: "Grupos empresariales" },
  { href: "/enterprise", label: "Empresas" },
  { href: "/contacts", label: "Contactos" },
];

export function Navbar({ user }: { user: FakeAuthUser | null }) {
  const pathname = usePathname();
  const visibleLinks =
    user?.role === "tutor"
      ? NAV_LINKS.filter((link) => link.href === "/contacts")
      : NAV_LINKS;

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center gap-6 h-14">
        <Link
          href="/"
          className="text-sm font-semibold text-gray-900 dark:text-gray-100 mr-2 hover:opacity-80 transition-opacity"
        >
          Prospectors App
        </Link>
        {user &&
          visibleLinks.map(({ href, label }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        {user && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {user.username}
              </span>{" "}
              · {user.role}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
