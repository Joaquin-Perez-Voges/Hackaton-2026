"use client";

import {
  HouseIcon,
  LogOutIcon,
  MessagesSquareIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type NavUser = { name?: string | null; email: string; image?: string | null };

const items = [
  { href: "/", label: "Inicio", icon: HouseIcon },
  { href: "/tutor", label: "Tutor", icon: MessagesSquareIcon },
  { href: "/settings", label: "Ajustes", icon: SettingsIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();

  const cerrar = () =>
    start(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });

  return (
    <>
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-background p-4 md:flex">
        <Link
          href="/"
          className="mb-6 px-2 font-heading text-2xl font-bold tracking-tight text-primary"
        >
          NextSelf
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name ?? "Vos"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            disabled={pending}
            aria-label="Cerrar sesión"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </aside>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-background md:hidden">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
