import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Nasym-ur-Rahmah — Islamic Learning & Live Classes",
  description: "An Islamic learning app for the youth: live classes, news, reminders, and a safe community."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of unstyled content by applying saved theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d))document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
      </head>
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
