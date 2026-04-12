import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Noor — Islamic Learning & Live Classes",
  description: "An Islamic learning app for the youth: live classes, news, reminders, and a safe community."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-160px)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
