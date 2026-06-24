import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Entrar — NextSelf" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-10">
      <AuthForm />
    </div>
  );
}
