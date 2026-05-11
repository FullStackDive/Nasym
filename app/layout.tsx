import "./globals.css";
import type { Metadata } from "next";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Nasym-ur-Rahmah — Islamic Learning & Live Classes",
  description: "An Islamic learning app for the youth: live classes, news, reminders, and a safe community."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="coastal" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Amiri:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=(t==='dark')||((t==='system'||t===null)&&d);if(dark){document.documentElement.dataset.theme='dark';document.documentElement.classList.add('dark')}else{document.documentElement.dataset.theme='coastal';document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
