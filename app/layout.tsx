import "./globals.css";
import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Amiri, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/providers";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--ff-display",
});
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--ff-sans",
});
const arabic = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--ff-arabic",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--ff-mono",
});

export const metadata: Metadata = {
  title: "Nasym-ur-Rahmah — Islamic Learning & Live Classes",
  description: "An Islamic learning app for the youth: live classes, news, reminders, and a safe community."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = `${display.variable} ${sans.variable} ${arabic.variable} ${mono.variable}`;
  return (
    <html lang="en" data-theme="coastal" className={fontVars} suppressHydrationWarning>
      <head>
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
