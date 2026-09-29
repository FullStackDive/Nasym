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
  title: "Nasym-Ur-Rahmah Institute — Islamic Learning & Live Classes",
  description: "Nasym-Ur-Rahmah Institute is an Islamic learning space for live classes, recorded lessons, courses, reflections, and a safe learning community."
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
            __html: `(function(){try{document.documentElement.dataset.theme='coastal';document.documentElement.classList.remove('dark');localStorage.setItem('theme','light')}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
