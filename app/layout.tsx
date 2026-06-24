import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/session";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "NextSelf — Estudiá con IA",
  description: "Creá resúmenes y pruebas con IA para superarte cada día.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {session ? (
            <div className="flex min-h-dvh flex-col md:flex-row">
              <Navbar user={session.user} />
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
            </div>
          ) : (
            children
          )}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
