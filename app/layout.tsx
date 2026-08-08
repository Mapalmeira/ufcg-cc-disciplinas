import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grade Curricular",
  description: "Explore a grade curricular, turmas, disciplinas e suas dependências.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
