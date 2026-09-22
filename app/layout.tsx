import type { Metadata } from "next";
import "./globals.css";
import "./scene.css";
export const metadata: Metadata = {
  title: "Border Protocol — East Grestin Checkpoint",
  description: "Your desk. Their fate. An atmospheric border inspection game.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
