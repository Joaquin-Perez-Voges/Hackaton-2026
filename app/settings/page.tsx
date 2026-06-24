import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DailyGoal } from "@/components/daily-goal";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Ajustes — NextSelf" };

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {desc && <p className="mt-0.5 mb-3 text-sm text-muted-foreground">{desc}</p>}
      <div className={desc ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const session = await requireSession();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight">
        Ajustes
      </h1>

      <div className="space-y-4">
        <Section title="Cuenta" desc={session.user.email}>
          <SignOutButton />
        </Section>

        <Section title="Apariencia" desc="Elegí el tema de la app.">
          <ThemeToggle />
        </Section>

        <Section
          title="Meta diaria"
          desc="¿Cuántas pruebas querés hacer por día?"
        >
          <DailyGoal />
        </Section>

        <Section title="Acerca de">
          <p className="text-sm text-muted-foreground">
            NextSelf · estudiá con IA. Pruebas y tutor potenciados por Claude
            (Anthropic).
          </p>
        </Section>
      </div>
    </div>
  );
}
