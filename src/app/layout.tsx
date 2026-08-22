import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/ui/header";
import { Sidebar } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "MemesMaterial Studio - AI Meme Video Creator",
  description: "Create 25/60-second meme videos for YouTube channel MemesMaterial",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white">
        <Header />
        <Sidebar />
        <main className="min-h-[calc(100vh-73px)] px-5 py-6 md:ml-64 md:px-10 md:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
