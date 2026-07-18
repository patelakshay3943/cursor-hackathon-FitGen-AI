"use client";

import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { APP_NAME } from "@/config/app";
import { Button } from "@/shared/components/ui/Button";

const linkClass =
  "text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

export function Navbar() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, displayName } = useAppSelector((s) => s.auth);

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {APP_NAME}
        </Link>
        <nav className="flex flex-wrap items-center gap-4">
          <Link className={linkClass} href="/products">
            Products
          </Link>
          <Link className={linkClass} href="/orders">
            Orders
          </Link>
          {isAuthenticated ? (
            <>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {displayName || "User"}
              </span>
              <Button type="button" variant="ghost" onClick={() => dispatch(logout())}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link className={linkClass} href="/login">
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
